# INTEGRATIONS — next-swagger-doc

This is a **library**, not a service-backed app. It has no database, no auth provider, no external API calls, and no webhooks at runtime. Integrations are limited to the libraries it builds on and the tooling around the repo.

## Core Library Integrations

| Integration | Type | How it's used |
| --- | --- | --- |
| **swagger-jsdoc** (`src/swagger.ts`) | npm library | Parses `@swagger` JSDoc annotations from route files and merges them with the OpenAPI `definition` into a spec object. This is the entire "engine" of the library. |
| **Next.js** (`src/swagger.ts`) | peer framework | `NextApiRequest`/`NextApiResponse` types for `withSwagger` middleware; scans `.next/server` build output; reads `__NEXT_ROUTER_BASEPATH` env for base-path-aware servers. |
| **cleye** (`src/cli.ts`) | npm library | CLI flag/parameter parsing for the `next-swagger-doc-cli` binary. |
| **es-module-lexer** (`src/route-parser.ts`) | npm library | Real ESM lexer that extracts exported names from route source, replacing the hand-rolled string scanner in auto-doc. |

## Build / Docs / Quality Tooling

| Integration | Purpose |
| --- | --- |
| **pkgroll** | Bundling to dual ESM/CJS output |
| **typedoc** | Generates API reference docs (used in `vercel-build`) |
| **Biome** | Lint + format |
| **Vitest** | Unit testing |
| **Renovate** (`renovate.json`) | Automated dependency PRs; auto-merges non-major bumps |
| **pre-commit** (`.pre-commit-config.yaml`) | Prettier + Biome hooks |
| **Changie** (`.changie.yaml`, `.changes/`) | Changelog fragment management |
| **cspell** | Spell checking |
| **all-contributors-cli** | Contributor badge/table in README |

## CI / SaaS

| Integration | Location | Purpose |
| --- | --- | --- |
| **GitHub Actions — CodeQL** | `.github/workflows/codeql-analysis.yml` | Security scanning (JavaScript), on push/PR to `main` + weekly schedule |
| **GitHub Actions — CodeSee** | `.github/workflows/codesee-arch-diagram.yml` | Architecture diagram (uses `CODESEE_ARCH_DIAG_API_TOKEN` secret) |
| **GitHub Sponsors / Ko-fi** | `.github/FUNDING.yml` | Funding links |

> Note: there is **no** CI workflow for running tests or lint — those run only locally/pre-commit.

## Example App Integrations (not part of the library)

- `swagger-ui-react` — renders the generated spec as Swagger UI in `examples/next14-app` and `examples/next15-app`
- `next-themes`, `tailwindcss`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@radix-ui/react-slot`, `sharp` — UI stack of the example apps
- `openapi-types` — OpenAPI type helpers in examples

## Auth / Security Schemes (documented, not connected)

The library and examples document OpenAPI security schemes (Bearer JWT, OAuth2) in the generated spec — these are **documentation only**; no authentication is enforced or integrated.
