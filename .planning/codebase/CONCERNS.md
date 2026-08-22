# CONCERNS — next-swagger-doc

## Parsing (previously the highest risk)

- **Resolved**: the hand-rolled source scanner (`sanitizeSource()` + string matching in `getExportedMethods`) was replaced with **es-module-lexer** (`src/route-parser.ts`) — a real ESM lexer that handles comments, strings, and regex literals correctly. The old approach silently missed handlers when source contained regex literals with comment-like sequences; a regression fixture (`test/fixtures/app/api/regex/route.ts`) now guards this.
- **Remaining**: `getApiSegments()` uses `lastIndexOf('app')` / `lastIndexOf('pages')` on the folder path — a folder named `myapp`, `pages2`, or a parent dir containing "app"/"pages" would be mis-split
- **Regex-based path parameter extraction** (`getPathParameters`) — fine for simple `{id}` but won't handle path parameters with regex constraints or multi-segment patterns

## Versioning / Release Hygiene

- `package.json` is at **`0.4.2-0`** (prerelease) but `CHANGELOG.md` stops at **0.3.4 (2022)** — changelog is 4 minor versions behind
- `.changes/unreleased/` is empty (only `.gitkeep`) — no change fragments for the new App Router feature (PR #1241) or any other unreleased work
- `next-swagger-doc.txt` is a **cspell dictionary**, not documentation, despite the name

## Config / Tooling Drift

- `size-limit` is a devDependency but has **no config file** and no script — dead dependency
- `tsconfig.json` includes a `types/` directory that **does not exist** (harmless, but stale)
- `c8` and `@vitest/coverage-v8` both present (overlapping coverage tooling)
- `.swm/testing-overview.b1r1n.sw.md` references **Playwright E2E tests that don't exist** in the repo — misleading onboarding doc
- `examples/next15-app/package.json` is named `"next13-app"` (copy-paste from the older example)

## CI Gaps

- **No CI workflow runs tests or lint** — only CodeQL and CodeSee workflows exist; regressions are caught only by pre-commit hooks (which require local install) and local `pnpm test`
- CodeQL runs on every push/PR but there's no coverage or typecheck gate

## Potential Runtime Issues

- `extractApiInfo()` scans **both** the source folder and `.next/server/<apiFolder>` and merges results into a single map — if a route exists in both (stale build output), methods could be double-counted or a stale compiled route could surface a method that no longer exists in source
- `swagger.ts` globs `**/*.{ts,tsx,jsx,js,json,swagger.yaml}` across the api folder — large folders or non-route files (helpers, types) get fed to swagger-jsdoc and could produce unexpected spec entries
- `withSwagger` returns `400` on failure but does **not log** the error — silent failures in production are hard to diagnose
- Base-path injection relies on the internal `process.env.__NEXT_ROUTER_BASEPATH` env var (Next.js internals) — could change between Next versions

## Security

- No obvious vulnerabilities in the small codebase; CodeQL is configured. `noGlobalEval` is enforced. No user input is evaluated. The main risk surface is the parser being fed arbitrary source (low risk — the lexer never executes the code).

## Performance

- Trivial for typical API sizes. `extractApiInfo` does a full recursive directory walk and reads every route file synchronously (`readFileSync`) — fine for dev/docs generation, but the sync I/O could add up on very large route trees
- `createSwaggerSpec` re-reads and re-parses everything on every call (no caching) — relevant if called per-request via `withSwagger` in production
