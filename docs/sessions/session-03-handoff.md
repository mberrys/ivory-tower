# Session 03 Handoff

## Objective completed

Dependency, licensing, SBOM, and pinning gate (IV-19, Gate 0). Made third-party dependency and
release-artifact governance mechanically enforceable: fixed `@theia/ivory-identity`'s exclusion
from the format/typecheck/lint/test/dependency/boundary gates, added SBOM generation for the
Ivory Tower source tree and each deployable artifact (`api`, `worker`), added a deterministic
third-party notices generator, added a sentinel secret scan wired into `verify:ivory-tower`, added
self-verifying adversarial fixtures for the dependency-policy gate (prohibited license, unapproved
network dependency, unpinned high-risk dependency, floating Docling tag), and wrote the reviewed
third-party dependency inventory the issue requires.

## Canonical commit / branch

- Started from `stable` @ `40d48b06b579c5301b97401a3ba11067a28ffbd6` (branch
  `claude/session-3-q9tc4o`, which was identical to `stable` at session start).
- This session's changes sit directly atop that commit.

## Files changed

New:

- `scripts/shared/ivory-dependency-graph.mjs` — shared npm-workspace dependency-closure resolver
  over `package-lock.json` (used by both generators below). Lives under `scripts/shared/`, not
  `scripts/lib/`, because the repo's root `.gitignore` has an unanchored `lib` pattern that would
  otherwise silently exclude it.
- `scripts/generate-ivory-sbom.mjs` — CycloneDX-shaped SBOM generator (`npm run sbom:generate`):
  source-tree SBOM plus one SBOM per deployable artifact (`api`, `worker`), written to
  `artifacts/`.
- `scripts/generate-ivory-notices.mjs` — deterministic third-party notices generator (`npm run
  notices:generate`), written to `artifacts/`.
- `scripts/check-ivory-secrets.mjs` — sentinel secret scan (`npm run secret:scan`); self-tests
  every pattern against a synthetic sample before scanning real files.
- `configs/ivory-dependency-policy-fixtures.json` — adversarial fixtures (prohibited license,
  unapproved network dependency, unpinned high-risk dependency) run through the real
  violation-detection function on every `dependency:policy` invocation.
- `docs/iv-19-dependency-inventory.md` — the reviewed third-party dependency inventory the issue's
  step 4 requires (purpose/owner/license/version-policy/replacement-path per dependency),
  including LiqUIdify, Docling, PDF.js, AI SDK, pgvector, and visualization libraries as
  `planned`-status rows since they are not yet installed.
- `.github/workflows/ivory-dependency-gate.yml` — new workflow (kept separate from upstream's
  `generate-sbom.yml`/`license-check.yml` per the fork-divergence-minimization rule in
  `CLAUDE.md`): a `dependency-policy` job (policy + secret scan) and a `sbom-and-notices` job that
  uploads generated evidence as a build artifact, on push/PR to ivory paths, on release, and on
  `workflow_dispatch`.
- `docs/sessions/session-03-handoff.md` — this file.

Modified:

- `scripts/check-ivory-dependency-policy.mjs` — package discovery is now directory-driven
  (`packages/ivory-tower-*` or `packages/ivory-identity`) instead of a hardcoded `ivory-tower-`
  prefix filter, so `@theia/ivory-identity` can no longer be silently omitted from scope; extracted
  `evaluateManifest`/`evaluateExceptions` as pure functions; added `checkDoclingPin` (verifies the
  digest-pin regex against both the real `DEFAULT_DOCLING_IMAGE` and a synthetic floating-tag
  fixture) and `runAdversarialFixtures`.
