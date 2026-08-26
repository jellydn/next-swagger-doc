# Codebase Concerns

**Analysis Date:** 2026-08-26

## Tech Debt

**Unused `isarray` runtime dependency:**
- Issue: `isarray@2.0.5` is declared in the library `dependencies` and again in `examples/next13-simple`, but no source file imports it. It is leftover install-time noise (also listed in `cspell-tool.txt` / `next-swagger-doc.txt`).
- Files: `package.json`, `examples/next13-simple/package.json`, `src/`
- Impact: Extra install surface; confuses audits (`npm ls`) and security scanners.
- Fix approach: Remove from both package.json files and the lockfiles unless a real import is added.

**Example apps pin a GitHub beta tag, not the local 0.5.0 package:**
- Issue: All four examples depend on `next-swagger-doc`: `github:jellydn/next-swagger-doc#v0.4.2-beta.0` while the repo is `0.5.0`. `examples/next13-simple/link.config.json` additionally points at `../` for `npx link`, so two conflicting linking strategies exist. App Router examples also set `specFile: 'public/swagger.json'` but those `public/` folders have no `swagger.json` (only `examples/next13-simple/public/swagger.json` exists). `examples/next15-app/package.json` still names the package `"next13-app"`. Example READMEs for 14/15 are leftover shadcn/create-next-app boilerplate.
- Files: `examples/next13-simple/package.json`, `examples/next13-simple/link.config.json`, `examples/next14-app/package.json`, `examples/next14-app/lib/swagger.ts`, `examples/next14-app/README.md`, `examples/next15-app/package.json`, `examples/next15-app/lib/swagger.ts`, `examples/next16-app/package.json`, `examples/next16-app/lib/swagger.ts`, `AGENTS.md`
- Impact: `pnpm dev` in examples does not exercise unpublished library changes (AGENTS.md already says this). `specFile` is dead config until a CLI generate step exists. Copy-paste naming (`next13-app`) misleads contributors.
- Fix approach: Keep examples on published tags by policy, but bump them to `0.5.0` after release; add a generate script or drop unused `specFile`; rename `next15-app`; replace boilerplate READMEs.

**Default `apiFolder` is still Pages Router:**
- Issue: `createSwaggerSpec` / `withSwagger` default `apiFolder` to `'pages/api'`. App Router apps must pass `'app/api'`. `autoDoc` is off when source exists unless set `true`. GitHub issue #1199 (`paths is empty`) is the resulting empty spec. JSDoc comments on `createSwaggerSpec` still document non-options (`openApiVersion`, `title`, `version`).
- Files: `src/swagger.ts`, `README.md`, `src/index.ts`
- Impact: Next 13+ App Router users following Usage #3 / defaults get `paths: {}` unless they add JSDoc *and* the right folder. README Usage #1 is labeled “Next.js 13” even though Next 16 examples exist.
- Fix approach: Keep the Pages default for compatibility, but document App Router first; consider warning when `pages/api` is missing and `app/api` exists.

