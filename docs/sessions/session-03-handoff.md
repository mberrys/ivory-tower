# Session 03 Handoff

## Objective completed

Dependency, licensing, SBOM, and pinning gate (IV-19, Gate 0). Replaced the flat allowlist policy
with a fail-closed machine-readable policy and an offline gate covering the reviewed dependency
inventory, licence classes over each deployable's runtime closure, quality scope, image pinning, and
an owned expiring exception register; added a secret sentinel scan, CycloneDX SBOM and deterministic
notices generation, seven adversarial fixtures that execute the real gate, and a CI governance job.
Brought `@theia/ivory-identity` into every Ivory gate. Reconstructed the missing Session 02 handoff
from repository evidence.

## Canonical commit / branch

Branch `claude/session-3-q9tc4o`, atop `stable` @ `40d48b0`.

- `1a7afe3` — `style(ivory-identity): apply the pinned Ivory Prettier configuration`
- `e941c16` — `feat(ivory-tower): enforce dependency, licence, and pinning governance (IV-19)`
- `5dd4eab` — `docs(ivory-tower): document IV-19 dependency governance`
- this commit — session records

## Files changed

**New:** `scripts/check-ivory-secrets.mjs`, `scripts/generate-ivory-sbom.mjs`,
`scripts/generate-ivory-notices.mjs`, `scripts/ivory-lockfile.mjs`,
`scripts/ivory-dependency-policy-fixtures.json`, `scripts/fixtures/dependency-policy/*` (7
fixtures), `docs/iv-19-dependency-governance.md`, `docs/sessions/session-02-handoff.md`,
`docs/sessions/session-03-dependency-governance.md`, this handoff.

**Modified:** `configs/ivory-dependency-policy.json` (restructured),
`scripts/check-ivory-dependency-policy.mjs` (rewritten), `package.json` (scopes + four new
scripts), `.github/workflows/ivory-tower.yml` (`governance` job), `.gitignore` (`artifacts/`),
`README.md`, `docs/ivory-tower-development.md`, and 13 `packages/ivory-identity/src` files
(formatting only).

No upstream Theia package was modified. `generate-sbom.yml` and `license-check.yml` were left
untouched.

## Tests and commands run

All on Node 22.22.2 / npm 10.9.7 with no `node_modules`; the new scripts are dependency-free.

- `node scripts/check-ivory-dependency-policy.mjs` — pass
- `node scripts/check-ivory-dependency-policy.mjs --fixtures` — pass, 7/7 rejected
- `node scripts/check-ivory-secrets.mjs` — pass
- `node scripts/generate-ivory-sbom.mjs` — 4 documents (source 1215, api 78, worker 77, browser 765)
- `node scripts/generate-ivory-notices.mjs` and `--check` — 524 components, byte-identical rerun
- `node scripts/check-ivory-boundaries.mjs` — pass, no regression
- `npx prettier@3.6.2 --check` over the full Ivory format scope — pass
- Adversarial: floating Docling tag injected into `infra/docker-compose.yml` → rejected, reverted,
  gate green again; every fixture inspected individually for the correct failure reason

## Evidence produced

`artifacts/sbom/{sbom-source,sbom-ivory-api,sbom-ivory-worker,sbom-ivory-browser}.cdx.json` plus
`sbom-manifest.json` (commit SHA, generation mode, toolchain, per-file SHA-256), and
`artifacts/notices/NOTICE-IVORY-THIRD-PARTY.md`. `artifacts/` is gitignored; CI uploads it as
`ivory-governance-evidence-${{ github.sha }}`.

## Acceptance criteria passed

- CI produces an SBOM for the deployable artifacts — source plus one per deployable.
- Every direct dependency records purpose, owner, licence, version policy, data boundary, and
  replacement path; an uninventoried direct dependency fails.
- Docling, PDF.js-class UI libraries, pgvector/PostgreSQL, Graphile Worker, S3, Sentry, Theia, and
  Playwright are represented; LiqUIdify and provider SDKs are **not yet dependencies** and are
  recorded as such rather than as fictional entries.