- `scripts/check-ivory-boundaries.mjs` — added an `@theia/ivory-identity` layer (forbids
  `@theia/`, `@ivory-tower/`, `pg`, `@aws-sdk/`, `graphile-worker`, `docling`, `liquidify-react`;
  its only real import is Node's `crypto`).
- `scripts/ivory-boundary-fixtures.json` — added two negative fixtures for the new
  `@theia/ivory-identity` layer.
- `package.json` — `format:check:ivory-tower` / `format:write:ivory-tower` glob now includes
  `packages/ivory-identity/src`; `typecheck:ivory-tower`, `lint:ivory-tower`, `test:ivory-tower`,
  and the inline test step inside `verify:ivory-tower` now add `--scope "@theia/ivory-identity"`
  alongside `--scope "@ivory-tower/*"`; added `secret:scan`, `sbom:generate`, `notices:generate`
  scripts; `verify:ivory-tower` now also runs `secret:scan`.
- `.gitignore` — added `/artifacts/` (generated SBOM/notices evidence, not committed as source).
- `README.md` — SBOM section now documents the four new commands and links the inventory doc.
- `docs/ivory-tower-development.md` — "Required commands" section documents the four new commands
  and states explicitly that `@theia/ivory-identity` participates in every ivory-tower gate.

## Tests and commands run

Executed directly with the system `node` (v22.22.2; no `node_modules` install was performed this
session — see "Do not assume" below):

- `node scripts/check-ivory-dependency-policy.mjs` — passes; reports 11 manifests checked including
  `ivory-identity`; adversarial fixtures confirmed catchable.
- Fault-injection proof: temporarily corrupted one fixture's `expectSubstring` to an unmatchable
  string, confirmed the script now exits 1 with a clear "gate cannot be trusted" message, then
  restored the fixture and confirmed exit 0 again.
- `node scripts/check-ivory-boundaries.mjs` — passes with the new `@theia/ivory-identity` layer and
  its two negative fixtures.
- `node scripts/check-ivory-secrets.mjs` — passes (6 self-tested patterns, zero matches in real
  source/config).
- Fault-injection proof: wrote a file containing a synthetic `AKIA...` sentinel into
  `packages/ivory-tower-domain/src/`, confirmed the scan catches it and exits 1, then deleted the
  file and confirmed exit 0 again (no leftover files committed).
- `node scripts/generate-ivory-sbom.mjs --out-dir <scratch>` — produced three valid CycloneDX-shaped
  JSON files; source SBOM has 377 components, `api` has 130, `worker` has 124 (verified non-empty;
  the generator refuses to write an empty SBOM).
- `node scripts/generate-ivory-notices.mjs --out-dir <scratch>` — produced a deterministic notices
  file listing 377 packages plus an explicit "None currently recorded" exceptions section.
- `python3 -c "import json; json.load(open('package.json'))"` — confirmed `package.json` stays
  valid JSON after edits.
- Manual inspection of `packages/ivory-identity/src/**/*.ts` imports confirmed it only imports its
  own relative modules and Node's built-in `crypto`, justifying the new boundary layer's forbidden
  list.

## Evidence produced

- `docs/iv-19-dependency-inventory.md` — the reviewed third-party inventory.
- Ad hoc SBOM/notices output generated into a scratch directory during verification (not
  committed; regenerate any time with `npm run sbom:generate` / `npm run notices:generate`).

## Acceptance criteria passed

- [x] CI produces an SBOM for the deployable artifact — `sbom-and-notices` job in
      `.github/workflows/ivory-dependency-gate.yml` runs `generate-ivory-sbom.mjs`, which emits one
      SBOM per deployable artifact (`api`, `worker`) plus a source-tree SBOM.
- [x] Every direct dependency has recorded purpose, version policy, license, and replacement path —
      `docs/iv-19-dependency-inventory.md`.
- [x] LiqUIdify, Docling, PDF.js, AI SDK, pgvector, visualization libraries, and model assets are
      represented — same document (installed rows for Docling/pgvector; planned rows for the rest,
      accurately marked not-yet-installed rather than claimed as done).
- [x] A prohibited license or unapproved networked dependency fails the policy check — proven by
      fault injection (see "Tests and commands run") and by the self-verifying adversarial fixtures
      that run on every `dependency:policy` invocation.
- [x] `@sentry/node` is explicitly approved and pinned with a documented data boundary — already
      true pre-session (`configs/ivory-dependency-policy.json`); reproduced in the inventory doc.
- [x] `@theia/ivory-identity` participates in format/type/lint/test/dependency/boundary gates — the
      core fix this session (see "Files changed" above).
- [x] Third-party notices and reviewed exceptions are reproducible — `notices:generate` plus the
      inventory doc.
- [x] No floating production image or unreviewed network-capable dependency can pass CI — Docling
      digest-pin enforcement now exists in both the runtime (`validateIvoryTowerEnvironment`,
      pre-existing) and the static dependency-policy gate (`checkDoclingPin`, new); network-capable
      dependencies are limited to an explicit `approvedNetworkDependencies` allowlist.

## Acceptance criteria still open

- Source and production SBOMs generated **from an actual tagged release commit** and archived with
  release evidence — the mechanism exists and is exercised by CI on every push/PR/release event,
  but no v1 release has occurred yet, so no such archived bundle exists. This is expected: Gate 0
  does not require a release to exist yet.
- The new `.github/workflows/ivory-dependency-gate.yml` workflow has not been observed running on
  GitHub Actions (it will run on the first push of this branch, or on the PR); I verified its two
  jobs are equivalent to running the underlying scripts directly, which I did run.

## Known regressions / risks

None identified. All changes are additive (new scripts, new workflow, new docs) or narrow
extensions of existing scripts' scope (adding `ivory-identity` alongside `@ivory-tower/*`, never
removing an existing check). `scripts/check-ivory-dependency-policy.mjs`'s exported functions are a
superset of its prior behavior — the CLI output and exit-code contract for the previously-passing
case (11 → 10 manifests before this session, now 11) is unchanged in shape, only in scope.

