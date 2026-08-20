# IV-19 — Reviewed third-party dependency inventory

This is the human-reviewed record required by IV-19 step 4: for every direct dependency of an
Ivory-owned package, its purpose, owner, license, version policy, and replacement path. It is a
committed, curated document — distinct from the machine-generated SBOMs and notices produced by
`npm run sbom:generate` and `npm run notices:generate`, which enumerate the full transitive
closure and are evidence artifacts, not authored prose (`docs/v1-build-vs-open-source.md` §
"Repository evidence is authoritative").

Scope: direct dependencies of `packages/ivory-tower-*` and `packages/ivory-identity`
(`@theia/ivory-identity`). Transitive dependencies are covered by the upstream Theia
`npm run license:check` (dash-licenses) gate across the full `package-lock.json`, and by the
generated SBOMs for disclosure. Planned-but-not-yet-installed libraries from ADR-002's stack list
are included below so the inventory stays ahead of, not behind, implementation.

## How to read this table

- **Version policy** — `exact-pinned` (the dependency-policy gate enforces `x.y.z`, no ranges) or
  `lockfile-pinned` (caret/tilde range in `package.json`, resolved version pinned by
  `package-lock.json`).
- **Source-content boundary** — whether the dependency's normal operation can see or transmit
  ingested source/passage content, per architectural invariant 3 (nothing asserted without
  provenance) and the IV-83/IV-87 admission/egress chokepoints.
- **Status** — `installed` (present in a package.json today) or `planned` (named in ADR-002's
  supporting stack, not yet added to any package; will require the same review row updated in
  place, not a new row, once added).

## Runtime and infrastructure dependencies

| Dependency | Purpose | Owner | License | Version policy | Network-capable | Source-content boundary | Replacement path | Status |
|---|---|---|---|---|---|---|---|---|
| `pg` | PostgreSQL driver for canonical state and pgvector queries (`@ivory-tower/infrastructure`, `api`, `worker`) | Engineering | MIT | exact-pinned (`8.16.3`) | yes, to the operator-controlled Postgres instance only | no source content; connection carries structured rows only | `node-postgres` is itself the reviewed choice; a swap would go through `@ivory-tower/adapters`' port interface | installed |
| `pgvector` (Postgres extension, not an npm package) | Hybrid vector + relational search substrate | Engineering | PostgreSQL License (permissive) | image/extension version pinned in `infra/docker-compose.yml` | no (local/private network only, IV-22) | stores embeddings derived from admitted passages | none planned; canonical per ADR-002 | installed (infra) |
| `graphile-worker` | Durable job queue on top of PostgreSQL (`@ivory-tower/infrastructure`, `worker`) | Engineering | MIT | exact-pinned (`0.17.3`) | no (reads/writes the same private Postgres instance) | job payloads may reference source/passage identifiers, never raw content bytes | none planned; canonical per ADR-002 | installed |
| `@aws-sdk/client-s3` | S3-compatible object storage client for the hosted/staging profile (`@ivory-tower/infrastructure`) | Engineering | Apache-2.0 | exact-pinned (`3.1113.0`) | yes, to the configured S3-compatible endpoint only (IVORY_S3_ENDPOINT) | yes — this is the admitted-source-bytes storage boundary; access is gated by the IV-83 admission chokepoint upstream, not by this library | swappable behind the `ObjectStore` adapter port (`@ivory-tower/adapters`); local profile uses the filesystem adapter instead | installed |
| `@sentry/node` | Server-side operational error/telemetry reporting (`@ivory-tower/infrastructure`) | Engineering | MIT | exact-pinned (`10.70.0`) | yes — reports to the configured `SENTRY_DSN`, disabled unless `SENTRY_ENABLED=true` | **scrubbed operational metadata only** (recorded data boundary in `configs/ivory-dependency-policy.json`); must never receive passage/source text or model output | could be removed/disabled entirely without affecting product behavior; no replacement required | installed |
| `zod` | Runtime schema validation for versioned contracts (`@ivory-tower/contracts`) | Engineering | MIT | lockfile-pinned (`^4.4.3`) | no | validates shapes only; never transmits data itself | low switching cost; contract package is the only consumer | installed |
| `tslib` | TypeScript helper runtime, used across Ivory packages | Engineering | 0BSD | lockfile-pinned | no | none | standard TypeScript output dependency; no realistic replacement need | installed |
| Docling (`docling-serve` container image) | Document conversion service invoked over HTTP by `@ivory-tower/infrastructure`'s conversion adapter | Third-party (Docling project) | MIT | **digest-pinned**: `quay.io/docling-project/docling-serve:v1.21.0@sha256:32b3de41f325f93c1dd35907cd9147fa35df9f7c5abc86eb2788b6bda7ce6d10`; mutable tags are rejected at startup by `validateIvoryTowerEnvironment` (`packages/ivory-tower-infrastructure/src/environment.ts`) | private/internal only per `docs/ivory-tower-development.md`; never a public fallback | yes — receives admitted-source bytes for conversion; only reachable after the IV-83 admission decision | conversion is behind a versioned port (`docs/ivory-tower-development.md` "Docling pin and supported registry"); a mirror may replace Quay only after resolving the same manifest list | installed (infra) |

