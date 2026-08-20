# Ivory Tower V1 development contract

## Toolchain

Ivory Tower development and CI use Node 24.16.0 and npm 11.13.0. The root
Theia engine declaration remains `>=22` for upstream compatibility; the pinned
Ivory toolchain is recorded in `.nvmrc` and `configs/ivory-toolchain.json`.

On Windows PowerShell, use `npm.cmd`:

```powershell
npm.cmd ci
npm.cmd run verify:ivory-tower
```

On Ubuntu or another Unix shell, use `npm`:

```sh
npm ci
npm run verify:ivory-tower
```

`format:write:ivory-tower` is developer-invoked. CI only runs
`format:check:ivory-tower`; it never rewrites files. The pinned Prettier
configuration applies only to `packages/ivory-tower-*` and
`examples/ivory-tower-browser`.

## Environment

Copy `.env.example` to the local environment and set `DATABASE_URL` before
starting the API or worker. `readIvoryTowerEnvironment(role)` validates the
database, queue, storage, provider, Docling, browser, and role combination
before startup. Local development may use filesystem objects; staging and
production require S3-compatible storage with both access-key secrets.

The browser health view calls `/health/ready` and reports `ok`, `degraded`, or
`unavailable`; it does not claim readiness from a static UI flag.

## Architecture rules

The allowed dependency direction is:

```text
contracts -> domain -> application -> adapters -> infrastructure / api / worker
health browser -> application contracts only
```

Provider, database, Graphile Worker, Docling, Theia, and LiqUIdify clients stay
behind the appropriate adapter or application boundary. The boundary checker
also runs negative fixtures for those prohibited imports. The browser
application does not load a runtime plugin host.

## Required commands

- `npm run verify:ivory-tower` — the local and CI gate.
- `npm run typecheck:ivory-tower` — scoped compile/typecheck.
- `npm run format:check:ivory-tower` — pinned first-party formatting check.
- `npm run format:write:ivory-tower` — explicit developer formatting.
- `npm run dependency:policy` — license, network-capability, high-risk version,
  advisory-exception, and Docling-pin policy (IV-19); self-verifies against
  adversarial fixtures in `configs/ivory-dependency-policy-fixtures.json` on
  every run.
- `npm run secret:scan` — sentinel scan for committed credentials (IV-19).
- `npm run sbom:generate` — CycloneDX SBOMs for the Ivory Tower source tree and
  each deployable artifact (`api`, `worker`), written to `artifacts/` (IV-19).
- `npm run notices:generate` — deterministic third-party notices plus recorded
  dependency-policy exceptions, written to `artifacts/` (IV-19).
- `npm run test:ivory-browser` — the health-view Playwright test.

The aggregate gate runs boundaries, compile, lint, package tests, production
browser build, browser tests, dependency policy, secret scan, `git diff
--check`, and a clean-tree assertion. Run it from a clean checkout when
validating CI parity. `@theia/ivory-identity` participates in every one of
these gates alongside the `@ivory-tower/*` packages; nothing scopes to the
`@ivory-tower/*` glob alone. See
[`docs/iv-19-dependency-inventory.md`](iv-19-dependency-inventory.md) for the
reviewed third-party dependency inventory.

## Docling pin and supported registry

The supported V1 image is the Quay manifest list below:

```text
quay.io/docling-project/docling-serve:v1.21.0@sha256:32b3de41f325f93c1dd35907cd9147fa35df9f7c5abc86eb2788b6bda7ce6d10
```

GHCR publishes the same project image and is the supported mirror. A mirror
may replace Quay only after resolving the same `v1.21.0` manifest list and
recording the mirror digest in the deployment evidence. Mutable tags and
unverified mirrors are rejected by environment validation.

## Troubleshooting

- `EPERM` under the npm cache: retry with the managed Windows approval path or
  use a writable npm cache; do not loosen dependency pins.
- Boundary failures: run `npm run check:ivory-boundaries` and inspect the
  prohibited import plus its layer before changing a package dependency.
- A missing `DATABASE_URL`, S3 secret, or mutable `DOCLING_IMAGE` is a startup
  configuration failure, not a readiness warning.
- If Docker Desktop is unavailable, the deterministic package/runtime tests
  remain runnable, but the PostgreSQL/MinIO/Docling integration gate is not
  complete and IV-14 must remain open.
- The inherited Electron target is a compatibility gate only. It is not the
  Ivory Windows product until the Phase 7 wrapper and Acrylic adapter exist.
