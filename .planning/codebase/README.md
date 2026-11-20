# Codebase map baseline

The seven analysis documents in this folder describe the 2026-08-26 baseline
at commit `b87cecb`, not the current release. Their line numbers, dependency
versions, known bugs, and test counts are historical observations. Use
`AGENTS.md`, `package.json`, and the source for current behavior.

The implementation stack #1277–#1283 addresses the scan gate, CLI output and
errors, HTTP error responses, specFile validation, public JSON scanning,
Node.js engine declaration, and unused isarray dependency described here.
See `plans/README.md` for implementation tracking and `CHANGELOG.md` for
released changes.

Important corrections to the baseline:

- swagger-jsdoc does not merge ordinary JSON objects from public assets.
  YAML sidecars contain fragments; `specFile` loads a complete JSON spec.
- The scan gate belongs in `src/spec-source.ts` and is shared by the glob
  scanner and App Router extraction, not duplicated in the orchestrator.
- CLI output uses the library's output path policy, including directory
  creation. Prebuilt specs can also be copied to `outputFile`.
- Node.js 20 is the library runtime floor. New contributor tooling requires
  Node.js 22.22 or a supported newer LTS line; consult `AGENTS.md` for setup.
- The root package uses the pnpm version in `packageManager`, not the
  historical package-manager versions quoted in these analyses. TypeDoc
  uses a TypeScript 6 compiler API override while the project uses TS7.
