# Session IVS-00 Handoff

## Objective completed

Froze the V1 reset authority and captured a protected repository baseline (Session 00 / IVS-1,
issues IV1-1 and IV1-2, Gate 0). The repository now names exactly one authoritative V1 plan and
one authority chain; the exact reset baseline and every piece of in-flight user work is recorded
and provably untouched. No product code was written (Session 00 closes on evidence, per its
contract).

The five exit-gate questions, answered from the repository alone:

| Question | Answer | Where |
|---|---|---|
| Canonical roadmap | Unified V1 roadmap, revision 4 (2026-08-29), NO-GO — `https://app.notion.com/p/3cb9cb079ddb811eb7c1e43a4ca80439` | `docs/v1-reset-manifest.md` §2, Appendix A |
| Exact repository baseline | branch `cc/freeze-reset-authority-repository-e4d51a`; session start HEAD `1e45afd5182a58f12205472e4f05f02c5086d44d` (= `origin/dev`); upstream base Theia v1.74.0 at `172494ea2`; 4 worktrees | `release-evidence/session-00/repository-baseline.md` §1–2 |
| Protected user work | primary checkout (`dev`): 5 modified tracked files, 13 untracked, stash empty — byte-identical before and after; no `reset`/`checkout --`/`restore`/`stash`/`clean` run | `release-evidence/session-00/repository-baseline.md` §3–4 |
| Legacy-tracker posture | `IV-8` tracker (`3af9cb07…`, 130 `IV-#`) = historical backlog metadata, **read-only**; reconciliation owned by Session 01 (IV1-3 / IV1-4); `docs/generated/v1-cutline.json` retained, not regenerated | `docs/v1-reset-manifest.md` §6; `release-evidence/cutline.json` → `authority.ledgers` |
| Next issue | **IV1-3**, in Session 01 (IVS-2) | `docs/v1-reset-manifest.md` §12 |

## Canonical commit / branch

Branch `cc/freeze-reset-authority-repository-e4d51a`, atop `origin/dev` @ `1e45afd51`. Unpushed.

| # | SHA | Subject |
|---|---|---|
| 1 | `63bb20a56` | `docs(v1-reset): freeze reset authority manifest and cutline header (IV1-1)` |
| 2 | `28343fe36` | `test(v1-reset): add reset-authority validator and success/failure fixtures (IV1-1)` |
| 3 | `be961cfe2` | `build(ivory-tower): restore dropped cutline gate scripts and wire the reset-authority gate (IV1-2)` |
| 4 | `41d0335e8` | `docs(v1-reset): capture protected repository baseline (IV1-2)` |
| 5 | `c8bb3597a` | `docs(sessions): record Session 00 and start the v1-roadmap session series` |
| 6 | `3a4ad1ab8` | `docs(v1-reset): add supersession banners to superseded planning docs` |
| 7 | _<this commit>_ | `docs(v1-reset): finalize Session 00 gate evidence and preservation checklist` |

Commit 1 (`63bb20a56…`) is `release-evidence/cutline.json` → `authority.repositoryBaseline.frozenCommit`.

## Files changed

**New**

- `docs/v1-reset-manifest.md`
- `release-evidence/cutline.json`
- `release-evidence/session-00/repository-baseline.md`, `repository-baseline.json`, `git-evidence.txt`, `gate-run.txt`
- `scripts/ivory/reset-authority-model.mjs`, `verify-reset-authority.mjs`, `reset-authority.spec.mjs`
- `scripts/ivory/fixtures/reset-authority/empty.json`, `status-only.json`
- `docs/sessions/v1-roadmap/ivs-00-freeze-reset-authority.md`, `ivs-00-handoff.md`

**Modified**

- `package.json` — re-added `verify:ivory-cutline`, `generate:ivory-cutline`, `verify:ivory-phase-gates`,
  `test:ivory-cutline`; added `verify:ivory-reset-authority`, `test:ivory-reset-authority`; extended `verify:ivory-tower`.
