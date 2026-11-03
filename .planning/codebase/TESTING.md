# Testing Patterns

**Analysis Date:** 2026-08-26

## Test Framework

**Runner:**
- Vitest 4.1.11 (`vitest` / `@vitest/ui` / `@vitest/coverage-v8` in `package.json`)
- Config: `vitest.config.ts` (`test.globals: true` only — no custom environment, include, or coverage block)

**Assertion Library:**
- Vitest `expect` (imported from `vitest` in `test/index.test.ts`, even though globals are enabled)

**Run Commands:**
```bash
pnpm test              # Run all tests
pnpm exec vitest       # Watch mode (no package script; `pnpm test` is `vitest run`)
pnpm coverage          # Coverage
```

`pnpm test:ui` (`vitest --ui`) is the interactive UI. There is no `test:watch` script in `package.json`.

## Test File Organization

**Location:**
- Separate `test/` tree (not co-located with `src/`). One suite file covers the whole library.

**Naming:**
- `test/index.test.ts` plus Vitest snapshots `test/__snapshots__/index.test.ts.snap`.
- Fixture routes keep Next.js names: `route.ts` / compiled `route.js`.

**Structure:**
```
test/
  index.test.ts
  __snapshots__/
    index.test.ts.snap
  fixtures/
    app/                          # App Router source tree
      api/health/route.ts
      api/manual/route.ts         # JSDoc @swagger wins over autoDoc
      api/regex/route.ts          # regex vs comment-stripping
      api/users/[id]/route.ts     # dynamic segment
      blog/[[...slug]]/route.ts   # optional catch-all
      commented/route.ts
      users/route.ts              # re-export / commented false-positive
    .next/server/app/only-compiled/compiled/route.js  # compiled-only fallback
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it } from 'vitest';

import {
  createSwaggerSpec,
  extractApiInfo,
  isAutoDocEnabled,
  shouldScanBuildDirectory,
} from '../src';
import { mergeAutoDoc } from '../src/merge-auto-doc';

describe('withSwagger', () => {
  it('extracts App Router paths and exported HTTP methods', () => {
    expect(extractApiInfo('test/fixtures/app')).toEqual([
      { path: '/api/health', methods: ['get', 'head'] },
      { path: '/api/users/{id}', methods: ['patch', 'delete'] },
    ]);
  });
});

describe('mergeAutoDoc', () => {
  it('keeps manual and auto-only paths and lets manual win per method', () => {
    expect(mergeAutoDoc(autoPaths, manualPaths)).toEqual({ /* ... */ });
  });
});
```

Suites in `test/index.test.ts` are grouped by symbol or feature: `withSwagger`, `shouldScanBuildDirectory`, `isAutoDocEnabled`, `standalone spec files`, `routeToOpenApiPaths`, `discoverSpecLocations`, `mergeAutoDoc`.

**Patterns:**
- Setup pattern: public API imported from `../src`; internals imported from their modules (`../src/merge-auto-doc`, `../src/route-path`, `../src/spec-source`). Filesystem cases create a temp dir with `mkdtempSync(join(tmpdir(), 'swagger-scan-'))` in `test/index.test.ts`.
- Teardown pattern: `try { ... } finally { rmSync(root, { recursive: true, force: true }); }` — no `beforeEach` / `afterEach` / `beforeAll`.
- Assertion pattern: `toEqual` for exact structures; `toMatchObject` for partial OpenAPI paths; `toMatchSnapshot` for full `createSwaggerSpec` documents; `toBe` for booleans/primitives; `toBeDefined` for path presence. Older cases use `should ...` names; newer ones use present-tense verbs (`extracts`, `skips`, `honors`, `merges`).

## Mocking

**Framework:** None. No `vi.mock`, `jest.mock`, or fake timers appear in `test/index.test.ts`.

**Patterns:**
```typescript
// Prefer a real fixture tree over a mocked fs:
expect(extractApiInfo('test/fixtures/app/api/regex')).toEqual([
  { path: '/api/regex', methods: ['get'] },
]);

// When the filesystem must be isolated, use a real temp directory:
const root = mkdtempSync(join(tmpdir(), 'swagger-spec-'));
try {
  writeFileSync(specFile, JSON.stringify({ openapi: '3.0.0', /* ... */ }));
  const spec = createSwaggerSpec({ specFile, /* ... */ });
  expect(spec.info.title).toBe('Standalone');
} finally {
  rmSync(root, { recursive: true, force: true });
}
```

**What to Mock:**
- Do not introduce mocks for `fs`, `swagger-jsdoc`, or route parsing unless a new test cannot use a fixture or temp dir.
- Inject `cwd` / `nextPhase` arguments (`extractApiInfo(..., 'test/fixtures')`, `shouldScanBuildDirectory({ nextPhase: 'phase-production-build' })` in `test/index.test.ts`) instead of stubbing `process.env` or `process.cwd()`.

**What NOT to Mock:**
- App Router `route` modules — use `test/fixtures/**/route.ts`.
- Compiled output — use `test/fixtures/.next/server/app/only-compiled/compiled/route.js`.
- `createSwaggerSpec` / `swagger-jsdoc` — run the real pipeline and assert `spec.paths` or snapshots.
- `mergeAutoDoc`, `routeToOpenApiPaths`, `discoverSpecLocations` — call the real functions with in-memory objects.

