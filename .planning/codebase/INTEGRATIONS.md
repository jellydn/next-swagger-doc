# External Integrations

**Analysis Date:** 2026-08-26

## APIs & External Services

**None in the library runtime.** `next-swagger-doc` is an OpenAPI generator: it reads local Next.js route files and writes a spec. There are no `fetch` / HTTP client calls in `src/` (confirmed across `src/swagger.ts`, `src/auto-doc.ts`, `src/cli.ts`, `src/route-parser.ts`, `src/spec-source.ts`, `src/merge-auto-doc.ts`, `src/route-path.ts`).

**OpenAPI / Swagger (local library, not a hosted API):**
- swagger-jsdoc 6.3.0 - parse `@swagger` JSDoc into OAS3 (`package.json`, `src/swagger.ts` `createSwaggerSpec`).
- SDK/Client: `swagger-jsdoc` (`src/swagger.ts`).
- Auth: none.

**OpenAPI UI viewers (examples only, in-process):**
- swagger-ui-react - render spec in demo apps (`examples/next14-app/app/api-doc/react-swagger.tsx`, `examples/next13-simple/pages/api-doc.tsx`, `examples/next13-simple/pages/swagger.tsx`). Not a library dependency (`README.md`, `AGENTS.md`).
- @stoplight/elements 9.0.1 - alternate viewer (`examples/next13-simple/pages/playground.tsx` loads `/swagger.json`).
- Scalar is mentioned as a consumer option only (`README.md`, `AGENTS.md`); no Scalar package in this repo.

**Package registry / docs hosting (publish-time, not runtime):**
- npm registry - package `next-swagger-doc` (`package.json` name/version, `README.md` npm badges).
- SDK/Client: npm publish of `dist/` (`package.json` `files`, `exports`).
- Auth: npm token not present in repo (no `.npmrc` publish config).
- TypeDoc docs at `https://next-swagger-doc.productsway.com/` via `package.json` `vercel-build`.
- Demo app at `https://next-swagger-doc-demo.productsway.com/api-doc` (`README.md`).
- GitHub repo `https://github.com/jellydn/next-swagger-doc` (`package.json` `repository`).

**Example-only placeholder OAuth URLs (not wired):**
- `https://example.com/oauth/authorize` and `https://example.com/oauth/token` appear as OpenAPI `securitySchemes.OAuth2` documentation samples (`examples/next14-app/lib/swagger.ts`, `examples/next15-app/lib/swagger.ts`, `examples/next16-app/lib/swagger.ts`, `test/index.test.ts`). No OAuth client, no token exchange.

**Dependency / architecture services (CI, not app):**
- Renovate - dependency PRs (`renovate.json`).
- SDK/Client: Renovate GitHub app (config only).
- Auth: none in repo.
- CodeSee - architecture diagrams (`.github/workflows/codesee-arch-diagram.yml`).
- SDK/Client: `Codesee-io/codesee-action@v2`.
- Auth: `secrets.CODESEE_ARCH_DIAG_API_TOKEN`.

## Data Storage

**Databases:**
- None. No Prisma, SQL, Redis, Mongo, or other DB client in `package.json` or `src/`. Example API handlers return in-memory JSON/text (`examples/next13-simple/pages/api/hello.ts`, `examples/next14-app/app/api/hello/route.ts`). Evidence: `AGENTS.md` “No extra services need to be started.”

**File Storage:**
- Local filesystem only. Reads API/schema files and optional prebuilt spec; writes JSON spec.
  - Source scan: `apiFolder` (default `pages/api`) + `schemaFolders` + `public/**/*.swagger.yaml|json` (`src/swagger.ts`, `src/spec-source.ts`).
  - Compiled fallback: `.next/server/<folder>` when source is missing and Next.js is not compiling (`src/spec-source.ts`, `src/swagger.ts` `shouldScanBuildDirectory`).
  - Prebuilt load: `specFile` e.g. `public/swagger.json` (`src/swagger.ts` `loadSpecFile`, `examples/next14-app/lib/swagger.ts`).
  - Write: `outputFile` (`src/swagger.ts`) and CLI `--output` default `public/swagger.json` (`src/cli.ts`).
  - Example static spec: `examples/next13-simple/public/swagger.json`; YAML schemas under `examples/next13-simple/models/openapi/`.
- Connection: none (paths relative to `process.cwd()` in `src/swagger.ts` `resolveUserPath`).
- Client: Node `fs` (`src/swagger.ts`, `src/auto-doc.ts`, `src/cli.ts`).

**Caching:**
- None. Spec is generated per `createSwaggerSpec` / `withSwagger` call (`src/swagger.ts`). No Redis, CDN cache config, or in-memory cache layer. `specFile` is a static file load, not a cache.

## Authentication & Identity

**Auth Provider:**
- None implemented. Library does not authenticate users or call IdPs.

