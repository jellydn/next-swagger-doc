# Coding Conventions

**Analysis Date:** 2026-08-26

## Naming Patterns

**Files:**
- Library modules in `src/` use kebab-case TypeScript files: `src/auto-doc.ts`, `src/merge-auto-doc.ts`, `src/route-parser.ts`, `src/route-path.ts`, `src/spec-source.ts`, `src/swagger.ts`, `src/cli.ts`, `src/index.ts`.
- Tests live as a single file `test/index.test.ts` with snapshots at `test/__snapshots__/index.test.ts.snap`.
- Fixtures mirror Next.js App Router filenames (`route.ts`, compiled `route.js`) under `test/fixtures/`.
- No default-export React-style `index.ts` barrels except the public package entry `src/index.ts`.

**Functions:**
- camelCase verb phrases: `createSwaggerSpec`, `extractApiInfo`, `generateAutoDoc`, `getExportedMethods`, `routeToOpenApiPaths`, `discoverSpecLocations`, `mergeAutoDoc`, `loadSpecFile` in `src/swagger.ts` / `src/auto-doc.ts` / `src/route-parser.ts` / `src/route-path.ts` / `src/spec-source.ts` / `src/merge-auto-doc.ts`.
- Boolean predicates use `is*` / `should*`: `isAutoDocEnabled`, `shouldScanBuildDirectory`, `isRouteFile` in `src/swagger.ts` and `src/auto-doc.ts`.
- Unexported helpers stay camelCase and file-private: `resolveUserPath` (`src/swagger.ts`), `getRouteFiles` / `getPathParameters` (`src/auto-doc.ts`), `getApiSegments` (`src/route-path.ts`).
- HTTP handler names in fixtures and App Router code are uppercase Next.js exports (`GET`, `HEAD`, `PATCH`, `DELETE`, `OPTIONS`) as in `test/fixtures/app/api/health/route.ts`.

**Variables:**
- camelCase locals: `sourceDirectory`, `buildDirectory`, `scanFolders`, `apiInfos`, `exportSpecifiers` in `src/swagger.ts`, `src/auto-doc.ts`, `src/route-parser.ts`.
- Module constants are `SCREAMING_SNAKE_CASE`: `HTTP_METHODS` in `src/route-parser.ts`, `NEXT_BUILD_PHASES` in `src/swagger.ts`.
- `const` everywhere (Biome `useConst` / `noVar` in `biome.json`); no `var`.
- Option fields on `SwaggerOptions` in `src/swagger.ts` match user-facing camelCase API names: `apiFolder`, `schemaFolders`, `outputFile`, `specFile`, `autoDoc`, `scanBuildOutput`.

**Types:**
- PascalCase `export type` aliases, never `interface`: `SwaggerOptions`, `AutoDocOptions` in `src/swagger.ts`; `ApiInfo` in `src/auto-doc.ts`; `SpecLocations` in `src/spec-source.ts`; `PathsObject` in `src/merge-auto-doc.ts`.
- Object types use inline `{ field: Type }` shapes, often with optional `?` fields.
- External OpenAPI types are imported (`OAS3Definition`, `Options` from `swagger-jsdoc` in `src/swagger.ts`) rather than re-declared.
- String unions / const arrays with `as const` for closed sets (`HTTP_METHODS` in `src/route-parser.ts`).
- No `any` in `src/` (AGENTS.md + TypeScript `strict` in `tsconfig.json`). CLI JSON parse uses a double assertion `as unknown as SwaggerOptions` in `src/cli.ts`.

## Code Style

