# ADR-0009: Make row-level security actually bind — a non-owning application role and FORCE RLS

**Status:** Accepted (founder, 2026-08-17)
**Date:** 2026-08-16
**Decision register ref:** New D-number required. `DECISIONS.md` is absent from the repository (REALITY_AUDIT_2026-08-15 §C1), so this ADR cannot cite or close one.

## Existing decision

- **MULTI_TENANCY.md §3 layer 3** requires Postgres row-level security as defence-in-depth: "Layer 2 bugs hit a database wall."
- **CLAUDE.md non-negotiable principle 5** requires "tenant isolation in the database".
- **ADR-0004** chose Drizzle specifically so "RLS policies, constraints and append-only rules must be visible and auditable, not hidden behind a migration DSL", and named RLS "a first-class requirement".
- Migrations `0001_enable_rls_organisations.sql` and `0003_enable_rls_auth_tables.sql` issue `ALTER TABLE … ENABLE ROW LEVEL SECURITY` on `organisations`, `auth_user`, `auth_session`, `auth_account`, `auth_verification`.

`0001` records the assumption on which the whole layer rests:

> The application connects as a non-superuser role, so with no permissive policies defined yet, RLS default-denies direct row access outside the migration/owner role.

## The problem

**Nothing in the repository establishes or enforces that assumption, and as configured it is false.**

`packages/config/src/server.ts` defines exactly one `DATABASE_URL`. `packages/db/src/client.ts` (`createDatabase`) and `packages/db/src/migrate.ts` (`runMigrations`) both consume it. The role that runs the migrations therefore **owns** the tables, and the application connects as that same owner.

In PostgreSQL, `ENABLE ROW LEVEL SECURITY` **does not apply to the table's owner**. Layer 3 is currently inert — not weak, inert.

### Verified, not assumed

Reproduced locally on PostgreSQL 17.10, mirroring the repo's migrations exactly (table created, RLS enabled, no policies defined):

| Connecting role               | RLS state           | Rows visible            |
| ----------------------------- | ------------------- | ----------------------- |
| Table owner (non-superuser)   | `ENABLE` only       | **2 — bypassed**        |
| Table owner (non-superuser)   | `FORCE`             | 0 — denied              |
| Non-owning role with `SELECT` | `ENABLE` only       | 0 — denied              |
| Superuser                     | `ENABLE` or `FORCE` | **2 — always bypassed** |

Three conclusions follow, and they are independent:

1. A separate non-owning application role is **necessary** — with the current single role, RLS does nothing.
2. `FORCE ROW LEVEL SECURITY` is **necessary** — it is the only thing that binds the owner, and it is what protects us the day someone points the app at the migration URL.
3. Neither helps against a **superuser**. The application role must be non-superuser and must not hold `BYPASSRLS`.

This is not yet an incident: there are no learner tables, no policies to bypass, and no real child data (D10 ungated). It is a gap to close _before_ data exists, and while the cost of closing it is one migration and one environment variable.

## Proposed change

1. **Two database roles, two connection strings.**
   - A migration/owner role, used only by `runMigrations`, the `db:migrate` CLI, and CI. Supplied as **`MIGRATION_DATABASE_URL`**.
   - A non-owning, non-superuser application role without `BYPASSRLS`, holding only `SELECT/INSERT/UPDATE/DELETE` on the tables it needs. Remains **`DATABASE_URL`**, so the app's existing variable keeps its meaning and gets _narrower_, never wider.
   - `loadServerConfig` gains `MIGRATION_DATABASE_URL` as **optional** — the web app must start without it, and must never hold it in preview or production.

2. **`FORCE ROW LEVEL SECURITY` on every tenant-scoped table**, in the same migration that enables RLS, as a standing rule for all future tables.

3. **Tenant policies keyed on a session variable.** Policies compare the row's tenant key against `current_setting('app.organisation_id', true)`, set with `SET LOCAL` inside the transaction that carries the request, derived from `ActorContext.organisationId` (never from a client-supplied value). `SET LOCAL` is deliberate: it is transaction-scoped and therefore safe under transaction-mode connection pooling, whereas a session-level `SET` leaks across pooled clients.

4. **A CI test that proves the wall exists.** Connect as the application role, attempt a cross-tenant read, assert zero rows; assert the application role is neither superuser nor `BYPASSRLS` nor the table owner. This satisfies MULTI_TENANCY.md §3 layer 4 for layer 3 itself — the failure mode being guarded against is precisely a silent regression to "RLS enabled but not binding".

## Reason

Doing it now costs one migration, one environment variable, and a CI role setup. Doing it after learner tables and policies exist means rewriting ownership and grants across every table under a live schema. Doing it after real child data exists means doing that migration against production data behind the D10 gate.

There is a second, sharper reason. The repository currently _reads_ as though tenant isolation is enforced in the database. A future session — human or Claude — will reasonably rely on that. An inert control that is believed to be active is worse than a documented absence.

## Alternatives considered

