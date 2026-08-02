# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository **is a fork of Eclipse Theia** (`mberrys/ivory-tower`, branch `stable`, upstream v1.74.0). Ivory Tower is being built as a Theia product inside it.

Two documentation trees, easily confused:

- **`docs/`** (plural) — Ivory Tower's own planning documents. Ours.
- **`doc/`** (singular) — upstream Theia's documentation. Theirs, plus one file we added.

Read these before non-trivial work:

- `docs/v1-build-vs-open-source.md` — the planning baseline and repository map. Read first.
- `docs/adr-001-application-platform.md` — the binding platform and surface decision.
- `docs/iv-8-product-model.md` — canonical object vocabulary, lifecycle, non-goals, issue traceability matrix.
- **`doc/THEIA-CLAUDE.md`** — upstream Theia's own guidance: build commands, monorepo layout, DI and contribution patterns, code style, test infrastructure. **Read this before touching `packages/`, `dev-packages/`, `examples/`, or `configs/`.** It is the authority on how to build and test Theia; this file does not duplicate it.

Practical notes:

- Build, lint, and test commands **do exist** now and come from Theia — see `doc/THEIA-CLAUDE.md`. Use `npm`, not `yarn`. Node ≥22.
- `git` history is real: branch `stable` tracks `origin/stable` at `https://github.com/mberrys/ivory-tower`. **The repo is public** — treat anything committed here as publishable, and confirm before pushing planning material.
- `liquidify-react` is **not currently installed**. Theia's monorepo root `package.json` replaced the earlier stub. It must be added to whichever Ivory Tower package needs it, not to the monorepo root.
- `prototype-v3/` is untracked, is not part of the Theia build, and is not ours to modify or commit unless asked.

## Source of truth

Detailed requirements, acceptance criteria, and attributed callouts live in the **Notion issue tracker**, not in this repo:

- Tracker: https://app.notion.com/p/3af9cb079ddb8001b65ed40b0b1ed594
- Shape: 125 flat issues (`IV-#`), 689 points, sequenced only by `Blocked by` relations. `IV-8` is the sole root; there is no epic/sub-issue hierarchy.
- `docs/v1-build-vs-open-source.md` is the compact map of that tracker; keep it in sync when phase/issue structure changes, and keep issue bodies as the place for detail.

Reference work by issue ID (`IV-83`, `IV-97`) — the doc, the critical path, and the release gates all use those IDs as the shared vocabulary.

## What Ivory Tower is

A private, academic-first **corpus-to-cited-conclusion** workflow: ingest authorized scholarly sources, retrieve evidence, extract reported data, generate *proposed* claims, have a researcher adjudicate them, and export a cited brief with verifiable lineage. V1 also carries a second bounded path — authorized non-restricted survey file to validated descriptive analysis — over the same provenance model.

## Architectural invariants

These are the constraints that shape almost every implementation decision. They come from `docs/v1-build-vs-open-source.md` and are worth internalizing before writing code.

**1. Stage boundaries are separate contracts.** The pipeline is:

```text
candidate papers -> accessible full text -> extracted observations
  -> normalized comparable dataset -> researcher-adjudicated completeness
  -> approved visualization specification -> deterministic plot -> plot/dataset reconciliation
```

Success at an early stage must never mask failure at a later one. Benchmarks, telemetry, export, and release gates report each stage separately. This exists specifically to prevent the observed failure mode where strong literature discovery hid weak data extraction and inscrutable plots.

**2. Ivory Tower owns the domain; libraries stay behind owned adapters.** Reuse runtime, UI, document, persistence, AI-transport, and visualization libraries — but Ivory Tower owns the topology, research schema, provenance chain, identity/idempotency semantics, and authorization policy. Generic RAG or agent frameworks must not own the domain model, canonical persistence, provenance chain, or authorization policy. **This applies to Theia too**: Theia provides the shell, not the domain model.

**3. Nothing is asserted without provenance.** Every displayed AI claim needs validated, authorized passage evidence; every plotted or exported datum needs a reviewed observation identity and an exact source anchor. Model output starts as a *proposal* and becomes researcher-approved only via recorded adjudication.

