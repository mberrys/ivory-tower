# IVS-00 — Freeze reset authority and repository truth

**Session:** IVS-1 (unified V1 roadmap series — "Session 00").
**Issues:** IV1-1 (freeze reset authority and execution order), IV1-2 (capture a protected repository baseline).
**Branch:** `cc/freeze-reset-authority-repository-e4d51a`, cut from `origin/dev` at `1e45afd51`.
**Worktree:** `.claude/worktrees/new-session-1dda69` (isolated; the primary checkout carried unrelated uncommitted work).

This session is a grouping / architecture-control / evidence / handoff gate. It writes no product
code. It records — in the repository — which plan is now authoritative, the exact repository
baseline, the protected user work, the legacy-tracker posture, and the next issue.

## What this session established

| Fact | Value | Check |
|---|---|---|
| Canonical V1 plan | Unified roadmap, **revision 4**, 2026-08-29, posture **NO-GO** | `docs/v1-reset-manifest.md` §2; `release-evidence/cutline.json` → `authority.roadmap` |
| Authority chain | roadmap → execution contract → V1 Issues DB → V1 Sessions DB → Session 00 page → repo evidence | `docs/v1-reset-manifest.md` §2 |
| Active issue ledger | Ivory Tower V1 Issues (`adde6f38…`), `IV1-#`, 95 declared | `release-evidence/cutline.json` → `authority.ledgers.activeIssues` |
| Active session ledger | Ivory Tower V1 Sessions (`676cc270…`), `IVS-#`, 48 declared | `release-evidence/cutline.json` → `authority.ledgers.activeSessions` |
| Legacy tracker | `IV-8` root (`3af9cb07…`), 130 `IV-#` issues → **historical backlog metadata, read-only** | `release-evidence/cutline.json` → `authority.ledgers.historicalTracker` |
| Legacy repo snapshot | `docs/generated/v1-cutline.json` (schemaVersion 1) → retained, not regenerated, not authoritative | `docs/v1-reset-manifest.md` §6 |
| Repository baseline | branch `cc/freeze-reset-authority-repository-e4d51a`, HEAD `1e45afd51` (= `origin/dev`); upstream base Theia v1.74.0 at `172494ea2` | `release-evidence/session-00/repository-baseline.md` §1 |
| Worktrees | 4 — primary `dev` (dirty), this session (clean), `next-steps-74f966` + `pr-30` (detached, clean) | `release-evidence/session-00/repository-baseline.md` §2 |
| Protected user work | primary checkout: 5 modified tracked files (+93/−5) + 13 untracked; stash empty; **byte-identical before/after** | `release-evidence/session-00/repository-baseline.md` §3–4 |
| Baseline gate defect | `verify:ivory-tower` was RED at `1e45afd51` — 4 undefined scripts (`verify:ivory-cutline`, `generate:ivory-cutline`, `verify:ivory-phase-gates`, `test:ivory-cutline`), dropped by merge `ecda63ed1` | `release-evidence/session-00/repository-baseline.md` §7; `git-evidence.txt` |
| Gate repair | 4 definitions re-added verbatim from `7309a7f83`; chain extended with `verify:ivory-reset-authority` + `test:ivory-reset-authority` | `package.json`; `release-evidence/session-00/gate-run.txt` |
| Superseded in-repo docs | `CLAUDE.md`, `AGENTS.md`, `docs/v1-build-vs-open-source.md`, `docs/adr-001-application-platform.md`, `docs/adr-002-runtime-topology.md`, `docs/sessions/README.md` — pointer banner only, no content rewritten | `docs/v1-reset-manifest.md` §9 |
| Next issue | **IV1-3** in **Session 01 (IVS-2)** — "Reconcile the historical tracker into a read-only cutline" | `docs/v1-reset-manifest.md` §12 |

## Artifacts produced

- `docs/v1-reset-manifest.md` — human-readable reset authority manifest (IV1-1).
- `release-evidence/cutline.json` — machine-readable authority header, `artifact: "v1-reset-cutline"` (IV1-1).
- `scripts/ivory/reset-authority-model.mjs`, `verify-reset-authority.mjs`, `reset-authority.spec.mjs`,
  `scripts/ivory/fixtures/reset-authority/{empty,status-only}.json` — validator + 25 tests / success + failure fixtures (IV1-1).
- `release-evidence/session-00/repository-baseline.md` + `.json` — repository-state report + preservation checklist (IV1-2).
- `release-evidence/session-00/git-evidence.txt` — verbatim read-only command output (IV1-2).
- `release-evidence/session-00/gate-run.txt` — repaired-gate run result (IV1-2).
- `package.json` — re-added 4 cutline scripts + 2 reset-authority scripts + extended `verify:ivory-tower` (IV1-2 baseline repair).
- `.gitattributes` — LF rules for `release-evidence/**` and `scripts/ivory/fixtures/**`.
- Pointer banners on the 6 superseded in-repo planning docs.

## Verification (this session)

```bash
npm run verify:ivory-reset-authority   # PASS — cutline header + manifest cross-reference
npm run test:ivory-reset-authority     # 25/25 pass
npm run verify:ivory-cutline           # PASS — 130 legacy issues; generated block current
npm run test:ivory-cutline             # 7/7 pass
npm run verify:ivory-phase-gates       # exit 0 — reports; all evidence artifacts present
npm run check:ivory-toolchain          # OK (npm aligned to 11.13.0)
npm run check:ivory-install            # OK (npm ci in this worktree)
npm run check:ivory-boundaries         # OK
npm run format:check:ivory-tower       # OK
npm run dependency:policy              # tree clean; 7 fixtures rejected
npm run secret:scan                    # clean
```

Full `npm run verify:ivory-tower`: **links 1–9 PASS** (missing-scripts defect repaired); link 10
`typecheck:ivory-tower` fails on a pre-existing environmental condition — `lerna`/`nx` from a linked
worktree targets the primary checkout → sandbox `TS5033 EPERM`; `@ivory-tower/domain` compiles
cleanly with direct `tsc`. Full evidence + root cause: `release-evidence/session-00/gate-run.txt`.

## What this session did NOT do

- No product/package source changed; no dependency added or removed (`package.json` change is script aliases + one chain edit).
- No legacy Notion `IV-#` issue or Notion source document modified.
- No per-`IV-#` tracker disposition — that is Session 01 (IV1-3 / IV1-4).
- No `git push`; no destructive git command in any worktree.
