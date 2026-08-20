# Session 04 — Runtime, clean-install, and migration-recovery implementation

## Scope delivered

- Added `check:ivory-install`, a fail-fast bootstrap verifier for the pinned Node/npm toolchain and the linked `@theia/ext-scripts` workspace binary. It provides a clean-install repair command but does not mutate `node_modules`.
- Inserted that verifier before the aggregate Ivory compile/test gate and as an explicit CI step after every clean `npm ci`.
- Added `verify:ivory-session-04`: disposable Compose startup, deterministic database/object-store seeding, immediate N-1 dump/restore/upgrade, reconciliation, runtime happy path, sanitized failure diagnostics, and checkout-local teardown.
- Extended the migration runner with a validated, inclusive upper boundary so the N-1 fixture uses the production migration code rather than a test-only fork.
- Made the existing runtime verifier portable between Windows (`docker.exe`) and Unix (`docker`), allowing the new Ubuntu CI runtime job to execute it.
- Pinned pgvector, MinIO server, and MinIO client to resolved immutable manifest digests and retired their former local-image exceptions.

## Evidence boundary

This session adds the execution contracts and CI job. It does not itself prove a local runtime pass until the bootstrap verifier and Docker daemon are available on the machine executing it. The CI runtime job is the required clean-install, Docker-backed evidence producer.

See [IV-21](../iv-21-local-runtime.md) for the operational contract and [the handoff](session-04-handoff.md) for the exact remaining verification commands.
