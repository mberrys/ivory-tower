# Ivory Tower V1 — Reset Authority Manifest

> **Status: FROZEN 2026-08-29 — Session 00 (IVS-1), issue IV1-1.**
> This document and [`release-evidence/cutline.json`](../release-evidence/cutline.json) are the
> single V1 reset-authority pointer for this repository. Where any in-repo document disagrees
> with the canonical roadmap named in [§2](#2-canonical-authority-chain), **the roadmap wins**;
> repository code that disagrees with the roadmap is a tracked defect, not a silent override.

## 1. Why this document exists

On **2026-08-29** the Ivory Tower V1 plan was reset around a **unified roadmap, revision 4**
(release posture **NO-GO**). It supersedes the planning baseline written into this repository on
2026-08-02 (`docs/v1-build-vs-open-source.md`, `docs/adr-001-application-platform.md`,
`docs/adr-002-runtime-topology.md`). The reset changes four things:

| Dimension | Superseded in-repo plan (2026-08-02) | Unified roadmap, revision 4 (2026-08-29) |
|---|---|---|
| Architecture | Theia workbench is the product shell | Four layers — **Ivory Core / Ivory Compute / Ivory Studio / IDE Bridge**. Theia is *only* the Studio substrate; Core and Compute import zero Theia. |
| Deployment | **Web-first**, wrapped for desktop | **Electron-first** for Ivory Studio; the browser build exists for development and automated testing, **not** as a hosted or shipped surface. |
| CLI / MCP | Post-V1 surfaces | **First-class V1** — the IDE Bridge (portable project root + Ivory CLI + local MCP server) makes RStudio / Positron / VS Code / Cursor / Codex first-class clients. |
| Execution ledger | One Notion tracker — 130 flat `IV-#` issues, mapped by `docs/v1-build-vs-open-source.md` | Two databases — **Ivory Tower V1 Issues** (`IV1-#`) and **Ivory Tower V1 Sessions** (`IVS-#`). The old tracker becomes historical backlog metadata until deliberately reconciled. |

Nothing in the repository recorded this switch before Session 00. This manifest is that record.

## 2. Canonical authority chain

Resolve authority top-down. The roadmap defines product and architecture intent; the execution
contract defines tracker rules; the two databases own implementation scope and bounded execution;
committed repository evidence is the only proof that work is done.

| Rank | Document | Notion URL | Role |
|---|---|---|---|
| 1 | Unified V1 roadmap (revision 4) | `https://app.notion.com/p/3cb9cb079ddb811eb7c1e43a4ca80439` | Supreme authority for V1 product form, layer boundaries, scope, increments, and release obligations. |
| 2 | Ivory Tower V1 — Execution Contract & Tracker Architecture | `https://app.notion.com/p/3cb9cb079ddb8135adf9db1d07786ed3` | Evidence rule, tracker ownership boundaries, architect gate, granularity contract, historical-tracker policy. |
| 3 | Ivory Tower V1 Issues (database) | `https://app.notion.com/p/adde6f38aea34caab3117f50c7ec67ff` | Authoritative active issue ledger (`IV1-#`): problem, objective, scope, sequence, acceptance, validation, constraints. |
| 4 | Ivory Tower V1 Sessions (database) | `https://app.notion.com/p/676cc270f3154536be0ee00a5ba93129` | Authoritative active session ledger (`IVS-#`): entry criteria, ordering, context budget, exit gate, evidence, handoff. |
| 5 | Session 00 — Freeze reset authority and repository truth (IVS-1) | `https://app.notion.com/p/3cb9cb079ddb814ca0f1d663e2fdb3e7` | The specification for this session; the reset authorization. |
| — | *This repository* — `release-evidence/` and `docs/sessions/` | — | Implementation truth. Tracker status never substitutes for repository evidence. |

The roadmap is elaborated by six architecture subpages (URLs in
[`release-evidence/cutline.json`](../release-evidence/cutline.json) → `authority.architectureSubpages`
and in [Appendix A](#appendix-a--canonical-url-list)).

## 3. Decision record

- **Decision date:** 2026-08-29
- **Roadmap revision:** 4
- **Release posture:** NO-GO
- **Frozen by:** Session 00 (IVS-1), issue IV1-1, branch `cc/freeze-reset-authority-repository-e4d51a`

## 4. V1 scope and exclusions

**Authoritative source: rank-1 roadmap.** This is a summary; the roadmap governs.

**In scope**

- **Ivory Core** — research semantics, citations, protocols, lenses, claims, temporal and
  identity objects, protected records, manifests and provenance. Imports zero Theia and zero
  Compute/Studio adapters.
- **Ivory Compute** — governed R / Python / Quarto execution over frozen corpus snapshots with
  exact execution provenance. Imports zero Studio.
- **Ivory Studio** — a single custom Eclipse Theia application, **Electron-first**, exposing one
  guided visual workflow and one code-capable workbench over the same Core/Compute contract.
- **IDE Bridge** — a documented portable project root, a stable Ivory CLI, and a local MCP
  server. RStudio / Positron / VS Code / Cursor / Codex are first-class V1 clients.
- Local, single-researcher deployment only.
- Lexical (PostgreSQL) retrieval baseline; content-addressed source admission; Docling normalization.
- A governed code lane for quantitative / survey analysis.
- Complete no-model and no-AI-code paths.
- Executable release-evidence gates (architecture separation, compute, identity/citations,
  retrieval, research semantics, AI safety, protected authorship, recovery, reproducibility,
  usability, accessibility).

**Explicitly excluded from V1**

- The browser build as a shipped or hosted production surface (development and automated testing only).
- Hosted, remote, team, role-based, or multi-tenant deployment.
- Making Ivory Studio mandatory for researchers who prefer another IDE.
- Silent model-autonomous shell, package, or network access.
- Unreviewed arbitrary MCP servers or extensions in the default Studio profile; an enabled or
  unrestricted plugin host.
- Automatic statistical interpretation, causal claims, unrestricted model selection, or treating
  an installed package as method validation.
- Broad connectors, live credentialed acquisition, a model marketplace, automatic provider routing.
- Vector / visual retrieval (evidence-gated), a survey wizard UI (deferred), hosted collaboration (deferred).
- Full feature parity with every RStudio / Positron / VS Code / Jupyter / Cursor / Codex capability.
- Representing any post-V1 capability as V1 completion.

## 5. Evidence rule

> No Ivory Tower V1 issue, session, or release gate advances on a Notion status, a planning page,
> or a document that asserts completion. Only committed, reproducible repository evidence advances
> work: source code, tests, and the artifacts under `release-evidence/` and `docs/sessions/`,
> reproducible by another engineer from a clean checkout. Source, static-analysis, local-runtime,
> hosted-CI, and release evidence are reported separately and never substituted for one another.
> The legacy Notion issue tracker and every `IV-#` issue are frozen historical input; Session 00
> modifies none of them.

## 6. Ledger roles

| Ledger | Notion | Prefix | Declared size | Role |
|---|---|---|---|---|
| Ivory Tower V1 Issues | `adde6f38aea34caab3117f50c7ec67ff` | `IV1-` | 95 issues | **Authoritative** active issue ledger. |
| Ivory Tower V1 Sessions | `676cc270f3154536be0ee00a5ba93129` | `IVS-` | 48 sessions | **Authoritative** active session ledger. |
| Ivory Tower Issue Tracker (`IV-8` root) | `3af9cb079ddb8001b65ed40b0b1ed594` | `IV-` | 130 issues | **Historical backlog metadata, read-only.** Reconciliation into a read-only cutline is owned by **Session 01 (IVS-2)**, issues IV1-3 and IV1-4. |
| `docs/generated/v1-cutline.json` | — | — | schemaVersion 1 | Historical repo snapshot of the old tracker. **Retained, not regenerated, not authoritative.** |

Declared sizes are as stated by the roadmap on the decision date; they are recorded, not
asserted as exact counts (they drift as the databases evolve).

## 7. Repository baseline

Session 00 ran in an isolated worktree on branch `cc/freeze-reset-authority-repository-e4d51a`,
starting from HEAD `1e45afd5182a58f12205472e4f05f02c5086d44d` (identical to `origin/dev`; upstream
base Eclipse Theia v1.74.0 at `172494ea2`). Four git worktrees exist; the primary checkout carried
pre-existing uncommitted work that Session 00 did not touch. The exact, reproducible snapshot and
the preservation checklist are in
[`release-evidence/session-00/repository-baseline.md`](../release-evidence/session-00/repository-baseline.md).

## 8. Protected user work

The primary checkout (`C:/.dev/repos/ivory-tower`, branch `dev`) held five modified tracked files
and thirteen untracked files at session start (a hooks/guard and Codex/Cursor environment setup).
Session 00 ran no `reset`, `checkout --`, `restore`, `stash`, or `clean` in any worktree; every
item is byte-identical before and after. Proof: the preservation checklist in
[`release-evidence/session-00/repository-baseline.md`](../release-evidence/session-00/repository-baseline.md).

## 9. Superseded in-repo planning docs

Superseded **as V1 planning authority**. Retained as history. Session 00 rewrote no content in any
of these files; each received a dated non-destructive pointer banner only.

| File | Disposition |
|---|---|
| `CLAUDE.md` | Banner. "Source of truth" / "Scope discipline" sections predate the reset. Build, test, and tooling guidance remain in force. |
| `AGENTS.md` | Banner. Repository map and verification commands remain in force; the roadmap references are historical. |
| `docs/v1-build-vs-open-source.md` | Banner. The compact map of the `IV-#` tracker; superseded by ranks 1–4 above. The generated cutline block is left intact. |
| `docs/adr-001-application-platform.md` | Banner. Web-first / surface-ordering decision superseded by the roadmap (Electron-first; CLI/MCP first-class). |
| `docs/adr-002-runtime-topology.md` | Banner. Hosted container topology superseded; the local-first runtime detail is re-decided by the roadmap's architecture subpages. |
| `docs/sessions/README.md` | Banner + a "Two session series" note. The old `session-01..04-*.md` records target the `IV-#` tracker under the `0→3` gate ladder and are retained as evidence. |

New unified-roadmap session records live under `docs/sessions/v1-roadmap/` as `ivs-NN-*.md`.

## 10. Known baseline defects (carried)

| Defect | Severity | State |
|---|---|---|
| `verify:ivory-tower` chained four undefined scripts (`verify:ivory-cutline`, `generate:ivory-cutline`, `verify:ivory-phase-gates`, `test:ivory-cutline`) — dropped by merge `ecda63ed1`, originally added in `7309a7f83`; on-disk targets present. CI gate was RED at `1e45afd51`. | red | **Repaired in Session 00** — definitions re-added verbatim; chain extended with the reset-authority checks. See `release-evidence/session-00/repository-baseline.md` §7. |
| Developer environment ran npm 11.17.0 against the pinned 11.13.0. | yellow | Environment only; not a repository change. Align with `npm i -g npm@11.13.0`. |

## 11. Machine-readable companion

[`release-evidence/cutline.json`](../release-evidence/cutline.json) carries the same facts in a
form a tool can check: `artifact = "v1-reset-cutline"`, `artifactVersion = 1`, one `authority`
block frozen by Session 00. Session 01 (IV1-3 / IV1-4) adds a sibling `reconciliation` block with
per-`IV-#` dispositions — an additive change that does not alter `authority`.

Verify both with:

```bash
npm run verify:ivory-reset-authority
npm run test:ivory-reset-authority
```

## 12. Next issue

**Session 01 (IVS-2) — "Reconcile the historical tracker into a read-only cutline."** First issue
**IV1-3** ("Generate the legacy Issue Tracker to V1 roadmap mapping"), then **IV1-4** ("Freeze
tracker disposition and carry-forward rules"). Only Session 01 is marked Ready. No V1 build work
begins before Session 01's exit gate is proven.

## Appendix A — canonical URL list

| Name | URL |
|---|---|
| Unified V1 roadmap (revision 4) | https://app.notion.com/p/3cb9cb079ddb811eb7c1e43a4ca80439 |
| Execution Contract & Tracker Architecture | https://app.notion.com/p/3cb9cb079ddb8135adf9db1d07786ed3 |
| V1 Issues database | https://app.notion.com/p/adde6f38aea34caab3117f50c7ec67ff |
| V1 Sessions database | https://app.notion.com/p/676cc270f3154536be0ee00a5ba93129 |
| Session 00 (IVS-1) | https://app.notion.com/p/3cb9cb079ddb814ca0f1d663e2fdb3e7 |
| Historical tracker (`IV-8` root) — read-only | https://app.notion.com/p/3af9cb079ddb8001b65ed40b0b1ed594 |
| Architecture 1 — Four-Layer Boundary, Runtime Topology & Dependency Law | https://app.notion.com/p/3cb9cb079ddb81b3b232e7e043465ee8 |
| Architecture 2 — Ivory Core | https://app.notion.com/p/3cb9cb079ddb81c887f4f16ba9de07b2 |
| Architecture 3 — Ivory Compute | https://app.notion.com/p/3cb9cb079ddb817c8498df1ac55458c1 |
| Architecture 4 — Ivory Studio | https://app.notion.com/p/3cb9cb079ddb816b87c3fedc88fa1e04 |
| Architecture 5 — IDE Bridge | https://app.notion.com/p/3cb9cb079ddb8147a79cf2a78bb610a5 |
| Architecture 6 — Ingestion, AI, Security, Measurement, Recovery & Release Evidence | https://app.notion.com/p/3cb9cb079ddb81f4be8df02e16e23a0d |
