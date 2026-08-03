# Ivory Tower local runtime

This profile provides the external services used by the hosted-style local
stack: PostgreSQL with pgvector, an S3-compatible MinIO endpoint, and a private
Docling HTTP service. The one-shot MinIO initializer creates the project bucket
automatically. All volumes are beneath `.ivory-tower/`, which is ignored by Git
and is owned by this checkout.

```powershell
docker compose -f infra/docker-compose.yml up -d
copy .env.example .env
# For this Compose profile, set IVORY_S3_BUCKET=ivory-tower and
# IVORY_S3_ENDPOINT=http://localhost:9000 in .env when running the API locally.
npm.cmd run migrate:ivory
npm.cmd run start:ivory-api
npm.cmd run start:ivory-worker
```

The migration command is forward-only. Reset is intentionally limited to a
disposable development checkout: stop the Compose profile, remove only the
project-owned `.ivory-tower/` data directories, and start again. Production
deployments must never use a reset command.

The Docling endpoint is private to the runtime. A source is admitted before it
is committed to canonical storage or dispatched to any worker. A remote
conversion endpoint is an explicit policy choice, not an automatic fallback.

The API uses the S3-compatible adapter whenever `IVORY_S3_BUCKET` is set.
Leaving it empty selects the filesystem adapter for the post-V1 local profile
only.
