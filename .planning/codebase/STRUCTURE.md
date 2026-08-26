# STRUCTURE — next-swagger-doc

## Directory Layout

```
.
├── src/                        # Library source (TypeScript, ESM)
│   ├── index.ts                # Public entry — re-exports auto-doc + swagger
│   ├── swagger.ts              # createSwaggerSpec, withSwagger, SwaggerOptions
│   ├── auto-doc.ts             # extractApiInfo, generateAutoDoc (App Router)
│   ├── route-parser.ts         # getExportedMethods via es-module-lexer
│   └── cli.ts                  # next-swagger-doc-cli binary (cleye)
├── test/
│   ├── index.test.ts           # All unit tests (Vitest)
│   ├── __snapshots__/          # Vitest snapshots for spec generation
│   └── fixtures/               # Test fixtures
│       ├── app/                # App Router route fixtures (route.ts files)
│       │   ├── api/{health,manual,regex,users/[id],users}/
│       │   ├── blog/[[...slug]]/
│       │   ├── users/
│       │   └── commented/
│       └── .next/server/app/   # Compiled route.js fixtures (build-dir scanning)
│           ├── only-compiled/compiled/route.js
│           └── api/compiled/route.js
├── examples/                   # Runnable demo apps (not published)
│   ├── next13-simple/          # Pages Router demo (pages/api, models/, CLI config)
│   ├── next14-app/             # App Router demo (app/api, app/api-doc, swagger-ui-react)
│   └── next15-app/             # App Router demo (same shape as next14-app, Next 15 + React 19)
├── .github/
│   ├── workflows/              # codeql-analysis.yml, codesee-arch-diagram.yml
│   └── FUNDING.yml
├── .changes/                   # Changie changelog fragments (unreleased/)
├── .swm/                       # Swimm docs (testing-overview, dev-environment-setup)
├── .agents/                    # Agent config files (setup, resume)
└── Root config files           # package.json, tsconfig.json, biome.json, vitest.config.ts,
                                # renovate.json, cspell.json, .pre-commit-config.yaml,
                                # .changie.yaml, .nvmrc, .gitignore
```

## Key Locations

| Location | What lives there |
| --- | --- |
| `src/index.ts` | Public API surface (barrel) |
| `src/swagger.ts` | Main spec-generation logic + Next middleware |
| `src/auto-doc.ts` | App Router auto-documentation feature |
| `src/route-parser.ts` | Route source parser (es-module-lexer) |
| `src/cli.ts` | CLI entry (`bin` target) |
| `test/fixtures/` | Route files used to test extraction/generation |
| `examples/` | Three standalone Next.js apps demonstrating usage |

## Naming Conventions

- **Files**: `kebab-case` for source/config (`auto-doc.ts`, `next-swagger-doc.json`); `route.ts` / `page.tsx` per Next.js conventions inside examples
- **Functions**: `camelCase`, verb-first for actions (`extractApiInfo`, `generateAutoDoc`, `createSwaggerSpec`, `getRouteFiles`)
- **Types/Interfaces**: `PascalCase` (`ApiInfo`, `SwaggerOptions`, `AutoDocOptions`)
- **Constants**: `UPPER_SNAKE_CASE` (`HTTP_METHODS`, `defaultOptions`)
- **Exports**: named exports throughout; no default exports in the library (`src/`)
- **Tests**: single `index.test.ts` with `describe('withSwagger', …)` suites; fixtures mirror real Next.js app structure

## Entry Points

- **Library**: `src/index.ts` → `dist/index.js` (ESM) / `dist/index.cjs` (CJS), types `dist/index.d.ts`
- **CLI**: `src/cli.ts` → `dist/cli.js` (`next-swagger-doc-cli`)
- **Docs**: `typedoc src/index.ts` (via `vercel-build`)

## Generated / Ignored

`dist/`, `node_modules/`, `coverage/`, `docs/`, `.vercel/` are gitignored. `tsconfig.tsbuildinfo` appears inside examples (not ignored there).
