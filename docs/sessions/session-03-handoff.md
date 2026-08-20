# Session 03 Handoff

## Objective completed

Dependency, licensing, SBOM, and pinning gate (IV-19, Gate 0). Closed the four acceptance
criteria mechanically: CI now produces a CycloneDX source SBOM and a derived deployable-artifact
SBOM for `@ivory-tower/api`/`@ivory-tower/worker`; every direct dependency of an Ivory-owned
package plus the technologies IV-19 names explicitly (LiqUIdify, Docling, PDF.js, AI SDK provider
adapters, pgvector, visualization libraries, model assets) are recorded in a reviewed inventory
with purpose/license/version-policy/replacement-path; the dependency-policy gate has adversarial
fixtures proving it rejects an unapproved network dependency, a prohibited license, a floating
high-risk version pin, and a package silently omitted from scope; and `@theia/ivory-identity`,
which previously ran outside the format/typecheck/lint/test/dependency/boundary gates entirely,
now participates in all of them.

## Canonical commit / branch

- Started from `stable` @ `40d48b06b579c5301b97401a3ba11067a28ffbd6` (branch was a clean cut from
  `origin/stable`, empty diff at session start).
- Work branch: `claude/session-3-q9tc4o`.

## Files changed

New:

- `configs/ivory-third-party-inventory.json` — the reviewed third-party inventory.
- `configs/ivory-dependency-policy-fixtures.json` — adversarial fixtures for the dependency gate.
- `scripts/check-ivory-third-party-inventory.mjs` — enforces the inventory.
- `scripts/check-ivory-secret-scan.mjs` — sentinel secret scan with self-test fixtures.
- `scripts/generate-ivory-sbom.mjs` — source + deployable-artifact CycloneDX SBOM generation.
- `scripts/generate-ivory-notices.mjs` / `scripts/check-ivory-notices.mjs` — notices rendering and
  drift check.
- `THIRD-PARTY-NOTICES-ivory-tower.md` — generated output, committed so it is reviewable in a diff.
- `docs/iv-19-dependency-governance.md` — maps the requirement onto the mechanism.

Modified:

- `scripts/check-ivory-dependency-policy.mjs` — added `packages/ivory-identity` to the scanned
  manifests; factored the allow-list predicate out so the new fixture check can reuse it; added the
  adversarial-fixture verification block.
- `scripts/check-ivory-boundaries.mjs` / `scripts/ivory-boundary-fixtures.json` — added a
  `@theia/ivory-identity` layer (forbids `@theia/`, `@ivory-tower/`, and every platform/infra
  dependency) with negative fixtures.
- `packages/ivory-tower-infrastructure/src/package.spec.ts` — added the floating-Docling-image-tag
  adversarial fixture test (the digest-pin rejection in `environment.ts` existed already but had no
  fixture-style test isolating that specific rejection reason).
- `package.json` — new scripts (`inventory:policy:ivory-tower`, `secret:scan:ivory-tower`,
  `notices:generate:ivory-tower`, `notices:check:ivory-tower`, `sbom:generate:ivory-tower`); added
  `--scope "@theia/ivory-identity"` to `typecheck:ivory-tower`, `lint:ivory-tower`,
  `test:ivory-tower`; added the `packages/ivory-identity/src` glob to
  `format:check:ivory-tower`/`format:write:ivory-tower`; `verify:ivory-tower` now chains
  `inventory:policy:ivory-tower`, `secret:scan:ivory-tower`, and `notices:check:ivory-tower` (all
  fast/deterministic/no-network) and reuses `test:ivory-tower` instead of duplicating the lerna
  invocation inline.
- `.github/workflows/ivory-tower.yml` — new `sbom` job: `npm ci` → `npm run
  sbom:generate:ivory-tower` → upload `artifacts/*.cdx.json` as a build artifact, on every push/PR
  (kept out of the `verify` job because it needs network access to fetch the scanner).
- `.gitignore` — `/artifacts/` (generated SBOM evidence; archived by CI, not committed).
- `README.md` — SBOM section rewritten to describe the implemented mechanism instead of pointing
  forward to "IV-19, in Phase 1".
- `packages/ivory-identity/src/**/*.ts` (13 files) — **prettier --write only**, no logic changes.
  Adding `ivory-identity` to the format gate surfaced pre-existing formatting drift (the package
  predates the pinned Ivory Prettier config being applied to it); fixed so the gate that now
  includes it actually passes rather than including it in a broken state.

## Tests and commands run

