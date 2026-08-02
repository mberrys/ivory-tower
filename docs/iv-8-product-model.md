# The Ivory Tower Product Model: Objects, Lifecycle, and Non-Goals

**Deliverable:** IV-8 canonical product model
**Date:** 2026-08-01
**Delivery map:** [v1-build-vs-open-source.md](v1-build-vs-open-source.md) · **Evidence base:** [iv-102-landscape-review.md](iv-102-landscape-review.md)
**Tracker:** [Ivory Tower Issue Tracker](https://app.notion.com/p/3af9cb079ddb8001b65ed40b0b1ed594) · **Scope:** 125 phased issues, 689 points

---

## 1. Product definition and boundary

Ivory Tower is an AI research operating system for knowledge work, with academia as the first and best-supported domain. It is not an academic dashboard and not a Tableau clone. Visual analytics are one capability inside a research workflow, never the purpose of the product.

The promise it makes is narrow on purpose:

> Ivory Tower does not write the scholarship. It preserves evidence, surfaces inspectable leads, tests research moves, and leaves argument, interpretation, ethical judgment, and final voice to the researcher.

### 1.1 Two bounded paths, one provenance model

V1 delivers two finite workflows over a single provenance, authorship, adjudication, and export model:

| | Path A — scholarly corpus | Path B — authorized survey file |
|---|---|---|
| Input | Admitted documents (papers, books, archival items) | Authorized non-restricted survey data with instrument and codebook |
| Method surface | Retrieval, passage evidence, qualitative coding, reported-data extraction | Instrument review, preflight, allow-listed descriptive specification |
| Deterministic output | Normalized observation dataset, approved plots | Validated descriptive tables and charts |
| Shared | Protocol staging, protected authorship, proposal/adjudication lifecycle, provenance chain, export contract |

The critical-history scholar and the non-programmer survey student use different method surfaces and the same canonical model. Neither path may borrow the other's guarantees without meeting its own gates.

### 1.2 What Ivory Tower is not

It is not a paper writer, a generic dashboard, an autonomous analyst, an unrestricted statistician, or an unrestricted document-chat system. Every one of these exclusions is load-bearing:

- **Not a paper writer.** Generated prose is a proposal. It can be purged without destroying evidence, human work, or deterministic results.
- **Not a generic dashboard.** Research material is never forced into a spreadsheet or dashboard schema. §2 is the reason this holds.
- **Not an autonomous analyst.** The researcher owns the question, scope, interpretation, and final voice. Model output is adjudicated, never assumed.
- **Not an unrestricted statistician.** Only an allow-listed set of descriptive survey operators executes, and only against a researcher-approved specification.
- **Not unrestricted document-chat.** Admission, authorization, and egress checks precede conversion and transmission, and they fail closed.

---

## 2. Canonical research object vocabulary

This section is the authority for object names. [IV-16](https://app.notion.com/p/3b09cb079ddb812f9782c4ea0f33f12c) implements the schema; where IV-16 and this section differ, this section is corrected first and IV-16 follows.

**Provenance owner** is the column that makes invariant 3 enforceable rather than aspirational. Every object declares who asserted it:

- `source` — asserted by the admitted material itself
- `human` — authored by the researcher; protected from model mutation
- `model` — proposed by a model; not researcher-approved until an adjudication record exists
- `derived` — produced deterministically from other objects and reconstructable from them

### 2.1 Core objects

| Object | Definition | Identity and versioning | Provenance owner | Owned by |
|---|---|---|---|---|
| **Project** | Bounded research workspace; the authorization and scope root | Stable project ID; staged, not mutated, through protocol revisions | `human` | IV-16, IV-82 |
| **Corpus** | Declared set of sources under one selection mode with recorded rationale | Corpus ID plus selection mode plus revision | `human` | IV-16, IV-84 |
| **Source** | An admitted work: paper, book, archival item, or survey file bundle | Content hash plus resolved scholarly identifier | `source` | IV-28, IV-32, IV-33 |
| **SourceVersion** | Immutable byte-level state of a Source with its conversion lineage | Content hash; never mutated in place | `source` | IV-28, IV-33, IV-36 |
| **Passage** | Addressable normalized text, table, or figure span with an exact anchor | Stable passage ID plus anchor; survives reprocessing of unchanged bytes | `derived` | IV-35, IV-38 |
| **Entity** | Resolved person, institution, place, instrument, or agent | Entity ID plus retained resolution evidence | `derived` | IV-44 |
| **Event** | Dated or date-ranged occurrence asserted by a source | Event ID plus asserting passage | `source` | IV-44 |
| **Concept** | Term or construct with its context of use | Concept ID plus term-context assertions | `source` | IV-44, IV-119 |
| **Claim** | A proposition carrying a declared posture | Claim ID plus proposal lineage | `model` until adjudicated | IV-43, IV-86 |
| **EvidenceLink** | Typed binding of a Claim to a Passage or Observation | Link ID with polarity, relevance, confidence provenance | `derived` plus human adjudication | IV-43, IV-46 |
| **Contradiction** | Recorded disagreement between claims or evidence, preserved not resolved | Contradiction ID referencing both sides | `derived` | IV-43, IV-53 |
| **Interpretation** | The researcher's reading, distinct from claims and from model output | Interpretation ID plus branch lineage | `human` | IV-43, IV-53 |
| **Citation** | Reproducible reference rendering bound to a SourceVersion | Citation ID plus format version | `derived` | IV-45, IV-46 |
| **Execution** | Recorded run of a capability or job with full lineage | Execution ID plus immutable run manifest | `derived` | IV-56, IV-78, IV-79 |
| **Artifact** | Any addressable output of an Execution | Content address plus producing Execution | `derived` | IV-79, IV-101 |
| **VisualizationSpec** | Typed specification that must be approved before compilation | Spec ID plus approval record and version | `human`-approved | IV-59, IV-96 |

`Artifact` is present because IV-16 requires it. IV-8's original enumeration omitted it; that omission is corrected here.

### 2.2 Extended objects

These entered the model after the original enumeration and are canonical on identical terms. Each traces to the issue that introduced it.

| Object | Definition | Provenance owner | Introduced by |
|---|---|---|---|
| **ResearchProtocol** (stage, posture) | Staged commitment `exploratory → specified → export_snapshot`; revisions branch and preserve the predecessor, rationale, changed scope, and affected artifacts | `human` | IV-77 |
| **Observation** | Source-grounded reported datum with exact anchor, units, conditions, and uncertainty | `source` extracted `derived` | IV-92, IV-93, IV-94 |
| **ProtectedHumanRecord** | Notes, annotations, codes, and memos a model cannot read or mutate absent a bounded, revocable, operation-specific grant | `human` | IV-113, IV-114, IV-115 |
| **Annotation / Code / Memo** | Qualitative subtypes of the protected record, versioned and attributed | `human` | IV-85 |
| **ModelContribution** | Every retained model output, inspectable, diffable, and purgeable | `model` | IV-113, IV-114, IV-116 |
| **Connection** (+ **Warrant**) | Typed relation proposal carrying warrant type, exact support, counterevidence, alternatives, limitations, and review state | `model` until adjudicated | IV-117, IV-118 |
| **ContestedAssertion** | Identity, terminology, and archive-context assertion retaining speaker, assertion type, time, place, and institutional context | `source` | IV-119, IV-120 |
| **SurveyInstrument / Codebook** | Preserved questionnaire and variable documentation | `source` | IV-122, IV-123 |
| **SurveyDataset** | Authorized non-restricted dataset with weights, denominators, and missingness structure | `source` | IV-123, IV-124 |
| **AnalysisSpec** | Allow-listed descriptive specification, researcher-approved before any execution | `human`-approved | IV-122, IV-125 |
| **AnalysisResult** | Deterministic computation output, an analytical artifact pending review | `derived` | IV-125, IV-126 |
| **AdjudicationRecord** | The recorded human decision: accept, revise, dispute, defer, reject, or request more evidence | `human` | IV-86, IV-95, IV-118 |
| **ExportSnapshot / Manifest** | Immutable export state with authorship, reproducibility, analysis, visualization, and audit manifests | `derived` | IV-88, IV-116, IV-90 |

### 2.3 Why this is not a dashboard schema

IV-8 acceptance criterion 2 requires that a project be representable without forcing research material into a spreadsheet or dashboard schema. Three properties of the vocabulary above establish it:

1. **Disagreement is first-class.** `Contradiction` and competing `Interpretation` branches persist. A table row cannot hold two conflicting values with separate warrants; this model can.
2. **Evidence is addressed, not summarized.** `EvidenceLink` binds to an exact `Passage` or `Observation` anchor. A dashboard aggregates away the anchor; here the anchor is the identity.
3. **Authorship is typed.** `human`, `model`, `source`, and `derived` records are separable at query time, so generated prose can be purged without destroying the evidence graph. A cell in a spreadsheet has no author.

---

## 3. Research lifecycle

Six stages. Both paths traverse all six; their method surfaces differ, their guarantees do not.

| Stage | Path A — scholarly corpus | Path B — authorized survey file |
|---|---|---|
| **Discover** | Establish purpose, provisional question, posture, and authorized scope; assemble candidates; adjudicate relevance and refine search | Establish purpose and scope; identify an authorized non-restricted survey file |
| **Validate** | Admit content fail-closed before conversion; resolve metadata; deduplicate; diagnose extraction quality; report corpus coverage and selection rationale | Admit the file fail-closed; preserve instrument and codebook; run weighting, missingness, and data-quality preflight |
| **Organize** | Chunk with preserved provenance; embed; index for hybrid retrieval; annotate, code, and memo in the protected workspace | Review instrument, denominators, skip logic, privacy, and design support; organize variables against the codebook |
| **Analyze** | Retrieve evidence; surface typed connection proposals; extract, normalize, and adjudicate reported observations; represent uncertainty and competing readings | Approve an allow-listed descriptive specification; execute deterministically; validate results, small cells, and causal-language boundaries |
| **Communicate** | Inspect every claim and connection back to its passage; compile approved visualizations from adjudicated data | Inspect every result back to dataset snapshot, variable, transformation, and specification; render accessible tables and charts |
| **Publish** | Export a researcher-owned dossier with evidence, structure, limitations, and manifests; model prose excluded unless explicitly approved | Export a reproducible, accessible analysis package with the same manifest obligations |

Two properties hold across both columns and are the reason the paths can share one model:

- **Staged, not gated.** No methodological gate blocks reading; no methodological amnesia follows it. Protocol revisions branch and preserve their predecessor.
- **Stage boundaries are separate contracts.** Success at Discover never implies success at Analyze. Benchmarks, telemetry, export, and release gates report each stage independently — this is the specific failure the model exists to prevent.

---

## 4. Supported content and exclusions

This section defines the **product-level** matrix. It does not duplicate enforcement authority: **IV-20 owns the supported-content and restricted-data policy**, **IV-83 owns pre-conversion admission**, **IV-87 owns provider egress**, and **IV-68 owns the release matrix**. Where those issues are more specific, they govern.

| Content class | V1 status | Condition |
|---|---|---|
| Published scholarly documents (papers, books, chapters) | Supported | Project-authorized; admitted before conversion |
| Archival and primary-source items | Supported | Authorized; archive context and silence recorded (IV-119–IV-121) |
| Reported data in text, tables, figures, supplements | Supported | Extracted to `Observation` with exact anchors (IV-92–IV-95) |
| Non-restricted survey files with instrument and codebook | Supported | Authorized manual upload only; preflight resolved (IV-122–IV-127) |
| Restricted microdata | **Excluded** | Rejected before conversion or transmission |
| Direct-identifier survey files | **Excluded** | Rejected at admission |
| Sensitive interview material | **Excluded** | Rejected at admission |
| Unapproved human-subject data | **Excluded** | Rejected at admission |

Exclusion is enforced at admission and at egress, and both fail closed. Restricted content is rejected *before* conversion or external transmission, not filtered afterward.

---

## 5. Non-goals

Not deferred features awaiting capacity — boundaries whose absence is part of the contract.

| Non-goal | Why |
|---|---|
| Broad source connectors | Demand unestablished (§6). Every future adapter must reuse the reviewed admission, authorization, job, provenance, egress, and release-evidence contracts |
| Arbitrary statistical execution | Only allow-listed descriptive survey operators run, with no ambient files, network, credentials, SQL, or arbitrary code |
| Automated causal inference | Statistical association is never promoted to causation |
| Multi-user collaboration | V1 is single-researcher; authorization is project-scoped |
| Outbound MCP | Post-v1 (IV-13, IV-69, IV-70) |
| Berry LLM adoption | Post-v1 evaluation only (IV-76) |
| Maps | Post-v1 (IV-73) |
| Full CAQDAS/NVivo-class analysis | Bounded annotation, codebook, and memo work only (IV-85) |
| Restricted-data handling | A fail-closed obligation, never a differentiator |
| Fair-representation scoring | Fair representation is never reduced to a score |

---

## 6. Evidence constraints on product claims

[IV-102](iv-102-landscape-review.md) graded the claims this product model would otherwise rest on. Its verdicts bind this document; nothing here may assert what the review refuted or left unresolved.

| Claim | IV-102 verdict | Consequence for the product model |
|---|---|---|
| Social-science tooling is severely fragmented | **Refuted at the preprint layer**, supported at the economics boundary | Fragmentation may not be used to motivate connector breadth. SocArXiv and PsyArXiv share OSF infrastructure; RePEc is genuinely separate |
| Restricted microdata is a candidate integration surface | **Refuted on architecture** | The FSRDC enclave permits neither internet access nor downloads. Foreclosed by architecture, not policy |
| Claude is dominant among social scientists | **Refuted as stated** | No provider-preference claim enters the product model |
| Coding-agent adoption among social scientists is near-universal | **Supported at ~20%** | Expert-tooling assumptions must not presume agent fluency |
| Equity-of-access design is needed | **Supported** | A minimum useful V1 path under constrained access, quota, bandwidth, hardware, and tool literacy is a release gate (IV-104) |
| IRB-aware redaction and de-identification | **Supported as requirement, refuted as differentiator** | Built because required, never positioned as the product's edge |
| Federated literature connectors; OSF workflows | **Provisional** | Research gates (IV-106, IV-108), not approved implementation work |
| Evidence-clearinghouse connectors; CAQDAS interchange | **Unresolved** | Research gates (IV-107, IV-109). Unresolved stays unresolved; no conversion to a recommendation |
| GenAI improves qualitative research outcomes | **Unresolved** | No outcome claim is made for the qualitative surface |

Vendor documentation may establish that a capability exists. It may never establish adoption, quality, or market position. That rule applies to this document as much as to the review.

---

## 7. Traceability matrix

IV-8's verification bar: *every planned issue maps to an object, lifecycle stage, release gate, or explicit post-v1 deferral*. All 125 phased issues are mapped below.

### 7.1 Release gate legend

Gate IDs are local to this document and reference the non-negotiable gates in [v1-build-vs-open-source.md](v1-build-vs-open-source.md).

| ID | Gate |
|---|---|
| G1 | No displayed AI claim lacks validated, authorized passage evidence |
| G2 | No plotted or exported datum lacks a reviewed identity and exact anchor |
| G3 | No model proposal is represented as approved without recorded adjudication |
| G4 | Protected human notes require a bounded, revocable, operation-specific grant |
| G5 | Retained model contributions are inspectable; prose is purgeable |
| G6 | Every connection states warrant, support, counterevidence, alternatives, limitations, review state |
| G7 | Contested identities retain speaker, type, time, place, archive context |
| G8 | Identity inference, outing, unsafe linkage, small-cell disclosure fail closed |
| G9 | Survey analysis requires authorization, preservation, preflight, approved spec, reconciliation, causal limits |
| G10 | Exact passage links survive reload and unchanged-source reprocessing |
| G11 | All versions reconstructable: protocol, source, passage, job, pipeline, model, prompt, tool, retrieval, validation, decision, export |
| G12 | Restricted content rejected before conversion or transmission |
| G13 | Provider dispatch is authorized, disclosed, policy-approved, fail-closed |
| G14 | Keyboard-only completion; graphs have structured alternatives |
| G15 | Dependency policy, SBOM, secret scans, migrations, mitigations, deterministic E2E tests pass |
| G16 | Benchmarks separate ingestion, retrieval, model, validation, latency, cost, infrastructure failures |
| G17 | Each pipeline stage passes independently; discovery cannot compensate downstream |
| G18 | Every plot reconciles to marks and passes unit, uncertainty, legibility, accessibility checks |
| G19 | Preflight upper bound; quota exhaustion checkpoints and resumes |
| G20 | Novice and expert comprehension validated; critical failures block release |
| G21 | Backup/restore, worker drain, migration recovery, store reconciliation drills pass |
| G22 | Landscape claims separate vendor capability from independent prevalence |
| G23 | Minimum useful path validated under constrained access |
| G24 | Post-v1 capabilities are not represented as V1 completion |

### 7.2 Phase 1 — Product and architecture contract (23 issues, 106 points)

| ID | Issue | Stage | Primary objects | Gate |
|---|---|---|---|---|
| IV-8 | Define the academic-first product model | All | All | G24 |
| IV-14 | Decide runtime topology and repository architecture | Cross-cutting | Execution | G11 |
| IV-15 | Scaffold the TypeScript application and quality gates | Cross-cutting | — | G15 |
| IV-16 | Define the canonical research object schema | All | All core + extended | G11 |
| IV-17 | Define stable source, passage, and artifact identifiers | Organize | Source, SourceVersion, Passage, Artifact | G10 |
| IV-18 | Define typed service and API boundaries | Cross-cutting | — | G11 |
| IV-19 | Establish licensing, SBOM, and pinning policy | Cross-cutting | — | G15 |
| IV-20 | Define supported-content and restricted-data policy | Validate | Source | G12 |
| IV-21 | Establish local development, migrations, and seed workflow | Cross-cutting | — | G15 |
| IV-22 | Define deployment, configuration, and secret management | Cross-cutting | — | G15 |
| IV-77 | Define staged research protocol and claim-posture contract | Discover | ResearchProtocol, Claim | G11 |
| IV-78 | Define and implement durable asynchronous job contracts | Cross-cutting | Execution | G11, G21 |
| IV-79 | Implement immutable pipeline-run manifests and invalidation | Cross-cutting | Execution, Artifact | G11 |
| IV-92 | Define reported-data and experimental-observation schema | Analyze | Observation | G2, G17 |
| IV-102 | Systematic tool, source, and adoption landscape review ✅ | Discover | — | G22 |
| IV-103 | Validate the connector-and-workflow-layer thesis | Discover | Project, Corpus | G22 |
| IV-104 | Define and validate equity-of-access requirements | Cross-cutting | — | G23 |
| IV-105 | Define applied personas and deliverable contracts | Publish | ExportSnapshot | G20 |
| IV-113 | Define the researcher-authorship constitution | Cross-cutting | ProtectedHumanRecord, ModelContribution | G4, G5 |
| IV-114 | Extend the schema for protected records and contributions | Cross-cutting | ProtectedHumanRecord, ModelContribution | G4, G5 |
| IV-117 | Define the connection proposal and warrant schema | Analyze | Connection, Warrant | G6 |
| IV-119 | Define the critical-history identity and archive model | Organize | ContestedAssertion, Concept | G7 |
| IV-122 | Define the bounded survey-analysis and warrant contract | Analyze | AnalysisSpec, SurveyInstrument | G9 |

### 7.3 Phase 2 — Application shell (9 issues, 41 points)

| ID | Issue | Stage | Primary objects | Gate |
|---|---|---|---|---|
| IV-3 | Establish the LiqUIdify GUI foundation | Cross-cutting | — | G14 |
| IV-23 | Implement the Ivory Tower UI adapter over LiqUIdify | Cross-cutting | — | G14 |
| IV-24 | Build responsive research workspace shell and navigation | Cross-cutting | Project | G14 |
| IV-25 | Implement shared loading, empty, failure, and retry states | Cross-cutting | Execution | G14 |
| IV-26 | Verify keyboard, focus, contrast, and reduced motion | Cross-cutting | — | G14 |
| IV-27 | Execute LiqUIdify compatibility and upgrade spike | Cross-cutting | — | G15 |
| IV-80 | Implement guided first-project onboarding with a sample corpus | Discover | Project, Corpus | G20, G23 |
| IV-81 | Implement progressive-disclosure method inspector and vocabulary | Cross-cutting | ResearchProtocol | G20 |
| IV-82 | Implement authentication and project authorization boundary | Cross-cutting | Project | G13 |

### 7.4 Phase 3 — Source ingestion and inspection (11 issues, 56 points)

| ID | Issue | Stage | Primary objects | Gate |
|---|---|---|---|---|
| IV-28 | Implement immutable source storage and content hashing | Validate | Source, SourceVersion | G10, G11 |
| IV-29 | Implement source upload and ingestion state machine | Validate | Source, Execution | G11 |
| IV-30 | Integrate Docling conversion service | Validate | SourceVersion, Passage | G17 |
| IV-31 | Implement OCR fallback and extraction diagnostics | Validate | Passage | G17 |
| IV-32 | Resolve scholarly metadata with Crossref and OpenAlex | Validate | Source, Entity | G11 |
| IV-33 | Implement source deduplication and version reconciliation | Validate | Source, SourceVersion | G11 |
| IV-34 | Integrate PDF.js source viewer | Communicate | Passage | G10, G14 |
| IV-35 | Implement stable passage deep links and highlights | Communicate | Passage | G10 |
| IV-36 | Implement failure recovery and controlled reprocessing | Validate | SourceVersion, Execution | G10, G21 |
| IV-83 | Enforce supported-content admission before conversion | Validate | Source | G12 |
| IV-123 | Implement survey dataset, questionnaire, and codebook ingestion | Validate | SurveyDataset, SurveyInstrument, Codebook | G9, G12 |

### 7.5 Phase 4 — Corpus, retrieval, and provenance (18 issues, 104 points)

| ID | Issue | Stage | Primary objects | Gate |
|---|---|---|---|---|
| IV-7 | Enforce end-to-end inspectable conclusions | Communicate | Claim, EvidenceLink, Passage | G1, G2 |
| IV-9 | Integrate the hybrid scholarly corpus and knowledge substrate | Organize | Corpus, Passage | G11 |
| IV-37 | Provision PostgreSQL, pgvector, and migrations | Cross-cutting | — | G15, G21 |
| IV-38 | Implement provenance-preserving chunking | Organize | Passage | G10 |
| IV-39 | Implement embeddings and model-version tracking | Organize | Passage, Execution | G11 |
| IV-40 | Implement hybrid lexical-vector retrieval | Analyze | Passage | G11 |
| IV-41 | Implement corpus, source, date, entity, content filters | Analyze | Corpus, Entity | G11 |
| IV-42 | Implement surrounding-context expansion | Analyze | Passage | G1 |
| IV-43 | Persist claims, evidence, contradictions, interpretations | Analyze | Claim, EvidenceLink, Contradiction, Interpretation | G1, G3 |
| IV-44 | Implement entity resolution and temporal relationships | Organize | Entity, Event, Concept | G7 |
| IV-45 | Implement reproducible citation formatting and export | Publish | Citation | G11 |
| IV-46 | Validate citations and reject unsupported claims | Communicate | Citation, EvidenceLink | G1 |
| IV-47 | Build retrieval and passage-anchor evaluation corpus | Cross-cutting | Passage | G16, G17 |
| IV-84 | Implement corpus coverage and extraction-quality report | Validate | Corpus, Passage | G17 |
| IV-91 | Implement candidate relevance adjudication and search refinement | Discover | Source, AdjudicationRecord | G17 |
| IV-93 | Extract reported data from text, tables, figures, supplements | Analyze | Observation | G2, G17 |
| IV-94 | Normalize cross-paper variables, units, conditions, uncertainty | Analyze | Observation | G2, G17 |
| IV-124 | Implement survey weighting, missingness, and quality preflight | Validate | SurveyDataset | G9 |

### 7.6 Phase 5 — Research dossier workflow (29 issues, 168 points)

| ID | Issue | Stage | Primary objects | Gate |
|---|---|---|---|---|
| IV-4 | Integrate the provider abstraction contract | Cross-cutting | Execution | G13 |
| IV-5 | Define capability-based AI contracts | Cross-cutting | Execution, ModelContribution | G11 |
| IV-10 | Integrate the conversational research workspace | Analyze | Claim, EvidenceLink, VisualizationSpec | G1, G3 |
| IV-12 | Integrate bounded evidence-led research capabilities | Analyze | Claim, ModelContribution | G1, G3 |
| IV-48 | Integrate AI SDK registry and direct provider adapters | Cross-cutting | Execution | G13 |
| IV-49 | Implement provider-independent structured result envelope | Cross-cutting | ModelContribution | G11 |
| IV-50 | Implement structured cited-answer capability | Analyze | Claim, Citation, EvidenceLink | G1 |
| IV-51 | Implement persistent conversational research threads | Analyze | Execution, ModelContribution | G11 |
| IV-52 | Implement scope and framing revision controls | Discover | ResearchProtocol | G11 |
| IV-53 | Represent uncertainty and competing interpretations | Analyze | Interpretation, Contradiction | G3 |
| IV-54 | Implement evidence-gap analysis | Analyze | EvidenceLink, Corpus | G17 |
| IV-55 | Implement bounded literature review | Analyze | Claim, Corpus | G1 |
| IV-56 | Persist model, prompt, tool, and source audit records | Cross-cutting | Execution | G11 |
| IV-57 | Implement streaming transport and cancellation | Cross-cutting | Execution | G11 |
| IV-58 | Enforce time, cost, and source budgets | Cross-cutting | Execution | G19 |
| IV-85 | Implement bounded annotation, codebook, and memo workflow | Organize | Annotation, Code, Memo | G4 |
| IV-86 | Implement researcher adjudication for generated claims | Analyze | AdjudicationRecord, Claim | G3 |
| IV-87 | Enforce provider data-egress policy | Cross-cutting | Execution | G12, G13 |
| IV-95 | Validate dataset completeness and adjudicate observations | Analyze | Observation, AdjudicationRecord | G2, G17 |
| IV-96 | Convert schemas and example plots into reviewable specs | Communicate | VisualizationSpec | G18 |
| IV-99 | Implement reusable workflow recipes and expert-run controls | Cross-cutting | Execution | G11 |
| IV-100 | Implement quota-aware preflight and resumable checkpoints | Cross-cutting | Execution | G19 |
| IV-101 | Implement content-addressed artifact cache and reuse policy | Cross-cutting | Artifact | G8, G11 |
| IV-115 | Implement the protected human-only notebook boundary | Organize | ProtectedHumanRecord | G4 |
| IV-118 | Implement connection surfacing and researcher adjudication | Analyze | Connection, Warrant, AdjudicationRecord | G6 |
| IV-120 | Implement counter-archive, silence, and positionality workflows | Organize | ContestedAssertion | G7 |
| IV-121 | Enforce identity non-inference and anti-outing protections | Cross-cutting | ContestedAssertion | G8 |
| IV-125 | Implement researcher-approved descriptive survey specifications | Analyze | AnalysisSpec | G9 |
| IV-126 | Validate survey results, small cells, and causal boundaries | Analyze | AnalysisResult | G8, G9 |

### 7.7 Phase 6 — Visualization, verification, and release evidence (19 issues, 101 points)

| ID | Issue | Stage | Primary objects | Gate |
|---|---|---|---|---|
| IV-6 | Define the cross-provider benchmark contract | Cross-cutting | Execution | G16 |
| IV-11 | Integrate research-native visualization primitives | Communicate | VisualizationSpec | G14, G18 |
| IV-59 | Define typed research visualization specification | Communicate | VisualizationSpec | G18 |
| IV-60 | Implement interactive claim-evidence graph | Communicate | Claim, EvidenceLink | G14 |
| IV-61 | Implement temporal evidence timeline | Communicate | Event, ContestedAssertion | G7, G14 |
| IV-62 | Implement visualization-to-source navigation | Communicate | Passage, VisualizationSpec | G2 |
| IV-63 | Implement visualization selection rationale | Communicate | VisualizationSpec | G18 |
| IV-64 | Implement V1 golden benchmark harness | Cross-cutting | Execution | G16, G17 |
| IV-65 | Instrument quality, latency, cost, and failure telemetry | Cross-cutting | Execution | G16 |
| IV-66 | Build end-to-end acceptance suite | Cross-cutting | All | G15, G17 |
| IV-67 | Complete security and privacy threat model | Cross-cutting | — | G8, G12, G13 |
| IV-68 | Define release gates and supported-content matrix | Cross-cutting | Source | G12, G24 |
| IV-88 | Export verifiable dossier and reproducibility package | Publish | ExportSnapshot, Manifest | G2, G11 |
| IV-89 | Validate novice and expert comprehension before release | Cross-cutting | — | G20 |
| IV-90 | Implement operational recovery and release evidence bundle | Cross-cutting | Manifest | G21 |
| IV-97 | Generate deterministic plots from validated datasets | Communicate | Observation, VisualizationSpec | G2, G18 |
| IV-98 | Validate plot completeness, legibility, and reconciliation | Communicate | VisualizationSpec, Observation | G18 |
| IV-116 | Implement contribution review, diff, purge, export manifests | Publish | ModelContribution, Manifest | G5 |
| IV-127 | Generate accessible survey tables, charts, and packages | Publish | AnalysisResult, ExportSnapshot | G9, G14 |

### 7.8 Phase 7 — Explicit post-v1 deferrals (16 issues, 113 points)

Every row here is a **deferral**, not a stage mapping. None may be represented as V1 completion (G24).

| ID | Issue | Deferral basis |
|---|---|---|
| IV-13 | Define controlled semantic access through MCP | Outbound MCP is a V1 non-goal |
| IV-69 | Integrate production MCP server SDK | Depends on IV-13 |
| IV-70 | Implement project-scoped MCP authorization | Depends on IV-13 |
| IV-71 | Implement Zotero and OSF connectors | Broad connectors are a V1 non-goal; OSF demand provisional (IV-108) |
| IV-72 | Implement DuckDB statistical-analysis sandbox | Arbitrary statistical execution is a V1 non-goal |
| IV-73 | Implement geographic and archaeological maps | Maps are a V1 non-goal |
| IV-74 | Implement multi-user authorization and collaboration | V1 is single-researcher |
| IV-75 | Implement restricted-data de-identification workflow | Restricted data is excluded at admission in V1 |
| IV-76 | Evaluate Berry LLM as an optional provider | Evaluation only; no V1 adoption |
| IV-106 | Validate federated literature connector demand | Research gate — provisional evidence (IV-102) |
| IV-107 | Validate evidence-clearinghouse connector demand | Research gate — unresolved evidence (IV-102) |
| IV-108 | Validate OSF workflow demand and API feasibility | Research gate — provisional evidence (IV-102) |
| IV-109 | Validate CAQDAS interchange demand and outcome safety | Research gate — unresolved evidence (IV-102) |
| IV-110 | Implement portable quantitative-artifact interchange | Moderate demand support; outside the V1 boundary |
| IV-111 | Implement authorized survey-platform connectors | Broad connectors are a V1 non-goal; policy validation outstanding |
| IV-112 | Implement domain-specific deliverable profiles | Depends on IV-105 |

---

## 8. Verification

**The finite workflow.** A researcher creates a project, establishes purpose, question, posture, and authorized scope; admits sources or an authorized survey file through one fail-closed boundary; inspects coverage and data quality; reads, annotates, and memos in a protected workspace; retrieves evidence and reviews typed connection and claim proposals against exact anchors; extracts and adjudicates reported observations or approves an allow-listed descriptive specification; adjudicates every proposal into an accepted, revised, disputed, deferred, or rejected state; compiles deterministic tables and plots only from adjudicated data and approved specifications; reconciles every mark to its datum; and exports a researcher-owned dossier with authorship, reproducibility, analysis, visualization, and audit manifests. The workflow terminates. Nothing in it requires an unbounded capability.

**Coverage.** 125 of 125 phased issues are mapped in §7 — 23 + 9 + 11 + 18 + 29 + 19 in V1, and 16 explicitly deferred post-v1. Points reconcile to 106 + 41 + 56 + 104 + 168 + 101 = 576 for V1 and 113 for Phase 7, totalling 689.

Two tracker rows are deliberately absent from the matrix and are accounted for here: `IV-1` is the issue template, carries no phase or estimate, and is not work; `IV-2` does not exist in the tracker.

**Acceptance criteria.**

| IV-8 criterion | Satisfied by |
|---|---|
| A canonical product-model document names the objects, lifecycle, and non-goals | §2, §3, §5 |
| A project can be represented without a spreadsheet or dashboard schema | §2.3 |
| The MVP roadmap maps each planned capability to a research-lifecycle stage | §7 |
| Every planned issue maps to an object, stage, gate, or post-v1 deferral | §7, all 125 rows |

**Downstream obligations.** IV-16 adopts §2 as its object list, including `Artifact` and the §2.2 extended objects. IV-20 and IV-68 own the enforcement and release forms of §4. IV-103 tests §1.1 as a hypothesis and may not silently supersede it.
