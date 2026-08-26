# Technology Stack

**Analysis Date:** 2026-08-26

## Languages

**Primary:**
- TypeScript 5.9.3 (`package.json` `devDependencies.typescript`, `tsconfig.json`) - library source under `src/` (`src/swagger.ts`, `src/auto-doc.ts`, `src/cli.ts`, `src/index.ts`, `src/merge-auto-doc.ts`, `src/route-parser.ts`, `src/route-path.ts`, `src/spec-source.ts`) and tests in `test/index.test.ts`. Strict ESM (`package.json` `"type": "module"`). Compiler is strict with `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters` (`tsconfig.json`).
- TypeScript 5.8.3 (`examples/next13-simple/package.json`, `examples/next14-app/package.json`, `examples/next15-app/package.json`, `examples/next16-app/package.json`) - versioned Next.js demo apps.

**Secondary:**
- JavaScript / JSX - Next.js example pages and configs (`examples/next13-simple/next.config.js`, `examples/next14-app/next.config.mjs`, `examples/next14-app/postcss.config.js`, `examples/next14-app/tailwind.config.js`).
- YAML - OpenAPI schema dumps and CI (`examples/next13-simple/models/openapi/company.swagger.yaml`, `examples/next13-simple/models/openapi/organization.swagger.yaml`, `examples/next13-simple/models/openapi/people.swagger.yaml`, `.github/workflows/codeql-analysis.yml`, `.github/workflows/codesee-arch-diagram.yml`, `.pre-commit-config.yaml`).
- JSON - library and example config (`package.json`, `biome.json`, `renovate.json`, `cspell.json`, `examples/next13-simple/next-swagger-doc.json`, `examples/next13-simple/public/swagger.json`).
- CSS - Swagger UI stylesheet imports (`examples/next14-app/app/api-doc/react-swagger.tsx`) and Tailwind globals (`examples/next14-app/styles/globals.css`, `examples/next15-app/styles/globals.css`, `examples/next16-app/styles/globals.css`).
- OpenAPI 3.0.0 YAML/JSON - generated and hand-written specs (`src/swagger.ts` default `definition.openapi`, `examples/next13-simple/public/swagger.json`).

## Runtime

**Environment:**
- Node.js >= 18 (`package.json` `engines.node`, `AGENTS.md`, `README.md` badge). Next.js 16 example requires Node.js >= 20.9.0 (`examples/next16-app/package.json` `engines`, `AGENTS.md`).
- Dual publish: ESM `dist/index.js` + CJS `dist/index.cjs` with types `dist/index.d.ts` (`package.json` `exports` / `main` / `module` / `types`). CLI bin `next-swagger-doc-cli` → `dist/cli.js` (`package.json` `bin`).

**Package Manager:**
- pnpm 10.34.5 via Corepack (`package.json` `packageManager`, `AGENTS.md`).
- Lockfile: present — root `pnpm-lock.yaml` (`lockfileVersion: '9.0'`). Example apps have separate lockfiles (`examples/next13-simple/pnpm-lock.yaml`, `examples/next14-app/pnpm-lock.yaml`, `examples/next15-app/pnpm-lock.yaml`, `examples/next16-app/pnpm-lock.yaml`) and pin `pnpm@10.8.0` (`examples/next13-simple/package.json`, `examples/next14-app/package.json`, `examples/next15-app/package.json`, `examples/next16-app/package.json`).
- `pnpm.onlyBuiltDependencies`: `@biomejs/biome`, `esbuild`, `sharp` (`package.json`).

## Frameworks

**Core:**
- Next.js peer `>=9` (`package.json` `peerDependencies`); library types import `NextApiRequest` / `NextApiResponse` (`src/swagger.ts`). Dev dependency Next.js 16.3.3 (`package.json`). Example apps stay on their lines: Next.js 13.5.6 Pages Router (`examples/next13-simple/package.json`), Next.js ^14.2.26 App Router (`examples/next14-app/package.json`), Next.js ^15.3.0 App Router (`examples/next15-app/package.json`), Next.js ^16.1.5 App Router (`examples/next16-app/package.json`, `AGENTS.md`).
- React 18.3.1 (`examples/next13-simple/package.json`, `examples/next14-app/package.json`) and React 19.1.0 (`examples/next15-app/package.json`, `examples/next16-app/package.json`) — demo UIs only; the library itself is not a React component (`src/index.ts` exports `./auto-doc` and `./swagger` only).
- swagger-jsdoc 6.3.0 (`package.json` `dependencies`, `src/swagger.ts`) — parses `@swagger` JSDoc into an OAS3 document.
- OpenAPI 3.0.0 (`src/swagger.ts` `defaultOptions.definition`, `README.md`) — output spec format, not a runtime framework.

