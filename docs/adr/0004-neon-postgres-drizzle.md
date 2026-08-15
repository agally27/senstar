# ADR-0004: Neon Postgres (London) + Drizzle ORM as the data access layer

**Status:** Accepted (founder, 2026-08-14)
**Date:** 2026-08-14
**Decision register ref:** D4 (Neon, decided), D12 (access layer, open)

## Decision

1. **Neon** managed PostgreSQL, project created in **`aws-eu-west-2` (London)** — region is fixed at creation, so day one. Separate Neon branches/databases per environment (dev / preview / production); production is its own isolated branch with no non-production access. Local development and CI use the locally-installed PostgreSQL 16 — never a shared cloud database.
2. **Drizzle ORM** as the single data access layer and migration tool (`drizzle-kit` generating SQL migrations, committed and reviewed).

## Why Drizzle (D12 recommendation)

- **SQL-first and thin:** the schema is TypeScript that maps 1:1 to SQL; migrations are plain reviewable SQL files — which matters enormously for a platform where RLS policies, constraints and append-only rules must be visible and auditable, not hidden behind a migration DSL.
- Fully typed queries; no runtime query-engine binary; serverless-friendly (works with Neon's HTTP/websocket drivers); RLS-compatible (we control the SQL).
- Migrations-as-SQL lets us include RLS policies, triggers (e.g. append-only enforcement) and check constraints in the same reviewed artefact.

## Alternatives (D12)

- **Prisma** — most popular; richer tooling; but heavier runtime, migration DSL abstracts the SQL we specifically need to see (RLS, triggers), and historically awkward with serverless/RLS. Viable second choice.
- **Kysely (query builder only)** — excellent typing, but no schema/migration story; we'd assemble more ourselves.
- **Raw SQL + node-postgres** — maximum control, loses schema typing and developer speed.

## Cost

Neon free tier for dev/test; Launch tier (~$19/mo) when needed; scales with storage/compute. Drizzle is MIT/free.

## Scalability

Postgres to very large scale; Neon autoscaling + read replicas later; Drizzle adds no ceiling. If we leave Neon: plain `pg_dump`/restore.

## Security & child-data implications

London region satisfies residency (D4). Neon is a US-headquartered processor operating on AWS London — must be in the DPIA with DPA before real child data (D10); until then synthetic only. TLS-required connections; per-environment credentials; production credentials never in local/CI env. RLS as defence-in-depth is a first-class requirement and drove the D12 recommendation.

## Affected modules

`packages/db` owns schema, migrations, and scoped-repository primitives; all other packages consume through it.

## Outcome

Accepted by founder, 2026-08-14 (closes D12; formalises D4).