**Formatting:**
- Tool: Biome (`@biomejs/biome` 2.5.10), invoked as `pnpm format` → `biome format src` in `package.json`.
- Settings from `biome.json`: 2-space indent, LF line endings, 80-column `lineWidth`, single quotes (`quoteStyle: "single"`), always semicolons, ES5 trailing commas, `arrowParentheses: "always"`, `bracketSpacing: true`.
- Import organization is enabled through `assist.actions.source.organizeImports` in `biome.json`; format/lint scripts scope to `src/` only (tests are not formatted by the package scripts).
- TypeScript in `tsconfig.json`: `"strict": true`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`, `forceConsistentCasingInFileNames`, ESM (`"type": "module"` in `package.json`, `"module": "esnext"`).

**Linting:**
- Tool: Biome linter via `pnpm lint` → `biome lint src` in `package.json`.
- `linter.rules.recommended` is `false` in `biome.json`; correctness/complexity/style/suspicious rules are enabled individually as `"error"`.
- Notable style rules in `biome.json`: `useImportType` / `useExportType`, `useArrowFunction`, `useOptionalChain`, `noUselessElse`, `noNegationElse`, `useBlockStatements`, `useConst` / `noVar`, `noDoubleEquals`, `useConsistentArrayType` (shorthand `T[]`), `noRestrictedGlobals` (`event`, `atob`, `btoa`).
- `useNamingConvention` is `"warn"` with `strictCase: false`.
- Linter ignore: `dist`, `.eslintrc.cjs`, `vite.config.ts` in `biome.json`.
- Conventional commits (`feat`, `fix`, `chore`, `docs`, `test`) per `AGENTS.md`; release script in `package.json` uses `chore: release v%s`.

## Import Organization

**Order:**
1. Node builtins, preferring the `node:` protocol (`node:fs`, `node:path` in `src/swagger.ts`, `src/auto-doc.ts`, `src/spec-source.ts`). Exception: `src/cli.ts` still imports `from 'fs'`.
2. External packages, with type-only imports via `import type` or inline `type` specifiers (`next`, `swagger-jsdoc`, `cleye`, `es-module-lexer` in `src/swagger.ts`, `src/cli.ts`, `src/route-parser.ts`).
3. Relative local modules last (`./auto-doc`, `./merge-auto-doc`, `./spec-source` in `src/swagger.ts`; `./route-parser`, `./route-path`, `./spec-source` in `src/auto-doc.ts`).
- Blank lines between groups appear in `src/auto-doc.ts` and `src/cli.ts`; `src/swagger.ts` keeps groups consecutive. Named imports are alphabetized within a specifier when Biome organizes them (e.g. `dirname, isAbsolute, join` in `src/swagger.ts`).

**Path Aliases:**
- None in the library. `tsconfig.json` has no `paths` / `baseUrl`; all library imports are relative (`./swagger`, `../src`).
- Example apps under `examples/` use `@/` (e.g. `@/types/nav`) — do not copy that into `src/`.

## Error Handling

**Patterns:**
- Fail soft for parse/scan problems: `getExportedMethods` in `src/route-parser.ts` wraps `parse()` in `try/catch`, logs a warning, and returns `[]` so a bad route file is skipped.
- Missing files return `undefined` or empty data rather than throwing: `loadSpecFile` in `src/swagger.ts` returns `undefined` when the path does not exist; `extractApiInfo` in `src/auto-doc.ts` filters to existing dirs and can yield `[]`.
- HTTP wrapper `withSwagger` in `src/swagger.ts` catches errors and responds `400` with `{ error: message }`, using `error instanceof Error ? error.message : 'Failed to create Swagger spec'`.
- Boolean option guards short-circuit (`isAutoDocEnabled`, `shouldScanBuildDirectory` in `src/swagger.ts`) instead of throwing on invalid combinations.
- CLI in `src/cli.ts` does not catch `JSON.parse` / write failures; those surface as process crashes.
- Tests that touch the filesystem use `try/finally` with `rmSync` in `test/index.test.ts` rather than throwing assertions.

## Logging

**Framework:** `console`

**Patterns:**
- CLI progress: `console.log` in `src/cli.ts` prints the output path and raw config before `writeFileSync`.
- Recoverable parse failures: `console.warn` in `src/route-parser.ts` prefixes messages with `next-swagger-doc:` and includes the optional `sourceName` plus the caught error.
- No debug/info logger, no structured logging library. Library hot paths (`createSwaggerSpec` in `src/swagger.ts`) are silent on success.

## Comments

**When to Comment:**
- Explain *why* a constraint exists, not restated control flow. Example: `NEXT_BUILD_PHASES` and `shouldScanBuildDirectory` JSDoc in `src/swagger.ts` document the Vercel `export-detail.json` ENOENT failure.
- One-line notes for non-obvious setup: `// es-module-lexer needs its WASM engine ready before parse() can run.` in `src/route-parser.ts`; `// Append base path server element to server array` in `src/swagger.ts`.
- File-level ownership comments when a module is the single source of a convention (`src/route-path.ts` owns Next.js folder segment translation; `src/spec-source.ts` owns `.next/server/<folder>` layout).
- Do not comment obvious maps/filters.

