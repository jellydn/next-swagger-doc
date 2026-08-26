# Plan 002: CLI creates output directories and fails with clear errors

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b87cecb..HEAD -- src/cli.ts src/swagger.ts test/index.test.ts package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `b87cecb`, 2026-08-26

## Why this matters

The documented standalone path is:

```sh
npx next-swagger-doc-cli next-swagger-doc.json --output public/swagger.json
```

(`README.md` around line 182). `src/cli.ts` calls `writeFileSync` on that
path with no `mkdirSync`. A fresh app with no `public/` directory throws
`ENOENT`. Missing or invalid JSON config also crash as uncaught exceptions.
If the config JSON contains `outputFile`, `createSwaggerSpec` may write that
path *and* the CLI writes `--output` (double write). `createSwaggerSpec`'s
`outputFile` path already uses `mkdirSync(dirname(outputPath), { recursive: true })`
(`src/swagger.ts:204-207`) — match that for the CLI, and write only `--output`.

`src/cli.ts` is untested today.

## Current state

`src/cli.ts` in full (39 lines). Top-level `cli()` from `cleye` runs at import
time — tests **must not** `import './cli'` or they will parse process argv and
exit. Extract writable logic into a new module.

```typescript
import { readFileSync, writeFileSync } from 'fs';
import { cli } from 'cleye';
import { type SwaggerOptions, createSwaggerSpec } from './swagger';

const argv = cli({
  name: 'next-swagger-doc-cli',
  // Becomes available in ._.filePath   ← stale comment; the param is configFile
  parameters: ['<config file>'],
  flags: {
    output: {
      type: String,
      description: 'Output file path',
      default: 'public/swagger.json',
    },
  },
});

const config = readFileSync(argv._.configFile);
const spec = createSwaggerSpec(
  JSON.parse(config.toString()) as unknown as SwaggerOptions
);
console.log(
  `Generating swagger spec to ${argv.flags.output} with config`,
  config.toString()
);
writeFileSync(argv.flags.output, JSON.stringify(spec, null, 2));
```

`src/swagger.ts:204-207` (the pattern to copy for mkdir):

```typescript
if (outputFile) {
  const outputPath = resolveUserPath(outputFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(spec, null, 2));
}
```

`package.json` bin: `"next-swagger-doc-cli": "dist/cli.js"`. pkgroll builds
`src/cli.ts` → `dist/cli.js`. Do not edit `dist/`.

Conventions: `node:fs` / `node:path` prefixes (see `src/swagger.ts`), 2-space,
80-col Biome, no `any` (the existing `as unknown as SwaggerOptions` may stay
after a JSON-object check). Tests live in `test/index.test.ts`, Vitest,
temp dirs, no mocks.

Do **not** add `--apiFolder`, YAML output, or watch mode (deferred product
work).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pnpm install`           | exit 0              |
| Tests     | `pnpm test`              | all pass            |
| Lint      | `pnpm lint`              | exit 0              |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Build     | `pnpm build`             | exit 0              |

## Scope

**In scope**:
- `src/cli.ts`
- `src/cli-write.ts` (create — extracted function so tests can import it
  without running cleye)
- `test/index.test.ts`
- `plans/README.md` (status bookkeeping only)

**Out of scope**:
- `src/swagger.ts` `outputFile` behavior for library callers (already mkdirs)
- New CLI flags (`--apiFolder`, `--watch`)
- Example apps / lockfiles
- Publishing a new version

## Git workflow

- Branch: `advisor/002-cli-mkdir-and-errors`
- Commit example: `fix: create CLI output directories and report config errors`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extract `writeCliSpec`

Create `src/cli-write.ts` exporting:

```typescript
export function writeCliSpec(configFile: string, outputFile: string): void
```

Behavior:

1. `readFileSync(configFile, 'utf8')`. If this throws, let it throw (missing
   file). Callers wrap it.
2. `JSON.parse` inside try/catch. On `SyntaxError`, throw
   `Error('Invalid JSON in config file <configFile>')`. Do not include the
   raw parse message if it is huge; the path is enough.
3. If the parsed value is not a non-null object (or is an array), throw
   `Error('Config file must contain a JSON object')`.
4. Pass the CLI output path to `createSwaggerSpec`, overriding any configured
   `outputFile`. This keeps path resolution, directory creation, and JSON
   serialization in their canonical implementation:

   ```typescript
   createSwaggerSpec({ ...(parsed as SwaggerOptions), outputFile });
   ```

Do not duplicate `createSwaggerSpec`'s `mkdirSync`, path resolution, or
`writeFileSync` behavior in the CLI helper.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Thin `src/cli.ts`

`src/cli.ts` should only parse argv with cleye (keep the same flag names and
default `public/swagger.json`), then:

```typescript
try {
  writeCliSpec(argv._.configFile, argv.flags.output);
  console.log(`Generating swagger spec to ${argv.flags.output}`);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to generate swagger spec';
  console.error(message);
  process.exitCode = 1;
}
```

Fix the stale comment `// Becomes available in ._.filePath` to `configFile`.
Do not log the full config body (current `console.log(..., config.toString())`
dumps the file). A single line with the output path is enough.