**Placeholder docs and changelog gap:**
- Issue: `SECURITY.md` is the unmodified GitHub template (claims support for `5.1.x` / `4.0.x`; this package is `0.5.0`). `CHANGELOG.md` jumps from `0.3.4` (2022) to `0.4.2-beta.0` / `0.5.0` (2026) and omits published `0.3.5`–`0.4.1` (0.4.1 is the Vercel ENOENT release, issue #1157).
- Files: `SECURITY.md`, `CHANGELOG.md`, `package.json`
- Impact: No real vulnerability-reporting process; historical breakages are invisible in-repo.
- Fix approach: Replace the security template with a reporting contact and actual supported versions; backfill changelog from GitHub releases.

**Idle tooling and config drift:**
- Issue: DevDependencies `c8`, `size-limit`, and `@skypack/package-check` have no scripts. `biome.json` `$schema` is `1.7.0` while Biome is `1.9.4`, and `linter.rules.recommended` is `false`. `tsconfig.json` `include`s `"types"` but no `types/` directory exists; `moduleResolution` is legacy `"node"` despite `"type": "module"`. Example `packageManager` is `pnpm@10.8.0` vs root `pnpm@10.34.5`. Tests under `describe('withSwagger')` call `createSwaggerSpec`, not `withSwagger`. CLI comment says `._.filePath` but the parameter is `configFile`.
- Files: `package.json`, `biome.json`, `tsconfig.json`, `test/index.test.ts`, `src/cli.ts`, `examples/*/package.json`
- Impact: Dead tooling in every install; weaker lint than Biome recommended; contributors copy the wrong test name when extending the handler API.
- Fix approach: Drop unused devDeps, align Biome schema, fix tsconfig `include`, rename the snapshot describe block, fix the CLI comment.

**`withSwagger` is a Pages-Router, per-request generator:**
- Issue: The handler is typed with `NextApiRequest` / `NextApiResponse` and calls `createSwaggerSpec` on every request. GitHub issue #1190 asked for an App Router equivalent; the library still has none. Examples 14/15/16 generate the spec in a Server Component instead.
- Files: `src/swagger.ts`, `examples/next13-simple/pages/api/doc.ts`, `examples/next14-app/app/api-doc/page.tsx`
- Impact: App Router apps cannot drop in `withSwagger`. Runtime generation walks the filesystem on each `/api/doc` hit.
- Fix approach: Add a Route Handler helper (or document `createSwaggerSpec` + `NextResponse.json` as the App pattern). Cache or generate at build via `outputFile` / CLI.

## Known Bugs

**`extractApiInfo` walks `.next/server` without the production-build gate:**
- Symptoms: `createSwaggerSpec` gates swagger-jsdoc globs with `shouldScanBuildDirectory` (skips `NEXT_PHASE` `phase-production-build` / `phase-production-compile` / `phase-export` unless `scanBuildOutput: true`). `extractApiInfo` always `readdirSync`s every existing `buildDirs` entry and unions methods into the spec. Leftover compiled handlers can appear as extra operations; a `readdir`/`readFile` race while Next rewrites `.next` can throw ENOENT (same class of failure as issue #1157, though the original glob of `.next/export-detail.json` is the swagger-jsdoc path).
- Files: `src/auto-doc.ts`, `src/swagger.ts`, `src/spec-source.ts`, `test/index.test.ts`, `test/fixtures/.next/server/app/api/compiled/route.js`
- Trigger: `autoDoc: true` (README default for App Router) during `next build` when `.next/server/<apiFolder>` already exists, or a stale compiled `route.js` that exports a method the source no longer exports.
- Workaround: Set `autoDoc: false` during build, or generate with CLI/`outputFile` and serve `specFile`. Do not set `scanBuildOutput: true` on Vercel (README already warns this re-enables `.next` globs).

**CLI does not create parent directories and has no error handling:**
- Symptoms: `next-swagger-doc-cli … --output public/swagger.json` throws if `public/` is missing (`writeFileSync` only). Invalid JSON or a missing config file crash with an uncaught exception. If the JSON config itself contains `outputFile`, `createSwaggerSpec` may write that path *and* the CLI writes `--output`.
- Files: `src/cli.ts`, `src/swagger.ts` (`outputFile` uses `mkdirSync`)
- Trigger: Fresh repo with no `public/`; malformed `next-swagger-doc.json`; config `outputFile` plus `--output`.
- Workaround: `mkdir -p public` first; keep a single output path.

**`withSwagger` reports generation failures as HTTP 400 and leaks `error.message`:**
- Symptoms: Any `createSwaggerSpec` throw (bad glob, invalid YAML JSDoc, missing files mid-walk) becomes `400 { error: <Error.message> }`. That is a server-side failure, not a client input error, and the message can include filesystem paths.
- Files: `src/swagger.ts`
- Trigger: Call `GET` on a `withSwagger()` Pages route when spec generation throws.
- Workaround: Prefer `createSwaggerSpec` at build / in a Server Component (App Router examples) so errors surface in the build log.

**`loadSpecFile` is an unvalidated `JSON.parse`:**
- Symptoms: A present but invalid `specFile` throws (caught only inside `withSwagger`). A JSON object that is not an OpenAPI document is returned as-is (`as OAS3Definition`), so UI pages show “Unable to render this definition” (issues #1163 / discussion #1164).
- Files: `src/swagger.ts`
- Trigger: Truncated or hand-edited `public/swagger.json`; empty `{}`.
- Workaround: Generate the file with the CLI; omit `specFile` until the file exists (`loadSpecFile` already returns `undefined` when missing).

No `TODO` / `FIXME` / `HACK` / `XXX` markers were found under `src/`, `test/`, or `examples/`.

## Security Considerations

**Security policy is a GitHub stub:**
- Risk: `SECURITY.md` still says “Use this section to tell people…” and lists fictional `5.1.x` / `4.0.x` support. There is no reporting address or SLA.
- Files: `SECURITY.md`
- Current mitigation: None beyond MIT LICENSE.
- Recommendations: Name a contact (GitHub Security Advisories / email), list actually supported npm versions (`0.5.x`), and drop the template table.

**Runtime spec generation reads the whole API tree and can ingest `public/**/*.json`:**
- Risk: `createSwaggerSpec` globs `public/**/*.json` and `public/**/*.swagger.yaml` into swagger-jsdoc. Any JSON under `public/` is treated as an OpenAPI fragment. A large data dump or a secrets JSON accidentally placed in `public/` is merged into the served spec. `withSwagger` also returns raw `error.message` to the client (see Known Bugs).
- Files: `src/swagger.ts`, `src/cli.ts`
- Current mitigation: Intended for committed OpenAPI YAML/JSON (the next13 example uses `models/**/*.swagger.yaml` copied to `public/openapi`). Missing `specFile` is skipped.
- Recommendations: Restrict public globs to `*.swagger.yaml` / a configured spec path; never glob all `*.json`; return 500 without `error.message` from `withSwagger`.

**CLI writes whatever `--output` path the user passes:**
- Risk: Expected for a local codegen CLI (no sandbox). Combined with `JSON.parse` of the config file, a bad config is fail-loud rather than fail-safe.
- Files: `src/cli.ts`
- Current mitigation: Config path is a required argv parameter; output defaults to `public/swagger.json`.
- Recommendations: Validate config against `SwaggerOptions` (at least `definition.openapi` / `definition.info`); `mkdirSync` before write (same as `outputFile`).

This library is a build/runtime doc generator, not an auth system. No credential handling exists in `src/`. Do not treat the empty `SECURITY.md` as evidence of a product security review.

## Performance Bottlenecks

**Synchronous full-tree scan on every `createSwaggerSpec` call:**
- Problem: Each call `readdirSync`s the API tree, `readFileSync`s every `route.*` file, then swagger-jsdoc globs `ts/tsx/jsx/js/json/swagger.yaml` under source dirs plus `public/**`. `withSwagger` repeats that per HTTP request. There is no cache, etag, or incremental invalidation.
- Files: `src/swagger.ts`, `src/auto-doc.ts`, `src/cli.ts`
- Cause: All I/O is sync Node fs; swagger-jsdoc glob is unbounded (`**/*`).
- Improvement path: Generate once (`outputFile` / CLI) and load `specFile` at runtime (already the standalone path). If a live handler remains, memoize on `mtime` or `NODE_ENV === 'production'`.

**Optional compiled-output glob can walk webpack/turbopack chunks:**
- Problem: `scanBuildOutput: true` adds `.next/server/<folder>/**/*.{js,swagger.yaml,json}`. A real `.next/server` tree is large; globbing `**/*.js` is far more work than reading `route.js` files only.
- Files: `src/swagger.ts`, `src/spec-source.ts`
- Cause: File-type globs rather than `**/route.js`.
- Improvement path: When scanning build output, only open files named `route.js` (same as `isRouteFile` on the source side). Keep the default “scan compiled only if source is missing and not compiling”.

**`es-module-lexer` WASM `initSync()` at import time:**
- Problem: `route-parser.ts` calls `initSync()` when the module loads, so any import of `next-swagger-doc` pays WASM init even if `autoDoc` is off. Combined with `node:fs`, the package cannot run on the Edge runtime.
- Files: `src/route-parser.ts`, `src/swagger.ts`, `src/auto-doc.ts`
- Cause: Lexer requires WASM before `parse()`.
- Improvement path: Lazy-init inside `getExportedMethods`; document Node.js runtime only.

## Fragile Areas

**Hard-coded `.next/server/<folder>` layout:**
- Files: `src/spec-source.ts`, `src/swagger.ts`
- Why fragile: `discoverSpecLocations` always uses `join(cwd, '.next/server', folder)`. Custom `distDir`, Next.js standalone layout (`.next/standalone/…`), and future Turbopack output locations are invisible. `src/app/api` works only because `routeToOpenApiPaths` takes the segment after the last `app`/`pages` (`src/app/api` → `/api`); that heuristic breaks if a folder named `app` appears earlier in a non-Next path.
- Safe modification: Keep all build-output path logic in `discoverSpecLocations`. Add an option (`distDir`) and tests that pass a fake layout, as `test/index.test.ts` already does for `test/fixtures`.
- Test coverage: Source vs `.next/server/<apiFolder>` with a custom cwd is tested (`extractApiInfo('app/only-compiled', 'test/fixtures')`). Custom `distDir` is not.

**Compiled-route fallback vs real Next emit:**
- Files: `src/route-parser.ts`, `src/auto-doc.ts`, `test/fixtures/.next/server/app/only-compiled/compiled/route.js`, `test/fixtures/.next/server/app/api/compiled/route.js`, `README.md`
- Why fragile: `getExportedMethods` uses `es-module-lexer`, which only sees ESM export specifiers. The compiled fixtures are hand-written `export function OPTIONS()`. Production Next `route.js` chunks are typically webpack/turbopack wrappers (`exports.GET = …` / runtime modules). README claims standalone runtime still documents compiled `route.js` handlers; that is unverified against a real `next build`. JSDoc is stripped from compiled output (documented).
- Safe modification: Capture a real `next build` `route.js` as a fixture before changing the lexer. Consider a CJS export fallback (`exports.GET` / `module.exports.GET`) if standalone autoDoc is a supported path.
- Test coverage: No fixture from an actual Next compile; `test/fixtures/.next/server/app/api/compiled/route.js` is never asserted by `extractApiInfo('test/fixtures/app')` because that call uses cwd-relative `.next/server/test/fixtures/app`, not `test/fixtures/.next`.

**Next.js folder conventions concentrated in regex:**
- Files: `src/route-path.ts`, `src/auto-doc.ts`
- Why fragile: Route groups `(name)`, parallel `@slot`, `[id]`, `[...slug]`, `[[...slug]]` are string-replaced. Private folders (`_lib`) are **not** skipped (Next.js excludes them from routing). Catch-alls become a single `{slug}` string param, which does not express multi-segment paths in OpenAPI. Intercepting routes `(.)photo` happen to look like groups and are dropped; that is accidental. `isRouteFile` only matches `route.{ts,tsx,js,jsx,mts,mtsx,mjs,mjsx}` — Pages Router `pages/api/*.ts` never get autoDoc (JSDoc only).
- Safe modification: Add fixtures for `_private`, intercepting `(.)`, and `src/app` before changing `routeToOpenApiPaths`. Keep JSDoc-wins merge in `merge-auto-doc.ts`.
- Test coverage: Dynamic, catch-all, optional catch-all, groups, and `@parallel` are tested. Private `_` folders, intercepting routes, and Pages Router filenames are not.

**JSDoc YAML is parsed by swagger-jsdoc, not this repo:**
- Files: `src/swagger.ts` (`swaggerJsdoc(options)`), `test/fixtures/app/api/manual/route.ts`
- Why fragile: Indentation/YAML errors in `@swagger` blocks fail inside swagger-jsdoc (`yaml@2.0.0-1`). Manual vs auto merge is only per HTTP method (`mergeAutoDoc`); path-level OpenAPI keys ride along on the manual object. `fileTypes` includes `swagger.yaml` but not `.yml` / `.yaml`.
- Safe modification: Do not reimplement swagger-jsdoc parsing. Add a fixture `.yml` only if you expand `fileTypes`.
- Test coverage: One manual `@swagger` GET that beats autoDoc. No invalid-YAML, `.yml`, or `schemaFolders` tests.

**`NEXT_PHASE` set may lag Next.js:**
- Files: `src/swagger.ts`
- Why fragile: The skip list is `phase-production-build`, `phase-production-compile`, `phase-export`. Tests only pass `phase-production-build`. A new compile phase that is not in the set would glob `.next` again (issue #1157). `scanBuildOutput: true` overrides the skip even during those phases (documented, still dangerous on Vercel).
- Safe modification: Keep the allow/deny logic only in `shouldScanBuildDirectory`. Never bypass it from `extractApiInfo`.
- Test coverage: `phase-export` / `phase-production-compile` untested; autoDoc + `NEXT_PHASE` untested together.

## Scaling Limits

**Unbounded recursive walk of `apiFolder`:**
- Current capacity: Fine for typical `app/api` trees (the test fixture is <10 routes). `extractApiInfo` and swagger-jsdoc both recurse with `**`.
- Limit: If `apiFolder` is set to `.` or a monorepo root, swagger-jsdoc globs `./**/*.ts` (and `./**/*.json`) across the whole project, including `node_modules` if present under that tree. `getRouteFiles` has no ignore list. `withSwagger` does this on every request.
- Scaling path: Refuse `apiFolder` outside known roots; ignore `node_modules` / `.git`; prefer CLI generate + `specFile` for large apps.

**In-memory OpenAPI document, no pagination:**
- Current capacity: One spec object built with `JSON.stringify(spec, null, 2)` for `outputFile` / CLI.
- Limit: Thousands of operations plus `public/**/*.json` merges will block the event loop (all sync) and produce a multi-MB JSON payload for the browser UI.
- Scaling path: Build-time generation; split specs by tag later if needed (not supported today).

**Standalone / Vercel:**
- Current capacity: Source scan works when `app/api` is on disk. Compiled fallback is best-effort (see Fragile). `specFile` short-circuits everything.
- Limit: `output: 'standalone'` strips source (`README.md`, issue #1228). Without a prebuilt spec, runtime docs are empty or method-only.
- Scaling path: Always generate `public/swagger.json` in CI/`postbuild` and set `specFile`.

## Dependencies at Risk

**`swagger-jsdoc@6.3.0` (engines Node `>=20`) vs library `engines.node: >=18`:**
- Risk: Lockfile records `swagger-jsdoc@6.3.0` `engines: {node: '>=20.0.0'}`. This package still advertises `node: '>=18'` and `peerDependencies.next: '>=9'`. Transitive `yaml@2.0.0-1` is a pre-release YAML parser (swagger-jsdoc pin). Issue #1149 (outdated `glob`) is improved in 6.3.0 (`glob@11.1.0`), but swagger-jsdoc still owns globbing `.next` when `scanBuildOutput` is on.
- Impact: Node 18 installs may warn or break on swagger-jsdoc 6.3; YAML JSDoc edge cases depend on an old `yaml` prerelease. Next 9–12 are claimed but untested (devDependency is Next `16.3.3`).
- Migration plan: Bump `engines` to `>=20` (Next 16 examples already need `>=20.9`), or pin a swagger-jsdoc that supports 18. Document that Pages Next 9 is historical only.

**`isarray@2.0.5`:**
- Risk: Unused direct dependency (see Tech Debt).
- Impact: Audit noise only.
- Migration plan: Remove.

**Example `swagger-ui-react` (not a library dependency):**
- Risk: Examples depend on `swagger-ui-react` (`latest` in next13-simple; `^5.20.8` in 14/15/16). It still uses `UNSAFE_componentWillReceiveProps` on `ExamplesSelect` / `ParameterRow` (README, issue #1231, AGENTS.md). Webpack needs `transpilePackages: ['react-syntax-highlighter', 'swagger-client', 'swagger-ui-react']` (swagger-ui issue #8245). `#apg-lite` resolution failures (issue #1032) were closed as not planned.
- Impact: Strict Mode warnings and occasional bundler failures in *consumer* apps that copy the example. This package does not depend on swagger-ui-react.
- Migration plan: Keep examples on `next/dynamic(..., { ssr: false })`; point README at Scalar / Stoplight (next13 `pages/playground.tsx` already uses Elements). Never pin `latest`.

**`cleye@1.3.4`:**
- Risk: Small CLI parser, last-line 1.x. CLI itself is untested (see Test Coverage).
- Impact: Flag/argv regressions ship unnoticed.
- Migration plan: Add a CLI test (spawn `dist/cli.js`) before changing parsers.

**`@types/swagger-jsdoc` in `dependencies`:**
- Risk: Type-only package on the runtime graph. Fine for TS consumers, unusual for a dual CJS/ESM build.
- Impact: Extra install; types can drift from swagger-jsdoc if not bumped together (Renovate `group:allNonMajor` + `automerge: true` in `renovate.json`).
- Migration plan: Keep inlined if the public `SwaggerOptions` extends `Options`; otherwise move to `devDependencies` and bundle types.

## Missing Critical Features

**No App Router spec Route Handler:**
- Problem: `withSwagger` is Pages-only (`NextApiResponse`). Issue #1190. App examples embed the spec in a Server Component instead of serving JSON.
- Blocks: Drop-in `/api/doc` JSON in App Router without writing a custom `route.ts`.

**autoDoc is path + method only:**
- Problem: Generated operations are `{ summary, parameters: path-params, responses: { 200 } }`. No requestBody, query/header params, status codes from `Response.json`, or tags. Catch-alls are a single string `{slug}`. Private `_` folders are not excluded. Pages Router files are not auto-documented.
- Blocks: Accurate docs without manual `@swagger` JSDoc for every interesting endpoint.

**No schema inference / OpenAPI 3.1 first-class support:**
- Problem: Models must be JSDoc or `*.swagger.yaml` (next13 `typeconv` flow). `definition.openapi` is passed through to swagger-jsdoc; nothing validates 3.1 vs 3.0.
- Blocks: TypeScript-first schema generation inside this library.

**CLI is a thin JSON wrapper:**
- Problem: No `--apiFolder` override, no YAML output, no watch mode, no config schema, no `mkdir`. `outputFile` on `SwaggerOptions` and `--output` can diverge.
- Blocks: Usable `postbuild` codegen without extra shell.

**Edge / non-Node runtimes:**
- Problem: `node:fs` + `initSync()` WASM. Cannot run in Edge middleware or the Edge route runtime.
- Blocks: Generating the spec on the Edge; callers must use Node runtime or a prebuilt `specFile`.

## Test Coverage Gaps

**CLI (`src/cli.ts`) is untested:**
- What's not tested: Missing config, invalid JSON, default `--output`, nested output without `public/`, double-write when config has `outputFile`.
- Files: `src/cli.ts`, `test/index.test.ts`
- Risk: The documented standalone path (`npx next-swagger-doc-cli … --output public/swagger.json`) can fail on a clean tree (no `mkdir`).
- Priority: High

**`withSwagger` handler is untested:**
- What's not tested: Status 200 body, 400 error path, option plumbing (`specFile`, `scanBuildOutput`, `autoDoc`). The suite named `describe('withSwagger')` only snapshots `createSwaggerSpec`.
- Files: `src/swagger.ts`, `test/index.test.ts`, `test/__snapshots__/index.test.ts.snap`
- Risk: Error-status / leak regressions ship without failing CI.
- Priority: High

**Production-build + autoDoc interaction is untested:**
- What's not tested: `extractApiInfo` while `NEXT_PHASE=phase-production-build` and `.next/server/...` exists; union of source methods with stale compiled methods; `scanBuildOutput: true` actually globbing via `createSwaggerSpec` (unit tests only call `shouldScanBuildDirectory`).
- Files: `src/auto-doc.ts`, `src/swagger.ts`, `test/index.test.ts`, `test/fixtures/.next/server/app/api/compiled/route.js`
- Risk: Reintroduces Vercel ENOENT (#1157) or extra phantom operations.
- Priority: High

**Compiled output is not a real Next artifact:**
- What's not tested: webpack/turbopack `route.js` (CJS / runtime exports); parse failures in `getExportedMethods` (the `console.warn` branch); `loadSpecFile` invalid JSON; `__NEXT_ROUTER_BASEPATH` server injection; `schemaFolders`; `public/**/*.json` merge; `phase-export`.
- Files: `src/route-parser.ts`, `src/swagger.ts`, `test/fixtures/.next/`
- Risk: Standalone autoDoc fallback documented in README may no-op on real builds (issue #1228 class of problem).
- Priority: High

**Route conventions with no fixtures:**
- What's not tested: Private `_` folders, intercepting `(.)` routes, `.yml` schemas, Pages Router autoDoc (expected empty), `src/pages/api`, custom `distDir`.
- Files: `src/route-path.ts`, `src/auto-doc.ts`, `test/fixtures/app/`
- Risk: Next.js private folders leak into the spec; new folder conventions silently mis-parse.
- Priority: Medium

**No coverage gates:**
- What's not tested: `vitest.config.ts` is `{ test: { globals: true } }` only — no `coverage.thresholds`. `pnpm coverage` can pass with untested CLI/handler.
- Files: `vitest.config.ts`, `package.json`
- Risk: New files can land at 0% coverage.
- Priority: Low

---

*Concerns audit: 2026-08-26*
