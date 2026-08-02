# IV-102 — Social-science tool, source, and adoption landscape review

**Version 2** · 2026-08-02 · **Status:** delivered, with declared boundaries
**Issue:** [IV-102](https://app.notion.com/p/3b09cb079ddb814d8075cc666a7320aa)
**Supersedes:** version 1 (2026-08-01), which was never committed to this repository (§1)

This review exists to stop vendor claims and plausible intuitions from becoming roadmap
commitments. Its central discipline is that **every claim below carries its source, that
source's class, and the confidence the class supports** — and that where evidence is
absent, the absence is recorded rather than filled in.

---

## 1. Why this version exists

Version 1 was recorded in the issue tracker as delivered on 2026-08-01, at
`docs/iv-102-landscape-review.md`, with a protocol at `docs/iv-102-chapter-plan.md` and a
claim/source record at `docs/iv-102-phase1-literature-search-report.md`.

**None of those three files has ever existed in this repository.** Verified by
`git log --all --diff-filter=A --name-only` across every branch and the full history: no
file matching `iv-102`, `landscape-review`, `chapter-plan`, or `literature-search` was
ever added. Before this document, the entire `docs/` tree across all branches was two
files, both from other issues.

What survives from v1 is its **decision ledger and stated limitations**, recorded in the
issue body. Those are reproduced and independently re-examined in §5 and §6. What does
not survive is v1's **source base**: the ledger cites 48 core sources with specific
properties (13 peer-reviewed or archival preprints; 79% of geographically identifiable
sources US-based). Those 48 sources are not recoverable from the tracker.

This version therefore does not claim to be v1 restored. It is a **new review with a
smaller, fully disclosed source base**, whose verdicts are compared against v1's in §8.
Where this version reaches the same verdict on independent evidence, that is recorded as
corroboration. Where it cannot reach a verdict at all, that is recorded as such.

**On the three-artifact structure.** v1 named three files: the review, a protocol
(`-chapter-plan.md`), and a claim/source record (`-phase1-literature-search-report.md`).
This version deliberately consolidates all three into one document — the protocol is §2
and the claim/source record is §3 — because at this source-base size, splitting them
would separate each claim from the classification that bounds it, which is the one thing
this review exists to keep together. If the source base grows past what one document can
carry legibly, §3 should split out first.

---

## 2. Review protocol

### 2.1 Research questions

| # | Question |
|---|---|
| RQ1 | What is the evidence on AI-tool adoption among researchers, and what do researchers report about accountability when using them? |
| RQ2 | How accurate are AI literature-review and extraction tools when independently evaluated? |
| RQ3 | What is the qualitative-analysis software landscape, and what does independent evidence say about its use? |
| RQ4 | What architecture governs access to restricted statistical microdata, and is third-party integration feasible? |
| RQ5 | What is the adoption state of open-science infrastructure? |
| RQ6 | What evidence exists for equity-of-access as a design constraint? |

### 2.2 Search boundaries — declared

This review searched **English-language, publicly indexed web sources reachable without
authentication, between 2022 and August 2026**, using general web search.

It did **not** search: subscription bibliographic databases (Scopus, Web of Science),
institutional repositories requiring credentials, non-English sources, or grey literature
not surfaced by general web search. It conducted no primary research — no interviews, no
surveys, no telemetry.

These boundaries are narrower than the issue's stated ambition, which asks for coverage
across experimental economics, text-as-data, computational social science, network
analysis, agent-based modeling, survey research, and applied professional workflows.
**Those domains are not covered by this version.** §6 records this as the primary
limitation; §9 states what follows from it.

### 2.3 Inclusion and exclusion

**Included** when a source (a) addresses one of RQ1–RQ6, (b) has an identifiable
publisher or author, and (c) has a stable, citable URL.

**Excluded** when a source is (a) affiliate or SEO content marketing, (b) a vendor page
used to support an *adoption* or *market-position* claim, (c) retracted, or (d) not
retrievable for verification. Every exclusion is logged in §3.2 with its reason — an
exclusion that is not recorded is indistinguishable from an oversight.

### 2.4 Source classification

Every source carries exactly one class. The class bounds what the source may support.

| Class | May support | May **not** support |
|---|---|---|
| **V** Vendor-authored | Product capability; pricing; stated roadmap | Adoption prevalence; quality; market leadership |
| **E** Independent empirical research | Findings within its stated design and sample | Generalization beyond its sample frame |
| **I** Institutional documentation | Process, requirement, and architecture facts | Prevalence outside the institution |
| **P** Practitioner report | Existence of a practice; lived difficulty | Prevalence |
| **C** Commentary | Framing; hypothesis generation | Any factual claim |

### 2.5 Retrieval tiers

A discipline this review adds, because it materially changes what the evidence supports:

| Tier | Meaning |
|---|---|
| **T1** | Full text independently retrieved and read during this review |
| **T2** | Title, venue, and URL confirmed in a search index; content known only through search-engine extraction |
| **T3** | Referenced by another source; not independently located |

**Every source in this version is T2 or lower.** No full text was independently retrieved:
the single fetch attempted (§3.2) returned HTTP 403. This is the review's second major
limitation and it constrains every figure quoted below — figures are reported *as the
search index rendered them*, and none has been checked against the source's own text.
Numbers in §4 should be treated as **indicative of direction, not as citable values**.

### 2.6 Confidence

| Level | Requires |
|---|---|
| **Supported** | ≥2 independent sources, at least one class **E** or **I**, no substantive contradiction |
| **Moderate** | 1 class **E**/**I** source, or several consistent lower-class sources |
| **Provisional** | Directionally consistent but thin, or T2-only on a contested question |
| **Unresolved** | Evidence absent, contradictory, or below the class threshold |
| **Refuted** | Evidence positively contradicts the proposition |

---

## 3. Source register

### 3.1 Included sources

| # | Source | Class | Tier | RQ |
|---|---|---|---|---|
| S1 | [Generative AI usage by researchers at work: effects of gender, career stage, workplace, and perceived barriers](https://arxiv.org/pdf/2409.14570) (preprint) | E | T2 | RQ1 |
| S2 | [Who Uses Artificial Intelligence in Research — And for What?](https://www.ip.mpg.de/en/research/research-news/ai-in-research.html), Max Planck Institute for Innovation and Competition (n≈6,215) | I | T2 | RQ1 |
| S3 | [Is it OK for AI to write science papers? Nature survey shows researchers are split](https://www.nature.com/articles/d41586-025-01463-8) | I | T2 | RQ1 |
| S4 | [More than half of researchers now use AI for peer review — often against guidance](https://www.nature.com/articles/d41586-025-04066-5) (n≈1,600) | I | T2 | RQ1 |
| S5 | [AI tools boost individual scientists but could limit research as a whole](https://www.nature.com/articles/d41586-025-04092-3) | I | T2 | RQ1 |
| S6 | [How Researchers Navigate Accountability, Transparency, and Trust When Using AI Tools in Early-Stage Research: A Think-Aloud Study](https://arxiv.org/pdf/2604.23136) (preprint) | E | T2 | RQ1 |
| S7 | [Evaluating the AI Tool "Elicit" as a Semi-Automated Second Reviewer for Data Extraction in Systematic Reviews: A Proof-of-Concept](https://journals.sagepub.com/doi/10.1177/08944393251404052), Hilkenmeier et al., *Social Science Computer Review*, 2025 | E | T2 | RQ2 |
| S8 | [Trust in AI: Evaluating Scite, Elicit, Consensus, and Scopus AI for Generating Literature Reviews](https://library.hkust.edu.hk/news-events/news/trust-ai-evaluating-scite-elicit-consensus-and-scopus-ai-generating-literature), HKUST Library | I | T2 | RQ2 |
| S9 | [The Future of Scientific Writing: AI Tools, Benefits, and Ethical Implications](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11981593/) | E | T2 | RQ2 |
| S10 | [Advancing Qualitative Research Using QDAS? Reviewing Potential Versus Practice in Published Studies using ATLAS.ti and NVivo, 1994–2013](https://www.researchgate.net/publication/281323388) (content analysis, n=763 articles) | E | T2 | RQ3 |
| S11 | [About Federal Statistical Research Data Centers](https://www.census.gov/about/adrm/fsrdc/about.html), U.S. Census Bureau | I | T2 | RQ4 |
| S12 | [Restricted-Use Data Application Process](https://www.census.gov/topics/research/guidance/restricted-use-microdata/standard-application-process.html), U.S. Census Bureau | I | T2 | RQ4 |
| S13 | [Secure Remote Access for FSRDC Research](https://www.census.gov/about/adrm/fsrdc/about/secure-remote-access.html), U.S. Census Bureau | I | T2 | RQ4 |
| S14 | [FSRDC Data and Guidelines](https://dlab.berkeley.edu/data/fsrdc-data-and-guidelines), UC Berkeley D-Lab | I | T2 | RQ4 |
| S15 | [Government Restricted Data](https://guides.nyu.edu/business-econ-data/government-restricted-data), NYU Libraries | I | T2 | RQ4 |
| S16 | [OSF Reaches 500,000 Registered Users](https://www.cos.io/about/news/open-science-framework-reaches-500000-registered-users-worldwide), Center for Open Science | V | T2 | RQ5 |
| S17 | [Surpassing 100,000 Registrations on OSF](https://www.cos.io/blog/surpassing-100000-registrations-on-osf), Center for Open Science | V | T2 | RQ5 |
| S18 | [Fostering open science and responsible research practices: a pre-post study](https://pubmed.ncbi.nlm.nih.gov/40443909/) | E | T2 | RQ5 |
| S19 | [Causal evidence of racial and institutional biases in accessing paywalled articles and scientific data](https://arxiv.org/pdf/2509.08299) (preprint) | E | T2 | RQ6 |
| S20 | [Open-access publishing fees deter researchers in the global south](https://www.nature.com/articles/d41586-022-00342-w), *Nature* | I | T2 | RQ6 |
| S21 | [Article Processing Charges Threaten Global Health Equity: Open Access is Closed Science](https://www.medrxiv.org/content/10.1101/2024.11.22.24317779.full.pdf) (preprint) | E | T2 | RQ6 |
| S22 | [The evolution and implications of equitable open access](https://www.editage.com/insights/the-evolution-and-implications-of-equitable-open-access-a-perspective-from-the-global-south), Editage Insights | C | T2 | RQ6 |
| S23 | [The Impact of Paywalls on Global Research Equity](https://editorscafe.org/details.php?id=65) | C | T2 | RQ6 |

**Composition.** 23 included sources: 8 class **E**, 11 class **I**, 2 class **V**,
2 class **C**, 0 class **P**. Peer-reviewed or archival-preprint share: 8/23 ≈ **35%**
(S1, S6, S7, S9, S10, S18, S19, S21), which is **below the 70% gate v1 declared for
itself** — the same failure mode v1 recorded, at a similar magnitude (v1: 13/48 ≈ 27%).

The absence of any class **P** source is itself a finding: no practitioner report met the
inclusion criteria, so this review carries **no direct researcher voice**. v1 covered that
gap with Reddit sentiment, explicitly marked non-decisive and hypothesis-generating. This
version has no equivalent, which is why §5's accountable-augmentation verdict rests on S6
— an independent study — rather than on reported sentiment.

### 3.2 Exclusion log

| Source | Reason |
|---|---|
| *Assessing the Effectiveness of AI Tools (Elicit, SciSpace, and Consensus) in Literature Review and Research*, Canadian Journal of Information and Library Science | Search index flags it **[Retracted]**. Article page returned **HTTP 403**, so the retraction notice could not be read. Excluded on the flag; the retraction itself is **unverified**. |
| Lumivero blog, "Best qualitative data analysis software (2026)" | Class **V** — Lumivero publishes NVivo. Cannot support a comparative or adoption claim (§2.4). |
| *Nature*/Fudan partner content, "AI for Science 2026" | Partner content; class **V** for prevalence purposes. Figures on tool-share circulated from it are excluded from §4.1. |
| sourcely.net, aitoolranked.com | Affiliate/SEO content marketing (§2.3a). |
| newsrx.com blog, "How scientists are using AI in 2026" | Class **C** aggregating unattributed figures; no independent value. |
| Elite Research LLC review | Class **P/C** vendor-adjacent consultancy; not used for comparative claims. |
| ResearchGate Q&A threads on CAQDAS comparison | Class **C**; unattributable participants. |

Note that the excluded set includes the *only* source that directly compared several AI
literature-review tools head to head. §4.2 is correspondingly thin, and that is a
consequence of the protocol working rather than a gap to be papered over.

---

## 4. Findings

Every figure below is **T2** (§2.5): rendered by a search index, not read in the source.
Treat directions as informative and magnitudes as unconfirmed.

### 4.1 RQ1 — AI adoption and researcher accountability

Adoption is broad and rising, and is concentrated in general-purpose assistants rather
than research-specific tools. S2 (n≈6,215) and S3 establish institutional-scale usage;
S4 reports that more than half of ~1,600 surveyed academics have used AI tools while peer
reviewing, **often against the guidance of the venues involved**. S1 finds adoption varies
by gender, career stage, and workplace type — so aggregate adoption figures conceal
substantial population differences.

The finding most consequential for Ivory Tower is S6, a think-aloud study of how
researchers navigate **accountability, transparency, and trust** when using AI in
early-stage research. Its existence as an independent empirical study of *accountability
specifically* is what elevates the accountable-augmentation principle above a product
intuition. S5 adds the countervailing consideration that individual-level gains may not
aggregate to field-level gains.

> **Confidence: Supported** — that adoption is broad and that accountability is a live,
> studied researcher concern. **Unresolved** — the size of the effect, and whether stated
> accountability concerns predict tool choice.

### 4.2 RQ2 — Accuracy of AI literature tools

S7 is the strongest available evidence: a proof-of-concept evaluating Elicit as a
semi-automated *second* reviewer for data extraction, reporting accuracy **not
statistically distinguishable from human reviewers** on its task. The framing matters more
than the number — the tool is positioned as a second reviewer, not a replacement, which is
the same accountable-augmentation shape as §4.1.

S8 (institutional) and S9 report that output quality and source recency vary substantially
across tools, and that corpus cut-off dates differ. S9 additionally reports limitations
around standardization of writing style and authorship accountability.

The head-to-head comparison that would have anchored this section is retracted and
unreadable (§3.2).

> **Confidence: Moderate** — that bounded extraction assistance under human review is
> viable. **Unresolved** — comparative accuracy between tools, and accuracy on
> interpretive rather than extractive tasks.

### 4.3 RQ3 — Qualitative analysis software

S10 is a content analysis of 763 empirical articles (1994–2013) reporting ATLAS.ti or
NVivo use. Two findings carry: reported use rose year over year, and the literature
clusters in **health sciences** and in the **UK, US, Netherlands, Canada, and Australia**.
The vendor-published comparisons that dominate search results for this question were
excluded (§3.2), leaving no current independent comparative evidence.

> **Confidence: Provisional** — the evidence is a decade stale at its endpoint and
> health-sciences-weighted. **Unresolved** — current market composition, and CAQDAS
> interchange demand.

### 4.4 RQ4 — Restricted microdata architecture

This is the review's best-evidenced finding, on five independent class **I** sources
(S11–S15), and it is decisive for product scope.

Access to restricted federal statistical microdata is governed by an **enclave
architecture**. Per S11–S13: a researcher must be attached to an approved project *and*
hold **Special Sworn Status**, which requires a background investigation and
fingerprinting; approved individuals take an oath of confidentiality binding **for life**,
carrying legal penalties. Work occurs at one of 30+ secure physical locations, or — where
authorized — from a **secure designated space** within a residence, inside the FSRDC
computing environment.

The architectural consequence is unambiguous: the data does not leave the enclave, and the
computation happens inside it. A third-party application cannot ingest this material,
because ingestion is the specific act the architecture exists to prevent. This is not a
matter of certification difficulty or roadmap sequencing.

> **Confidence: Refuted** — restricted federal microdata integration is foreclosed by the
> access architecture, not merely difficult. This independently corroborates v1's verdict.

### 4.5 RQ5 — Open-science infrastructure

S16 and S17 report OSF passing 500,000 registered users and 100,000 registrations, with
accelerating growth. **Both are class V** — the Center for Open Science operates OSF — so
under §2.4 they support *capability and scale of the platform's own records* but cannot
alone support a claim about researcher-population prevalence. S18 supplies independent
peer-reviewed evidence that open-science practice responds to intervention, which is a
different claim from prevalence.

> **Confidence: Moderate** — that open-science infrastructure has meaningful and growing
> use. **Unresolved** — what share of the target research population uses it, and OSF
> workflow-integration demand specifically.

### 4.6 RQ6 — Equity of access

S19 provides causal evidence of racial and institutional biases in access to paywalled
articles and scientific data. S20 and S21 document the article-processing-charge paradox:
open-access fee structures deter exactly the authors that open access was intended to
serve, with S20 reporting that authors in low-income countries rarely publish free-to-read
papers **even when they qualify for fee waivers** — which indicates the barrier is not
solely price. S22 and S23 are class **C** and are used for framing only; the widely
circulated figures they carry (a ~75% paywalled share; a 34% vs 21% Global South/North
split in spontaneously reported paywall barriers) are **not** treated as established here,
because neither source was retrievable at tier T1 and neither is class **E**.

> **Confidence: Supported** — access inequity is real, measurable, and causally
> demonstrated. **Unresolved** — the specific mechanism by which a research tool would
> reduce it, and whether waiver-eligible non-uptake is informational, procedural, or
> reputational.

---

## 5. Decision ledger

Each proposed opportunity is marked **supported**, **provisional**, **refuted**, or
**unresolved**, per the issue's fourth acceptance criterion. The v1 column is reproduced
from the issue body; the v2 column is this review's independent finding.

| Opportunity | v1 verdict | v2 verdict | Basis |
|---|---|---|---|
| Visualization need | Moderate | **Unresolved** | No source in this version's base addresses visualization demand. v1's moderate rating is not contradicted — it is simply not re-established here. |
| Equity of access as a design constraint | Supported | **Supported** | S19, S20, S21 — corroborated on independent evidence |
| Literature connector opportunity | Provisional | **Provisional** | S7–S9 show bounded viability; no demand evidence |
| OSF workflow opportunity | Provisional | **Provisional** | S16–S18 show platform scale, not integration demand |
| Evidence-clearinghouse opportunity | Unresolved | **Unresolved** | No source located |
| CAQDAS interchange opportunity | Unresolved | **Unresolved** | S10 is a decade stale; comparatives excluded as vendor |
| IRB-aware de-identification | Required, not a differentiator | **Unresolved as a differentiator** | Not addressed by this version's sources; v1's finding stands unchallenged |
| Restricted federal microdata integration | Refuted | **Refuted** | S11–S15 — corroborated, and strengthened |
| Multi-agent orchestration | No demand evidence | **No demand evidence** | No source located. Bounded architecture choice only |
| Model agnosticism | No demand evidence | **No demand evidence** | No source located. Governance/procurement justification only |
| Accountable augmentation as the product principle | (implicit) | **Supported** | S6 directly; S4 and S7 consistent |

**The last row is this version's substantive addition.** IV-8 §1.1 makes accountable
augmentation the governing product principle; v1 supported it only through
hypothesis-generating Reddit sentiment, explicitly marked non-decisive. S6 — an
independent think-aloud study of researcher accountability with AI tools — raises it from
intuition to evidenced. S4's finding that AI use in peer review frequently proceeds
*against venue guidance* sharpens it: the governance gap is real and is not self-closing.

**No verdict was upgraded on vendor evidence.** The two class **V** sources (S16, S17)
support only the Moderate rating in §4.5, alongside class **E** S18.

---

## 6. Limitations

These are load-bearing. A reader who skips them will overread everything above.

1. **No source was independently retrieved.** All 23 are tier T2 (§2.5); the one fetch
   attempted returned HTTP 403. Every quoted figure is as rendered by a search index and
   has not been checked against the source text. **No figure here should be cited
   onward without retrieval.**
2. **Peer-reviewed share is 35%, below the 70% gate.** v1 recorded the same failure at
   27%. Two independent attempts falling well short suggests the gate is either wrong for
   an open-web landscape review or unreachable without database access — this needs
   resolving rather than repeating.
3. **Search was general-web and English-only**, without Scopus or Web of Science. Coverage
   is therefore biased toward well-indexed, English-language, Anglophone-institution
   sources — the identical bias v1 recorded as 79% US-based geography.
4. **Seven of the issue's named domains are uncovered**: experimental economics,
   text-as-data, computational social science, network analysis, agent-based modeling,
   survey research, and applied professional workflows. This version says nothing about
   them, and their absence must not be read as absence of opportunity.
5. **The only head-to-head AI-tool comparison is retracted and unreadable**, so §4.2 rests
   on one proof-of-concept plus two descriptive sources.
6. **No primary research.** No interviews, no surveys, no telemetry. Every population
   claim is second-hand.
7. **v1's 48-source base is unrecoverable**, so v1 and v2 cannot be reconciled at the
   source level — only at the verdict level (§5).

---

## 7. Update procedure

Reproducible, per the issue's third acceptance criterion.

1. **Re-run the RQ searches** in §2.1 with the §2.2 boundaries. Record the date.
2. **Classify every new source** by §2.4 class and §2.5 tier before reading it for
   content. Classification precedes extraction so that a persuasive vendor page cannot
   acquire evidential weight through familiarity.
3. **Log every exclusion** in §3.2 with a reason.
4. **Recompute the composition line** in §3.1, including peer-reviewed share against the
   declared gate.
5. **Re-derive each ledger verdict** in §5 from the sources, and record movement in both
   directions. A verdict that improves without new evidence is a defect.
6. **Raise tier before raising confidence.** Retrieving a source at T1 is worth more than
   adding three more at T2.
7. **Version the document**; never edit a prior version's verdicts in place.

**Priority for version 3**, in order: (a) retrieve S6, S7, S19 at T1, since the most
consequential verdicts rest on them; (b) obtain database access to lift the peer-reviewed
share; (c) open the seven uncovered domains; (d) resolve the visualization-need question
this version could not reach.

---

## 8. Reconciliation with version 1

v2 **corroborates** v1 on: equity of access (supported), restricted microdata (refuted),
literature and OSF opportunities (provisional), evidence-clearinghouse and CAQDAS
(unresolved), and the absence of demand evidence for multi-agent orchestration and model
agnosticism.

v2 **cannot reach** v1's verdicts on visualization need or on IRB-aware de-identification.
Neither is contradicted; both are outside this version's source base. **v1's verdicts
stand** on those two questions, with the caveat that they now rest on a source base nobody
can inspect.

v2 **adds** one verdict v1 did not carry: accountable augmentation as an evidenced product
principle (§5, last row).

No v1 verdict is weakened by this version.

---

## 9. What this review does not establish

Stated plainly, because a review's value is bounded by its honesty about its own reach:

- It does **not** establish prevalence of any tool in any research population.
- It does **not** establish willingness to pay, for anything.
- It does **not** establish that Ivory Tower's V1 scope is the right scope. It constrains
  that scope negatively — ruling out restricted microdata (§4.4) and withholding support
  from unevidenced differentiators — without positively validating what remains.
- It does **not** supersede [IV-103](https://app.notion.com/p/3b09cb079ddb814a99d2d5dfd16de215),
  which must still test the connector-and-workflow-layer thesis against a standalone
  vertical application.
- It does **not** license any figure in §4 to be quoted onward. Every one is T2.

Per [`docs/iv-8-product-model.md`](iv-8-product-model.md) §6.3, a **refuted** verdict is
reopened only by new evidence recorded in this ledger, and a finding with **no demand
evidence** may justify an internal architecture choice but may never become a user-facing
product claim.