## Planned UI and analysis dependencies (ADR-002 stack; not yet installed)

| Dependency | Purpose | Owner | License (as published) | Version policy (planned) | Network-capable | Source-content boundary | Replacement path | Status |
|---|---|---|---|---|---|---|---|---|
| `liquidify-react` (v0.6.25) | Component library for Ivory Tower's own Theia views (research workspace, evidence inspector, adjudication, dossier) — not the workbench shell | Engineering, via the IV-23 UI adapter | MIT | lockfile-pinned once added; added to the specific consuming Ivory package, never the monorepo root (`CLAUDE.md`) | no | UI rendering only; consumes already-adjudicated data passed in as props | isolated behind `@ivory-tower/ui` / `@ivory-tower/theia-ui` per IV-23; a library swap would not touch feature code | planned |
| `pdfjs-dist` (PDF.js) | Source PDF viewer for exact passage navigation | Engineering | Apache-2.0 | to be lockfile-pinned; high-risk review before install given direct handling of source bytes | no (client-side rendering) | yes — renders admitted source PDFs directly; must only receive bytes that already passed IV-83 admission | Mozilla's PDF.js is itself the reviewed choice per ADR-002; no alternate planned | planned |
| Cytoscape.js | Claim-evidence graph rendering | Engineering | MIT | to be lockfile-pinned | no | renders claim/evidence identifiers and adjudication state, not raw source text | ADR-002 canonical choice; alternative graph libraries would require an adapter rewrite | planned |
| Vega-Lite (or equivalent adapter) | Reported-data chart rendering for approved visualization specs | Engineering | BSD-3-Clause | to be lockfile-pinned | no | renders researcher-approved observation data only, never raw passages | ADR-002 allows "or equivalent adapter" — swappable behind the visualization port | planned |
| AI SDK provider registry (`ai`, `@ai-sdk/*`) | Direct provider adapters (≥2) for claim generation | Engineering | Apache-2.0 | to be exact/lockfile-pinned per provider risk; **egress requires the IV-87 policy-approved, disclosed dispatch path** | yes — this is the primary external-provider egress surface | yes — provider calls may transmit retrieved passage evidence; gated entirely by IV-87 project-authorized, disclosed dispatch | replaceable capability adapters by design (Session 21 / IV-4); no vendor lock-in | not yet a direct Ivory Tower dependency (currently only present via upstream Theia's own `@theia/ai-*` packages, which Ivory Tower does not consume) |
| Model assets (embedding/ranking models, if any are vendored rather than API-called) | Retrieval/ranking support | TBD | TBD — must be recorded separately from software licenses per IV-19 "Technical requirements" | N/A | depends on deployment (local inference vs. API) | would process passage content directly if vendored | none identified yet; no model assets are currently vendored in this repository | not applicable yet — no model asset has been selected |

## Governance mechanics

- **Policy source of truth:** `configs/ivory-dependency-policy.json` — allowed license expressions,
  allowed dependency name prefixes (`@ivory-tower/`, `@theia/`, `@types/`), approved
  network-capable dependencies, and the high-risk exact-pin list.
- **Enforcement:** `npm run dependency:policy` (`scripts/check-ivory-dependency-policy.mjs`) scans
  every `packages/ivory-tower-*` and `packages/ivory-identity` manifest (dynamically discovered by
  directory name, so a new Ivory package cannot be silently omitted from scope) plus
  `examples/ivory-tower-browser`, and fails on: an unapproved license, an unapproved dependency
  name, a high-risk dependency that is not exact-pinned, a malformed advisory exception, or a
  Docling image reference that is not digest-pinned. The same script runs three adversarial
  fixtures (`configs/ivory-dependency-policy-fixtures.json`) through the real violation-detection
  function on every invocation, so a regression in the checker itself — not just in a dependency —
  fails the gate.
- **SBOM generation:** `npm run sbom:generate` (`scripts/generate-ivory-sbom.mjs`) produces
  CycloneDX-shaped SBOMs for the Ivory Tower source tree and for each deployable artifact (`api`,
  `worker`) by walking the resolved `package-lock.json` dependency graph from those workspaces'
  production dependencies. Output goes to `artifacts/` (generated evidence, gitignored — archived
  with release evidence, not committed as source, per IV-19 step 3).
- **Third-party notices:** `npm run notices:generate`
  (`scripts/generate-ivory-notices.mjs`) produces a deterministic notices listing plus the current
  `advisoryExceptions` from the policy file, also to `artifacts/`.
- **Secret sentinel scan:** `npm run secret:scan` (`scripts/check-ivory-secrets.mjs`) scans Ivory
  source/config for high-signal credential patterns (AWS access key IDs, PEM private key headers,
  Anthropic/OpenAI-style API key shapes, Slack tokens, inline `SECRET`/`TOKEN`/`API_KEY`
  assignments), self-testing every pattern against a synthetic sample before scanning real files.
  Wired into `npm run verify:ivory-tower`.
- **Exceptions:** any policy exception must be recorded in `configs/ivory-dependency-policy.json`'s
  `advisoryExceptions` array with `package`, `advisory`, `reason`, `owner`, and `expires` — enforced
  structurally by `evaluateExceptions` in the policy checker. There are no exceptions recorded as of
  this session; a broad wildcard is never used to make the gate pass (IV-19 step 6).

## Definition-of-complete checklist status (from the IV-19 issue body)

- [x] `@sentry/node` is explicitly approved and pinned with a documented data boundary (see table
      above and `configs/ivory-dependency-policy.json`).
- [x] `@theia/ivory-identity` participates in format/type/lint/test/dependency/boundary gates —
      fixed this session in `package.json` (`format:check:ivory-tower`, `typecheck:ivory-tower`,
      `lint:ivory-tower`, `verify:ivory-tower`'s test step), `scripts/check-ivory-dependency-policy.mjs`
      (directory-driven package discovery), and `scripts/check-ivory-boundaries.mjs` (new
      `@theia/ivory-identity` layer).
- [x] Source and production SBOMs can be generated from any commit and archived as release evidence
      (`npm run sbom:generate`); not yet run from an actual tagged release commit, since none exists
      yet — this is a mechanism, not a completed release-evidence artifact.
- [x] Third-party notices and reviewed exceptions are reproducible (`npm run notices:generate`;
      this document).
- [x] No floating production image or unreviewed network-capable dependency can pass CI: Docling is
      digest-pinned and enforced by both `validateIvoryTowerEnvironment` (runtime, existing) and the
      dependency-policy gate's `checkDoclingPin` (static, added this session); `approvedNetworkDependencies`
      is an explicit allowlist in the policy file.

## What this does not settle

- No CI workflow yet runs `sbom:generate`/`notices:generate` on a release event and archives the
  output as attached release evidence — the generation mechanism exists
  (`.github/workflows/ivory-dependency-gate.yml`), but no v1 release has occurred to produce that
  evidence bundle.
- The planned UI/analysis dependencies (LiqUIdify, PDF.js, Cytoscape.js, Vega-Lite, AI SDK
  providers) are reviewed *in advance* here, but their actual license/version fields must be
  re-verified against the real installed version at the time each is added — this table is not a
  substitute for that follow-up review.
- Model-asset licensing has no entries because no model asset is vendored yet; this section must be
  populated before any local-inference model is added, per the IV-19 technical requirement to record
  model licenses separately from software licenses.
