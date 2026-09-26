# Plan 006: Reject invalid `specFile` JSON instead of throwing raw `JSON.parse`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b87cecb..HEAD -- src/swagger.ts test/index.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 003 also edits `src/swagger.ts` but only
  `withSwagger`; do not restyle unrelated functions)
- **Category**: bug
- **Planned at**: commit `b87cecb`, 2026-08-26

## Why this matters

`loadSpecFile` is the standalone-output path: if `public/swagger.json`
exists, `createSwaggerSpec` returns it and skips scanning
(`src/swagger.ts:140-145`). Today it is a bare `JSON.parse` plus
`as OAS3Definition`. Truncated JSON throws `SyntaxError`. A JSON array or
empty `{}` is returned as a "spec", which Swagger UI cannot render. Missing
files must still return `undefined` so callers fall back to scanning.

## Current state

`src/swagger.ts:77-90`:

```typescript
export function loadSpecFile(
  specFile: string,
  cwd = process.cwd()
): OAS3Definition | undefined {
  const specPath = resolveUserPath(specFile, cwd);
  if (!existsSync(specPath)) {
    return undefined;
  }
  return JSON.parse(readFileSync(specPath, 'utf8')) as OAS3Definition;
}
```

`test/index.test.ts:273-303` — happy path: valid specFile is returned and
routes are not scanned. No invalid-JSON test. `loadSpecFile` is exported
from `src/swagger.ts` and therefore from `src/index.ts`.

Do not add swagger-parser / full OpenAPI schema validation. Check:

1. JSON parses
2. Value is a non-null plain object (not array)
3. `openapi` or `swagger` is a string (OpenAPI 3 / Swagger 2 marker)

Throw `Error` with a stable message that includes the word `specFile` and
does not need to include the full path (path is useful; keep it if it is
already `specPath`).

Conventions: optional `cwd` last arg; temp-dir tests; no `any` (use
`unknown` then narrow).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `pnpm test`              | all pass            |
| Lint      | `pnpm lint`              | exit 0              |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |

## Scope

**In scope**:
- `src/swagger.ts` (`loadSpecFile` only)
- `test/index.test.ts`
- `plans/README.md` (status bookkeeping only)

**Out of scope**:
- `withSwagger` status codes (plan 003)
- Restricting `public/**/*.json` globs (plan 007)
- Fetching remote spec URLs
- YAML spec files

## Git workflow

- Branch: `advisor/006-specfile-json-validation`
- Commit: `fix: reject invalid specFile JSON`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Harden `loadSpecFile`

Replace the parse/return with:

```typescript
  const contents = readFileSync(specPath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error(`Invalid JSON in specFile ${specPath}`);
  }
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    throw new Error(`specFile is not an OpenAPI object: ${specPath}`);
  }
  const document = parsed as Record<string, unknown>;
  if (
    typeof document.openapi !== 'string' &&
    typeof document.swagger !== 'string'
  ) {
    throw new Error(`specFile is not an OpenAPI object: ${specPath}`);
  }
  return parsed as OAS3Definition;
```

Keep the `existsSync` → `undefined` branch unchanged.
Read the file before the parse `try` so permission errors, directory paths,
and read races retain their filesystem error instead of being mislabeled as
invalid JSON.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Tests

In `describe('standalone spec files')` (`test/index.test.ts:273`), add:

1. **Invalid JSON throws** — write `not-json` to a temp file; `createSwaggerSpec({ specFile, definition: { openapi: '3.0.0', info: { title: 'x', version: '1' } } })` throws `/Invalid JSON/`.
2. **Empty object throws** — write `{}`; throws `/not an OpenAPI object/`.
3. **Array throws** — write `[]`; throws `/not an OpenAPI object/`.
4. **Missing file still scans / does not throw** — existing test
   `returns a prebuilt specFile without scanning routes` stays; add
   `createSwaggerSpec({ specFile: join(temp, 'missing.json'), apiFolder: 'test/fixtures/app/api', autoDoc: true, definition: { ... } })` and expect
   `spec.paths` to include `/api/health` (fallback). Or call `loadSpecFile`
   directly and expect `undefined`. Direct `loadSpecFile` is simpler —
   import it from `../src`.
5. **Read errors stay read errors** — pass an existing directory as
   `specFile`; it must throw a filesystem error, not `Invalid JSON`.

Keep the existing valid specFile test as-is (it already has `openapi` and
`info`).

**Verify**: `pnpm test` → all pass including new cases.

### Step 3: Lint

**Verify**: `pnpm lint` → exit 0.

## Test plan

- File: `test/index.test.ts`, describe `standalone spec files`.
- Pattern: existing specFile temp-file test (`test/index.test.ts:274-303`).
- Verification: `pnpm test` → all pass.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0; invalid JSON / `{}` / `[]` / missing-file and read-error cases exist
- [ ] `loadSpecFile` still returns `undefined` when the file is missing
- [ ] Valid specFile test still passes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 006 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `createSwaggerSpec` no longer short-circuits on a successful `loadSpecFile`
  (must still skip route scanning when a valid spec exists).
- You think you need a full OpenAPI validator package — do not add
  dependencies; this plan is parse + shape check only.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Swagger UI "Unable to render this definition" on `{}` should no longer
  happen for `specFile` (it will throw instead). `withSwagger` (after plan
  003) maps that throw to HTTP 500 with a constant message.
- Reviewer: missing file = `undefined`; garbage = throw; valid 3.0 document
  unchanged.
