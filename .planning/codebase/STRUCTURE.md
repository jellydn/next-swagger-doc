# Codebase Structure

**Analysis Date:** 2026-08-26

## Directory Layout

```
codemap/  # next-swagger-doc — OpenAPI spec generator for Next.js API routes
├── src/  # Library TypeScript source (strict ESM); pkgroll compiles to dist/
│   ├── index.ts  # Public barrel: re-exports auto-doc + swagger
│   ├── swagger.ts  # createSwaggerSpec, withSwagger, SwaggerOptions, scan policy
│   ├── auto-doc.ts  # Walk route files, extract ApiInfo, generate operations
│   ├── cli.ts  # next-swagger-doc-cli entry (cleye)
│   ├── merge-auto-doc.ts  # Manual JSDoc operations win over generated
│   ├── route-parser.ts  # es-module-lexer HTTP method export detection
│   ├── route-path.ts  # Next.js folder segments → OpenAPI paths
│   └── spec-source.ts  # sourceDirs / .next/server buildDirs / publicDir
├── test/  # Vitest tests, snapshots, and App Router fixtures
│   ├── index.test.ts  # All library tests (snapshots + unit)
│   ├── __snapshots__/index.test.ts.snap  # createSwaggerSpec snapshots
│   └── fixtures/
│       ├── app/  # Source App Router route.* fixtures
│       └── .next/server/app/only-compiled/  # Compiled-only fallback fixture
├── examples/  # Versioned Next.js demo apps (own lockfiles; published package)
│   ├── next13-simple/  # Next.js 13 Pages Router + models/schemaFolders + CLI
│   ├── next14-app/  # Next.js 14 App Router + swagger-ui-react
│   ├── next15-app/  # Next.js 15 App Router (same layout as 14)
│   └── next16-app/  # Next.js 16 App Router (Node >= 20.9)
├── .agents/  # Agent setup/resume scripts
├── .github/  # FUNDING.yml and GitHub Actions (CodeQL, CodeSee)
├── .planning/codebase/  # Architecture/structure notes (this folder)
├── AGENTS.md  # Agent instructions for this repo
├── biome.json  # Format + lint for src (2-space, 80-col)
├── CHANGELOG.md  # Keep a Changelog / Changie
├── cspell.json  # Spellcheck config
├── cspell-tool.txt  # Project dictionary
├── LICENSE  # MIT
├── package.json  # Library package, scripts, exports, bin
├── pnpm-lock.yaml  # Root lockfile (pnpm 11.24.0)
├── README.md  # Usage (App Router, Pages, API route, CLI)
├── renovate.json  # Dependency update policy
├── SECURITY.md  # Vulnerability reporting
├── tsconfig.json  # Strict TS, rootDir src, noEmit
├── vitest.config.ts  # Vitest globals
└── example-screenshot.png  # README screenshot
```

## Directory Purposes

**src/:**
- Purpose: All library implementation. Do not edit `dist/`; pkgroll writes it from here (`package.json` `build`/`prepare`).
- Contains: Eight `.ts` modules, no subpackages, no React UI.
- Key files: `src/index.ts`, `src/swagger.ts`, `src/auto-doc.ts`, `src/cli.ts`, `src/merge-auto-doc.ts`, `src/route-parser.ts`, `src/route-path.ts`, `src/spec-source.ts`

**test/:**
- Purpose: Vitest coverage of public and internal helpers using real route fixtures rather than mocks (`AGENTS.md`).
- Contains: One test file, one snapshot, App Router `route.ts` trees, and a compiled `.next` fallback.
- Key files: `test/index.test.ts`, `test/fixtures/app/api/health/route.ts`, `test/fixtures/app/api/manual/route.ts`, `test/fixtures/app/api/regex/route.ts`, `test/fixtures/app/api/users/[id]/route.ts`, `test/fixtures/app/blog/[[...slug]]/route.ts`, `test/fixtures/app/commented/route.ts`, `test/fixtures/app/users/route.ts`, `test/fixtures/.next/server/app/only-compiled/compiled/route.js`

**examples/:**
- Purpose: Version-locked demos. Depend on published `next-swagger-doc` (GitHub tag in their `package.json`), not workspace linking. Do not bump 13/14/15 examples to 16.
- Contains: Four independent Next.js apps with their own `pnpm-lock.yaml`.
- Key files: `examples/next13-simple/pages/api/doc.ts`, `examples/next13-simple/next-swagger-doc.json`, `examples/next14-app/lib/swagger.ts`, `examples/next14-app/app/api/hello/route.ts`, `examples/next16-app/next.config.mjs`