**Testing:**
- Vitest 3.2.7 (`package.json` `scripts.test` = `vitest run`, `vitest.config.ts` `test.globals: true`). Tests live in `test/index.test.ts` with snapshots in `test/__snapshots__/index.test.ts.snap` and fixtures under `test/fixtures/` (`AGENTS.md`).
- @vitest/coverage-v8 3.2.7 (`package.json` `scripts.coverage` = `vitest run --coverage`).
- @vitest/ui 3.2.7 (`package.json` `scripts.test:ui`).
- c8 10.1.3 (`package.json`) — listed but coverage is wired through Vitest V8, not a separate `c8` script.

**Build/Dev:**
- pkgroll 2.27.1 (`package.json` `scripts.build` / `prepare` / `start`) — bundles `src/` to `dist/` (do not edit `dist/`; `AGENTS.md`).
- TypeScript 5.9.3 (`package.json`, `tsconfig.json`) — `noEmit: true`; emit is pkgroll’s job.
- Biome 1.9.4 (`package.json` `scripts.lint` / `format`, `biome.json`) — 2-space indent, 80-column width, single quotes, lint+format `src` (`AGENTS.md`).
- Vite 6.4.3 (`package.json`) — Vitest runner.
- pre-commit (`README.md`, `.pre-commit-config.yaml`) — Prettier for HTML/CSS/Markdown; Biome check with `@biomejs/biome@1.7.0`.
- cspell (`cspell.json`, `cspell-tool.txt`) — English spellcheck dictionary.
- TypeDoc 0.28.20 (`package.json` `scripts.vercel-build` = `npx typedoc src/index.ts`) — API docs site.
- bumpp 12.2.2 (`package.json` `scripts.release:version`) — conventional version/tag/push.
- size-limit 11.2.0 (`package.json`) — listed; no `size-limit` config or script found.
- @skypack/package-check 0.2.2, sort-package-json 3.7.1, all-contributors-cli 6.26.1, tslib 2.8.1 (`package.json`).
- Example UI: Tailwind CSS ^3.4.14 + PostCSS + Autoprefixer (`examples/next14-app/package.json`, `examples/next14-app/tailwind.config.js`, `examples/next14-app/postcss.config.js`; same pattern in `examples/next15-app/` and `examples/next16-app/`).
- Example UI: styled-components 6.1.17 + @xstyled (`examples/next13-simple/package.json`, `examples/next13-simple/next.config.js`).
- Example UI: Radix UI, lucide-react, next-themes, class-variance-authority, clsx, tailwind-merge (`examples/next14-app/package.json`, `examples/next14-app/components/theme-provider.tsx`).
- Example schema helper: typeconv 2.3.1 + cpy-cli 5.0.0 (`examples/next13-simple/package.json` `openapi:yaml` / `postbuild`).
- Example local linking: `examples/next13-simple/link.config.json` points `packages` at `../`.

## Key Dependencies

**Critical:**
- swagger-jsdoc 6.3.0 (`package.json`, `src/swagger.ts`) — core JSDoc `@swagger` → OpenAPI conversion used by `createSwaggerSpec`.
- @types/swagger-jsdoc 6.0.4 (`package.json`) — `OAS3Definition` / `Options` types in `src/swagger.ts`.
- es-module-lexer 2.3.2 (`package.json`, `src/route-parser.ts`) — WASM lexer extracts exported HTTP handlers (`GET`/`POST`/…) from `route.ts` without regex sanitisation; `initSync()` at module load.
- cleye 1.3.4 (`package.json`, `src/cli.ts`) — CLI argv for `next-swagger-doc-cli` (`<config file>`, `--output`).
- next >= 9 (peer) (`package.json`, `src/swagger.ts`) — `withSwagger` Pages Router handler types; App Router support is filesystem-based, not a Next.js plugin.
- isarray 2.0.5 (`package.json`) — declared runtime dependency; no import in `src/` (also listed in `examples/next13-simple/package.json`).
- Node built-ins `node:fs` / `node:path` (`src/swagger.ts`, `src/auto-doc.ts`, `src/spec-source.ts`, `src/cli.ts`) — scan API folders, `.next/server`, and `public/`; write `outputFile`.

**Infrastructure:**
- swagger-ui-react (examples only: `latest` in `examples/next13-simple/package.json`; ^5.20.8 in `examples/next14-app/package.json`, `examples/next15-app/package.json`, `examples/next16-app/package.json`) — demo Swagger UI; not a library dependency (`README.md`, `AGENTS.md`). Loaded via `next/dynamic` with `ssr: false` (`examples/next14-app/app/api-doc/react-swagger.tsx`, `examples/next13-simple/pages/api-doc.tsx`).
- @stoplight/elements 9.0.1 (`examples/next13-simple/package.json`, `examples/next13-simple/pages/playground.tsx`) — alternate OpenAPI viewer demo.
- openapi-types ^12.1.3 (`examples/next14-app/package.json`, `examples/next15-app/package.json`, `examples/next16-app/package.json`) — example typing only.
- sharp ^0.34.1 (`examples/next14-app/package.json` and later examples) — Next.js image pipeline in demos.
- Git (`biome.json` `vcs.clientKind`, `.pre-commit-config.yaml`) — VCS for Biome ignore file and hooks.

