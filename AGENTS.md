# AGENTS.md

Guidance for AI coding agents working in this repository. Human-oriented docs live in
[`CLAUDE.md`](CLAUDE.md), [`README.md`](README.md), and [`doc/THEIA-CLAUDE.md`](doc/THEIA-CLAUDE.md).

## Repository map

- **`docs/`** — Ivory Tower normative specifications (`iv-<n>-*.md`).
- **`doc/`** — upstream Theia developer documentation.
- **`packages/ivory-*`** — Ivory Tower domain, API, worker, and infrastructure packages.
- **`examples/ivory-tower-browser`** — Ivory Tower Theia browser application.
- **`infra/`** — local/remote Compose profile for Postgres, MinIO, and Docling.

Use `npm`, not `yarn`. Node.js **≥ 22**.

## Default verification

For Ivory Tower changes without full Theia UI work:

```bash
npm run verify:ivory-tower
```

Lighter runtime checks:

```bash
npm run test:ivory-runtime
```

Before manual browser testing of Ivory views:

```bash
npm run build:ivory-tower
npm run start:ivory-tower
```

## Cursor Cloud specific instructions

Remote agents use [`.cursor/environment.json`](.cursor/environment.json).

### Boot sequence

On agent startup, Cursor runs:

1. `npm install && bash scripts/ivory-cloud-setup.sh` — dependencies and a Compose-aligned `.env`
2. `sudo service docker start && bash scripts/ivory-cloud-boot.sh` — Postgres/pgvector, MinIO, Docling, and `ivory-migrate`
3. Long-lived terminals for `ivory-api` (4100) and `ivory-worker`

Infrastructure details: [`infra/README.md`](infra/README.md).

### Secrets

Store provider keys, `SENTRY_DSN`, and other credentials in the
[Cursor Cloud Agents Secrets](https://cursor.com/dashboard/cloud-agents) dashboard — not in the
repository. The generated `.env` contains only local development defaults.

### Common tasks

| Task | Command |
|---|---|
| Re-run migrations after schema changes | `npm run migrate:ivory` |
| Restart infrastructure | `docker compose -f infra/docker-compose.yml up -d --wait` |
| API health | `curl -fsS http://127.0.0.1:4100/health/live` |
| Readiness (DB + schema) | `curl -fsS http://127.0.0.1:4100/health/ready` |
| Observability | optional `SENTRY_DSN`; see README **Observability (Sentry)** |

### Constraints

- Do not commit `.env` or `.ivory-tower/` data directories.
- The hosted-style local profile requires `IVORY_S3_BUCKET`; the cloud setup script sets it automatically.
- Docling is private to the runtime; do not treat it as a public fallback without an explicit policy decision.
- Prefer new packages under `packages/` over edits to upstream Theia packages.
