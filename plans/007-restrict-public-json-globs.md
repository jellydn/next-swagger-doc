# Plan 007: Stop scanning arbitrary `public/**/*.json` files

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b87cecb..HEAD -- src/swagger.ts test/index.test.ts README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (touches the `apis` glob list in `createSwaggerSpec`;
  plan 001 also edits `createSwaggerSpec` but the autoDoc call, not this
  array — rebase if both land)
- **Category**: correctness
- **Planned at**: commit `b87cecb`, 2026-08-26

## Why this matters

`createSwaggerSpec` passes swagger-jsdoc globs for `public/**/*.swagger.yaml`
and `public/**/*.json`. swagger-jsdoc 6.3.0 parses YAML files as sidecar
documents, but treats every other extension as source text containing JSDoc
comments. It does not parse JSON objects as OpenAPI fragments, so the broad
JSON glob is ineffective and unnecessarily scans unrelated public assets.

The supported fragment format in this repo is `*.swagger.yaml` (the next13
example copies `models/**/*.swagger.yaml` to `public/openapi`). A full
prebuilt JSON spec belongs in `specFile` (for example,
`public/swagger.json`), which short-circuits scanning when the file exists.

## Current state

`src/swagger.ts:147-157`:

```typescript
  const scanFolders = [apiFolder, ...schemaFolders];
  const { sourceDirs, buildDirs, publicDir } =
    discoverSpecLocations(scanFolders);
  const fileTypes = ['ts', 'tsx', 'jsx', 'js', 'json', 'swagger.yaml'];
  const apis = [
    ...sourceDirs.flatMap((dir) =>
      fileTypes.map((fileType) => `${dir}/**/*.${fileType}`)
    ),
    ...['swagger.yaml', 'json'].map(
      (fileType) => `${publicDir}/**/*.${fileType}`
    ),
```

`fileTypes` still includes `'json'` for **source** API / schema folders
(`schemaFolders`). Do **not** remove JSON from source globs in this plan —
only the `publicDir` entries.

`README.md` ~171-173 says source API files and `public` OpenAPI files are
scanned. Update that sentence so it names `*.swagger.yaml`. Document
`specFile` as the way to load a complete JSON spec.

`createSwaggerSpec` uses `process.cwd()` for `discoverSpecLocations` (no
`cwd` option). Tests that need a fake `public/` should `process.chdir` into
a temp dir **inside one `it`**, restore cwd in `finally`, and must not run
with `{ concurrent: true }`. The existing file is sequential Vitest.

next13 `postbuild` copies YAML only
(`examples/next13-simple/package.json` `cpy 'models/**/*.swagger.yaml'`).

Conventions: Biome 80-col; document new glob behavior on `SwaggerOptions`
JSDoc if you mention public files there, and in `README.md` (`AGENTS.md`:
document new options on `SwaggerOptions` and README — this is a behavior
change of existing scanning, not a new option).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `pnpm test`              | all pass            |
| Lint      | `pnpm lint`              | exit 0              |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |

## Scope

**In scope**:
- `src/swagger.ts` (the `publicDir` glob list and a short JSDoc note on
  `createSwaggerSpec` or `SwaggerOptions` if public files are described)
- `test/index.test.ts`
- `README.md` (Vercel / scanning paragraph only)
- `plans/README.md` (status bookkeeping only)

**Out of scope**:
- Source `fileTypes` JSON (`app/api/**/*.json`)
- Compiled `.next` globs (`js`, `swagger.yaml`, `json` under `buildDirs`)
- Example apps / lockfiles
- `specFile` parse validation (plan 006)

## Git workflow

- Branch: `advisor/007-restrict-public-json-globs`
- Commit: `fix: glob only swagger fragments under public/`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Change the public globs

Replace:

```typescript
    ...['swagger.yaml', 'json'].map(
      (fileType) => `${publicDir}/**/*.${fileType}`
    ),
```

with:

```typescript
    `${publicDir}/**/*.swagger.yaml`,
```

Do not glob `${publicDir}/**/*.json`.

**Verify**: `rg "publicDir}\\/\\*\\*\\/\\*\\.json" src/swagger.ts` → no
match.

### Step 2: README

In the “Vercel builds” paragraph (`README.md` ~171-173), state that `public/`
is scanned for `*.swagger.yaml` fragments. A complete JSON spec should use
`specFile` (already documented just below for standalone).

**Verify**: `rg "public/\\*\\*\\/\\*\\.json" README.md` → no matches.

### Step 3: Tests for public scanning

Add `describe('public spec fragments', () => { ... })` in
`test/index.test.ts`.

Because `createSwaggerSpec` resolves `public/` from `process.cwd()`, use
chdir for this describe only:

```typescript
describe('public spec fragments', () => {
  it('does not merge arbitrary public JSON into the spec', () => {
    const root = mkdtempSync(join(tmpdir(), 'swagger-public-'));
    const previousCwd = process.cwd();
    try {
      mkdirSync(join(root, 'pages/api'), { recursive: true });
      mkdirSync(join(root, 'public'), { recursive: true });
      writeFileSync(
        join(root, 'public', 'secrets.json'),
        JSON.stringify({ leaked: true, paths: { '/leaked': { get: {} } } })
      );
      writeFileSync(
        join(root, 'pages/api', 'ignored.ts'),
        'export {}\n'
      );
      process.chdir(root);
      const spec = createSwaggerSpec({
        apiFolder: 'pages/api',
        definition: {
          openapi: '3.0.0',
          info: { title: 'Public glob', version: '1.0.0' },
        },
      });
      expect(spec.paths?.['/leaked']).toBeUndefined();
    } finally {
      process.chdir(previousCwd);
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('still merges public/*.swagger.yaml fragments', () => {
    // same chdir pattern; write public/extra.swagger.yaml with a path entry
    // expect that path to exist on spec.paths
  });
});
```

The YAML sidecar should contain the path item directly, matching the existing
swagger-jsdoc sidecar format. The negative JSON test documents that unrelated
public assets are not scanned; the positive YAML test is the load-bearing
compatibility check.

**Verify**: `pnpm test` → both tests pass. Cwd after the describe equals
the original (the `finally` must always `chdir` back even on assertion
failure).

### Step 4: Lint

**Verify**: `pnpm lint` → exit 0. `pnpm exec tsc --noEmit` → exit 0.

## Test plan

- New describe in `test/index.test.ts` as in Step 3.
- Do not add `concurrent: true`.
- Verification: `pnpm test` → all pass.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0; public glob tests exist and pass
- [ ] `rg "publicDir.*json" src/swagger.ts` has no matches
- [ ] README no longer implies all public JSON is scanned
- [ ] Source `fileTypes` still includes `'json'` for API folders
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 007 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The existing `*.swagger.yaml` sidecar fixture cannot be parsed after the
  glob change.
- `process.chdir` appears to flake because Vitest parallelizes this file
  (it should not). If it flakes twice, STOP rather than adding cwd to
  `createSwaggerSpec` (API change; would need its own plan).
- You feel you must change source-folder `fileTypes` or compiled `.next`
  `json` globs — out of scope.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- This removes an ineffective broad glob; swagger-jsdoc did not parse raw JSON
  objects as sidecar documents before this change.
- Reviewer: trap file `secrets.json` / `leaked` path absent, YAML fragment
  still merged, source JSON globs untouched, and no example lockfile edits.
- `specFile: 'public/swagger.json'` remains the way to load a full spec
  (plan 006 validates that file).
