# Plan 005: Remove unused `isarray` dependency

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b87cecb..HEAD -- package.json pnpm-lock.yaml src examples/next13-simple/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `b87cecb`, 2026-08-26

## Why this matters

`isarray@2.0.5` is listed in the library `dependencies` and in
`examples/next13-simple`, but no `src/` file imports it. It adds install
surface and audit noise. Remove it from the published package.

`AGENTS.md` says example apps depend on published `next-swagger-doc` and
library work normally should not rewrite example lockfiles. This task changes
an example manifest, so its matching importer entry must be removed from
`examples/next13-simple/pnpm-lock.yaml` to keep frozen installs valid. Leave
transitive `isarray` entries intact.

## Current state

`package.json` dependencies include:

```json
    "isarray": "2.0.5",
```

(`package.json:45-51`, alongside `@types/swagger-jsdoc`, `cleye`,
`es-module-lexer`, `swagger-jsdoc`).

`examples/next13-simple/package.json:16` also has `"isarray": "2.0.5"`.

Confirm before deleting: `rg "from 'isarray'|from \"isarray\"|require\\('isarray" src` must be empty (it was empty at `b87cecb`).

Conventions: conventional commit `chore:`. Root package manager
`pnpm@10.34.5`. After removing a dependency, update the **root** lockfile
with pnpm.

## Commands you will need

| Purpose        | Command                                      | Expected on success |
|----------------|----------------------------------------------|---------------------|
| Remove dep     | `pnpm remove isarray` (from repo root)       | exit 0; gone from package.json + pnpm-lock.yaml |
| Tests          | `pnpm test`                                  | all pass            |
| Lint           | `pnpm lint`                                  | exit 0              |
| Build          | `pnpm build`                                 | exit 0              |

## Scope

**In scope**:
- `package.json` (root)
- `pnpm-lock.yaml` (root only)
- `examples/next13-simple/package.json` (the `"isarray"` line only)
- `examples/next13-simple/pnpm-lock.yaml` (root importer entry only)
- `plans/README.md` (status bookkeeping only)

**Out of scope**:
- Other example lockfiles
- Other unused devDependencies (`c8`, `size-limit`, `@skypack/package-check`)
- `cspell-tool.txt` / `next-swagger-doc.txt` (generated word lists; do not
  hand-edit unless `pnpm` scripts regenerate them — they should not)

## Git workflow

- Branch: `advisor/005-remove-isarray`
- Commit: `chore: remove unused isarray dependency`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Reconfirm it is unused

**Verify**: `rg "isarray" src test` → no import/require of the package
(hits inside comments or this plan do not count). If you find a real import
in `src/`, STOP — the finding is wrong.

### Step 2: Remove from the library

From the repo root (not an example directory):

```sh
pnpm remove isarray
```

That must update `package.json` and root `pnpm-lock.yaml` together. Do not
hand-edit the lockfile.

**Verify**: `rg '"isarray"' package.json` → no matches.
`rg "^  isarray@" pnpm-lock.yaml` — if importers still list it only as a
transitive dep of something else, that is fine; it must not appear under
the root `next-swagger-doc` dependencies importer. `rg "isarray" package.json`
is the hard check.

### Step 3: Keep the example manifest and lockfile consistent

Delete the `"isarray": "2.0.5"` line from
`examples/next13-simple/package.json`. Keep valid JSON (commas).

Remove the matching `isarray` entry from the lockfile's root importer. Keep
the package and snapshot entries because other dependencies still use
`isarray` transitively. Do not regenerate unrelated lockfile content.

**Verify**: `rg isarray examples/next13-simple/package.json` → no matches.
Run `corepack pnpm@10.8.0 install --frozen-lockfile --ignore-scripts` inside
`examples/next13-simple`; it must accept the lockfile.

### Step 4: Library still builds and tests

**Verify**: `pnpm test` → all pass. `pnpm lint` → exit 0. `pnpm build` →
exit 0.

## Test plan

- No new tests. Removal is verified by grep + existing suite + build
  (pkgroll would fail if a runtime import existed).

## Done criteria

- [ ] `isarray` is absent from root `package.json` dependencies
- [ ] `isarray` is absent from `examples/next13-simple/package.json`
- [ ] The example lockfile root importer no longer declares `isarray`
- [ ] The example's frozen install accepts its lockfile
- [ ] `pnpm test` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 005 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any `src/` file imports `isarray`.
- `pnpm remove isarray` wants to upgrade unrelated dependencies — STOP and
  report the extra lockfile diff; do not take drive-by upgrades.
- Removing it breaks `pnpm build` or tests (then it was not unused).
- Updating the example importer requires unrelated lockfile churn — STOP and
  report rather than accepting those unrelated updates.

## Maintenance notes

- Other idle devDependencies (`c8`, `size-limit`, `@skypack/package-check`)
  are intentionally not in this plan.
- Reviewer: lockfile diff should be isarray-only at the root.
