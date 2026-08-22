# ARCHITECTURE — next-swagger-doc

## Overview

A small, dependency-light library with **three public surfaces**:

1. `createSwaggerSpec()` — build an OpenAPI 3 spec object from JSDoc-annotated route files
2. `withSwagger()` — Next.js API-route middleware that serves the spec as JSON
3. `next-swagger-doc-cli` — CLI that reads a JSON config and writes `swagger.json`

Plus a newer **App Router auto-doc** feature that derives basic operations from `route.ts` files without any annotations.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Entry: src/index.ts (re-exports public API)                │
├─────────────────────────────────────────────────────────────┤
│  src/swagger.ts     — spec creation + Next.js middleware    │
│  src/auto-doc.ts    — App Router route scanner + generator  │
│  src/route-parser.ts — route source parsing (es-module-lexer) │
│  src/cli.ts         — CLI binary (cleye)                    │
├─────────────────────────────────────────────────────────────┤
│  swagger-jsdoc    — parses JSDoc annotations → OAS3 spec    │
│  node:fs / node:path — filesystem scanning                  │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### `src/swagger.ts` — public API

- **`SwaggerOptions`** = swagger-jsdoc `Options` + `apiFolder` (default `'pages/api'`), `schemaFolders` (default `[]`), `definition` (required `OAS3Definition`), `outputFile`, `autoDoc` (`boolean | AutoDocOptions`)
- **`createSwaggerSpec()`**
  1. Builds a glob list of `apis` from `apiFolder` + `schemaFolders`, scanning three locations: source dir (`**/*.{ts,tsx,jsx,js,json,swagger.yaml}`), `.next/server` build dir (js/swagger.yaml/json only), and `public/` (swagger.yaml/json)
  2. Injects a `servers` entry from `process.env.__NEXT_ROUTER_BASEPATH` if a base path is set and no `servers` are defined
  3. Delegates to `swaggerJsdoc(options)` for the base spec
  4. If `autoDoc` is enabled, merges generated paths from `generateAutoDoc(extractApiInfo(apiFolder))` into `spec.paths` — **manual `@swagger` operations win** over generated ones
- **`withSwagger()`** — returns a Next.js API handler; wraps `createSwaggerSpec` in try/catch, sends `200` + spec or `400` + `{ error }`

### `src/auto-doc.ts` — App Router scanner (newest feature)

- **`extractApiInfo(apiFolder, cwd)`** — walks the folder recursively, finds `route.*` files (ts/tsx/js/jsx/mts/mtsx/mjs/mjsx), reads exported HTTP methods, converts directory segments to OpenAPI path segments, and returns sorted `{ path, methods }[]`. Scans both the source folder and `.next/server/<apiFolder>` (compiled `route.js` files) when present.
- **`generateAutoDoc(apiInfos)`** — builds minimal operations: `summary` (`"GET /path"`), path `parameters` from `{...}` segments, and a default `200` "Successful response".
- **Internal helpers**:
  - `getRouteFiles()` — recursive directory walk
  - `getApiSegments()` — strips everything up to the `app`/`pages` root to derive the API base path
  - `toOpenApiPaths()` — converts `[id]` → `{id}`, `[...slug]` → `{slug}`, `[[...slug]]` → optional catch-all (emits both with and without the segment), drops route groups `(…)` and `@` parallel-route segments
  - `getPathParameters()` — regex-extracts `{param}` from a path

### `src/route-parser.ts` — route source parser

- **`getExportedMethods(source)`** — extracts exported HTTP method handler names from a route module's source using **es-module-lexer** (`initSync` + `parse`). Handles comments, strings, and regex literals correctly; a per-file parse failure warns and returns `[]` rather than crashing doc generation.
- **`HTTP_METHODS`** — the ordered list of HTTP methods a route can export (shared with `auto-doc.ts`).

### `src/cli.ts` — CLI

- Uses `cleye` to parse `<config file>` (required positional) and `--output` (default `public/swagger.json`)
- Reads the JSON config, calls `createSwaggerSpec`, writes pretty-printed JSON

## Data Flow

**Manual (JSDoc) path:**
```
route files with @swagger comments ──► swagger-jsdoc ──► spec.paths (from annotations)
```

**Auto-doc path:**
```
route.ts files ──► extractApiInfo (paths + methods)
            ──► generateAutoDoc (basic operations)
            ──► merged into spec.paths (manual overrides generated)
```

**Runtime serving:**
```
createSwaggerSpec ──► withSwagger handler ──► GET /api/doc → JSON spec
```

## Key Design Decisions

- **Real lexer over string matching** — auto-doc extracts exported handlers with es-module-lexer (a real ESM lexer) instead of the previous hand-rolled string scanner; comments, strings, and regex literals no longer cause false positives or misses
- **Dual source + build-dir scanning** — supports both dev (source) and production (`.next/server` compiled) scenarios
- **Manual-over-generated precedence** — `{ ...generatedOperations, ...operations }` merge ensures hand-written docs are never clobbered
- **Dual ESM/CJS output** via pkgroll with a single `src/` source of truth
