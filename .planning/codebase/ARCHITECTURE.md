# Architecture

**Analysis Date:** 2026-08-26

## Pattern Overview

**Overall:** Stateless facade + pipeline over `swagger-jsdoc`, with an optional App Router auto-doc overlay.

**Key Characteristics:**
- Library, not a framework: `createSwaggerSpec` in `src/swagger.ts` is a pure (cwd/env/fs-dependent) function that returns an OpenAPI 3 document; there is no long-lived process, cache, or DI container.
- Dual documentation sources: JSDoc `@swagger` blocks parsed by `swagger-jsdoc`, plus optional `autoDoc` operations derived from App Router `route.*` files (`src/auto-doc.ts`, `src/route-parser.ts`, `src/route-path.ts`). Manual JSDoc operations win on conflict via `src/merge-auto-doc.ts`.
- Build-aware file discovery: `src/spec-source.ts` maps source folders to `.next/server/<folder>` compiled output and `public/`. `shouldScanBuildDirectory` in `src/swagger.ts` refuses to glob `.next` during Next.js production phases (`NEXT_PHASE`) to avoid Vercel `export-detail.json` ENOENT failures.

## Layers

**Public API:**
- Purpose: Re-export the functions and types consumers import from `next-swagger-doc`.
- Location: `src/index.ts`
- Contains: Re-exports of `src/auto-doc.ts` (`extractApiInfo`, `generateAutoDoc`, `ApiInfo`) and `src/swagger.ts` (`createSwaggerSpec`, `withSwagger`, `SwaggerOptions`, `loadSpecFile`, `isAutoDocEnabled`, `shouldScanBuildDirectory`).
- Depends on: `src/auto-doc.ts`, `src/swagger.ts`
- Used by: npm package consumers, example apps under `examples/`, tests in `test/index.test.ts`

**Orchestration:**
- Purpose: Assemble glob lists, invoke `swagger-jsdoc`, optionally overlay auto-doc, and persist or return the spec.
- Location: `src/swagger.ts`
- Contains: `SwaggerOptions` / `AutoDocOptions` types, `createSwaggerSpec`, `withSwagger`, `loadSpecFile`, `isAutoDocEnabled`, `shouldScanBuildDirectory`, `NEXT_BUILD_PHASES`.
- Depends on: `swagger-jsdoc`, `next` types (`NextApiRequest`/`NextApiResponse`), `src/auto-doc.ts`, `src/merge-auto-doc.ts`, `src/spec-source.ts`, Node `fs`/`path`.
- Used by: `src/index.ts`, `src/cli.ts`, `examples/next13-simple/pages/api/doc.ts` (`withSwagger`), `examples/*/lib/swagger.ts` (`createSwaggerSpec`).

**Spec source discovery:**
- Purpose: Own the Next.js layout mapping so glob and auto-doc walkers do not re-derive `.next/server` or `public/` paths.
- Location: `src/spec-source.ts`
- Contains: `SpecLocations` (`sourceDirs`, `buildDirs`, `publicDir`) and `discoverSpecLocations`.
- Depends on: Node `path` only.
- Used by: `src/swagger.ts` (JSDoc globs), `src/auto-doc.ts` (route file walk).

**Auto-doc pipeline:**
- Purpose: Infer OpenAPI paths and HTTP methods from App Router `route` files when JSDoc is absent or incomplete.
- Location: `src/auto-doc.ts`, `src/route-parser.ts`, `src/route-path.ts`, `src/merge-auto-doc.ts`
- Contains: recursive `route.*` discovery; `es-module-lexer` export parsing; Next.js folder-to-OpenAPI path translation; per-method merge where manual operations win.
- Depends on: `es-module-lexer` (`src/route-parser.ts`), `src/spec-source.ts`, Node `fs`/`path`.
- Used by: `createSwaggerSpec` in `src/swagger.ts`; unit tests in `test/index.test.ts`.

**JSDoc OpenAPI parser (external):**
- Purpose: Parse `@swagger` YAML/JSON comments and YAML/JSON schema files into an OAS3 document.
- Location: dependency `swagger-jsdoc` (invoked from `src/swagger.ts`)
- Contains: Glob matching and JSDoc annotation extraction. Not vendored in this repo.
- Depends on: file globs produced by `createSwaggerSpec`.
- Used by: `createSwaggerSpec` as the first spec body, before auto-doc merge.

