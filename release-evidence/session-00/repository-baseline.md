# Session 00 (IVS-1) — Protected repository baseline

**Issue:** IV1-2 — Capture a protected repository baseline without discarding work.
**Session start:** 2026-08-29 (UTC capture in `git-evidence.txt`).
**Working worktree:** `C:/.dev/repos/ivory-tower/.claude/worktrees/new-session-1dda69`.

Every fact below is reproducible with the command shown; nothing here is asserted from a plan or a
Notion page. The verbatim command output is in
[`git-evidence.txt`](git-evidence.txt) (session start) and
[`gate-run.txt`](gate-run.txt) (repaired-gate run).

---

## 1. Anchor

| Fact | Value | Command |
|---|---|---|
| Branch | `cc/freeze-reset-authority-repository-e4d51a` | `git rev-parse --abbrev-ref HEAD` |
| HEAD at session start | `1e45afd5182a58f12205472e4f05f02c5086d44d` | `git rev-parse HEAD` |
| Relationship to `origin/dev` | 0 ahead / 0 behind (identical) | `git status -b --porcelain=v2` |
| Upstream tracking branch | none (unpushed) | `git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'` → fatal |
| `origin` | `https://github.com/mberrys/ivory-tower.git` | `git remote -v` |
| Upstream base | Eclipse Theia **v1.74.0** at `172494ea2564ca07690e230805861146007fae79` (= `origin/master`, `origin/original-cb`; merge-base with HEAD; `packages/core` version `1.74.0`) | `git merge-base HEAD origin/master` |
| Fork delta over base | 104 commits | `git rev-list --count 172494ea2..HEAD` |
| HEAD commit | `feat(ivory-tower): verify reproducible local runtime` (2026-08-20) | `git log -1` |

No upstream version tags are imported into the fork, so `git merge-base --is-ancestor v1.74.0 HEAD`
returns `fatal: Not a valid object name v1.74.0`; use the commit sha `172494ea2` instead.

## 2. Worktrees

`git worktree list --porcelain`

| Path | Branch / state | HEAD | Working tree |
|---|---|---|---|
| `C:/.dev/repos/ivory-tower` | `dev` (primary) | `1e45afd51` | **dirty** — see §3 |
| `C:/.dev/repos/ivory-tower/.claude/worktrees/new-session-1dda69` | `cc/freeze-reset-authority-repository-e4d51a` (this session) | `1e45afd51` | clean at session start |
| `C:/.dev/repos/ivory-tower/.claude/worktrees/next-steps-74f966` | detached | `f312f02a0` | clean |
| `C:/.dev/repos/ivory-tower/.claude/worktrees/pr-30` | detached | `fe9b619cd` | clean |

The branch `cc/new-session-1dda69` (`1a77a15a5`, `[origin/cc/new-session-1dda69: gone]`) exists in
the shared ref store but is **not** checked out by any worktree; this session's worktree is on
`cc/freeze-reset-authority-repository-e4d51a`.

## 3. Working-tree state of the primary worktree (`C:/.dev/repos/ivory-tower`)

Pre-existing user work, present at session start. `git diff --stat` = **5 files changed,
+93 / −5**. `git stash list` is **empty** in every worktree.

**Modified tracked files** (`git -C C:/.dev/repos/ivory-tower status --porcelain`)

| Path | Committed blob | Working blob (session start) |
|---|---|---|
| `.gitignore` | `6ceadccf31dc863c001acb31cb36eef716668041` | `583f7805cba977897d6c19b670365a30c028906f` |
| `packages/ivory-tower-infrastructure/src/in-memory-execution-store.ts` | `73146a…` (index) | `856d4381923b0bd2b2739cdd300bccc156581de5` |
| `packages/ivory-tower-infrastructure/src/in-memory-execution-store.spec.ts` | `73146a…`* | `18008fde46c4b097c18ccd0f10f981bce8238086` |
| `packages/ivory-tower-infrastructure/src/postgres-execution-store.ts` | `5ae5a9…`* | `f2fcc0aa6bf957875c50a2bafdbcc24aa43f5912` |
| `packages/ivory-tower-worker/src/package.spec.ts` | `cd910b…`* | `2230ac0c31c97984f163d44ae61620d642d0b9ed` |

\* index/committed blobs as reported by `git status --porcelain=v2` in `git-evidence.txt`.

The `.gitignore` edit un-ignores `.claude/settings.json` and `.claude/policy-brief.md` (a
`.claude/*` + negation rule), i.e. the user intends to commit those two files.

**Untracked files** (`git -C C:/.dev/repos/ivory-tower ls-files --others --exclude-standard`)

