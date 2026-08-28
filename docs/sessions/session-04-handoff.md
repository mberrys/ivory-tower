# Session 04 Handoff

## Objective completed

Reproducible local runtime and migration recovery (IV-21, Gate 0). A clean lockfile install now
fails closed unless the pinned toolchain and linked `@theia/ext-scripts` binary are present.
Local Compose images are digest-pinned. `verify:ivory-session-04` proves fresh Compose startup,
deterministic source/object-store seed, immediate N-1 dump/restore/upgrade through the production
migration runner, ledger and rights-backfill reconciliation, and the API/worker/Docling happy
path, then tears down only checkout-local `.ivory-tower/` state.

## Canonical commit / branch

Branch `cursor/session-04-runtime-migrations-9419`, atop `origin/stable` @ `9030ac2` (Session 03
including PR #28 addenda).

## Files changed

**New:** `scripts/check-ivory-install.mjs`, `scripts/verify-ivory-session-04.mjs`,
`packages/ivory-tower-infrastructure/src/node/migrate.spec.ts`, `docs/iv-21-local-runtime.md`,
`docs/sessions/session-04-runtime-migrations.md`, this handoff.

**Modified:** `package.json` (bootstrap and Session 04 scripts; `check:ivory-install` in
`verify:ivory-tower`), `.github/workflows/ivory-tower.yml` (bootstrap step after every `npm ci`;
Ubuntu runtime job), `infra/docker-compose.yml` (digest pins),
`configs/ivory-dependency-policy.json` (local images `digestRequired: true`),
`scripts/check-ivory-dependency-policy.mjs` (Session 04 verifier is an image source),
`packages/ivory-tower-infrastructure/src/node/migrate.ts` (`IVORY_MIGRATIONS_UP_TO`),
`scripts/verify-ivory-runtime.mjs` (portable Docker binary), `docs/iv-19-dependency-governance.md`,
`docs/ivory-tower-development.md`, `infra/README.md`.

No upstream Theia package was modified. `package-lock.json` was not rewritten.

## Tests and commands run

Recorded during implementation; CI run IDs are filled after the PR's `ivory-tower.yml` completes.

- `npm run check:ivory-install` — toolchain plus linked `@theia/ext-scripts` binary
- `npm run dependency:policy` — including the existing `floating-image-tag` fixture
- infrastructure package tests — `resolveIvoryMigrationBatch` rejects an unknown upper boundary
  and includes the named N-1 filename
- `npm run verify:ivory-tower` — static gate, including the new bootstrap check and
  Session 04 verifier contract tests
- `npm run verify:ivory-session-04` — Docker-backed proof when a daemon is available; otherwise
  the Ubuntu runtime job is the evidence producer

CI run 33183761714 (`ivory-tower.yml` on this branch) greened verify and governance, then the
runtime job failed after a successful N-1 dump/restore/upgrade: API/worker `lib/start.js` was
missing, and teardown could not remove root-owned `.ivory-tower/minio`. The follow-up commit
compiles `@ivory-tower/api` and `@ivory-tower/worker` inside `verify:ivory-runtime` and deletes
bind-mount children through the digest-pinned Postgres image.

## Evidence produced

- Passing `check:ivory-install` after `npm ci` (IV-15 clean-checkout bootstrap).
- Digest-pinned local images in Compose and the IV-19 policy.
- `artifacts/session-04/result.json` from a passing runtime job (gitignored; the passing job is
  the evidence). On failure, sanitized `artifacts/session-04/compose.log` is uploaded.

## Acceptance criteria passed

- Fresh lockfile install is mechanically checked before compile/test.
- Local pgvector, MinIO, and `mc` images are digest-pinned; floating local tags no longer have a
  recorded exception.
- Immediate N-1 schema snapshot restores and upgrades through the production migrator.
- Teardown is limited to `.ivory-tower/`.
- Runtime proof is an Ubuntu CI job, not a prose claim.

## Acceptance criteria still open

- **Docker-backed proof is the Ubuntu runtime job.** A cloud agent without a Docker daemon cannot
  substitute for that job.
- **MinIO AGPL-3.0 remains unreviewed.** Digest-pinning is not a licence ruling. Counsel review is
  required before either image is more than local-dev/test infrastructure.
- **Gate 0 is not closed.** Sessions 05–06 (IV-22 and remaining Gate 0 work) are untouched.
- **`IVORY_MIGRATIONS_UP_TO` is verification support**, not a deployment rollback path.

## Known regressions / risks

- The new runtime job `needs: verify`. If the static matrix is red, Session 04 Docker evidence
  will not run — the same skip mode that hid the first attempt on `origin/dev`. Keep `verify`
  green on this branch.
- `verify:ivory-session-04` starts Docling even though the N-1 fixture itself does not convert.
  That is required so the subsequent `verify:ivory-runtime` happy path can run against the same
  profile.
- First Compose pull of three digest-pinned images is slow on a cold runner.
- A lockfile install does not emit `packages/ivory-tower-{api,worker}/lib`. The runtime
  verifier now compiles those packages before `start`; do not assume the static `verify` job
  left artifacts for the runtime job.
- Compose bind mounts under `.ivory-tower/` are root-owned. Host `rm -rf` is not sufficient;
  teardown must delete children through a container bound only at that directory.

## Decisions made

- **Base is `origin/stable`, not `origin/dev`.** The first attempt at `1e45afd` sat on a divergent
  Session 03 lineage and failed `verify:ivory-tower` (run 32406462913).
- **No lockfile rewrite.** `@aws-sdk/client-s3` is already a dependency of
  `@ivory-tower/infrastructure`.
- **Local images require digests** after this session; the exception path remains for a future
  local image that cannot yet be pinned.
- **Unknown `IVORY_MIGRATIONS_UP_TO` values fail** rather than silently applying everything.

## Do not assume

- A successful static gate does not prove database restore, MinIO reconciliation, Docling, API,
  or worker behavior.
- The local reset is intentionally destructive only to `.ivory-tower/`; it is not a production
  migration or recovery procedure.
- Digest-pinned MinIO is not licence-cleared.
- A missing `@theia/ext-scripts` binary is an incomplete installation. Repair it with `npm ci`,
  not a copied binary.

## Exact prerequisite for next session

Green `verify` matrix, green `governance` job, and a green
`Runtime and migration recovery (Session 04)` job on this branch. If the runtime job is red, the
fix belongs to a Session 04 repair (`04A`), not to Session 05.

## Recommended next session

**Session 05 — Deployment, configuration, and secret management (IV-22):** readiness, secret
handling beyond the repository scan, and deployment profiles. It inherits the MinIO AGPL question
as a recorded local-dev limit, not as a hosted-object-store decision.
