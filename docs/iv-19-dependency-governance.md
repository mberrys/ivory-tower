# IV-19 — Dependency, licensing, SBOM, and pinning governance

**Status:** implemented at Gate 0 (Session 03). **Owner:** Engineering.
**Policy as data:** [`configs/ivory-dependency-policy.json`](../configs/ivory-dependency-policy.json).

This document explains the policy. The JSON file *is* the policy — every rule below is
mechanically enforced, and prose here never overrides it.

## 1. Why this exists

Open-source reuse is a stated Ivory Tower strategy, so the risk is not reuse itself but
*unreviewed* reuse: a dependency nobody chose, a licence nobody read, a network-capable package
nobody bounded, or a production image that silently changes under a mutable tag. IV-19 makes each
of those a mechanical failure rather than a review question.

The gates are **fail-closed and offline**. Every input — workspace manifests, `package-lock.json`,
and the Compose and runtime image references — is read from the working tree. No install, no
registry, no Java, and no external scanner is required, so the result is reproducible from a commit
by anyone.

## 2. Commands

| Command | What it does | In the required gate |
| --- | --- | --- |
| `npm run dependency:policy` | Licences, dependency inventory, quality scope, image pins, exception register, **and the adversarial fixtures** | yes |
| `npm run secret:scan` | Sentinel and credential scan | yes |
| `npm run sbom:generate` | CycloneDX SBOMs into `artifacts/sbom/` | CI / release |
| `npm run notices:generate` | Third-party notices into `artifacts/notices/` | CI / release |
| `npm run notices:check` | Fails if the notices artifact is stale | available, not gate-wired |
| `npm run license:check` | Upstream Eclipse dash-licenses (Theia's own gate; needs Java and network) | no — upstream-owned |

`npm run verify:ivory-tower` runs the first two. SBOM and notices generation is deliberately kept
out of the local gate: it is release evidence, it is slow, and it depends on install state.
`artifacts/` is gitignored and uploaded by the CI `governance` job instead of being committed, so a
dependency bump does not produce a notices diff on every pull request.

## 3. Licence classes

Three classes, in `licenseClasses`:

- **allowed** — permissive and file-level-copyleft expressions that need no per-package decision.
- **reviewRequired** — weak copyleft (LGPL) and attribution-over-content licences (CC-BY). These
  fail unless a recorded exception names the exact `package@version`.
- **prohibited** — strong copyleft and source-available licences (GPL, AGPL, SSPL, BUSL, Elastic),
  plus `UNLICENSED`. **A prohibited licence has no exception path.** The only remedy is removal.

A missing licence is `unknown`, which is treated like `reviewRequired` and denied by default
(`defaults.unknownLicense: "deny"`).

SPDX expressions are evaluated, not string-matched: an `OR` expression passes if any operand is
allowed (`(MPL-2.0 OR Apache-2.0)` resolves through Apache-2.0), and an `AND` expression requires
every operand to be allowed (`(OFL-1.1 AND MIT)`).

**Scope.** The licence closure is computed over the **runtime** dependencies of each entry in
`deployables` — what actually ships. Build and test tooling is out of scope: its licences do not
travel to users, and including it would bury the real signal.

## 4. The dependency inventory

`packages` is the reviewed third-party inventory. Every direct dependency of every Ivory-owned
workspace must have an entry recording:

`allowed`, `scope`, `purpose`, `owner`, `license`, `networkCapable`, `native`, `dataBoundary`,
`sourceContentCrossesBoundary`, `versionPolicy`, `replacementPath`.

A direct dependency with no entry fails the gate
(`defaults.uninventoriedDirectDependency: "deny"`). There is no prefix allowlist — the previous
`@types/*` and `@theia/*` prefix rules let unreviewed packages through, and they are gone.

Two fields carry weight beyond bookkeeping:

- **`dataBoundary` / `sourceContentCrossesBoundary`** record whether research content can cross the
  package boundary. `@sentry/node` is approved as `scrubbed operational metadata only`; if that
  ever stops being true, the entry is wrong and must change before the code does.
- **`replacementPath`** names how the dependency would be replaced. Architectural invariant 2 says
  libraries stay behind owned adapters; a dependency with no credible replacement path is a
  dependency that has quietly become the architecture.

`versionPolicy` is enforced: `exact` requires a pinned version, `range` accepts a reviewable
caret/tilde range, and everything is lockfile-pinned regardless.

## 5. Quality scope

The gate reads the root `package.json` and asserts that **every** Ivory-owned workspace — matched
by name (`@ivory-tower/*`, `@theia/ivory-*`), not by directory prefix — is covered by the scope of
`format:check:ivory-tower`, `typecheck:ivory-tower`, `lint:ivory-tower`, and `test:ivory-tower`.

This closes the specific hole IV-19 step 2 names. Before Session 03, `@theia/ivory-identity` was
invisible to all four: the format globs matched `packages/ivory-tower-*` only, and the lerna scopes
matched `@ivory-tower/*` only. A dependency or lint defect in the identity package failed nothing.
Adding a package under an Ivory name but outside those scopes is now itself a gate failure.

## 6. Image pinning

Every image reference in `infra/docker-compose.yml`, `.env.example`,
`scripts/verify-ivory-runtime.mjs`, and `packages/ivory-tower-infrastructure/src/environment.ts`
must be registered in `images`.

- **Mutable tags are never admissible.** `latest`, `main`, `master`, `edge`, `stable`, `dev`, and
  `nightly` fail unconditionally, in any environment.
- **`environment: "runtime"`** requires an `@sha256:` digest. Docling is pinned this way, and
  environment validation rejects a mutable `DOCLING_IMAGE` at startup independently of this gate.
- **`environment: "local"`** images may carry a tag, but only with a recorded `owner`, `reason`,
  `expires`, and `compensatingControl`. An expired entry fails the gate.

Three local Compose images currently sit in that second category. `pgvector/pgvector:pg16` is the
weakest of them — `pg16` is a rebuilt floating tag, not an immutable one. It is recorded rather
than pinned because the local environment is owned by **IV-21 (Session 04)**, which will pin it by
digest alongside the fixture and restore work. The expiry exists so this cannot be forgotten.

## 7. Exceptions

An exception is a **specific, owned, expiring** record. Every one requires `kind`, `subject`,
`reason`, `owner`, `expires`, and `compensatingControl`; the gate fails on a missing field, on an
expired record, and on a **stale** record that no longer matches anything in the tree. There is no
wildcard form, by construction.

Current register:

| Subject | Kind | Why |
| --- | --- | --- |
| `jschardet@2.3.0` | licence-review | LGPL-2.1+ encoding detection inherited from upstream Theia core; consumed unmodified and dynamically imported |
| `@vscode/codicons@0.0.45` | licence-review | CC-BY-4.0 icon font; the obligation is attribution, satisfied by the notices artifact |
| `busboy@1.6.0`, `streamsearch@1.1.0`, `fuzzy@0.1.3`, `xmlhttprequest-ssl@2.1.2` | licence-unknown | These packages publish **no** `license` field — confirmed against the registry packument on 2026-08-19, not merely absent from the lockfile. Their licence text ships only in their own LICENSE files and must be read from an installed tree before a tagged release |

The four licence-unknown records expire sooner than the review records precisely because they are
unfinished work, not settled decisions.

## 8. Secret scanning

Two tiers, because a single tier is either noisy or useless:

- **Critical patterns** — the sentinel, AWS access keys, private-key blocks, GitHub tokens, and
  Sentry DSNs — are scanned across the whole repository. These have effectively no false-positive
  surface.
- **Remaining patterns** are scanned over the Ivory-owned surface (`secretScan.scanPaths`).
  Upstream Theia's own hygiene is not this gate's subject.

The `credential-assignment` pattern deliberately does not run on TypeScript sources: in
TypeScript, `leaseToken: string` is a type annotation, not a credential, and scanning source files
produced dozens of such false positives with no true ones. It runs on configuration-shaped files,
where a literal value under a credential-shaped key really does mean a committed secret.

The scan covers files that are **staged but not yet committed** (`git ls-files --cached --others
--exclude-standard`), because a credential about to be committed is exactly what the gate is for.

Allowlist entries are exact paths with a reason, an owner, and the specific pattern ids they
suppress — never a directory wildcard.

**Boundary:** this is a repository and build-output scan. Redaction across bundles, logs,
telemetry, and audit events is **IV-22 (Session 05)** and is not claimed here.

## 9. Adversarial fixtures

`npm run dependency:policy` runs seven fixtures under
`scripts/fixtures/dependency-policy/`, each a minimal synthetic tree executed through the **real**
checker. Each must exit non-zero with the expected message:

| Fixture | Proves |
| --- | --- |
| `prohibited-license` | a deployable whose closure reaches GPL-3.0-only is rejected |
| `unapproved-network-dependency` | a network-capable package the inventory refused cannot be depended on |
| `missing-inventory-entry` | a direct dependency with no recorded purpose or data boundary fails |
| `floating-image-tag` | a production image on a mutable tag fails |
| `expired-exception` | a lapsed review window fails |
| `omitted-from-quality-scope` | an Ivory package no required script covers fails |
| `sentinel-secret` | the secret scan rejects a planted sentinel |

These **execute** the gate rather than asserting that a rule exists. The existing boundary fixtures
in `scripts/ivory-boundary-fixtures.json` only check that some rule covers each import, which
cannot catch a checker that stops rejecting; these can.

Fixtures declare their own sentinel value so the repository sentinel never appears in the fixture
tree, and the planted file is named `deploy.env` rather than `.env` so `.gitignore` cannot hide it.

## 10. Model licences and scholarly-data terms

`dataTerms` records these **separately from software licences**, and the separation is the point.

> A software licence is never authorization to ingest scholarly content.

Content admissibility is governed by IV-20 and IV-83 and documented in
[`docs/iv-128-content-rights.md`](iv-128-content-rights.md). This file records only that the
distinction is tracked: V1 bundles **no** model assets (recorded as an explicit empty set, not an
omission), and the scholarly sources named in the safe-open allowlist carry their own terms.

## 11. Update cadence

Per the IV-19 V1 governance addendum (2026-08-03):

- Theia upstream synchronization is owned by Engineering, with a **monthly drift review** and a
  review at each adopted upstream release. Both re-check the licence expressions behind the
  recorded exceptions, since those exceptions describe upstream-inherited packages.
- Exception expiries are the backstop: an expired record fails the gate whether or not a review
  happened on schedule.
- CI runs the full governance job on every push and pull request to `stable` and `dev`, uploading
  SBOMs and notices as build artifacts.

## 12. Known limits

- SBOMs generated without an install run in `package-lock-only` mode. The mode is recorded in
  `artifacts/sbom/sbom-manifest.json`; **release evidence must be regenerated from an installed
  tree**, and the manifest makes a package-lock-only SBOM impossible to mistake for one.
- The four licence-unknown packages are unfinished, not settled. Resolving them requires reading
  LICENSE files from an installed tree.
- Vulnerability disposition (`npm audit` findings and their recorded resolution) is **not**
  implemented here. `advisoryExceptions` exists and is validated, but no advisory feed is wired to
  it; that belongs with the release-drill work in Session 38.