| Path | Blob (session start) |
|---|---|
| `.claude/policy-brief.md` | `6035780def29fc574869d30a0b7a3054fe69b220` |
| `.claude/settings.json` | `7beeebbeafa504ea0ce55a79eff1493d4dc39c32` |
| `.codex/environments/environment.toml` | `7e2a69e183fc29a871bb158059453d58788808c7` |
| `.pre-commit-config.yaml` | `fdd04e2edb6d06fc7165f4e114bd19b2157e89f5` |
| `scripts/hooks/cc-guard-bash.sh` | `0fe3837a84050133c370fe4717c12edb58f391ec` |
| `scripts/hooks/cc-guard-write.sh` | `71ee1ee17f25ce07d82c20e319f664d5403f0a8a` |
| `scripts/hooks/cc-stop-self-review.sh` | `ac4c034f9bc22f445cbdf0ccc45ceffddece3343` |
| `scripts/hooks/cmake-discipline.sh` | `50f0b11099e53204746ef0cd3b3c6fa8ab639374` |
| `scripts/hooks/commit-msg-conventional.sh` | `b5ef04fecf4bec6d09126ee301747aa6ceef6475` |
| `scripts/hooks/forbid-secret-files.sh` | `98001b5e1b0efb581165d0692fb19f5e7237b122` |
| `scripts/hooks/pre-push.sh` | `9df9d1575b170de569ead45b1617dad7621f06db` |
| `scripts/hooks/prod-data-guard.sh` | `4acd25d7d1338078c5d75a36e9adae468f69d4df` |
| `scripts/hooks/run-bash.py` | `8134ee5f10b8179a1d588e5d1489fa5f1a207c5b` |

The full patch of the modified tracked files is in `git-evidence.txt`.

## 4. Preservation checklist

**Assertion 1 — Session 00 ran no destructive git command in any worktree.** No `reset`,
`checkout --`, `restore`, `switch`, `stash`, `clean`, `branch -D`, `gc --prune`, `rm`, or
`update-ref -d`. Session 00 used only read-only inspection commands plus `git add` / `git commit`
on `cc/freeze-reset-authority-repository-e4d51a` inside its own worktree.
_Proof:_ `git -C C:/.dev/repos/ivory-tower stash list` empty at start and end; `git reflog`
unchanged for `dev` between start and end (see `git-evidence.txt` and `git-evidence-end.txt`).

**Assertion 2 — Session 00 wrote only inside the `new-session-1dda69` worktree.** The primary
worktree was never checked out, reset, or cleaned; its uncommitted work is structurally isolated
on a separate branch.

**Assertion 3 — every pre-existing item in the primary worktree is byte-identical before and
after.** `git hash-object` for each file in §3, captured at session start and after the final
Session 00 commit.

| Item | Kind | Blob at start | Blob at end | Identical |
|---|---|---|---|---|
| `.gitignore` | tracked, modified | `583f7805…` | _<filled at session end>_ | — |
| `packages/ivory-tower-infrastructure/src/in-memory-execution-store.ts` | tracked, modified | `856d4381…` | _<filled>_ | — |
| `packages/ivory-tower-infrastructure/src/in-memory-execution-store.spec.ts` | tracked, modified | `18008fde…` | _<filled>_ | — |
| `packages/ivory-tower-infrastructure/src/postgres-execution-store.ts` | tracked, modified | `f2fcc0aa…` | _<filled>_ | — |
| `packages/ivory-tower-worker/src/package.spec.ts` | tracked, modified | `2230ac0c…` | _<filled>_ | — |
| `.claude/policy-brief.md` | untracked | `6035780d…` | _<filled>_ | — |
| `.claude/settings.json` | untracked | `7beeebbe…` | _<filled>_ | — |
| `.codex/environments/environment.toml` | untracked | `7e2a69e1…` | _<filled>_ | — |
| `.pre-commit-config.yaml` | untracked | `fdd04e2e…` | _<filled>_ | — |
| `scripts/hooks/*` (9 files) | untracked | see §3 | _<filled>_ | — |
| stash stack (all worktrees) | — | empty | _<filled>_ | — |
| `next-steps-74f966`, `pr-30` worktrees | — | clean | _<filled>_ | — |

## 5. Evidence-class taxonomy

Every Ivory gate, classified so a later session never substitutes one class of proof for another.

| Class | Meaning | Gates |
|---|---|---|
| **source** | Tracked tree at the sha | The Theia v1.74.0 fork + `packages/ivory-tower-*`, `packages/ivory-identity` (`@theia/ivory-identity`), `examples/ivory-tower-browser`, `infra/docker-compose.yml`, `configs/ivory-*.json`, `scripts/ivory/`, `scripts/check-ivory-*` |
| **static** (no services) | Runs offline, no DB/Docker | `check:ivory-toolchain`, `check:ivory-install`, `check:ivory-boundaries`, `format:check:ivory-tower`, `typecheck:ivory-tower`, `lint:ivory-tower`, `dependency:policy`, `secret:scan`, `verify:ivory-cutline`, `verify:ivory-phase-gates`, `test:ivory-cutline`, `verify:ivory-reset-authority`, `test:ivory-reset-authority`, `test:ivory-tower` package tests |
| **local-runtime** (Docker/Compose) | Needs PostgreSQL + MinIO + Docling | `verify:ivory-session-04`, `verify:ivory-runtime`, `test:ivory-runtime`, `migrate:ivory`, `/health/live` + `/health/ready` probes |
| **hosted-CI** | GitHub Actions | `ivory-tower.yml` (`verify` matrix win+ubuntu, `governance`, `runtime`); `generate-sbom.yml`, `license-check.yml`, `native-dependencies.yml`, `performance-tests.yml`, `playwright.yml`, `production-smoke-test.yml`, `ci-cd.yml` |
| **release-evidence** | Committed artifacts under `release-evidence/` | This report; `release-evidence/cutline.json`; SBOM / notices (`sbom:generate`, `notices:generate`) — CI-only, `artifacts/` is gitignored |