**CLI:**
- Purpose: Generate a static `swagger.json` at build time from a JSON config file.
- Location: `src/cli.ts` (published bin `next-swagger-doc-cli` → `dist/cli.js`)
- Contains: `cleye` argv parser (`<config file>`, `--output` defaulting to `public/swagger.json`), `JSON.parse` of the config, `createSwaggerSpec`, `writeFileSync`.
- Depends on: `src/swagger.ts`, `cleye`.
- Used by: README Usage #4, standalone/Vercel `output: 'standalone'` workflow, `examples/next13-simple/next-swagger-doc.json`.

**Example consumers (not library internals):**
- Purpose: Demonstrate Pages Router and App Router integration, including Swagger UI / Stoplight Elements viewers.
- Location: `examples/next13-simple/`, `examples/next14-app/`, `examples/next15-app/`, `examples/next16-app/`
- Contains: Next.js apps with their own lockfiles; they depend on published `next-swagger-doc`, not the local `src/` tree.
- Depends on: published package + `swagger-ui-react` (and `@stoplight/elements` in next13-simple).
- Used by: documentation and manual demos; library correctness is verified by `pnpm test` at the repo root, not by rewriting example lockfiles.

**Tests:**
- Purpose: Snapshot and unit-cover orchestration, auto-doc, merge, scan policy, and standalone spec I/O using real fixtures.
- Location: `test/index.test.ts`, `test/fixtures/`, `test/__snapshots__/index.test.ts.snap`
- Contains: Vitest `describe` blocks for `createSwaggerSpec`, `extractApiInfo`, `shouldScanBuildDirectory`, `isAutoDocEnabled`, `routeToOpenApiPaths`, `discoverSpecLocations`, `mergeAutoDoc`.
- Depends on: public exports from `src/index.ts` plus internal modules `src/merge-auto-doc.ts`, `src/route-path.ts`, `src/spec-source.ts`.
- Used by: `pnpm test` / Vitest.

## Data Flow

**createSwaggerSpec (primary generation):**
1. If `specFile` is set, `loadSpecFile` in `src/swagger.ts` reads the JSON; on hit, return immediately (standalone runtime path; no route scan).
2. Collect scan folders: `apiFolder` (default `pages/api`) plus `schemaFolders`.
3. `discoverSpecLocations` in `src/spec-source.ts` maps each folder to `cwd/<folder>`, `cwd/.next/server/<folder>`, and `cwd/public`.
4. Build `swagger-jsdoc` `apis` globs: source `**/*.{ts,tsx,jsx,js,json,swagger.yaml}`, public `**/*.{swagger.yaml,json}`, and compiled `**/*.{js,swagger.yaml,json}` only when `shouldScanBuildDirectory` is true.
5. Clone `definition`; if `process.env.__NEXT_ROUTER_BASEPATH` is set and `definition.servers` is missing, inject a single `servers` entry with that URL.
6. Call `swaggerJsdoc(options)` to parse JSDoc `@swagger` comments into an `OAS3Definition`.
7. If `isAutoDocEnabled(autoDoc, !existsSync(source apiFolder))`, run `extractApiInfo` → `generateAutoDoc` → `mergeAutoDoc(autoPaths, spec.paths)` so generated operations fill gaps and manual operations win per HTTP method.
8. If `outputFile` is set, `mkdirSync` + `writeFileSync` pretty-printed JSON, then return the in-memory spec.

**withSwagger (Pages Router API handler):**
1. `withSwagger(options)` in `src/swagger.ts` returns a Next.js Pages API factory `() => (req, res) => ...`.
2. On each request, call `createSwaggerSpec` with the captured options.
3. `res.status(200).send(swaggerSpec)` on success; catch and `res.status(400).json({ error })` on failure.
4. Consumed as `export default swaggerHandler()` in `examples/next13-simple/pages/api/doc.ts`.

**CLI (build-time file generation):**
1. `src/cli.ts` parses `next-swagger-doc-cli <config file> [--output public/swagger.json]` via `cleye`.
2. Read and `JSON.parse` the config as `SwaggerOptions`.
3. `createSwaggerSpec(config)` (which may also write `outputFile` from the config).
4. Always `writeFileSync(argv.flags.output, JSON.stringify(spec, null, 2))`. Default output is `public/swagger.json`.