**examples/next13-simple/:**
- Purpose: Pages Router sample: `withSwagger` API, `createSwaggerSpec` in `getStaticProps`, `schemaFolders: ['models']`, CLI-generated `public/swagger.json`, Stoplight playground.
- Contains: `pages/`, `models/` (+ `models/openapi/*.swagger.yaml` from typeconv), `public/swagger.json`.
- Key files: `examples/next13-simple/pages/api/hello.ts`, `examples/next13-simple/pages/api/organization.tsx`, `examples/next13-simple/pages/api-doc.tsx`, `examples/next13-simple/pages/swagger.tsx`, `examples/next13-simple/pages/playground.tsx`, `examples/next13-simple/models/organization.ts`

**examples/next14-app/, next15-app/, next16-app/:**
- Purpose: App Router samples sharing the same shape: `app/api/hello/route.ts` with `@swagger`, `lib/swagger.ts` (`apiFolder: 'app/api'`, `specFile: 'public/swagger.json'`, `autoDoc: true`), client `app/api-doc/react-swagger.tsx`.
- Contains: shadcn-style `components/`, Tailwind `styles/`, `config/site.ts`.
- Key files: `examples/next14-app/app/api-doc/page.tsx`, `examples/next14-app/app/api-doc/react-swagger.tsx`, `examples/next16-app/lib/swagger.ts`

**.agents/:**
- Purpose: Automated setup for coding agents.
- Contains: `setup` (Corepack + pnpm install), `resume`.
- Key files: `.agents/setup`

**.github/:**
- Purpose: GitHub metadata and CI.
- Contains: `FUNDING.yml`, `workflows/codeql-analysis.yml`, `workflows/codesee-arch-diagram.yml`.
- Key files: `.github/workflows/codeql-analysis.yml`

**.planning/codebase/:**
- Purpose: Generated architecture/structure documentation for planning.
- Contains: `ARCHITECTURE.md`, `STRUCTURE.md`.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `src/index.ts`: Package public API (`export *` from auto-doc and swagger).
- `src/swagger.ts`: `createSwaggerSpec` and `withSwagger` — main runtime entry.
- `src/cli.ts`: `next-swagger-doc-cli` (published as `dist/cli.js` via `package.json` `bin`).
- `package.json`: Dual ESM/CJS `exports`, `main`/`module`/`types` pointing at `dist/`, `files: ["dist", "src"]`.

**Configuration:**
- `package.json`: Scripts (`build` pkgroll, `test` vitest, `lint`/`format` biome), engines `node >= 18`, peer `next >= 9`, packageManager `pnpm@11.24.0`.
- `tsconfig.json`: `include: ["src", "types"]`, `strict`, `noEmit`, `rootDir: ./src`, `module: esnext`.
- `vitest.config.ts`: `{ test: { globals: true } }`.
- `biome.json`: Formatter (2-space, 80-col, single quotes for JS) and lint rules scoped to `src`; ignores `dist`.
- `renovate.json`: Pin non-peer deps, automerge non-major.
- `cspell.json` / `cspell-tool.txt`: Spellcheck dictionary.
- `.pre-commit-config.yaml`: prettier (html/css/md) + biome-check.
- `.gitignore`: `node_modules`, `dist`, `coverage`, `docs`, `.vercel`.
- `examples/next13-simple/next-swagger-doc.json`: CLI config (`apiFolder`, `schemaFolders`, `definition`).
- `examples/*/next.config.mjs` (or `.js`): App Router examples transpile `swagger-ui-react`; next16 sets `turbopack.root`.

**Core Logic:**
- `src/swagger.ts`: Options types, specFile load, glob assembly, NEXT_PHASE scan gate, swagger-jsdoc invocation, auto-doc merge, outputFile write, Pages middleware.
- `src/auto-doc.ts`: `extractApiInfo` / `generateAutoDoc` / path-parameter extraction.
- `src/spec-source.ts`: `discoverSpecLocations`.
- `src/route-path.ts`: `routeToOpenApiPaths` (groups, parallel routes, dynamic/catch-all).
- `src/route-parser.ts`: `HTTP_METHODS`, `getExportedMethods`.
- `src/merge-auto-doc.ts`: `mergeAutoDoc`.

**Testing:**
- `test/index.test.ts`: Snapshots for default/Bearer/OAuth2 specs; `extractApiInfo` on fixtures; autoDoc vs manual; scan policy temp dirs; `specFile`/`outputFile`; `routeToOpenApiPaths`; `discoverSpecLocations`; `mergeAutoDoc`.
- `test/__snapshots__/index.test.ts.snap`: Expected OAS3 JSON for snapshot cases.
- `test/fixtures/`: Real `route.ts` trees (no mocks).

