# Plan 003: `withSwagger` returns HTTP 500 without leaking error messages

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

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 006 also touches `loadSpecFile`; do not edit
  `loadSpecFile` here)
- **Category**: bug
- **Planned at**: commit `b87cecb`, 2026-08-26

## Why this matters

`withSwagger` is the Pages Router helper. Any throw from `createSwaggerSpec`
(bad glob, invalid YAML JSDoc, invalid `specFile` JSON, missing files
mid-walk) becomes `400 { error: <Error.message> }`. That is a server-side
failure, not a client input error, and `error.message` can include
filesystem paths. The Vitest suite named `describe('withSwagger')` never
calls `withSwagger` — it only snapshots `createSwaggerSpec`.

## Current state

`src/swagger.ts:222-246`:

```typescript
export function withSwagger({
  apiFolder = 'pages/api',
  schemaFolders = [],
  autoDoc,
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  return () => (_req: NextApiRequest, res: NextApiResponse) => {
    try {
      const swaggerSpec = createSwaggerSpec({
        apiFolder,
        schemaFolders,
        autoDoc,
        ...swaggerOptions,
      });
      res.status(200).send(swaggerSpec);
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create Swagger spec',
      });
    }
  };
}
```

`test/index.test.ts:22-35` — `describe('withSwagger')` calls
`createSwaggerSpec`, not `withSwagger`. `withSwagger` is not imported.

Conventions: no `any`; Biome 80-col; Vitest in `test/index.test.ts`; prefer
real fixtures over mock libraries. A small in-test `res` fake (object with
`status`/`send`/`json`) is allowed — this repo has no Next request test
harness. Do not add `vi.mock`.

Keep the Pages types (`NextApiRequest` / `NextApiResponse`). Do not add an
App Router helper (direction, issue #1190).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Tests     | `pnpm test`              | all pass            |
| Lint      | `pnpm lint`              | exit 0              |
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |

## Scope

**In scope**:
- `src/swagger.ts` (`withSwagger` only)
- `test/index.test.ts`
- `plans/README.md` (status bookkeeping only)

**Out of scope**:
- `loadSpecFile` validation (plan 006)
- App Router `route.ts` helper
- Changing `createSwaggerSpec` success behavior
- Example apps

## Git workflow

- Branch: `advisor/003-withswagger-error-status`
- Commit: `fix: return 500 from withSwagger without leaking errors`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Change the catch block

Replace the catch in `withSwagger` with:

```typescript
    } catch {
      res.status(500).json({
        error: 'Failed to create Swagger spec',
      });
    }
```

Do not send `error.message`, stack, or path. Optional: `console.error(error)`
before the response if you want server logs — if you add it, log the error
object, not a string built from user paths. Prefer no extra log unless you
need it for debugging the new tests; this library otherwise uses `console`
only in `src/route-parser.ts` for parse failures.

Do not change the 200 success path (`res.status(200).send(swaggerSpec)`).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Tests that actually call `withSwagger`

Import `withSwagger` from `../src` in `test/index.test.ts`.

Add a new `describe('withSwagger handler', () => { ... })` (leave the
existing snapshot describe name as-is so snapshots stay stable — do not
rename `describe('withSwagger')`).

Helper (inline in the test file):

```typescript
function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}
```

Cases:

The response helper intentionally implements only the methods this handler
uses, so pass it through an explicit test-boundary cast:
`res as unknown as NextApiResponse`. Do not weaken production types or add
unused response methods solely to satisfy the full Next.js interface.

1. **200** — `withSwagger({ definition: { openapi: '3.0.0', info: { title: 'H', version: '1' } }, apiFolder: 'test/fixtures/app/api', autoDoc: true })()({} as NextApiRequest, res as unknown as NextApiResponse)`.
   Expect `res.statusCode === 200` and `res.body` to be an object with
   `info.title === 'H'` (or `'Auto docs'` if you reuse that definition).
   Cast `_req` as needed; the handler ignores it.
2. **500, no message leak** — point `specFile` at a temp file whose contents
   are `not-json`. `createSwaggerSpec` → `loadSpecFile` → `JSON.parse` throws.
   Expect `res.statusCode === 500` and `res.body` equal to
   `{ error: 'Failed to create Swagger spec' }`.
   `JSON.stringify(res.body)` must not contain the temp file path.

Call shape: `withSwagger(options)` returns `() => (req, res) => void`.
Invoke as `withSwagger(options)()(req, res)`.

**Verify**: `pnpm test` → both new tests pass. Existing snapshots unchanged
(`git diff -- test/__snapshots__` should be empty unless you accidentally
renamed the snapshot describe).

### Step 3: Lint

**Verify**: `pnpm lint` → exit 0. `pnpm exec tsc --noEmit` → exit 0.

## Test plan

- File: `test/index.test.ts`, new describe `withSwagger handler`.
- Do not modify snapshot tests in `describe('withSwagger')`.
- Verification: `pnpm test` → all pass; `test/__snapshots__/index.test.ts.snap`
  unchanged.

## Done criteria

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0; two new handler tests pass
- [ ] `rg "status\\(400\\)" src/swagger.ts` matches nothing
- [ ] `rg "error.message" src/swagger.ts` matches nothing inside `withSwagger`
- [ ] Snapshot file unchanged
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 003 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `withSwagger` is no longer a double-function `(options) => () => (req, res)`
  (that shape is the Pages API wrapper used in
  `examples/next13-simple/pages/api/doc.ts`).
- Making tests typecheck appears to require `any` or disabling `strict`.
- Snapshot tests fail after an unrelated `createSwaggerSpec` change — revert
  those changes; this plan must not alter generated default specs.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- App Router apps should keep using `createSwaggerSpec` in a Server Component
  (see `examples/next14-app/lib/swagger.ts`). A Route Handler helper is a
  separate design (issue #1190).
- Reviewer: 500 + constant message; no path in JSON; snapshots untouched.