**autoDoc extraction:**
1. `extractApiInfo(apiFolder)` in `src/auto-doc.ts` discovers existing `sourceDirs` and `buildDirs`.
2. Recursively collect files named `route.{ts,tsx,js,jsx,mts,mtsx,mjs,mjsx}`.
3. Relative directory segments (minus the filename) go to `routeToOpenApiPaths` in `src/route-path.ts`, which strips `app`/`pages` roots, drops route groups `(…)` and parallel `@…` segments, maps `[id]` / `[...slug]` / `[[...slug]]` to `{param}` (optional catch-alls emit two paths).
4. `getExportedMethods` in `src/route-parser.ts` uses `es-module-lexer` `parse()` to find exported `GET`/`POST`/`PUT`/`PATCH`/`DELETE`/`HEAD`/`OPTIONS`; comments, strings, and regex literals are ignored (see `test/fixtures/app/commented/route.ts`, `test/fixtures/app/api/regex/route.ts`, `test/fixtures/app/users/route.ts`).
5. Methods are unioned per OpenAPI path, sorted, and filtered to those with at least one method.
6. `generateAutoDoc` emits `{ summary, parameters from `{name}` path tokens, responses: { 200: Successful response } }`.
7. `mergeAutoDoc` in `src/merge-auto-doc.ts` unions path keys and per-path operations: `{ ...generated, ...manual }` so a JSDoc `@swagger` GET replaces the generated GET but leaves generated PATCH/DELETE (see `test/fixtures/app/api/manual/route.ts` vs `test/fixtures/app/api/users/[id]/route.ts`).

**Standalone / Vercel constraints:**
1. During `phase-production-build` / `phase-production-compile` / `phase-export`, `shouldScanBuildDirectory` returns false unless `scanBuildOutput === true`.
2. When source `apiFolder` is missing at runtime (`output: 'standalone'`), `isAutoDocEnabled` defaults on unless `autoDoc: false`, and compiled `route.js` under `.next/server` can still document paths/methods (JSDoc is stripped). Fixture: `test/fixtures/.next/server/app/only-compiled/compiled/route.js`.
3. Preferred standalone path: generate at build (`CLI --output` or `outputFile`) and load via `specFile: 'public/swagger.json'` as in `examples/next14-app/lib/swagger.ts`.

**State Management:**
- No in-process state, cache, or singleton beyond `es-module-lexer` `initSync()` at module load in `src/route-parser.ts`.
- All paths resolve against `process.cwd()` (`resolveUserPath`, `discoverSpecLocations`).
- Environment: `NEXT_PHASE` gates `.next` globbing; `__NEXT_ROUTER_BASEPATH` optionally injects `servers`.
- Specs are immutable return values; `outputFile` / CLI writes are side effects after generation.

## Key Abstractions

**SwaggerOptions:**
- Purpose: Extends `swagger-jsdoc` `Options` with Next.js-specific knobs: `apiFolder`, `schemaFolders`, required `definition`, `outputFile`, `specFile`, `autoDoc`, `scanBuildOutput`.
- Examples: `src/swagger.ts`, `examples/next13-simple/next-swagger-doc.json`, `examples/next16-app/lib/swagger.ts`
- Pattern: Options object / configuration object passed through the facade.

**SpecLocations:**
- Purpose: Triple of directories where documentation can live for a given logical folder.
- Examples: `src/spec-source.ts`
- Pattern: Value object returned by `discoverSpecLocations(folders, cwd)`.

**ApiInfo:**
- Purpose: One OpenAPI path plus the lowercase HTTP methods exported by matching route files.
- Examples: `src/auto-doc.ts`, asserted in `test/index.test.ts` against `test/fixtures/app/`
- Pattern: Intermediate DTO between filesystem extraction and OpenAPI path objects.

**PathsObject merge:**
- Purpose: Union auto-generated and JSDoc path items with per-method precedence (manual wins).
- Examples: `src/merge-auto-doc.ts`
- Pattern: Shallow merge of path keys, then `{ ...autoOperations, ...manualOperations }` per path.

**Route path translation:**
- Purpose: Encode all Next.js App/Pages folder conventions in one place.
- Examples: `src/route-path.ts`
- Pattern: Pure function `routeToOpenApiPaths(apiFolder, routeSegments) → string[]`.

**Export method parsing:**
- Purpose: Detect HTTP handler exports without regex/string matching that would misread comments or regex literals.
- Examples: `src/route-parser.ts`
- Pattern: WASM lexer (`es-module-lexer`) + allowlist `HTTP_METHODS`.

**OAS3Definition:**
- Purpose: The OpenAPI 3 document returned to callers and written to disk.
- Examples: produced by `swagger-jsdoc` in `src/swagger.ts`; snapshotted in `test/__snapshots__/index.test.ts.snap`; stored in `examples/next13-simple/public/swagger.json`
- Pattern: External schema type from `swagger-jsdoc`; this library does not re-model OpenAPI.

