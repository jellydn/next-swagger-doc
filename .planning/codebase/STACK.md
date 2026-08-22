# STACK — next-swagger-doc

> Library that generates Swagger/OpenAPI JSON from Next.js API routes. Published on npm as `next-swagger-doc`, MIT licensed, maintained by Huynh Duc Dung (jellydn).

## Languages & Runtime

- **TypeScript** 5.8.3 — all source in `src/` (`tsconfig.json`)
- **Node.js** >= 18 (`package.json` `engines`, `.nvmrc` pins `lts/*`)
- **ESM-first** — `"type": "module"`; ships both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) bundles

## Package Manager

- **pnpm** 10.9.0 (`packageManager` field, `pnpm-lock.yaml`)

## Build & Tooling

| Tool | Version | Purpose |
| --- | --- | --- |
| pkgroll | 2.12.1 | Bundler — `pnpm build` / `pnpm start --watch`; emits `dist/index.cjs`, `dist/index.js`, `dist/index.d.ts`, `dist/cli.js` |
| TypeScript | 5.8.3 | Type checking (`tsconfig.json`, strict) |
| Biome | 1.9.4 | Lint + format (`biome.json`, `pnpm lint`, `pnpm format`) |
| Vitest | 3.1.2 | Unit tests (`vitest.config.ts`, `pnpm test`) |
| typedoc | 0.28.3 | API docs (`pnpm vercel-build` runs `typedoc src/index.ts`) |
| size-limit | 11.2.0 | Declared devDependency — **no config file found** (unused) |
| c8 / @vitest/coverage-v8 | 10.1.3 / 3.1.2 | Coverage (`pnpm coverage`) |

## Runtime Dependencies

| Package | Version | Role |
| --- | --- | --- |
| swagger-jsdoc | 6.2.8 | Core engine — parses JSDoc `@swagger` annotations into an OAS3 spec |
| cleye | 1.3.4 | CLI argument parsing (`src/cli.ts`) |
| es-module-lexer | 2.3.2 | Real ESM lexer — extracts exported HTTP handlers from route source (`src/route-parser.ts`) |
| isarray | 2.0.5 | Array check helper |
| @types/swagger-jsdoc | 6.0.4 | Types for swagger-jsdoc |

## Peer Dependency

- **next** >= 9 — the library targets Next.js API routes (pages router and App Router)

## Dev Dependencies (notable)

- `next` 15.3.1 (used by tests/examples), `@types/node` 22.14.1, `all-contributors-cli`, `sort-package-json`, `@vitest/ui`, `tslib`

## Configuration Files

| File | Purpose |
| --- | --- |
| `tsconfig.json` | Strict TS config; `noEmit`, declaration + sourceMap output via pkgroll |
| `biome.json` | Lint rules (recommended off, curated rule sets) + formatter (2-space, single quotes, 80 cols) |
| `vitest.config.ts` | Test config — `globals: true` |
| `.nvmrc` | Node `lts/*` |
| `renovate.json` | Dependency updates — auto-merge non-major, lockfile maintenance |
| `cspell.json` + `cspell-tool.txt` | Spell-check dictionary |
| `.pre-commit-config.yaml` | Prettier (html/css/markdown) + Biome pre-commit hooks |
| `.changie.yaml` | Changelog generation (fragments in `.changes/`) |
| `.gitignore` | Ignores `node_modules`, `dist`, `coverage`, `docs`, `.vercel` |

## Package Entry Points

- `exports`: `require` → `dist/index.cjs`, `import` → `dist/index.js`
- `types`/`typings` → `dist/index.d.ts`
- `bin`: `next-swagger-doc-cli` → `dist/cli.js`
- Published files: `dist` + `src`

## Scripts

| Script | Command |
| --- | --- |
| `build` / `prepare` | `pkgroll` |
| `start` | `pkgroll --watch` |
| `test` | `vitest run` |
| `test:ui` | `vitest --ui` |
| `coverage` | `vitest run --coverage` |
| `lint` | `biome lint src` |
| `format` | `biome format src` |
| `vercel-build` | `npx typedoc src/index.ts` |