## Configuration

**Environment:**
- No `.env`, `.env.example`, or required user secrets in the library. Runtime reads Next.js-injected vars only (`src/swagger.ts`): `process.env.NEXT_PHASE` (skip globbing `.next` during `phase-production-build` / `phase-production-compile` / `phase-export`) and `process.env.__NEXT_ROUTER_BASEPATH` (optional OpenAPI `servers[0].url`).
- Examples read `process.env.NODE_ENV` to hide the Tailwind breakpoint indicator (`examples/next14-app/components/tailwind-indicator.tsx`, `examples/next15-app/components/tailwind-indicator.tsx`, `examples/next16-app/components/tailwind-indicator.tsx`).
- Library options are code/JSON, not env: `apiFolder` (default `pages/api`), `schemaFolders`, `definition`, `autoDoc`, `specFile`, `outputFile`, `scanBuildOutput` (`src/swagger.ts` `SwaggerOptions`; CLI config `examples/next13-simple/next-swagger-doc.json`).
- GitHub Actions secret `CODESEE_ARCH_DIAG_API_TOKEN` (`.github/workflows/codesee-arch-diagram.yml`) — CodeSee only, not app runtime.

**Build:**
- `tsconfig.json` — `module: esnext`, `moduleResolution: node`, `jsx: react`, `strict: true`, `noEmit: true`, `rootDir: ./src`, `importHelpers: true`.
- `biome.json` — formatter (spaces, width 80, LF, single quotes) and linter rules; ignores `dist`.
- `vitest.config.ts` — `globals: true`.
- `package.json` scripts: `build`/`prepare`/`start` (pkgroll), `test`/`coverage`/`test:ui` (Vitest), `lint`/`format` (Biome), `vercel-build` (TypeDoc), `release:version` (bumpp).
- Example Next configs: `examples/next13-simple/next.config.js` (styled-components compiler, `removeConsole`); `examples/next14-app/next.config.mjs` and `examples/next15-app/next.config.mjs` (`reactStrictMode`, transpile `swagger-ui-react` / `swagger-client` / `react-syntax-highlighter`); `examples/next16-app/next.config.mjs` adds `turbopack.root`.
- Example TS configs: `examples/next13-simple/tsconfig.json` (`strict: false`); `examples/next14-app/tsconfig.json` (`strict: true`, `moduleResolution: node`); `examples/next16-app/tsconfig.json` (`moduleResolution: bundler`, `jsx: react-jsx`, `target: ES2017`).
- `renovate.json` — `config:base`, pin all except peers, lockfile maintenance, automerge non-major.
- `cspell.json` — custom dictionary `cspell-tool.txt`.
- `.pre-commit-config.yaml` — Prettier + Biome.
- No `vercel.json`, `typedoc.json`, or `size-limit` config file in the repo.

## Platform Requirements

**Development:**
- Node.js >= 18; Corepack + `pnpm@10.34.5 install --frozen-lockfile` (`AGENTS.md`, `package.json`). Next.js 16 example: Node.js >= 20.9 (`examples/next16-app/package.json`).
- Commands: `pnpm test`, `pnpm coverage`, `pnpm lint`, `pnpm format`, `pnpm build` (`AGENTS.md`, `package.json`).
- Optional: `pre-commit install` (`README.md`).
- No extra services (databases, queues, local docker) — `AGENTS.md` states `.agents/setup` is install-only.
- Library verified with `pnpm test` at repo root, not by rewriting example lockfiles (`AGENTS.md`).

**Production:**
- Published npm package `next-swagger-doc` 0.5.0 (`package.json`, `README.md` npm badges). Consumers embed it in a Next.js app (>=9) and optionally ship `public/swagger.json` for `output: 'standalone'` (`README.md`, `src/swagger.ts` `specFile` / `outputFile`).
- CLI generate-at-build: `next-swagger-doc-cli next-swagger-doc.json --output public/swagger.json` (`src/cli.ts` default output `public/swagger.json`, `README.md`).
- Docs site: TypeDoc via `vercel-build` (`package.json`); homepage `https://next-swagger-doc.productsway.com/` (`README.md`). Demo `https://next-swagger-doc-demo.productsway.com/api-doc` (`README.md`). Vercel is the documented Next.js deploy target (`examples/next13-simple/README.md`) and a build constraint (do not glob `.next` during compile; `src/swagger.ts`, `AGENTS.md`).
- MIT license (`LICENSE`, `package.json`).

---

*Stack analysis: 2026-08-26*