**Implementation:**
- OpenAPI documentation of consumer APIs only. Default spec has no security (`src/swagger.ts` `defaultOptions`). Tests and examples document optional schemes:
  - HTTP Bearer JWT (`test/index.test.ts` `bearerAuth`; `examples/next14-app/lib/swagger.ts` `BearerAuth`).
  - OAuth2 authorization code with example.com placeholder URLs (`test/index.test.ts`, `examples/next14-app/lib/swagger.ts`).
- `security: []` in example `getApiDocs` (`examples/next14-app/lib/swagger.ts`) — schemes declared, not required.
- No NextAuth, Clerk, Auth0, sessions, or cookies in this repo.
- `SECURITY.md` is the GitHub template stub (version table does not match package 0.5.0 in `package.json`); no reporting endpoint or bounty program is specified.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, Bugsnag, or similar in `package.json` or workflows).
- GitHub CodeQL static analysis on JavaScript (`.github/workflows/codeql-analysis.yml`, `github/codeql-action` v3.37.8) — security scanning, not production error tracking.
- CodeSee architecture diagrams (`.github/workflows/codesee-arch-diagram.yml`) — repo visualization, `continue-on-error: true`.

**Logs:**
- `console.warn` when `es-module-lexer` cannot parse a route file (`src/route-parser.ts`).
- `console.log` for CLI generation (`src/cli.ts`).
- `withSwagger` maps thrown errors to HTTP 400 JSON `{ error }` (`src/swagger.ts`); success is HTTP 200 with the spec.
- Example Next.js 13 config strips `console` in production (`examples/next13-simple/next.config.js` `compiler.removeConsole: true`).
- No structured logger, log drain, or APM.

## CI/CD & Deployment

**Hosting:**
- Library: npm (`package.json`, `README.md`). Not a hosted SaaS.
- API docs: TypeDoc built as `vercel-build` (`package.json`) for `https://next-swagger-doc.productsway.com/` (`README.md`, `examples/next14-app/config/site.ts` `links.docs`).
- Demo Next.js app: `https://next-swagger-doc-demo.productsway.com/api-doc` (`README.md`). Vercel is the documented example deploy path (`examples/next13-simple/README.md`) and a first-class build constraint (`src/swagger.ts` comments on Vercel `export-detail.json` ENOENT; `README.md` “Vercel builds”).
- No `vercel.json` / Dockerfile / k8s manifests in the repo.

**CI Pipeline:**
- GitHub Actions only two workflows — no test, lint, or npm-publish workflow under `.github/workflows/`:
  - CodeQL on push/PR to `main` + weekly cron (`18 18 * * 5`) (`.github/workflows/codeql-analysis.yml`).
  - CodeSee on push to `main` and `pull_request_target` (`.github/workflows/codesee-arch-diagram.yml`).
- Renovate automerges non-major updates (`renovate.json`).
- Release script `pnpm release:version` uses bumpp to commit/tag/push (`package.json`); changelog via Changie (`CHANGELOG.md`).
- Local quality: Vitest (`package.json` `test`), Biome (`package.json` `lint`/`format`), pre-commit (`.pre-commit-config.yaml`).
- Funding metadata only: GitHub Sponsors `jellydn`, Ko-fi `dunghd` (`.github/FUNDING.yml`); PayPal / Buy Me a Coffee links in `README.md` — not integrations.

## Environment Configuration

**Required env vars:**
- None required to generate a spec or run tests. Library options come from `SwaggerOptions` / `next-swagger-doc.json` (`src/swagger.ts`, `src/cli.ts`, `examples/next13-simple/next-swagger-doc.json`).
- Optional / injected (not user secrets):
  - `NEXT_PHASE` — Next.js build phase; when set to `phase-production-build`, `phase-production-compile`, or `phase-export`, compiled `.next` is not globbed (`src/swagger.ts` `shouldScanBuildDirectory`).
  - `__NEXT_ROUTER_BASEPATH` — if set and `definition.servers` is absent, becomes OpenAPI `servers[0].url` (`src/swagger.ts`).
  - `NODE_ENV` — example Tailwind indicator hidden in production (`examples/next14-app/components/tailwind-indicator.tsx` and next15/next16 copies).
- No `.env`, `.env.example`, or `process.env` API keys in source.

**Secrets location:**
- GitHub Actions secret `CODESEE_ARCH_DIAG_API_TOKEN` (`.github/workflows/codesee-arch-diagram.yml`).
- No Vault, AWS Secrets Manager, Doppler, or committed credentials. `SECURITY.md` does not define a secret-handling process.

## Webhooks & Callbacks

**Incoming:**
- None. Library HTTP surface is optional `withSwagger` Pages Router handler that **returns** the spec (`src/swagger.ts`); example routes are hello-world GET handlers (`examples/next13-simple/pages/api/hello.ts`, `examples/next14-app/app/api/hello/route.ts`, `examples/next13-simple/pages/api/doc.ts`). No `/webhooks` paths, no signature verification.

**Outgoing:**
- None. No outbound HTTP, no Slack/GitHub webhook posts, no OAuth token callbacks (example.com URLs in `examples/next14-app/lib/swagger.ts` are spec text only). CLI writes a local file (`src/cli.ts`).

---

*Integration audit: 2026-08-26*