## Fixtures and Factories

**Test Data:**
```typescript
// Real Next.js handlers under test/fixtures/app/api/health/route.ts
export function GET() {
  return Response.json({ status: 'ok' });
}
export async function HEAD() {
  return new Response(null);
}

// Manual JSDoc wins when autoDoc is on (test/fixtures/app/api/manual/route.ts)
/**
 * @swagger
 * /api/manual:
 *   get:
 *     summary: Manual documentation
 *     responses:
 *       204:
 *         description: No content
 */
export function GET() {
  return new Response(null, { status: 204 });
}

// Inline objects for pure unit cases (test/index.test.ts mergeAutoDoc):
const autoPaths = {
  '/api/health': { get: { summary: 'GET /api/health' } },
};
```

**Location:**
- On-disk App Router trees: `test/fixtures/app/` (dynamic `[id]`, optional catch-all `[[...slug]]`, commented exports, regex literals, alias re-exports).
- Compiled-only fallback: `test/fixtures/.next/server/app/only-compiled/compiled/route.js` (consumed via `extractApiInfo('app/only-compiled', 'test/fixtures')` in `test/index.test.ts`).
- Snapshot golden files: `test/__snapshots__/index.test.ts.snap`.
- Ad-hoc JSON specs and output files are written into `os.tmpdir()` during the test, not checked in.
- AGENTS.md: prefer these real fixtures over mocks.

## Coverage

**Requirements:** None enforced. `vitest.config.ts` has no `coverage.thresholds`. `@vitest/coverage-v8` 4.1.11 is a devDependency; `c8` is listed but unused by scripts. Coverage output dir `coverage/` is gitignored in `.gitignore`.

**View Coverage:**
```bash
pnpm coverage
```

(`vitest run --coverage` from `package.json`). Default v8 reporter; no custom include/exclude in `vitest.config.ts`.

## Test Types

**Unit Tests:**
- Pure functions with in-memory inputs in `test/index.test.ts`: `mergeAutoDoc`, `routeToOpenApiPaths`, `discoverSpecLocations`, `isAutoDocEnabled`.
- Filesystem predicates (`shouldScanBuildDirectory`) use temp directories, not the repo tree.
- Scope is one function per `describe`; assertions are exact `toEqual` / `toBe`.

**Integration Tests:**
- `createSwaggerSpec` + `extractApiInfo` against `test/fixtures/app` and `test/fixtures/app/api`, including `autoDoc: true` merge with JSDoc `@swagger` in `test/fixtures/app/api/manual/route.ts`.
- Standalone `specFile` / `outputFile` round-trips write and read real JSON.
- Compiled-route discovery hits `test/fixtures/.next/...`.
- Full spec shape for auth examples is locked with snapshots in `test/__snapshots__/index.test.ts.snap`.

**E2E Tests:**
- Not used. Example apps under `examples/next13-simple`, `examples/next14-app`, `examples/next15-app`, `examples/next16-app` are demos with their own lockfiles; AGENTS.md says library changes are verified with `pnpm test` at the repo root, not by running those apps.

## Common Patterns

**Async Testing:**
```typescript
// Tests are synchronous. createSwaggerSpec, extractApiInfo, and fs helpers
// used in test/index.test.ts are sync (readFileSync / writeFileSync).
it('writes the generated spec to outputFile', () => {
  const spec = createSwaggerSpec({
    apiFolder: 'test/fixtures/app/api',
    autoDoc: true,
    outputFile,
    definition: { openapi: '3.0.0', info: { title: 'Written', version: '1.0.0' } },
  });
  const saved = JSON.parse(readFileSync(outputFile, 'utf8')) as {
    info: { title: string };
  };
  expect(saved.info.title).toBe('Written');
  expect(spec.info.title).toBe('Written');
});
```

Do not add `async`/`await` unless the production API becomes async. Fixture handlers may be `async` (`HEAD` / `PATCH` in `test/fixtures/app/api/health/route.ts` and `test/fixtures/app/api/users/[id]/route.ts`); the extractor only cares about export names.

**Error Testing:**
```typescript
// No `expect().toThrow()` in test/index.test.ts. Empty/invalid inputs
// are asserted as empty results or boolean false:

it('ignores a missing App Router directory', () => {
  expect(extractApiInfo('test/fixtures/missing')).toEqual([]);
});

it('keeps autoDoc off when source files exist', () => {
  expect(isAutoDocEnabled(undefined, false)).toBe(false);
  expect(isAutoDocEnabled(false, true)).toBe(false);
});

it('skips missing build directories', () => {
  const root = mkdtempSync(join(tmpdir(), 'swagger-scan-'));
  try {
    expect(
      shouldScanBuildDirectory({
        sourceDirectory: join(root, 'app/api'),
        buildDirectory: join(root, '.next/server/app/api'),
      })
    ).toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
```

`withSwagger`'s `try/catch` 400 path in `src/swagger.ts` and `getExportedMethods` parse warnings in `src/route-parser.ts` are not covered by dedicated throw tests.

---

*Testing analysis: 2026-08-26*