**4. Everything is reconstructable.** Protocol, source, passage, job, pipeline, model, prompt, tool, retrieval, validation, human decision, and export versions must all be reconstructable. Hashes, query syntax, ranking weights, model/tool versions, and manifests may be visually collapsed but never omitted from persistence or export.

**5. Admission and egress fail closed.** Restricted content is rejected *before* conversion or external transmission (IV-83). External provider dispatch must be project-authorized, disclosed, and policy-approved (IV-87).

**6. Research protocol is staged, not gated.** `exploratory -> specified -> export_snapshot`. Revisions branch and preserve the predecessor, rationale, changed scope, and affected artifacts. No methodological gate before reading; no methodological amnesia afterward.

**7. Accessibility is a release gate, not a polish pass.** Keyboard-only users must be able to complete the vertical slice, and every graph needs a structured alternative — on **every surface shipped**, not once.

The full list of non-negotiable release gates is at the end of `docs/v1-build-vs-open-source.md`. Treat it as the definition of done.

## Application platform (decided)

**Eclipse Theia, deployed web-first and wrapped for desktop** (2026-08-02, `docs/adr-001-application-platform.md`, resolving part of IV-14). This repository is a **literal source fork** of Theia, not a composition over `@theia/*` packages. Non-negotiables that follow:

- Surfaces ship hosted web → desktop wrapper → CLI → editor extension. **No surface may contain product logic**; every surface is a client of the IV-18 typed API.
- **Theia owns the workbench chrome** (layout, panels, commands, keybindings, theming). LiqUIdify is scoped to Ivory Tower's own Theia views.
- **The plugin host is disabled or first-party allow-listed.** An arbitrary-extension surface defeats the IV-83 admission and IV-87 egress chokepoints. Do not enable it for convenience.
- Theia is EPL-2.0, not MIT — IV-19 owns that decision.
- Because this is a fork, **minimize divergence in files upstream owns.** Prefer new Ivory Tower packages under `packages/` over edits to upstream packages; every upstream file you modify becomes a recurring merge conflict.

Still open (ADR-001 §6): extension-host policy, desktop wrapper technology, local Docling bundling, queue technology, object storage, migration ownership, and per-boundary failure models. Confirm with the user before resolving any of these in code.

The supporting stack:

- TypeScript web application and API; durable job contract and queue boundary shared by independently deployable web and worker processes.
- Python Docling worker behind a versioned conversion port.
- PostgreSQL + pgvector as canonical store and hybrid-search substrate; immutable filesystem/object storage for source bytes.
- AI SDK provider registry with at least two direct provider adapters (gateway optional).
- PDF.js source viewer, Cytoscape.js claim-evidence graph, Vega-Lite (or equivalent adapter) for reported-data charts.

## Scope discipline

V1 is Phases 1–6 (109 issues, 576 points). Phase 7 is **explicitly post-v1** (16 issues, 113 points): MCP server, Zotero/OSF connectors, DuckDB statistical sandbox, maps, multi-user collaboration, restricted-data de-identification, Berry LLM evaluation. Also excluded from V1: restricted microdata, sensitive interviews, unapproved human-subject data, outbound MCP, arbitrary statistical execution, and full CAQDAS/NVivo-class analysis.

Post-v1 capabilities must never be represented as V1 completion.

## LiqUIdify

`liquidify-react` v0.6.25 is the component library for **Ivory Tower's own Theia views** — research workspace, evidence inspector, adjudication surfaces, dossier views. It is not the shell foundation; per ADR-001 §3.1 Theia owns the workbench chrome, and IV-3, IV-23, and IV-27 are rescoped accordingly.

- **Not currently installed.** Add it to an Ivory Tower package, never to the monorepo root.
- Peers must be provided: `react`/`react-dom` (^18 || ^19), `@ark-ui/react`, `framer-motion`, `lucide-react`. Theia pins React 18.2.0, which satisfies the peer range.
- `sideEffects` is limited to its dist CSS — the stylesheet must be imported explicitly (`liquidify-react/styles`) or components render unstyled.
- Subpath exports (e.g. `liquidify-react/button`, `liquidify-react/ark-ui/*`) exist for tree-shaking; prefer them over deep-importing `dist` paths.
- Per IV-23, application code consumes LiqUIdify through the Ivory Tower UI adapter, which also isolates views from Theia's Lumino widget lifecycle.