- `.gitattributes` — LF rules for `release-evidence/**` and `scripts/ivory/fixtures/**`.
- `CLAUDE.md`, `AGENTS.md`, `docs/v1-build-vs-open-source.md`, `docs/adr-001-application-platform.md`,
  `docs/adr-002-runtime-topology.md`, `docs/sessions/README.md` — **pointer banner only**, no content rewritten.

No upstream Theia package modified. `docs/generated/v1-cutline.json` left byte-for-byte untouched.

## Tests and commands run

Read-only baseline capture: verbatim in `release-evidence/session-00/git-evidence.txt`.

Verification (Node 24.16.0; npm aligned to the pinned 11.13.0 for this run):

- `node scripts/ivory/verify-reset-authority.mjs` — PASS (header + manifest cross-reference)
- `node --test scripts/ivory/reset-authority.spec.mjs` — 25/25 pass
- `node scripts/ivory/verify-v1-cutline.mjs` — PASS (130 legacy issues; generated block current)
- `node --test scripts/ivory/v1-cutline.spec.mjs` — 7/7 pass
- `node scripts/ivory/evaluate-phase-gates.mjs` — exit 0
- `npm run check:ivory-boundaries` — OK
- `npm run dependency:policy` — tree clean; 7 fixtures rejected
- `npm run secret:scan` — clean
- `npm run check:ivory-toolchain` — OK (after `npm i -g npm@11.13.0`)
- `npm run check:ivory-install` — OK (after `npm ci` in this worktree)
- `npm run check:ivory-boundaries` — OK; `npm run format:check:ivory-tower` — OK
- Full `npm run verify:ivory-tower` at `3a4ad1ab8` — **links 1–9 PASS** (the missing-scripts defect is
  repaired); **link 10 `typecheck:ivory-tower` fails on a pre-existing environmental condition**
  (`lerna`/`nx` from a linked worktree targets the primary checkout → sandbox `TS5033 EPERM`; the
  package compiles cleanly with direct `tsc`); links 15–18 PASS on the clean tree. Full evidence and
  root-cause in `release-evidence/session-00/gate-run.txt`.

## Evidence produced

`release-evidence/cutline.json` (frozen authority header), `docs/v1-reset-manifest.md` (manifest),
`release-evidence/session-00/*` (baseline report + preservation checklist + verbatim command
output + gate run). All reproducible from a checkout of this branch per
`release-evidence/session-00/repository-baseline.md` §9.

## Acceptance criteria passed

**IV1-1**

- Human-readable manifest + machine-readable authority/cutline header with canonical Notion URLs and decision date — `docs/v1-reset-manifest.md`, `release-evidence/cutline.json`.
- One unambiguous authority chain; references are canonical-form; no legacy Notion issue or source document modified.
- Success + failure fixtures pass and cannot be satisfied by a no-op, stale artifact, or status-only update (`empty.json`, `status-only.json`, + 23 guard tests; manifest cross-reference).
- No canonical research state duplicated into Studio/CLI/MCP/runtime/index/workspace authority.
- Exact SHA, commands, outputs, artifact paths, and evidence classification recorded.

**IV1-2**

- Exact repository-state snapshot with preservation notes + isolated-worktree recommendation — `release-evidence/session-00/repository-baseline.md`.
- Reproducible with named commands; distinguishes source / static / local-runtime / hosted-CI / release evidence.
- Proves no user work was cleaned, reset, stashed, or overwritten — preservation checklist §4, blob hashes before/after.

## Acceptance criteria still open

- **`verify:ivory-tower` links 10–14** (`typecheck:ivory-tower`, `lint:ivory-tower`, lerna `test`,
  `build:ivory-tower`, `test:ivory-browser`) were **not proven** — they are `lerna`/`nx`-based and
  cannot run from a linked git worktree (see next section). They exercise **no Session 00 change**.
  Prove them from the **primary checkout** on a clean branch, or via a **PR to `dev`** so
  `.github/workflows/ivory-tower.yml` runs the win + ubuntu matrix. Not done this session (no push
  authorized).
- **Notion write-back** — not applied (Notion MCP unauthenticated in this session). See "Decisions".

## Known regressions / risks

