# Plan 001: Gate `extractApiInfo` with `shouldScanBuildDirectory`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b87cecb..HEAD -- src/auto-doc.ts src/swagger.ts src/spec-source.ts src/index.ts test/index.test.ts AGENTS.md README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b87cecb`, 2026-08-26

## Why this matters

`createSwaggerSpec` already refuses to glob `.next` during Next.js production
build/export phases (`shouldScanBuildDirectory` in `src/swagger.ts`). That
gate was added to stop Vercel `ENOENT: .next/export-detail.json` failures
(issue #1157, commit `b491716`). `extractApiInfo` does not use the gate: it
`readdirSync`s every existing `.next/server/<apiFolder>` tree and unions
exported methods into autoDoc. With `autoDoc: true` (the App Router README
path) during `next build`, leftover compiled `route.js` handlers become extra
operations, and a `readdir`/`readFile` race while Next rewrites `.next` can
throw. Standalone fallback must still scan compiled output when the source
folder is gone.

## Current state

- `src/swagger.ts` — owns `shouldScanBuildDirectory`, `createSwaggerSpec`,
  swagger-jsdoc globs. `createSwaggerSpec` gates globs, then calls
  `extractApiInfo(apiFolder)` with no scan options.
- `src/auto-doc.ts` — `extractApiInfo` always walks `sourceDirs` and
  `buildDirs`.
- `src/spec-source.ts` — `discoverSpecLocations` maps folders to
  `.next/server/<folder>`. JSDoc already says this file owns the build-output
  layout.
- `src/index.ts` — `export * from './auto-doc'` and `export * from './swagger'`
  (public API). Tests import `shouldScanBuildDirectory` and `extractApiInfo`
  from `../src`.
- `test/index.test.ts` — `shouldScanBuildDirectory` is unit-tested with temp
  dirs; `extractApiInfo` is not tested against `NEXT_PHASE` or source+compiled
  union. Compiled-only fixture: `extractApiInfo('app/only-compiled', 'test/fixtures')`.

`src/auto-doc.ts:29-36`:

```typescript
export function extractApiInfo(
  apiFolder: string,
  cwd = process.cwd()
): ApiInfo[] {
  const { sourceDirs, buildDirs } = discoverSpecLocations([apiFolder], cwd);
  const directories = [...sourceDirs, ...buildDirs].filter(existsSync);
```

`src/swagger.ts:35-70` (`NEXT_BUILD_PHASES` + `shouldScanBuildDirectory`) and
`src/swagger.ts:158-201` (globs gated; autoDoc calls `extractApiInfo(apiFolder)`).

Do **not** import `shouldScanBuildDirectory` from `src/swagger.ts` into
`src/auto-doc.ts` — `swagger.ts` already imports `extractApiInfo` from
`auto-doc.ts` (circular).

Conventions: Biome 2-space, 80-column, `src/` only. TypeScript strict, no
`any`. Named exports. Optional last args so tests can pass a fixture cwd
(`extractApiInfo`, `discoverSpecLocations`). Tests: Vitest, real fixtures /
temp dirs, no mocks (`AGENTS.md`). Conventional commits (`fix:`, `test:`).

`AGENTS.md` constraint to honor:

> Do not glob `.next` while Next.js is compiling (`NEXT_PHASE` production
> build/export). Scan compiled output only when the source folder is missing,
> or set `scanBuildOutput: true`.

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Install   | `pnpm install`                  | exit 0              |
| Tests     | `pnpm test`                     | all pass            |
| Lint      | `pnpm lint`                     | exit 0              |
| Typecheck | `pnpm exec tsc --noEmit`        | exit 0 (no `typecheck` script in root `package.json`) |
| Build     | `pnpm build`                    | exit 0              |

This repo has no root `typecheck` script. Lint is `biome lint src` (not `test/`).

## Scope

**In scope**:
- `src/spec-source.ts`
- `src/swagger.ts`
- `src/auto-doc.ts`
- `test/index.test.ts`
- `README.md` (one sentence if the Vercel/standalone section still implies
  autoDoc never walks `.next` during build)

**Out of scope**:
- `src/cli.ts`, `src/route-parser.ts`, `src/route-path.ts`
- Example apps (`AGENTS.md`: do not rewrite example lockfiles)
- Changing default `apiFolder` (`pages/api`)
- Capturing a real webpack/turbopack `route.js` (deferred investigate)
- Restricting `public/**/*.json` (plan 007)
- `withSwagger` status codes (plan 003)

## Git workflow

- Branch: `advisor/001-gate-extract-api-info`
- Commits: conventional. Example from history: `fix: skip .next glob during Next.js builds (#1248)`
- Suggested: `fix: skip compiled autoDoc scan during Next.js builds`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move the scan gate into `src/spec-source.ts`

Cut `NEXT_BUILD_PHASES` and `shouldScanBuildDirectory` from `src/swagger.ts`
into `src/spec-source.ts` (that module already owns `.next/server/<folder>`).
Keep the function signature and JSDoc identical.

In `src/swagger.ts`, re-export so the public API is unchanged:

```typescript
export { shouldScanBuildDirectory } from './spec-source';
```

Remove the now-unused `existsSync` import from `swagger.ts` only if nothing
else in that file needs it (`loadSpecFile` and `isAutoDocEnabled` still use
`existsSync` — keep the import).

**Verify**: `pnpm exec tsc --noEmit` → exit 0. `pnpm test` → existing
`describe('shouldScanBuildDirectory')` tests still pass (they import from
`../src`).

### Step 2: Filter build dirs inside `extractApiInfo`

In `src/auto-doc.ts`, import `shouldScanBuildDirectory` from `./spec-source`
(not `./swagger`). Extend the signature without breaking the two-arg call
sites:

```typescript
export function extractApiInfo(
  apiFolder: string,
  cwd = process.cwd(),
  options?: { scanBuildOutput?: boolean; nextPhase?: string }
): ApiInfo[] {
  const { sourceDirs, buildDirs } = discoverSpecLocations([apiFolder], cwd);
  const directories: string[] = [];
  for (const [index, sourceDirectory] of sourceDirs.entries()) {
    if (existsSync(sourceDirectory)) {
      directories.push(sourceDirectory);
    }
    const buildDirectory = buildDirs[index];
    if (
      buildDirectory &&
      shouldScanBuildDirectory({
        sourceDirectory,
        buildDirectory,
        scanBuildOutput: options?.scanBuildOutput,
        nextPhase: options?.nextPhase,
      })
    ) {
      directories.push(buildDirectory);
    }
  }
  // existing loop over directories unchanged
```

Keep the rest of `extractApiInfo` (method union, sort, filter) as-is.

In `createSwaggerSpec`, replace `extractApiInfo(apiFolder)` with:

```typescript
extractApiInfo(apiFolder, process.cwd(), { scanBuildOutput })
```

so an explicit `scanBuildOutput: true` still unions compiled handlers.

**Verify**: `pnpm test` → existing tests pass, including
`extracts compiled routes when source files are unavailable`
(`test/index.test.ts:129-133`).

### Step 3: Characterization tests for the gate

In `test/index.test.ts`, next to `describe('shouldScanBuildDirectory')`, add
tests that use temp directories (copy the `mkdtempSync` / `mkdirSync` /
`rmSync` / `try/finally` pattern already in that describe).

Cases (all must exist):

1. **Source + compiled, default options** — write
   `app/api/hello/route.ts` exporting `GET`, and
   `.next/server/app/api/hello/route.js` exporting `OPTIONS`.
   `extractApiInfo('app/api', root)` returns only `get` for `/api/hello`.
   Compiled-only methods must not appear.
2. **Source missing, compiled present** — same compiled file, no source
   folder. `extractApiInfo('app/api', root)` returns `options` (standalone
   fallback still works).
3. **Both exist, `scanBuildOutput: true`** — union includes `get` and
   `options`.
4. **Both exist, `nextPhase: 'phase-production-build'`** — only source
   `get`, even if compiled `OPTIONS` is present.
5. **`scanBuildOutput: true` overrides `phase-production-build`** — union
   includes both (matches existing `shouldScanBuildDirectory` flag test).

Route files can be one-liners: `export function GET() {}` /
`export function OPTIONS() {}` (same shape as
`test/fixtures/.next/server/app/only-compiled/compiled/route.js`).

Do not use `process.chdir`. Pass `cwd` as the second argument.

**Verify**: `pnpm test` → new tests pass. Count: five new `it(...)` blocks.

### Step 4: Lint and docs

`pnpm lint` on `src/`. If README “Vercel builds” (`README.md` ~171-173)
claims autoDoc never walks `.next` during build, add one sentence that
`extractApiInfo` uses the same `shouldScanBuildDirectory` gate as the
swagger-jsdoc globs.

Do not change example apps.

**Verify**: `pnpm lint` → exit 0. `pnpm exec tsc --noEmit` → exit 0.
`pnpm build` → exit 0.

## Test plan

- File: `test/index.test.ts` (do not create a new test file; this repo has
  one suite).
- Pattern: `describe('shouldScanBuildDirectory')` temp-dir tests
  (`test/index.test.ts:187-258`).
- Cases: listed in Step 3.
- Existing tests that must still pass:
  - `extracts compiled routes when source files are unavailable`
  - `extracts App Router paths and exported HTTP methods`
  - `generates basic documentation without replacing manual operations`
- Verification: `pnpm test` → all pass, including 5 new tests.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0; five new `extractApiInfo` scan-gate tests exist and pass
- [ ] `src/auto-doc.ts` no longer concatenates `[...sourceDirs, ...buildDirs]`
      without `shouldScanBuildDirectory` (`rg "sourceDirs, ...buildDirs" src/auto-doc.ts` matches nothing)
- [ ] `shouldScanBuildDirectory` is defined in `src/spec-source.ts` and
      re-exported from `src/swagger.ts`
- [ ] `src/auto-doc.ts` does not import from `./swagger`
- [ ] Compiled-only fixture test still passes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 001 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts.
- Moving `shouldScanBuildDirectory` requires changing its public type or
  renaming it.
- `extractApiInfo('app/only-compiled', 'test/fixtures')` fails after the gate
  (standalone fallback must keep working).
- A circular import appears (`auto-doc` → `swagger` → `auto-doc`).
- A step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file.

## Maintenance notes

- Any new way of discovering `.next` (custom `distDir`, standalone layout)
  belongs in `discoverSpecLocations` / `shouldScanBuildDirectory`, not in
  `extractApiInfo`.
- Reviewer: confirm `scanBuildOutput: true` still unions compiled methods;
  confirm production phases skip compiled when source exists.
- Follow-up (not this plan): a fixture captured from a real `next build`
  `route.js` (webpack/CJS). Current fixtures are hand-written ESM.