- **Application-layer enforcement only (status quo).** Layers 1 and 2 are genuinely well built — `authorise()` checks tenant before role, and the deny cases are tested. But this is explicitly rejected by MULTI_TENANCY.md §3, which requires all four layers, and it means a single missing `WHERE` clause is a cross-tenant child-data breach with nothing beneath it.
- **Policies without a separate role.** Write `CREATE POLICY` but keep one connection. Inert for exactly the reason above — the owner bypasses the policies. Actively harmful, because the policies would make the protection look real.
- **`FORCE` alone, no separate role.** Better than nothing and closes the demonstrated hole, but leaves the application connected as table owner with DDL rights — so an application-layer SQL injection reaches `DROP TABLE`, not just rows. Least-privilege argues for both.
- **Neon's RLS/JWT integration.** Neon offers authenticated-role tooling that may map onto this. **Not evaluated.** It would couple our tenancy model to a vendor feature, which cuts against ADR-0004's stated portability (`pg_dump`/restore if we leave Neon). Worth a look before implementation, not a blocker.
- **Rely on Drizzle's RLS helpers.** Convenience over the same SQL; does not change the ownership question, which is the actual defect.

## Advantages / Disadvantages

**Advantages.** Layer 3 becomes real and testable. Least privilege at the database. Protects against the specific realistic failure — a forgotten tenant predicate — that layers 1 and 2 cannot catch by construction. Establishes the pattern before there are many tables.

**Disadvantages.** Two connection strings is more environment surface to get wrong (mitigated: `MIGRATION_DATABASE_URL` optional and absent from the app's runtime environment). Every request path must open a transaction and `SET LOCAL` — a real constraint on how repositories are written, and it must land in `packages/db` primitives rather than be left to callers. Local development and CI need role provisioning, so `pnpm test` gains a setup step.

## Cost implications

None material. No new services or licences. Neon supports multiple roles per database on all tiers, including free. Cost is engineering time — roughly a migration, a config change, the `packages/db` transaction primitive, and the CI role setup.

## Scalability implications

`SET LOCAL` per transaction is a negligible per-request overhead. RLS policy evaluation adds a predicate to each query; keeping policies keyed on an indexed tenant column keeps that cheap.

The pooling interaction is the thing to get right: under transaction-mode pooling (PgBouncer, Neon's pooled endpoint) a session-level `SET` can leak between clients, which for us would mean **serving one family's tenant context to another**. `SET LOCAL` inside an explicit transaction is the correct primitive, and the CI test above should include a pooled-connection case before production.

## Security & child-data implications

This is the ADR's whole purpose. Under the current configuration a layer-2 defect — one repository constructed without tenant scope, one hand-written query — exposes another family's child data with no barrier beneath it. Layer 3 exists to make that a database-level impossibility.

Directly serves CLAUDE.md principle 5 ("tenant isolation in the database") and is a precondition for the DPIA at the D10 gate: "we enforce tenant isolation in the database" must be _true_ when written down, not aspirational. No data leaves our control; no new processor; no residency change.

Non-negotiable for the application role: **not** superuser, **not** `BYPASSRLS`, **not** the table owner. All three must be asserted in CI, because all three silently defeat the control — as the superuser row in the table above demonstrates.

## Affected modules / migration requirements

- `packages/db/migrations/` — new migration: `FORCE ROW LEVEL SECURITY` on existing tables, application role creation and grants. Role creation may need to be environment-specific (Neon roles are often provisioned out-of-band); the migration must be idempotent and must not fail where the role already exists.
- `packages/db/src/client.ts` — a transaction primitive that sets `app.organisation_id` from `ActorContext` and is the only sanctioned way to reach tenant-scoped tables.
- `packages/db/src/migrate.ts`, `migrate-cli.ts` — use `MIGRATION_DATABASE_URL`.
- `packages/config/src/server.ts` — add optional `MIGRATION_DATABASE_URL`; document that the app runtime must not carry it.
- `.env.example` — both variables, with the distinction stated.
- `.github/workflows/ci.yml` — provision both roles against the Postgres service.
- `docs/MULTI_TENANCY.md` §3 — record that layer 3 requires a non-owning role and `FORCE`, so the requirement is not re-derived later.
- `packages/db/test/` — the RLS enforcement tests.

**Open question for implementation:** whether Neon's default project role is a superuser or holds `BYPASSRLS`. If it does, the application role must be a _new_ Neon role rather than the default one. **This has not been verified** — it needs checking against Neon's documentation before this ADR is implemented, and it may change step 1's provisioning detail.

## Outcome

**Accepted by founder, 2026-08-17.** Not yet implemented — acceptance authorises the change; the work follows.

Sequencing:

- **Steps 1 and 2** (migration/application role split, `FORCE ROW LEVEL SECURITY`, CI assertions that the application role is not owner, not superuser, and lacks `BYPASSRLS`) land first and independently. They close the demonstrated hole without needing the policy design.
- **Step 3** (tenant policies and the `SET LOCAL` primitive in `packages/db`) belongs with the first tenant-scoped learner table, when there is a real tenant key to key policies on.

**Blocking check before step 1:** whether Neon's default project role is a superuser or holds `BYPASSRLS`. If it does, the application role must be a new Neon role rather than the default. Unverified at time of acceptance.

A future ADR supersedes this one if the role model changes; it is not amended in place.