## Naming Conventions

**Files:**
- kebab-case TypeScript modules in `src/`: `auto-doc.ts`, `merge-auto-doc.ts`, `route-parser.ts`, `route-path.ts`, `spec-source.ts`.
- Next.js App Router convention `route.ts` under `app/**` in examples and fixtures.
- Next.js Pages API files named after the path: `examples/next13-simple/pages/api/hello.ts`, `doc.ts`, `organization.tsx`.
- Example swagger helpers: `lib/swagger.ts`; UI wrapper: `app/api-doc/react-swagger.tsx`.
- Schema sidecars: `*.swagger.yaml` under `examples/next13-simple/models/openapi/`.
- Tests: single `index.test.ts` plus `__snapshots__/index.test.ts.snap`.

**Directories:**
- `src/`, `test/`, `examples/` at repo root.
- Example folders `next{13,14,15,16}-{simple|app}` keep each Next.js major on its line.
- Fixtures mirror App Router trees: `test/fixtures/app/api/users/[id]/`, `test/fixtures/app/blog/[[...slug]]/`.
- Dynamic segments use Next.js bracket names (`[id]`, `[[...slug]]`), not OpenAPI `{id}` on disk.

## Where to Add New Code

**New Feature:**
- Primary code: `src/` — orchestration and options on `src/swagger.ts` (`SwaggerOptions`); App Router inference in `src/auto-doc.ts` or a new sibling module imported from there. Document new options on `SwaggerOptions` and in `README.md` (`AGENTS.md`).
- Tests: `test/index.test.ts` plus real files under `test/fixtures/` (prefer fixtures over mocks). Update `test/__snapshots__/index.test.ts.snap` when `createSwaggerSpec` output changes.

**New Component/Module:**
- Implementation: New `src/<kebab-name>.ts`. Export from `src/index.ts` only if it is a public API; keep helpers like `merge-auto-doc.ts` / `route-path.ts` internal and import them from tests by path if needed.
- CLI flags: `src/cli.ts` (`cleye` `flags` / `parameters`).
- Example-only UI: under the relevant `examples/next*-app/` app, not in `src/` (this package does not ship a viewer).

**Utilities:**
- Shared helpers: `src/spec-source.ts` (path layout), `src/route-path.ts` (folder conventions), `src/route-parser.ts` (export parsing), `src/merge-auto-doc.ts` (path merge). Keep them focused; do not dump helpers into `src/index.ts`.

## Special Directories

**dist/:**
- Purpose: pkgroll build output (`index.js`, `index.cjs`, `index.d.ts`, `cli.js`). Published to npm.
- Generated: Yes
- Committed: No (`.gitignore`)

**node_modules/:**
- Purpose: pnpm-installed dependencies at repo root and in each example.
- Generated: Yes
- Committed: No

**examples/*/ .next/ and test/fixtures/.next/:**
- Purpose: Next.js compiled server output. The fixture under `test/fixtures/.next/server/app/only-compiled/` is a checked-in compiled `route.js` used when source is missing.
- Generated: Example `.next/` is generated at `next build`. The compiled fixture is hand-authored for tests.
- Committed: Example `.next/` no (per-example `.gitignore`). Fixture `.next` yes (needed for `extractApiInfo('app/only-compiled', 'test/fixtures')`).

**coverage/:**
- Purpose: `pnpm coverage` (Vitest + `@vitest/coverage-v8`) output.
- Generated: Yes
- Committed: No (`.gitignore`)

**docs/:**
- Purpose: TypeDoc output from `package.json` `vercel-build` (`npx typedoc src/index.ts`).
- Generated: Yes
- Committed: No (`.gitignore`)

**examples/:**
- Purpose: Independent demo apps; each has its own lockfile and depends on published `next-swagger-doc`.
- Generated: No
- Committed: Yes (except each app’s `node_modules`, `.next`, `coverage`)

**test/fixtures/:**
- Purpose: Real App Router route modules covering health, JSDoc-manual, regex-in-source, dynamic `[id]`, optional catch-all, commented exports, re-exported handlers, and compiled-only OPTIONS.
- Generated: No
- Committed: Yes

**.planning/:**
- Purpose: Planning/architecture artifacts for agents.
- Generated: Written by analysis tasks
- Committed: Depends on workflow; not listed in `.gitignore`

---

*Structure analysis: 2026-08-26*