- A prohibited licence or an unapproved networked dependency fails the policy check — proved by
  fixture, not by assertion.
- `@theia/ivory-identity` participates in format, typecheck, lint, test, and dependency gates.
- Notices and reviewed exceptions are reproducible; regeneration is byte-identical.
- No floating production image can pass.

## Acceptance criteria still open

- **`npm run verify:ivory-tower` has not been run** on the pinned toolchain. It cannot be here:
  `check:ivory-toolchain` requires Node 24.16.0 / npm 11.13.0 and there is no install. CI is the
  first authoritative run. Unverified in particular: `typecheck`, `lint`, and `test` under the
  widened `@theia/ivory-*` scope, and `test:ivory-browser`.
- **Release SBOMs must be regenerated from an installed tree.** The committed evidence is
  `package-lock-only` mode, recorded as such in the manifest.
- **Four licences remain unresolved** — `busboy`, `streamsearch`, `fuzzy`, `xmlhttprequest-ssl`
  publish no licence field. Resolve from an installed tree before the first tagged release; the
  exceptions expire 2026-11-19.
- **Vulnerability disposition is not implemented.** `advisoryExceptions` is validated but no
  advisory feed is wired to it.
- **IV-15's clean-checkout evidence is still missing** (see the Session 02 reconstruction). Not
  Session 03's objective; recorded, not closed.

## Known regressions / risks

- The widened lerna scopes now run `compile`, `lint`, and `test` for `@theia/ivory-identity` inside
  the Ivory gate. Its tests already ran under upstream `test:theia`, so this should be additive —
  but it is unverified here and is the most likely place for CI to go red first.
- The fail-closed inventory means any new direct dependency now fails until someone records its
  purpose, owner, and data boundary. This is intended friction, and it will surprise the first
  person it stops.
- Dependabot bumps that change a transitive licence class will fail the gate until an exception is
  recorded or the licence is allowed. Notices were deliberately kept out of the gate so routine
  bumps do not also require regenerating an artifact.

## Decisions made

- **Image pinning:** production/runtime images require an `@sha256` digest; local-only images may
  keep a tag only with a recorded owner, reason, and expiry. Mutable tags fail everywhere.
- **Gate composition:** `secret:scan` and the fixtures join `verify:ivory-tower`; `sbom:generate`
  and `notices:generate` stay CI/release-only, and `artifacts/` is gitignored rather than committed.
- **Licence closure scope:** runtime dependencies of each deployable, not build tooling.
- **`credential-assignment` excludes TypeScript sources** — 36 false positives, zero true ones.
- **Session 02 handoff reconstructed** from repository evidence, explicitly banner-marked as a
  reconstruction and not as sign-off.

## Do not assume

- Do **not** treat this session as a Gate 0 pass. Gate 0 exit needs Sessions 01–06 reviewed
  together, and IV-21/IV-22/IV-128 are untouched.
- Do **not** treat the committed SBOMs as release evidence — they are `package-lock-only`.
- Do **not** read the four `license-unknown` exceptions as licence clearance. Nothing has cleared
  them; they are timed placeholders.
- Do **not** assume the secret scan covers bundles, logs, telemetry, or audit events. It covers the
  repository and build output. Redaction breadth is IV-22.
- Do **not** widen a prefix rule to make the policy pass. The inventory is fail-closed by design;
  the remedy is a recorded entry or a recorded, expiring exception.

## Exact prerequisite for next session

A green `governance` CI job and a green `verify` matrix on this branch. If either is red, the fix
belongs to a Session 03 repair (`03A`), not to Session 04.

## Recommended next session

**Session 04 — Reproducible local environment and migrations (IV-21):** fresh checkout → healthy
seeded system → teardown, plus N-1 upgrade and restore. It inherits two items from here:

1. `pgvector/pgvector:pg16` needs a digest pin; its recorded exception expires 2026-11-19.
2. IV-15's missing clean-checkout verification evidence, which Session 04's own clean-checkout work
   is the natural place to establish.
