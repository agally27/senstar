# Senstar (working name)

Adaptive learning platform for children with additional needs. UK-first. **Foundation phase — no product features exist yet, deliberately.**

Start here, in order: `CLAUDE.md` (operating constitution) → `DECISIONS.md` (what's decided/open) → `docs/PRODUCT_CONSTITUTION.md`, `docs/EDUCATIONAL_CONSTITUTION.md`, `docs/TECHNICAL_CONSTITUTION.md` → the design docs in `docs/` → `docs/adr/` for infrastructure decisions.

## Layout

```
apps/web                   Next.js delivery layer — NO business logic here
packages/config            typed, fail-fast env config (ADR-0008)
packages/db                Drizzle schema, migrations, client (ADR-0004)
packages/domain-identity   branded IDs, roles, authorisation decision point
packages/auth              Better Auth setup, actor context (ADR-0005)
packages/jobs              background job queue abstraction (ADR-0006)
packages/observability     structured logging and redaction (ADR-0007)
docs/                      constitutions, design docs, ADRs
```

## Local development

Requires Node 22+, pnpm, PostgreSQL 16.

```bash
pnpm install
cp .env.example .env.local          # fill in values (see file comments)
createdb senstar_dev                 # plus a senstar_test for integration tests
pnpm db:migrate                      # apply migrations
pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @senstar/web dev       # http://localhost:3000 (/api/health)
```

`packages/db`'s integration tests need a reachable Postgres. Without one they are skipped so `pnpm test` still passes; set `TEST_DATABASE_URL` to point them elsewhere. CI always sets it, so there an unreachable database is a failure, never a skip.

## Rules that bite

Synthetic data only outside production — no real child data anywhere before the D10 gate (`DECISIONS.md`). Schema changes by migration only. Business logic never in UI/routes. CI green is the definition of mergeable. Documentation states: Planned / Designed / Implemented / Tested / Production-ready — claims carry their state.