## Entry Points

**Package barrel:**
- Location: `src/index.ts`
- Triggers: `import { createSwaggerSpec, withSwagger } from 'next-swagger-doc'` (resolved via `package.json` `exports` to `dist/index.js` / `dist/index.cjs`).
- Responsibilities: Re-export public API; does not re-export `mergeAutoDoc`, `routeToOpenApiPaths`, `discoverSpecLocations`, or `getExportedMethods`.

**createSwaggerSpec:**
- Location: `src/swagger.ts`
- Triggers: App Router `lib/swagger.ts` helpers (`examples/next14-app/lib/swagger.ts`, `examples/next15-app/lib/swagger.ts`, `examples/next16-app/lib/swagger.ts`); Pages `getStaticProps` (`examples/next13-simple/pages/api-doc.tsx`); CLI; `withSwagger`.
- Responsibilities: Spec-file short-circuit, glob assembly, JSDoc parse, auto-doc merge, optional write.

**withSwagger:**
- Location: `src/swagger.ts`
- Triggers: Pages Router API routes such as `examples/next13-simple/pages/api/doc.ts`.
- Responsibilities: Per-request spec generation and JSON HTTP response with try/catch.

**next-swagger-doc-cli:**
- Location: `src/cli.ts` (bin `next-swagger-doc-cli` in `package.json`)
- Triggers: `npx next-swagger-doc-cli next-swagger-doc.json [--output public/swagger.json]` (README Usage #4).
- Responsibilities: Load JSON config, generate spec, write output file.

**Example App Router docs page:**
- Location: `examples/next14-app/app/api-doc/page.tsx` (mirrored in next15/next16)
- Triggers: Next.js App Router navigation to `/api-doc`.
- Responsibilities: Server-render `getApiDocs()` then pass the spec to client-only `react-swagger.tsx` (`next/dynamic`, `ssr: false`).

**Example Pages viewers:**
- Location: `examples/next13-simple/pages/api-doc.tsx`, `examples/next13-simple/pages/swagger.tsx`, `examples/next13-simple/pages/playground.tsx`
- Triggers: Next.js Pages routes `/api-doc`, `/swagger`, `/playground`.
- Responsibilities: Static generation via `createSwaggerSpec`, or load prebuilt `/swagger.json` into swagger-ui-react / Stoplight Elements.

## Error Handling

**Strategy:** Fail closed at the HTTP boundary; skip unparsable route files during auto-doc; let JSON/fs errors bubble in CLI and `createSwaggerSpec` except where a missing `specFile` is treated as a fallback.

**Patterns:**
- `withSwagger` wraps `createSwaggerSpec` in try/catch and returns HTTP 400 with `error.message` or `'Failed to create Swagger spec'` (`src/swagger.ts`).
- `getExportedMethods` catches `es-module-lexer` parse failures, `console.warn`s `next-swagger-doc: failed to parse route source (<file>), skipping file`, and returns `[]` so one bad `route` file does not abort the spec (`src/route-parser.ts`).
- `loadSpecFile` returns `undefined` when the file is missing so callers fall back to scanning; a present but invalid JSON still throws from `JSON.parse`.
- `extractApiInfo` ignores missing directories (`existsSync` filter); a missing `apiFolder` yields `[]` (tested in `test/index.test.ts`).
- CLI does not catch: invalid config JSON or write failures abort the process.
- No custom error types; `Error` instances and Node exceptions only.

## Cross-Cutting Concerns

**Logging:** Minimal. `src/route-parser.ts` uses `console.warn` for unparsable route sources. `src/cli.ts` `console.log`s the target output path and raw config. No structured logger, log levels, or tracing.

**Validation:** Compile-time TypeScript (`strict` in `tsconfig.json`; `SwaggerOptions` requires `definition: OAS3Definition`). Runtime: HTTP method allowlist in `src/route-parser.ts`; `swagger-jsdoc` validates/assembles OpenAPI from JSDoc. No Zod/JSON-schema validation of `SwaggerOptions` or of generated operations. Biome lints `src/` (`biome.json`, 2-space, 80 columns).

**Authentication:** The library does not authenticate callers. It forwards OpenAPI `components.securitySchemes` and `security` from user `definition` (Bearer and OAuth2 covered by snapshots in `test/index.test.ts` and example `lib/swagger.ts` files). `withSwagger` handlers are unauthenticated JSON endpoints.

---

*Architecture analysis: 2026-08-26*
