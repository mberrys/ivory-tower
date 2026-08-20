# Session 04 Handoff

## Implemented work

Session 04 implements IV-21's reproducible local-runtime and migration-recovery contract:

- `npm run check:ivory-install` checks the exact Node/npm toolchain and requires the resolved `@theia/ext-scripts/bin/theia-ext.js` workspace binary after a lockfile install.
- `npm run verify:ivory-session-04` produces a fresh local Compose environment, verifies a deterministic database/object-store source, snapshots the immediate N-1 schema, restores it to an isolated database, migrates both databases forward, and runs the API/worker/Docling runtime proof.
- Local pgvector and MinIO images are now pinned to immutable digests; no local image exception remains in the IV-19 policy.
- Ubuntu CI now executes the same clean-install/bootstrap/runtime verifier and retains only sanitized Session 04 diagnostics on failure.

## Required verification before sign-off

From a clean checkout on the pinned toolchain:

```powershell
npm.cmd ci
npm.cmd run check:ivory-install
npm.cmd run verify:ivory-tower
npm.cmd run verify:ivory-session-04
```

The last command requires a running Docker daemon. Review `artifacts/session-04/result.json` on success. On failure, inspect `artifacts/session-04/compose.log`; it is intentionally redacted.

## Do not assume

- A successful static gate does not prove database restore, MinIO reconciliation, Docling, API, or worker behavior.
- The local reset is intentionally destructive only to `.ivory-tower/`; it is not a production migration or recovery procedure.
- The `IVORY_MIGRATIONS_UP_TO` boundary is verification support, not a deployment rollback path.
- A missing `@theia/ext-scripts` binary is an incomplete installation. Repair it with `npm ci`, not a copied binary or a partial package install.