- **`verify:ivory-tower` was RED at the baseline (missing scripts) and is repaired.** The gate now
  gets through link 9. If a `lerna`-based link is red once run from the primary checkout / CI for a
  reason **other** than the missing scripts, that belongs to a Session 00 repair (`IVS-00A`), not to
  Session 01.
- **`lerna`/`nx` gates do not run from a linked worktree** (discovered this session, pre-existing):
  `lerna` resolves package locations to the **primary checkout**, so `typecheck`/`lint`/`test`/`build`
  and the full `verify:ivory-tower` operate on the wrong tree (and are sandbox-denied). Recorded as
  `knownBaselineDefects[lerna-nx-worktree-resolution]`; `release-evidence/session-00/repository-baseline.md`
  §8 carries the guidance. This affects **every** future worktree session.
- **Developer-environment actions** (not repository changes): `npm i -g npm@11.13.0` (left at the repo
  pin `11.13.0`; was `11.17.0` — restore with `npm i -g npm@11.17.0` if you want your prior version),
  and `npm ci` in this worktree (it started with an empty `node_modules`).
- `release-evidence/cutline.json` `authority` is frozen; Session 01 must extend it with a **sibling**
  `reconciliation` key, never by editing `authority`.
- Commits used `PRE_COMMIT_ALLOW_NO_CONFIG=1` — the shared `.git/hooks/` carries `pre-commit`
  framework shims (from your main-worktree setup) but `.pre-commit-config.yaml` is not present or
  committed in this worktree, so `pre-commit` had nothing to run. No hook was bypassed.

## Decisions made

- New unified-roadmap session records live under `docs/sessions/v1-roadmap/` as `ivs-NN-*.md`, to avoid
  colliding with the old flat `session-01..04-*.md` (which target the `IV-#` tracker under the `0→3` ladder).
- `release-evidence/cutline.json` uses `artifact: "v1-reset-cutline"` + `artifactVersion: 1`, **not**
  `schemaVersion` — the legacy `docs/generated/v1-cutline.json` validator hard-asserts `schemaVersion === 1`.
- Superseded in-repo planning docs get a **pointer banner only**; no content is rewritten. Reconciling their
  substance is Sessions 01–02.
- The broken `verify:ivory-tower` was repaired in this session (user decision) rather than only recorded.
- Notion write-back (Implementation Evidence on IV1-1 / IV1-2; set Session 01 Ready) is **applied by
  Claude with the user's approval** — deferred to an interactive session with the Notion connector
  authorized. Content is prepared in this handoff. The historical `IV-8` tracker is never touched.

## Do not assume

- Do **not** treat Session 00 as a Gate 0 pass. Gate 0 needs Sessions 00–06 (IVS-1 … IVS-7) reviewed together.
- Do **not** regenerate `docs/generated/v1-cutline.json` — it is a retained historical snapshot.
- Do **not** modify the historical `IV-8` tracker or any `IV-#` issue outside the Session 01 reconciliation.
- Do **not** read `verify:ivory-phase-gates` FAIL statuses as regressions — that script reports phase
  completion against the *legacy* tracker and exits 0 unless an evidence artifact is missing.
- Do **not** start Session 01 work in this session.

## Exact prerequisite for next session

Session 00's exit gate proven from this branch: `docs/v1-reset-manifest.md` + `release-evidence/cutline.json`
+ `release-evidence/session-00/repository-baseline.md` committed, `npm run verify:ivory-reset-authority` and
`npm run test:ivory-reset-authority` green. Session 01 may branch from `origin/dev` (or continue on this branch).

## Recommended next session

**Session 01 (IVS-2) — Reconcile the historical tracker into a read-only cutline.** First issue **IV1-3**
("Generate the legacy Issue Tracker to V1 roadmap mapping": `release-evidence/cutline.json` gains a
`reconciliation` block, plus `legacy-tracker-export.json` and a mapping report), then **IV1-4** ("Freeze
tracker disposition and carry-forward rules": `docs/v1-tracker-reconciliation.md`). Only evidence-backed
carry-forward work enters the V1 queue.