## 6. Dependency inventory

| Contract | Location |
|---|---|
| Dependency policy, licence classes, image pinning, exception register | `configs/ivory-dependency-policy.json` + `scripts/check-ivory-dependency-policy.mjs` (`npm run dependency:policy`) |
| Reproducible install contract | `package-lock.json` (the contract of record — SBOMs describe the lockfile, not a resolved tree) |
| Pinned toolchain | `.nvmrc` = `24.16.0`; `configs/ivory-toolchain.json` = Node `24.16.0` / npm `11.13.0`; root `engines.node` `>=22` is upstream-only |
| Documented governance | `docs/iv-19-dependency-governance.md` |

**Toolchain drift observed at session start:** local Node `24.16.0` (OK) but local npm
**`11.17.0` ≠ pinned `11.13.0`**, so `check:ivory-toolchain` — the first link of
`verify:ivory-tower` — fails locally until npm is aligned (`npm i -g npm@11.13.0`). This is a
developer-environment condition, not a repository change.

## 7. Gate inventory and the `verify:ivory-tower` repair

**Ivory `npm` scripts at session start** (`node -p "…scripts…"`, full list in `git-evidence.txt`):
`verify:ivory-tower` (aggregate), `check:ivory-toolchain`, `check:ivory-install`,
`check:ivory-boundaries`, `format:check:ivory-tower` / `format:write:ivory-tower`,
`typecheck:ivory-tower`, `lint:ivory-tower`, `test:ivory-tower`, `test:ivory-runtime`,
`test:ivory-browser`, `dependency:policy`, `secret:scan`, `sbom:generate`, `notices:generate` /
`notices:check`, `verify:ivory-runtime`, `verify:ivory-session-04`, `migrate:ivory`,
`build:ivory-tower`, `start:ivory-*`.

**Pre-existing defect — `verify:ivory-tower` was RED at `1e45afd51`.** The chain referenced four
scripts with no definition:

```
$ node -e "…['verify:ivory-cutline','generate:ivory-cutline','verify:ivory-phase-gates','test:ivory-cutline']…"
verify:ivory-cutline     => (MISSING)
generate:ivory-cutline   => (MISSING)
verify:ivory-phase-gates => (MISSING)
test:ivory-cutline       => (MISSING)
```

`git log -S` shows they were added by `7309a7f83` ("Implement IV-128 V1 cutline verification",
an ancestor of HEAD) and dropped by merge `ecda63ed1` ("Merge remote-tracking branch 'origin/dev'
into dev") while the `verify:ivory-tower` reference to them survived. The on-disk targets
(`scripts/ivory/verify-v1-cutline.mjs`, `evaluate-phase-gates.mjs`, `v1-cutline.spec.mjs`) were
never removed. `npm run verify:ivory-cutline` at session start:
`npm error Missing script: "verify:ivory-cutline"`.

**Repair applied by Session 00** (`build(ivory-tower): restore dropped cutline gate scripts`):
the four definitions re-added verbatim from `7309a7f83`, and the chain extended with
`verify:ivory-reset-authority` and `test:ivory-reset-authority` (the IV1-1 fixtures).

**Repaired-gate run result:** _<filled at session end from `gate-run.txt`>_.

## 8. Isolated-worktree recommendation for invasive sessions

Session 00 ran in a dedicated worktree (`new-session-1dda69`) on its own branch, cut from
`origin/dev`, precisely because the primary checkout carried unrelated uncommitted work (§3).
**Every later session that changes live branch topology or broad architecture** — schema and
migration work, dependency/lockfile changes, upstream Theia merges, repository-wide codemods,
package moves — should do the same:

```bash
git -C C:/.dev/repos/ivory-tower worktree add .claude/worktrees/<slug> -b cc/<slug> origin/dev
```

Never do invasive work in the primary worktree while it holds ambient uncommitted changes. The
four worktrees already present are the working precedent. Delete a worktree with
`git worktree remove` once its branch is merged or abandoned.

## 9. Reproduction

From a checkout of this branch, run the block in `git-evidence.txt`'s header order (all read-only)
plus:

```bash
node scripts/ivory/verify-reset-authority.mjs
node --test scripts/ivory/reset-authority.spec.mjs
node scripts/ivory/verify-v1-cutline.mjs
node --test scripts/ivory/v1-cutline.spec.mjs
node scripts/ivory/evaluate-phase-gates.mjs
git -C C:/.dev/repos/ivory-tower status --porcelain --untracked-files=all
git -C C:/.dev/repos/ivory-tower stash list
```

The primary-worktree status and `git hash-object` values must match §3 (allowing for the user's
own later edits — Session 00 changed none of them).
