# Plan 004: Advertise Node.js `>=20` to match `swagger-jsdoc@6.3.0`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat b87cecb..HEAD -- package.json pnpm-lock.yaml README.md AGENTS.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `b87cecb`, 2026-08-26

## Why this matters

This package advertises `engines.node: >=18` (`package.json`, README badge
and prerequisites). Direct dependency `swagger-jsdoc@6.3.0` records
`engines: {node: '>=20.0.0'}` in `pnpm-lock.yaml` (the `swagger-jsdoc@6.3.0:`
resolution block). Node 18 installs can warn or fail engines checks. Next.js
16 examples already need Node `>=20.9` (`AGENTS.md`). Align the library
engine with what it actually runs.

Do **not** bump `peerDependencies.next` (`>=9`) in this plan — that is a
separate compatibility story and untested.

## Current state

`package.json:75-77`:

```json
  "engines": {
    "node": ">=18"
  },
```

`pnpm-lock.yaml:1944-1946`:

```yaml
  swagger-jsdoc@6.3.0:
    resolution: {integrity: sha512-I+iQjVGV3t28pOkQUJv2MncthvOtkEactOn8R76SvSYhxgtIn7FoqfDHwQaN+GBnQdXQLrhgDXseKitmJcHMsA==}
    engines: {node: '>=20.0.0'}
```

`README.md:11` badge: `node-%3E%3D18`
`README.md:26-27`:

```markdown
- Nextjs >= 9
- Node >= 18
```

`AGENTS.md:9`:

```markdown
- Runtime: Node.js >= 18 (Next.js 16 example apps need Node.js >= 20.9)
```

Conventions: document options/runtime in `README.md` and `AGENTS.md`
(`AGENTS.md` Style/API notes). Conventional commit `chore:` or `docs:`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Tests   | `pnpm test` | all pass |
| Lint    | `pnpm lint` | exit 0 |

No code changes in `src/`. Do not run `pnpm install` just to rewrite the
lockfile unless `package.json` engines somehow invalidate it (it should not).

## Scope

**In scope**:
- `package.json` (`engines` only)
- `README.md` (badge + Prerequisites)
- `AGENTS.md` (Runtime bullet only)
- `.agents/setup` (runtime guard and error messages only)
- `plans/README.md` (status bookkeeping only)

**Out of scope**:
- `peerDependencies.next`
- Example `package.json` / lockfiles
- CI workflow files (`.github/workflows` is CodeQL/CodeSee only; do not
  add a Node matrix in this plan)
- Running a release, choosing the next version, or editing published entries
  in `CHANGELOG.md`

## Git workflow

- Branch: `advisor/004-align-node-engines`
- Commit: `chore: require Node.js >=20 to match swagger-jsdoc`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: `package.json` engines

Set:

```json
  "engines": {
    "node": ">=20"
  },
```

Use `>=20` (swagger-jsdoc's floor), not `>=20.9`. Next 16's 20.9 requirement
stays documented only for example apps.

**Verify**: `node -e "console.log(require('./package.json').engines.node)"`
→ prints `>=20`.

### Step 2: README

- Badge `node-%3E%3D18` → `node-%3E%3D20`
- Prerequisites `Node >= 18` → `Node >= 20`

Do not change `Nextjs >= 9`.

**Verify**: `rg ">=18" README.md` → no Node engine matches (other "18" hits
such as React versions in examples are in other files). `rg "Node >= 20" README.md`
matches.

### Step 3: AGENTS.md

Replace the Runtime bullet with:

```markdown
- Runtime: Node.js >= 20 (Next.js 16 example apps need Node.js >= 20.9)
```

**Verify**: `rg "Node.js >= 18" AGENTS.md` → no matches.

### Step 4: Orb setup guard

Update `.agents/setup` so both the numeric guard and its error messages
require Node.js 20. Verify the script with `bash -n .agents/setup`.

### Step 5: Record compatibility impact

Changing the advertised Node floor is a compatibility change even though the
existing direct dependency already requires Node 20. Mark that explicitly in
the PR body and ensure the next release's Changie entry records Node 18
support as removed. Do not select or publish a release version in this plan.

### Step 6: Tests still run

**Verify**: `pnpm test` → all pass. `pnpm lint` → exit 0.

## Test plan

- No new tests (manifest/docs only).
- Verification: `pnpm test` still passes so the engines field did not break
  the workspace.

## Done criteria

- [ ] `package.json` `engines.node` is `>=20`
- [ ] README badge and Prerequisites say Node >= 20
- [ ] `AGENTS.md` Runtime line says Node.js >= 20
- [ ] `.agents/setup` rejects Node.js below 20 and passes `bash -n`
- [ ] PR/release notes identify removal of advertised Node 18 support
- [ ] `rg "engines" package.json` does not contain `>=18`
- [ ] `pnpm test` exits 0
- [ ] `pnpm lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 004 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `swagger-jsdoc` in `package.json` is no longer `6.3.0` (re-check lockfile
  engines before changing ours).
- CI or a contributor doc elsewhere (not in scope) is the only remaining
  `>=18` claim and you feel you must edit it — STOP and list the paths
  rather than expanding scope.
- You believe this needs a semver-major release process (tags, GitHub
  release). Record that; do not run `pnpm release:version`.

## Maintenance notes

- Next 9–12 remain in `peerDependencies` but are untested (devDependency is
  Next `16.3.3`). Do not "fix" that here.
- Reviewer: engines string only; no lockfile churn; examples untouched.