**JSDoc/TSDoc:**
- Public functions get a short block describing behavior and return value: `createSwaggerSpec`, `withSwagger`, `loadSpecFile`, `isAutoDocEnabled`, `shouldScanBuildDirectory` in `src/swagger.ts`; `extractApiInfo` in `src/auto-doc.ts`; `getExportedMethods` in `src/route-parser.ts`; `mergeAutoDoc` in `src/merge-auto-doc.ts`.
- Option fields on `SwaggerOptions` in `src/swagger.ts` use field-level `/** ... */` (including multi-line notes for `specFile`, `scanBuildOutput`).
- Older `createSwaggerSpec` / `withSwagger` blocks still use `@param options.*` tags that predate the current destructured signature — new APIs prefer a prose summary over `@param` lists.
- No module-level `@packageDocumentation`. Types themselves are rarely JSDoc'd unless they wrap user options.

## Function Design

**Size:** Keep units small and single-purpose. Helpers such as `resolveUserPath` (`src/swagger.ts`), `isRouteFile` / `getPathParameters` (`src/auto-doc.ts`), and `getApiSegments` (`src/route-path.ts`) are ~5–20 lines. Feature functions (`extractApiInfo`, `routeToOpenApiPaths`, `mergeAutoDoc`, `getExportedMethods`) stay under ~40 lines. The largest composer is `createSwaggerSpec` in `src/swagger.ts` (~80 lines): scan, swagger-jsdoc, auto-doc merge, optional write.

**Parameters:**
- Multi-field APIs take a destructured options object, often with an inline type and defaults: `shouldScanBuildDirectory({ sourceDirectory, buildDirectory, scanBuildOutput, nextPhase = process.env.NEXT_PHASE })` in `src/swagger.ts`; `createSwaggerSpec({ apiFolder = 'pages/api', ... })`.
- Inject `cwd = process.cwd()` as a last/default argument so tests can point at fixtures (`extractApiInfo`, `discoverSpecLocations`, `loadSpecFile` in `src/auto-doc.ts`, `src/spec-source.ts`, `src/swagger.ts`).
- Rest-spread remaining swagger-jsdoc options (`...swaggerOptions` in `src/swagger.ts`).
- Default-parameter-last (Biome `useDefaultParameterLast`).

**Return Values:**
- Predicates and loaders annotate returns: `boolean`, `OAS3Definition | undefined`, `ApiInfo[]`, `string[]`, `SpecLocations` (`src/swagger.ts`, `src/auto-doc.ts`, `src/spec-source.ts`).
- Composers may rely on inference (`createSwaggerSpec`, `generateAutoDoc`, `mergeAutoDoc`, `withSwagger`).
- Missing optional data → `undefined`; no matches → `[]`; HTTP middleware returns a nested `(req, res) => void` closure from `withSwagger` in `src/swagger.ts`.
- Avoid throwing for expected empty states.

## Module Design

**Exports:** Named exports only in `src/` — no `export default`. Public surface is functions + option types. Constants that are part of the algorithm (`HTTP_METHODS` in `src/route-parser.ts`) are exported for reuse inside the package. CLI in `src/cli.ts` is a bin script (`next-swagger-doc-cli` in `package.json`), not a library export.

**Barrel Files:** `src/index.ts` re-exports only the public API:

```ts
export * from './auto-doc';
export * from './swagger';
```

Internal modules (`src/merge-auto-doc.ts`, `src/route-parser.ts`, `src/route-path.ts`, `src/spec-source.ts`) are imported by path, including from tests. Do not add them to the barrel unless they are intended for consumers. `dist/` is generated by pkgroll from `src/` — never edit `dist/` (`AGENTS.md`).

---

*Convention analysis: 2026-08-26*
