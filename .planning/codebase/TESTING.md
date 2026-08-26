# TESTING — next-swagger-doc

## Framework

- **Vitest** 3.1.2, configured in `vitest.config.ts` with `globals: true` (describe/it/expect available globally)
- Run with `pnpm test` (`vitest run`); UI mode via `pnpm test:ui`; coverage via `pnpm coverage` (`@vitest/coverage-v8`)

## Test Layout

- **Single test file**: `test/index.test.ts`
- **Suites**: `describe('withSwagger', …)` containing all `it(...)` cases
- **Snapshots**: `test/__snapshots__/index.test.ts.snap` (Vitest snapshot v1 format)
- **Fixtures**: `test/fixtures/` mirrors real Next.js app structure:
  - `app/**/route.ts` — source route files (App Router)
  - `app/api/regex/route.ts` — route with a regex literal containing a comment-like sequence (regression fixture)
  - `.next/server/app/**/route.js` — compiled route files (build-dir scanning)

## What Is Tested

1. **Default spec generation** — `createSwaggerSpec` with a minimal definition → snapshot
2. **Bearer auth** — `securitySchemes.bearerAuth` → snapshot
3. **OAuth2 auth** — `securitySchemes.OAuth2` with flows → snapshot
4. **App Router path/method extraction** — `extractApiInfo('test/fixtures/app')` returns exact sorted `{ path, methods }[]`, covering:
   - static routes (`/api/health` → get, head; `/users` → get, post)
   - dynamic segments (`/api/users/{id}` → patch, delete)
   - optional catch-all (`/blog` + `/blog/{slug}`)
   - `export { handler as GET, handler as POST }` re-export syntax
   - commented-out handlers and strings containing `export function DELETE` (comment/string handling)
   - regex literals containing comment-like sequences (`/api/regex` → get) — the case that broke the old hand-rolled scanner
5. **Compiled-route scanning** — `extractApiInfo('app/only-compiled', 'test/fixtures')` reads `.next/server` `route.js` when source is absent
6. **Auto-doc generation** — `autoDoc: true` produces default `200` responses; manual `@swagger` operations are **not** replaced
7. **Narrowed folders** — `extractApiInfo('test/fixtures/app/api')` scopes to a subfolder
8. **Missing directories** — `extractApiInfo('test/fixtures/missing')` returns `[]`

## Patterns

- **Snapshot testing** is the primary assertion style for spec output (`toMatchSnapshot`)
- **Exact-equality assertions** (`toEqual`) for extraction results
- **`toMatchObject`** for partial spec assertions (auto-doc merge test)
- No mocking framework in use — tests are pure/functional against real filesystem fixtures
- No test helpers or shared setup; each test is self-contained

## Coverage

- Coverage tooling present (`@vitest/coverage-v8`, `c8`), but no coverage thresholds configured and no coverage CI gate

## Gaps / Notes

- `.swm/testing-overview.b1r1n.sw.md` (Swimm doc) claims Playwright E2E tests exist — **no Playwright config or E2E tests are present in the repo** (stale doc)
- No CI workflow runs the test suite (only CodeQL + CodeSee workflows exist)
- No tests for the CLI (`src/cli.ts`) or for `withSwagger`'s error path
- `src/swagger.ts` base-path injection (`__NEXT_ROUTER_BASEPATH`) is untested
