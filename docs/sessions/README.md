# Session execution record

This directory is the in-repo record of the **AI coding-agent sessions** that build Ivory Tower's
V1. Each session is one bounded execution objective drawn from the V1 roadmap; this tree records
what each session actually did, so the repository — not a planning tool — remains the authoritative
account of progress.

> ⚠️ **V1 planning authority moved (2026-08-29).** The canonical plan is now the unified Notion
> roadmap, **revision 4**, frozen in [`../v1-reset-manifest.md`](../v1-reset-manifest.md). The
> operating rules and evidence discipline below still apply; the "Governing sources" and the
> `0 → 3` gate ladder describe the superseded plan.

## Two session series

| Series | Location | Tracker | Status |
|---|---|---|---|
| Original Gate 0 sessions | `session-01-*.md` … `session-04-*.md` (flat) | historical `IV-#` tracker (`3af9cb07…`), `0 → 1 → 2 → 3` gate ladder | Superseded **as a plan**; retained as implementation evidence. |
| Unified V1 roadmap sessions | `v1-roadmap/ivs-NN-*.md` | Ivory Tower V1 Sessions DB (`676cc270…`, `IVS-#`) + V1 Issues DB (`adde6f38…`, `IV1-#`); authority `../v1-reset-manifest.md` | Active. Start at `v1-roadmap/ivs-00-*`. |

"Session 01" in the old flat files and "Session 01" in the new `v1-roadmap/` series are **different
sessions** against different trackers. Cite the new ones as `IVS-NN` / `IV1-#` to avoid the collision.

## Governing sources (unified V1 roadmap series)

- **Roadmap + authority chain:** [`../v1-reset-manifest.md`](../v1-reset-manifest.md) §2 and
  [`../../release-evidence/cutline.json`](../../release-evidence/cutline.json).
- **Session sequencing:** the "Ivory Tower V1 Sessions" Notion database (`IVS-#`), lowest-numbered
  Ready session first.
- **Issue detail (requirements/acceptance):** the "Ivory Tower V1 Issues" Notion database
  (`IV1-#`). This repo references work by issue ID; it does not duplicate acceptance criteria.

The Notion databases sequence and specify work. They do **not** substitute for repository evidence.

## Operating rules (enforced here)

1. **One session = one bounded objective.** A session does not opportunistically expand into later
   gates.
2. **Repository evidence is authoritative.** A Notion plan, or a doc that says "complete", is not
   implementation evidence. Code, tests, and reproducible artifacts are.
3. **Do not advance a gate on prose.** A session closes only with code/tests/artifacts, or an
   explicit documented blocker.
4. **Every session writes a handoff.** Use `HANDOFF_TEMPLATE.md`. The handoff records files
   changed, commands run, evidence produced, unresolved gaps, regressions, and the exact
   prerequisite for the next session.
5. **No broad feature work before Gate 0 + Gate 1 exit.**

## Files

- `HANDOFF_TEMPLATE.md` — the required handoff skeleton; copy it per session.
- `session-NN-*.md` — original Gate 0 series (historical `IV-#` tracker), e.g.
  `session-01-canonical-reconciliation.md`, `session-01-handoff.md`.
- `v1-roadmap/ivs-NN-*.md` — unified V1 roadmap series (`IVS-#`), e.g.
  `v1-roadmap/ivs-00-freeze-reset-authority.md`, `v1-roadmap/ivs-00-handoff.md`.

## Numbering and repairs

Sessions are numbered `01`, `02`, …. When a verification session fails, insert a **targeted repair
session** between the failing session and the next number, named `Session 12A`, `12B`, etc. — do
not renumber the plan. A repair session contains only: failing evidence, suspected ownership
boundary, minimal fix scope, regression tests, and the exact evidence to rerun.

## Delivery-evidence states

Every roadmap issue carries a delivery-evidence state, used in these reports so a "done" doc is
never mistaken for shipped code:

`unimplemented` → `implemented-local` → `canonical` (present at the canonical commit) →
`verified-release` (proven from the release commit).
