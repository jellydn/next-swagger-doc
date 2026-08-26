# CONVENTIONS — next-swagger-doc

## Code Style (enforced by Biome — `biome.json`)

- **Indentation**: 2 spaces, LF line endings
- **Quotes**: single quotes; double quotes for JSX
- **Semicolons**: always
- **Trailing commas**: es5 (objects/arrays, not function params)
- **Line width**: 80
- **Imports**: auto-organized (`organizeImports` enabled); type-only imports preferred (`useImportType`, `useExportType`)
- **Arrow functions** preferred over function expressions (`useArrowFunction`); block statements required (`useBlockStatements`)

## Lint Rules (curated, `recommended: false`)

Biome is configured with explicit rule sets rather than the recommended preset:

- **complexity**: no useless catch/constructor/ternary/type-constraint; `useOptionalChain`, `useRegexLiterals`, `useLiteralKeys`
- **correctness**: no unused variables, no undeclared variables, `useIsNan`, no unsafe optional chaining
- **security**: `noGlobalEval`
- **style**: `noVar`, `useConst`, `useNamingConvention` (warn), `useAsConstAssertion`, `useExponentiationOperator`, restricted globals (`event`, `atob`, `btoa`)
- **suspicious**: `noDebugger`, `noDoubleEquals`, `noPrototypeBuiltins`, `noRedeclare`, `useValidTypeof`, etc.
- `dist/` and `.eslintrc.cjs`/`vite.config.ts` are ignored; `.d.ts` files relax `noUnusedVariables`

## TypeScript Conventions

- **Strict mode** (`strict: true`) plus `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`
- `moduleResolution: node`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`
- `importHelpers: true` (tslib)
- Type-only imports via `import type { … }` (e.g. `import type { NextApiRequest, NextApiResponse } from 'next'`)
- `as const` for literal tuples (`HTTP_METHODS`)
- No default exports in library code; named exports only

## Naming

- Functions: `camelCase`, action-first (`createSwaggerSpec`, `extractApiInfo`, `getRouteFiles`)
- Types: `PascalCase` (`SwaggerOptions`, `ApiInfo`, `AutoDocOptions`)
- Constants: `UPPER_SNAKE_CASE` (`HTTP_METHODS`, `defaultOptions`)
- Private helpers are module-local (not exported)

## Patterns

- **Default parameters** for options (`apiFolder = 'pages/api'`, `autoDoc = false`)
- **Destructuring** options in function signatures, spreading the rest into swagger-jsdoc options
- **Functional style**: `flatMap`, `filter`, `map`, `Object.fromEntries`; `Set`/`Map` for dedup (`apiInfos` map, `methods` set)
- **JSDoc comments** on public API functions (`createSwaggerSpec`, `withSwagger`) describing params and returns
- **No TODO/FIXME/HACK comments** anywhere in the codebase (verified via search)

## Error Handling

- `withSwagger` wraps spec creation in try/catch: success → `res.status(200).send(spec)`; failure → `res.status(400).json({ error })` with a fallback message `'Failed to create Swagger spec'`
- Error message extraction uses `error instanceof Error ? error.message : fallback`
- No custom error classes; logging is limited to a `console.warn` in `route-parser.ts` when a route file fails to parse

## Module & File Conventions

- ESM (`"type": "module"`), Node built-ins imported explicitly (`node:fs`, `node:path`)
- Single responsibility per file (swagger = API, auto-doc = scanner, route-parser = parser, cli = CLI)
- `src/index.ts` is a pure barrel re-export

## Commit / Release Conventions

- Conventional-ish commit messages (`feat:`, `chore:`, `fix:`)
- Changelog via Changie fragments in `.changes/unreleased/`
- Renovate auto-merges non-major dependency updates
- Pre-commit hooks: Prettier (html/css/markdown) + Biome check