Do not use `process.exit(1)` if `exitCode = 1` is enough for the bin to fail;
either is acceptable. Prefer `process.exitCode = 1` so tests of `writeCliSpec`
are unaffected.

**Verify**: `pnpm lint` → exit 0.

### Step 3: Tests for `writeCliSpec`

Add `describe('writeCliSpec', () => { ... })` in `test/index.test.ts`.
Import from `../src/cli-write` (not `../src/cli`). Pattern: temp dirs in
`describe('standalone spec files')` (`test/index.test.ts:273-327`).

Cases:

1. **Nested output without parent dir** — temp root has no `public/`.
   Config JSON: `{ "apiFolder": "<existing fixture>", "autoDoc": true, "definition": { "openapi": "3.0.0", "info": { "title": "CLI", "version": "1.0.0" } } }`.
   Use `apiFolder: 'test/fixtures/app/api'` with the process cwd (repo root)
   so scanning works, and `outputFile` under the temp dir, e.g.
   `join(temp, 'public/swagger.json')`.
   After `writeCliSpec(configPath, outputPath)`, `existsSync(outputPath)` is
   true and parsed JSON has `info.title === 'CLI'`.
2. **Invalid JSON config** — write `not-json` to the config file.
   `expect(() => writeCliSpec(configPath, outputPath)).toThrow(/Invalid JSON/)`.
3. **Invalid config shape** — cover `null`, a primitive, and an array;
   each must throw `Config file must contain a JSON object`.
4. **Missing config file** — `expect(() => writeCliSpec(join(temp, 'missing.json'), outputPath)).toThrow()`.
5. **Config `outputFile` does not double-write** — config includes
   `outputFile: join(temp, 'from-config.json')` and CLI output is
   `join(temp, 'from-flag.json')`. After the call, `from-flag.json` exists
   and `from-config.json` does **not**.

**Verify**: `pnpm test` → new tests pass.

### Step 4: Build the bin

`pnpm build` so `dist/cli.js` still exists as the published bin. Do not
hand-edit `dist/`. After building, run the bin once with an invalid temporary
config and verify it exits non-zero, writes the concise `Invalid JSON` message
to stderr, and does not print the raw config contents.

**Verify**: `pnpm build` → exit 0. `pnpm exec tsc --noEmit` → exit 0.

## Test plan

- New tests in `test/index.test.ts` as listed in Step 3.
- Pattern: `describe('standalone spec files')` temp-file tests.
- Keep the automated unit tests on `writeCliSpec`; use the focused built-bin
  command in Step 4 to verify cleye wiring and process exit behavior.
- Verification: `pnpm test` → all pass including 5 new tests.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0; five `writeCliSpec` tests exist and pass
- [ ] `pnpm build` exits 0
- [ ] Built CLI exits non-zero with concise stderr for invalid JSON
- [ ] `rg "writeFileSync" src/cli.ts` — `cli.ts` no longer writes the spec
      itself (writing remains in `createSwaggerSpec`)
- [ ] `rg "mkdirSync|writeFileSync" src/cli-write.ts` has no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 002 updated

## STOP conditions

Stop and report back (do not improvise) if:

- pkgroll stops emitting `dist/cli.js` after splitting the module (check
  `package.json` `"bin"` still points at `dist/cli.js` and the build output
  includes it). If the split breaks the bin, keep argv + write in `cli.ts`
  but export `writeCliSpec` from `cli.ts` behind an
  `import.meta.url` main-guard — and STOP to report that fallback if you
  need it, because ESM main-guards plus pkgroll CJS/ESM dual emit are easy
  to get wrong.
- `createSwaggerSpec` without `outputFile` no longer returns a spec object.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- A later CLI postbuild plan (`--apiFolder`, watch) should import
  `writeCliSpec` rather than growing `cli.ts` again.
- Reviewer: confirm config `outputFile` is ignored so `--output` is the
  single write; confirm `public/` is created.
- Do not log config file contents (may contain local paths).
