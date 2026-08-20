# IV-19 — Dependency licensing, SBOM, and pinning gate

**Status:** implemented-local · **Phase** 1 · **Milestone:** V1 — product and architecture contract
**Issue:** [IV-19](https://app.notion.com/p/3b09cb079ddb8175b536df461eb73b4a)

This document names the mechanism, not the requirement. The requirement lives in the IV-19 issue
body; this file is a short map from that requirement onto the files that enforce it, so a reviewer
does not have to reconstruct the wiring from six scripts and two configs.

The delivery-evidence state is `implemented-local` per `docs/sessions/README.md`: every gate below
passes at the commit this document ships in, but it has not yet been proven from a release commit
(SBOM archived, notices reviewed) — that is release-evidence work for a later Gate 0/exit-review
session, not this one.

## 1. What is governed, and where

| Concern | Mechanism | Command |
| --- | --- | --- |
| Allowed licenses, approved network-capable dependencies, high-risk exact pins, advisory exceptions | `configs/ivory-dependency-policy.json` | `npm run dependency:policy` |
| Per-dependency purpose, owner, license, version policy, replacement path, network/native/source-content posture | `configs/ivory-third-party-inventory.json` | `npm run inventory:policy:ivory-tower` |
| Human-readable rendering of the inventory | `THIRD-PARTY-NOTICES-ivory-tower.md` (generated) | `npm run notices:generate:ivory-tower` / `npm run notices:check:ivory-tower` |
| Module-boundary enforcement (which layer may import what) | `scripts/check-ivory-boundaries.mjs` + `scripts/ivory-boundary-fixtures.json` | `npm run check:ivory-boundaries` |
| Sentinel secret scan | `scripts/check-ivory-secret-scan.mjs` | `npm run secret:scan:ivory-tower` |
| Source and deployable-artifact SBOM | `scripts/generate-ivory-sbom.mjs` | `npm run sbom:generate:ivory-tower` (CI: `.github/workflows/ivory-tower.yml`, job `sbom`) |
| Immutable production image pin (Docling) | `packages/ivory-tower-infrastructure/src/environment.ts` (`validateIvoryTowerEnvironment`) | exercised by `packages/ivory-tower-infrastructure/src/package.spec.ts` |
| Upstream Theia's own license/SBOM scan (unchanged, not re-governed here) | `NOTICE.md`, `.github/workflows/license-check.yml`, `.github/workflows/generate-sbom.yml` | `npm run license:check` |

`npm run verify:ivory-tower` chains every row above except SBOM generation, which needs network
access to fetch the scanner and is therefore a separate CI job rather than part of the local/CI
gate every push runs.

## 2. Scope

The inventory and dependency-policy gates cover every package under `packages/ivory-tower-*` and
`packages/ivory-identity` (`@theia/ivory-identity`), plus `examples/ivory-tower-browser`.
`@theia/ivory-identity` previously ran outside the format/typecheck/lint/test/dependency/boundary
gates because its package name does not match the `@ivory-tower/*` glob the gates used to filter
on; it is now included explicitly wherever that glob is used (see the `--scope "@theia/ivory-identity"`
additions in `package.json` and the boundary layer added in `check-ivory-boundaries.mjs`).

Individual `@theia/*` dependencies are not re-inventoried one by one — they are represented as a
single `theia-platform` entry in the third-party inventory, because they are already governed by
upstream Theia's own `NOTICE.md` and `license-check.yml`. Duplicating ~2,600 transitive upstream
entries here would not make them more reviewed; it would just make this file unreadable.

## 3. Represented-but-not-installed technologies

IV-19's acceptance criteria name LiqUIdify, Docling, PDF.js, the AI SDK, pgvector, visualization
libraries, and model assets explicitly. Several of these are not npm dependencies of any
Ivory-owned package yet (LiqUIdify, PDF.js, an Ivory-owned AI SDK provider-adapter package,
Cytoscape.js/Vega-Lite) or are not npm dependencies at all (Docling is a pinned container image;
pgvector is a PostgreSQL extension; model assets are deliberately not redistributed). Each still has
an entry in `configs/ivory-third-party-inventory.json` with a `status` field recording exactly
that, so a reviewer can see the governance commitment now instead of discovering it only when the
package first lands. `scripts/check-ivory-third-party-inventory.mjs` fails if any of these entries
goes missing.

## 4. Verification (adversarial fixtures)

Per the issue's own verification instruction ("inject a known policy-violating dependency … confirm
the gate fails"), each rule below has a fixture proving the current policy would reject the case,
without literally introducing the violation into the tree:

- Unapproved network dependency, prohibited license, and a high-risk dependency with a floating
  (non-exact) version: `configs/ivory-dependency-policy-fixtures.json`, checked inside
  `scripts/check-ivory-dependency-policy.mjs`.
- A package silently omitted from the quality scope: the same fixtures file proves package-directory
  discovery is name-pattern-based (`isIvoryOwnedPackageDirectory`), not a hardcoded list, so a future
  `packages/ivory-tower-*` or `packages/ivory-identity` directory cannot be added without being
  picked up.
- A floating (non-digest-pinned) Docling image tag: `packages/ivory-tower-infrastructure/src/package.spec.ts`,
  test `"rejects a floating Docling image tag (IV-19 adversarial fixture)"`.
- A forbidden cross-layer import for `@theia/ivory-identity`: `scripts/ivory-boundary-fixtures.json`.
- A sentinel secret: `scripts/check-ivory-secret-scan.mjs` self-tests each pattern against an
  in-memory fixture on every run, so the gate proves it still catches its own adversarial cases
  without ever committing a real secret-shaped string to the tree.

## 5. What this does not settle

- SBOM archival and third-party notices review **from a release commit** (as opposed to every push)
  is release-evidence work, not part of this gate. `docs/sessions/README.md`'s delivery-evidence
  states apply.
- LiqUIdify's actual license is unconfirmed because the package is not installed; the inventory
  entry deliberately blocks on that until IV-23 installs it and updates the record.
- This document does not re-litigate ADR-001/ADR-002 topology decisions; it only wires the
  governance gate around whatever those decisions already fixed.
