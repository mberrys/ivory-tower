# Session 03 — Dependency, licensing, SBOM, and pinning gate (IV-19)

**Gate:** 0 — canonical executable baseline. **Primary owner:** IV-19.
**Branch:** `claude/session-3-q9tc4o`, atop `stable` @ `40d48b0`.
**Delivery-evidence state:** `implemented-local` → `canonical` once merged to `stable`.

## Objective

Make third-party dependency and release-artifact governance mechanically enforceable, so that a
prohibited licence, an unreviewed network-capable dependency, a floating production image, an
unscoped Ivory package, or a committed secret each fails a documented gate rather than a review.

## What the repository looked like at the start

`configs/ivory-dependency-policy.json` held five flat allowlists, and
`scripts/check-ivory-dependency-policy.mjs` inspected `packages/ivory-tower-*` plus
`examples/ivory-tower-browser`. Measured against IV-19's acceptance criteria, six things were
missing — and one of them was load-bearing:

1. **`@theia/ivory-identity` failed no Ivory gate at all.** The format globs matched
   `packages/ivory-tower-*`; the lerna scopes matched `@ivory-tower/*`. The identity package — which
   owns stable source, passage, and artifact identifiers, i.e. architectural invariants 3 and 4 —
   matched neither. Formatting, compile, lint, test, and dependency defects there were all silent.
2. No direct dependency recorded purpose, owner, data boundary, replacement path, or version
   policy. `@sentry/node` was approved by bare name, with no recorded data boundary despite being
   the one dependency in the tree that transmits anything outward.
3. No Ivory SBOM. `.github/workflows/generate-sbom.yml` is upstream Theia's — release-triggered,
   cdxgen, publishing to the Eclipse registry. It is not Ivory release evidence.
4. No third-party notices artifact and no exception register.
5. No image-pin enforcement. Docling was digest-pinned in four places by convention, but
   `infra/docker-compose.yml` ran `pgvector/pgvector:pg16`, MinIO, and `mc` on tags no gate read.
6. No secret scan, and no adversarial fixtures.

## Approach

**Offline and deterministic, by construction.** `package-lock.json` is lockfileVersion 3 and carries
a `license` field on 2677 of 2811 entries, so the licence closure of a deployable can be computed
from the working tree alone — no install, no registry, no Java, no external scanner. This matters
beyond convenience: a gate that needs the network is a gate that gets skipped. It also makes the
result reproducible from a commit by anyone, which is what "release evidence" has to mean.

`npm sbom --sbom-format cyclonedx` is built into npm, so SBOM generation added no dependency either.

**Fixtures execute the gate.** The existing boundary fixtures
(`scripts/ivory-boundary-fixtures.json`) only assert that *some rule covers* each prohibited import.
That cannot catch a checker which stops rejecting. The seven new fixtures are minimal synthetic
trees run through the real checker via `--root`, and each must exit non-zero with a specific
message. They run inside `npm run dependency:policy`, so the negative cases cannot rot.

## What was built

| Area | Artifact |
| --- | --- |
| Policy as data | `configs/ivory-dependency-policy.json` — licence classes, defaults, quality scope, deployables, inventory, images, secret-scan config, data terms, exceptions |
| Policy gate | `scripts/check-ivory-dependency-policy.mjs` (`--root`, `--fixtures`) |
| Lockfile resolution | `scripts/ivory-lockfile.mjs` — npm-semantics closure walker, shared by the gate and notices |
| Secret scan | `scripts/check-ivory-secrets.mjs` |
| SBOM | `scripts/generate-ivory-sbom.mjs` → `artifacts/sbom/` |
| Notices | `scripts/generate-ivory-notices.mjs` → `artifacts/notices/` |
| Fixtures | `scripts/fixtures/dependency-policy/*` + `scripts/ivory-dependency-policy-fixtures.json` |
| CI | `.github/workflows/ivory-tower.yml` — new `governance` job uploading `artifacts/**` |
| Docs | `docs/iv-19-dependency-governance.md` |

## Findings the new gate produced on the real tree

These were not hypothetical. Running the gate for the first time surfaced:

- **`@theia/ivory-identity` outside all four quality scopes** — four violations. Fixed by matching
  Ivory workspaces by *name* (`@ivory-tower/*`, `@theia/ivory-*`) rather than directory prefix, and
  by widening the format globs and lerna scopes. Bringing it under the pinned Prettier config
  reformatted 13 files (`1a7afe3`, formatting only).
- **`jschardet@2.3.0` is LGPL-2.1+**, reached transitively through upstream Theia core. Weak
  copyleft, consumed unmodified and dynamically imported — recorded as an owned, expiring exception
  with the bundling mode named, because the obligation changes if the bundling does.