## Decisions made

- Hand-rolled the SBOM/notices generators from `package-lock.json` rather than invoking
  `@cyclonedx/cdxgen` (as upstream's `generate-sbom.yml` does for the whole Theia monorepo at
  release time): this sandbox has no `node_modules` install and no verified network access to
  install `cdxgen` globally, and a pure-`fs`-based generator is deterministic, dependency-free, and
  directly testable without `npm ci`. This does **not** replace `generate-sbom.yml` — that workflow
  continues to produce Theia's own whole-repo SBOM for the Eclipse SBOM registry; the new workflow
  is Ivory-scoped and additive.
- Put the new workflow in its own file rather than extending `generate-sbom.yml` or
  `license-check.yml`, per `CLAUDE.md`'s fork-divergence-minimization guidance (treat upstream
  workflow files the same as upstream packages: prefer new files over edits).
- Scoped the dependency-policy gate's third-party-inventory requirement to **direct** dependencies
  of Ivory-owned packages, leaving full-transitive-closure license enforcement to upstream's
  existing `npm run license:check` (dash-licenses over the whole lockfile) — this matches the
  issue's own step 4 wording ("For every direct dependency...") and avoids duplicating an
  enforcement mechanism that already exists and already covers the full tree.
- Marked LiqUIdify, PDF.js, Cytoscape.js, Vega-Lite, and AI SDK provider adapters as `planned` in
  the inventory rather than skipping them, since the acceptance criterion requires them to be
  "represented" — but did not claim exact license/version fields as final, since they are not
  installed yet and must be re-verified at install time.

## Do not assume

- Do **not** assume `npm run verify:ivory-tower` (the full lerna-orchestrated pipeline) has been
  executed end-to-end this session. `node_modules` was empty at session start (0 entries) and the
  pinned toolchain (Node 24.16.0 / npm 11.13.0 per `configs/ivory-toolchain.json`) was not
  available in this sandbox (only Node 20/21/22 were pre-installed; no network-verified path to
  install 24.16.0 was attempted, to avoid a long, uncertain `npm ci` across the full Theia
  monorepo with unknown native-build-dependency availability). What **was** verified: every new
  script runs correctly as plain Node ESM with zero `node_modules` dependencies, against the real
  repository files, including fault-injection proofs that each gate actually fails when it should.
  The `--scope "@theia/ivory-identity"` additions to `typecheck:ivory-tower` / `lint:ivory-tower` /
  `test:ivory-tower` follow the exact multi-`--scope` pattern already used and presumably working in
  `test:ivory-runtime`, but were not executed via `lerna` in this session.
- Do **not** treat `docs/iv-19-dependency-inventory.md`'s `planned` rows (LiqUIdify, PDF.js,
  Cytoscape.js, Vega-Lite, AI SDK) as evidence that those libraries are installed. They are not.
- Do **not** assume the Docling image's license ("MIT", as recorded in the inventory doc) has been
  independently re-verified against the actual upstream Docling project license file this session —
  it was recorded from ADR-002/prior-session context, not re-checked against the source.

## Exact prerequisite for next session

A clean canonical baseline with this session's IV-19 work merged, plus (per the recommended
execution model) Session 02's IV-15 baseline already in place from prior work. No blocking
prerequisite specific to IV-19 remains for Session 04.

## Recommended next session

**Session 04 — Reproducible local environment and migrations (IV-21):** prove fresh checkout →
healthy seeded system → teardown, plus N-1 upgrade and restore, per the session plan. This session
did not touch `infra/`, migrations, or seed data.