Toolchain note: this sandbox has Node 22.22.2/npm 10.9.7, not the pinned 24.16.0/11.13.0, and
`node_modules` is not installed, so `npm run verify:ivory-tower` end-to-end (via `npm.cmd`/`npm`)
was **not** run here — that must happen in CI or a correctly provisioned dev environment (see "Do
not assume" below). Every new/modified script was instead run directly with the system `node`,
which does not depend on the toolchain pin:

- `node scripts/check-ivory-boundaries.mjs` → `Ivory Tower module boundaries: OK`
- `node scripts/check-ivory-dependency-policy.mjs` → `11 manifests checked; no unapproved
  dependencies, licenses, or exceptions.` (was 9 manifests before this session)
- `node scripts/check-ivory-third-party-inventory.mjs` → `14 entries checked; every direct
  dependency and required technology is represented.`
- `node scripts/check-ivory-secret-scan.mjs` → `148 files checked across 14 roots; self-test
  fixtures matched; no sentinel secrets found.`
- `node scripts/generate-ivory-notices.mjs && node scripts/check-ivory-notices.mjs` → reproducible.
- `node scripts/generate-ivory-sbom.mjs` (full run, network-backed `npx @cyclonedx/cdxgen@11.7.0`)
  → wrote `artifacts/sbom-ivory-source.cdx.json` (2,324 components), `sbom-ivory-api.cdx.json` (134
  components, derived closure), `sbom-ivory-worker.cdx.json` (133 components, derived closure).
  `artifacts/` is gitignored and was deleted after the smoke test; nothing generated is committed.
- `npx --yes prettier@3.6.2 --config configs/ivory-prettier.json --check
  "packages/ivory-tower-*/src/**/*.{ts,tsx}" "packages/ivory-identity/src/**/*.{ts,tsx}"
  "examples/ivory-tower-browser/**/*.{ts,tsx,mjs}"` → `All matched files use Prettier code style!`
  (after the `--write` fix above).
- `npx --yes lerna exec --scope "@ivory-tower/*" --scope "@theia/ivory-identity" -- node -p 1` →
  confirmed 11 packages selected (10 `@ivory-tower/*` + `@theia/ivory-identity`), proving the
  multi-`--scope` union used in the new `package.json` scripts actually includes ivory-identity.
  (`lerna list` without `--all` was misleading here — it defaults to excluding private packages
  and made it look like scope filters intersect rather than union; `lerna exec`/`lerna run`, which
  is what the real scripts use, includes private packages by default and unions multiple `--scope`
  flags. Recorded so the next session doesn't re-debug this.)
- `python3 -c "import json; ..."` — validated every new/edited JSON file parses.
- `python3 -c "import yaml; ..."` — validated `.github/workflows/ivory-tower.yml` parses.
- `git checkout -- package-lock.json` — an `npx --yes` invocation running under the sandbox's
  npm 10.9.7 (not the pinned 11.13.0) rewrote ~113 lines of `libc` metadata in the lockfile as a
  side effect; reverted since it was not an intended dependency change. If a future session sees
  unexpected `package-lock.json` drift after running an `npx` command, check the local npm version
  first before assuming a real dependency changed.

`npm test`/`mocha` for the new `package.spec.ts` cases (ivory-identity boundary/infrastructure
digest-pin test) could not be executed here — no `node_modules`. They must run as part of
`npm run test:ivory-tower` in CI or a provisioned environment before this is treated as verified.

## Evidence produced

- This handoff.
- `docs/iv-19-dependency-governance.md` (requirement-to-mechanism map, adversarial-fixture list).
- `THIRD-PARTY-NOTICES-ivory-tower.md` (generated, committed, reproducible).
- Local smoke-test SBOMs generated and inspected (not committed; CI will regenerate and archive per
  commit via the new `sbom` job).

## Acceptance criteria passed

From the IV-19 issue body, checked against this commit:

- [x] CI produces an SBOM for the deployable artifact — `sbom` job in `ivory-tower.yml`, verified
  locally that `sbom-ivory-api.cdx.json`/`sbom-ivory-worker.cdx.json` are non-trivial derived
  closures (134/133 components), not empty stubs.
- [x] Every direct dependency has recorded purpose, version policy, license, and replacement path —
  `configs/ivory-third-party-inventory.json`, enforced by `inventory:policy:ivory-tower`.
- [x] LiqUIdify, Docling, PDF.js, AI SDK, pgvector, visualization libraries, and model assets are
  represented — same file, `represented-technology` entries, enforced by the same script.
- [x] A prohibited license or unapproved networked dependency fails the policy check — enforced by
  the existing allow-list logic plus the new adversarial fixtures proving coverage.

"Definition of complete" bullets from the issue:

- [x] `@sentry/node` is explicitly approved and pinned with a documented data boundary — inventory
  entry records "scrubbed operational metadata only" as the boundary; policy requires an exact pin.
- [x] `@theia/ivory-identity` participates in format/type/lint/test/dependency/boundary gates — see
  "Files changed" above; confirmed the format check passes clean and the dependency/boundary
  scripts include it.
- [x] Source and production SBOMs are generated — from the workspace's canonical lockfile-driven
  scan, not a real release commit yet (see "Acceptance criteria still open").
- [x] Third-party notices and reviewed exceptions are reproducible —
  `notices:check:ivory-tower` proves this mechanically.
- [x] No floating production image or unreviewed network-capable dependency can pass CI —
  Docling's digest pin was already enforced in `environment.ts`; this session added the isolated
  fixture test confirming it, plus the dependency-policy fixture for a floating high-risk npm pin.

## Acceptance criteria still open

- SBOMs have not been generated **from a release commit** and archived as release evidence — only
  as a per-push/PR CI artifact with a 90-day retention window. Per `docs/sessions/README.md`'s
  delivery-evidence states, this is `implemented-local`, not `verified-release`. That step belongs
  to a release-evidence session (Session 38/39 in the AI Agent Session Plan), not this one.
- The full `npm run verify:ivory-tower` chain (including the new steps) has not been run end-to-end
  in this sandbox — only each new/changed check individually, plus the pieces of the existing chain
  that don't require a full `npm ci`/pinned toolchain. **The next session or CI run must execute
  `npm run verify:ivory-tower` on a clean checkout with the pinned toolchain and confirm it is
  still green**, since this is the first real test of the full chain with the new steps spliced in.
- LiqUIdify's actual license is still unconfirmed (it is not installed). The inventory entry
  records this as a blocking condition on purpose; IV-23 must resolve it before installing the
  package, or the inventory check will need updating alongside that install.

## Known regressions / risks

- None identified. The `ivory-identity` prettier reformat is mechanical only (verified by reading
  representative diffs — line-wrapping and trailing commas, no token/logic changes).
- Risk: `scripts/generate-ivory-sbom.mjs` depends on network access to fetch
  `@cyclonedx/cdxgen@11.7.0` via `npx`. If a future CI runner has no network egress for npm
  registry access, the `sbom` job will fail; it is isolated in its own job specifically so that
  failure cannot block the `verify` job's pass/fail signal.
- Risk: the derived deployable-artifact SBOM logic in `generate-ivory-sbom.mjs` locates the root
  component by matching `${group}/${name}` against `@ivory-tower/api` / `@ivory-tower/worker`
  inside the already-generated source SBOM's component list. If cdxgen ever stops emitting
  workspace-local packages as their own components (behavior observed at cdxgen 11.7.0, not
  contractually guaranteed), that lookup throws instead of silently producing an empty SBOM — this
  is intentional fail-closed behavior, but a future cdxgen upgrade should re-run the script locally
  before merging.

## Decisions made

- Kept `configs/ivory-dependency-policy.json` (enforcement allow-lists) and
  `configs/ivory-third-party-inventory.json` (reviewed inventory: purpose/license/etc.) as two
  separate files rather than merging the inventory's richer per-package schema into the policy
  file. The policy file answers "is this allowed"; the inventory answers "what is this, and why".
  Conflating them would have made the policy file's allow/deny logic harder to audit at a glance.
- Represented `@theia/*` as one `theia-platform` line item in the inventory rather than one entry
  per upstream package, because upstream Theia already has its own dash-licenses/SBOM gate
  (`license-check.yml`, `generate-sbom.yml`) and duplicating ~2,600 transitive entries would not
  add review value.
- Derived the deployable-artifact SBOMs from the single source-SBOM dependency graph instead of
  invoking cdxgen separately inside each workspace package directory. The latter was tried first
  and failed: cdxgen's per-directory auto-install collides with npm workspaces (it tries `npm
  install` inside `packages/ivory-tower-api`, which cascades into the monorepo root's `postinstall`
  script and fails without a full root install); `--no-install-deps` avoids the failed install but
  then has no lockfile to resolve against in that subdirectory, producing empty SBOMs. Deriving from
  the root scan's dependency graph is more deterministic and doesn't depend on cdxgen's
  workspace-awareness in a given version.
- Chose not to touch `docs/v1-build-vs-open-source.md` — it only references IV-19 by ID, carries no
  per-issue status table, and this session's evidence belongs in `docs/sessions/`, per that file's
  own operating rule that repository evidence (not doc prose) is authoritative.

## Do not assume

- Do **not** assume `npm run verify:ivory-tower` has been proven green end-to-end for this commit.
  It could not be run in this sandbox (wrong Node/npm version, no `node_modules`). Every individual
  new/changed script was run directly and passed; the full chain has not been.
- Do **not** assume the SBOMs in the new `sbom` CI job constitute release evidence. They are
  per-push/PR artifacts with a retention window, not a release-commit-anchored, reviewed SBOM.
- Do **not** assume LiqUIdify's license is anything in particular — it is recorded as
  "unconfirmed" on purpose.
- Do **not** re-run `npx <tool>@<version>` commands in a sandbox with a mismatched local npm
  version without diffing `package-lock.json` afterward; see the note under "Tests and commands
  run".

## Exact prerequisite for next session

A clean checkout with the pinned toolchain (Node 24.16.0 / npm 11.13.0) available, so
`npm run verify:ivory-tower` can be run once, end-to-end, to confirm the new steps this session
added do not break the existing gate. That confirmation — not this handoff — is what promotes
IV-19 from `implemented-local` to `canonical`.

## Recommended next session

**Session 04 — Reproducible local environment and migrations (IV-21):** per the AI Agent Session
Plan, this is the next Gate 0 session in sequence. Before starting it (or in its first step), run
`npm run verify:ivory-tower` on a clean, correctly provisioned checkout to close the open item
above; if it fails because of something this session introduced, that is a Session 03A repair, not
part of Session 04's scope.