- **Four packages publish no licence field at all** — `busboy@1.6.0`, `streamsearch@1.1.0`,
  `fuzzy@0.1.3`, `xmlhttprequest-ssl@2.1.2`. Confirmed against the npm registry packument on
  2026-08-19: this is genuinely absent published metadata, not a lockfile artifact. Their licence
  text ships only in their own LICENSE files. Recorded as `license-unknown` with a short expiry,
  because they are unfinished work rather than settled decisions.
- **`@vscode/codicons@0.0.45` is CC-BY-4.0** — an attribution licence over an icon font. The
  obligation is attribution, which the notices artifact discharges.
- **`pgvector/pgvector:pg16` is a rebuilt floating tag.** Recorded with an expiry rather than
  pinned, because the local environment belongs to IV-21 (Session 04).
- **A stale exception.** `caniuse-lite` was initially recorded, then removed when the gate's
  staleness rule showed it is build-time only and never in a runtime closure. The rule worked
  before the register did.
- **The secret scan only saw tracked files.** `git ls-files` omits untracked ones, so a credential
  staged for a first commit was invisible — the exact case the gate exists for. Now
  `--cached --others --exclude-standard`.

## Two calibration decisions worth recording

**The `credential-assignment` pattern does not run on TypeScript sources.** Its first run produced
36 findings, every one a type annotation or identifier — `leaseToken: string`,
`secretAccessKey: options.secretAccessKey`, `const token = getDeepLToken()` — and no true positives.
A scan that cries wolf 36 times gets disabled by the third pull request. It now runs on
configuration-shaped files, where a literal value under a credential-shaped key really does mean a
committed secret. The other six patterns still cover source.

**The licence closure covers runtime dependencies, not build tooling.** Build tooling's licences do
not travel to users, and including them would have buried the four genuinely unresolved packages
under hundreds of irrelevant rows.

## Verification

Run at `40d48b0` + this branch, on **Node 22.22.2 / npm 10.9.7 with no `node_modules`** — every new
script is dependency-free by design and reads manifests, `package-lock.json`, and Compose YAML
directly.

| Command | Result |
| --- | --- |
| `node scripts/check-ivory-dependency-policy.mjs` | pass — licences, inventory, quality scope, image pins, exceptions |
| `node scripts/check-ivory-dependency-policy.mjs --fixtures` | pass — 7/7 fixtures still rejected, each for its own reason |
| `node scripts/check-ivory-secrets.mjs` | pass — no sentinel or credential pattern |
| `node scripts/generate-ivory-sbom.mjs` | 4 CycloneDX documents: source 1215, ivory-api 78, ivory-worker 77, ivory-browser 765 components |
| `node scripts/generate-ivory-notices.mjs` | 524 components, 4 licence-unresolved |
| `node scripts/generate-ivory-notices.mjs --check` | pass — byte-identical on regeneration |
| `node scripts/check-ivory-boundaries.mjs` | pass — no regression |
| `npx prettier@3.6.2 --check` over the full Ivory format scope | pass, including `ivory-identity` |

**Adversarial checks against the real tree**, each reverted afterwards:

- Docling ref changed to `:latest` → rejected with
  `references the mutable image tag "quay.io/docling-project/docling-serve:latest"`. Tree restored;
  gate green again.
- Each fixture inspected individually to confirm it fails for its intended rule and not
  incidentally. The `sentinel-secret` fixture initially passed for the **wrong** reason — its
  planted `.env` was hidden by `.gitignore`, and the match came from the sentinel declared in the
  fixture's own config. Repaired: fixtures now declare their own distinct sentinel, and the planted
  file is `deploy.env`.

## Not verified, and why

`npm run verify:ivory-tower` was **not** run. It fails at its first step: `check:ivory-toolchain`
requires Node 24.16.0 / npm 11.13.0 (`configs/ivory-toolchain.json`), and this environment provides
22.22.2 / 10.9.7 with no install. The component-level runs above are not a substitute for the
aggregate gate, and per operating rule 3 this session does not claim one. **CI is the first
authoritative run of the modified gate.**

Specifically unverified here: `typecheck:ivory-tower`, `lint:ivory-tower`, and `test:ivory-tower`
under their widened `@theia/ivory-*` scope, and `test:ivory-browser`.

## Scope held

Not touched, and deliberately so: bundle/log/telemetry redaction and deployment profiles
(IV-22, Session 05); the cutline manifest (IV-128, Session 06); vulnerability disposition
(Session 38). Upstream `generate-sbom.yml` and `license-check.yml` were left alone — every upstream
file edited becomes a recurring merge conflict, and Ivory's evidence belongs in Ivory's own
workflow.
