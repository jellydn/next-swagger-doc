# AGENTS.md

Instructions for AI coding agents working on `next-swagger-doc`.

## Project

Generate an OpenAPI (Swagger) spec from Next.js API routes. JSDoc `@swagger` blocks are parsed by `swagger-jsdoc`. App Router `route.ts` files can also get basic operations from folder paths and exported HTTP handlers when `autoDoc` is enabled.

- Runtime: Node.js >= 18
- Package manager: pnpm 10.9.0 (Corepack)
- Language: TypeScript (strict, ESM)

## Setup

```sh
corepack enable
corepack pnpm@10.9.0 install --frozen-lockfile
```

`.agents/setup` runs the same install. No extra services need to be started.

## Commands

| Task | Command |
| --- | --- |
| Install | `pnpm install` |
| Test | `pnpm test` |
| Coverage | `pnpm coverage` |
| Lint | `pnpm lint` |
| Format check | `pnpm format` |
| Build | `pnpm build` |

Use Vitest for tests. Prefer real fixtures under `test/fixtures` over mocks.

## Layout

- `src/swagger.ts` — `createSwaggerSpec` and `withSwagger`
- `src/auto-doc.ts` — App Router path/method extraction
- `src/cli.ts` — `next-swagger-doc-cli`
- `src/index.ts` — public exports
- `test/` — Vitest tests and snapshots
- `examples/` — Next.js 13/14/15 demo apps (separate lockfiles)

Do not edit `dist/`; pkgroll writes it from `src/`.

## Style

- Biome formats and lints `src` (2-space indent, 80-column line width)
- Keep TypeScript strict; avoid `any`
- Document new options on `SwaggerOptions` and in `README.md`
- Conventional commits: `feat`, `fix`, `chore`, `docs`, `test`

## API notes

- `apiFolder` defaults to `pages/api`. App Router apps typically pass `app/api`.
- `autoDoc: true` fills in operations from `route` files. Manual `@swagger` JSDoc wins on conflict.
- `createSwaggerSpec` globs the source API folder, `public` OpenAPI files, and `.next/server` compiled output. Prefer source files when they exist.

## Examples

Example apps depend on published `next-swagger-doc`. Library changes are verified with `pnpm test` in the repo root, not by rewriting example lockfiles unless the task is specifically about an example.
