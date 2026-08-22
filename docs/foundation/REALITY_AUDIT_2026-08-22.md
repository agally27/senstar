# Foundation Reality Audit — 2026-08-22 (Stage D)

**Scope:** documentation vs code vs CI vs database vs **deployed environment**, per DEVELOPMENT_RULES §7 and DEFINITION_OF_DONE §2.
**Baseline:** `agally27/senstar` @ `3829321` (`main`, working tree clean at audit start).
**Method:** repository inspection; GitHub API for CI history, branch protection and deployments; live HTTP against the production deployment; SQL against the Neon project (queries run by the founder, results recorded verbatim).
**Classification:** Critical / High / Medium / Low / Intentional-documented.

**What is new since 2026-08-15:** that audit could not reach GitHub or any deployed environment (§C, "Not verifiable from this session"). Everything it listed as unverified is verified here, and the deployment itself is audited for the first time.

---

## A. Verified green

| Area                     | Evidence                                                                                                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI on `main`             | 10 consecutive successful runs, `1619622` → `3829321`. One historical failure (`fc2e978`, 2026-08-15) — the format defect H1 of the previous audit, since fixed.                                                                                         |
| Tests                    | **71** — domain-identity 9, config 7, observability 19, jobs 5, db 24, auth 7. `apps/web` has none, deliberately.                                                                                                                                        |
| Pipeline                 | install → typecheck (7 projects) → lint → format → test → build, all green in CI and locally.                                                                                                                                                            |
| Branch protection        | Active on `main`: PR required, `ci` required, strict (branch must be current), **admins included**, no force-push, no deletion. Verified via API, and observed in practice — PRs #9 and #11 were blocked as `BEHIND` and required updating before merge. |
| Deployment               | `https://senstar.vercel.app` returns `200`; `/api/health` returns `{"status":"healthy","checks":{"app":"ok","database":"ok"}}`.                                                                                                                          |
| Function region          | `x-vercel-id: lhr1::lhr1::…` on both `/` and `/api/health` — **London**, satisfying D4 and ADR-0003. Pinned in-repo at `apps/web/vercel.json`.                                                                                                           |
| Database region          | Connection host `…eu-west-2.aws.neon.tech` — **AWS London**, satisfying D4 and ADR-0004. Fixed at project creation, unchangeable.                                                                                                                        |
| Application DB role      | `senstar_app`: `rolsuper=f`, **`rolbypassrls=f`**, `rolcreatedb=f`, `rolcreaterole=f`.                                                                                                                                                                   |
| RLS in the live database | All five tables (`organisations`, `auth_user`, `auth_session`, `auth_account`, `auth_verification`) report `relrowsecurity=t` **and** `relforcerowsecurity=t`.                                                                                           |
| Preview per PR           | 6 GitHub deployments recorded; the `vercel` app comments deployments on PRs.                                                                                                                                                                             |
| Secrets                  | No `.env` file has ever been committed beyond `.env.example`. Full-history scan for provider key patterns returns only a synthetic test fixture (see L1).                                                                                                |

**On the RLS verification specifically.** The previous audit could only confirm that migrations ran. This one confirms the control _binds in the real database_: the role the application connects as cannot bypass row-level security, and every table forces it. That closes the defect recorded in ADR-0009, in production infrastructure rather than in CI.

---

## B. Findings

### HIGH

**H1 — Preview and production share one database. ADR-0004 requires they not.**

ADR-0004 decides:

> Separate Neon branches/databases per environment (dev / preview / production); production is its own isolated branch with no non-production access.

Reality: a single Neon branch (`main`) serves one `DATABASE_URL`, scoped in Vercel to **both** Production and Preview. Every preview deployment — including one built from an unmerged pull request — reads and writes the same database as production.

Not currently an incident: the database holds no data, there are no users, and D10 is ungated so no real child data may exist anywhere. It is a decided architectural control that is not in place, and the cost of establishing it rises once data exists. `DEFINITION_OF_DONE` §2 lists "dev/preview/production databases separated" as a foundation-completion item; it is not met.

**H2 — Error tracking does not exist. ADR-0007 decided it, and nothing records its absence.**

ADR-0007 item 2 decides:

> **Sentry, EU data residency region**, for error tracking and alerting (application + server errors, failed jobs, AI-pipeline failures), with PII scrubbing on.

There is no `@sentry` dependency anywhere in the workspace and no Sentry code in `packages/observability`. Items 1 (pino) and 3 (`/api/health`) are implemented; item 2 is absent.

The gap itself is defensible in a foundation phase. The defect is that **nothing says so**: ADR-0007 reads as accepted and complete, carries no state tag distinguishing its three parts, and `DEFINITION_OF_DONE` §2 counts "error tracking" among the observability foundation. A reader of this repository would reasonably conclude errors are being captured. They are not — unhandled errors in the deployed application currently go nowhere except Vercel's own runtime logs, which are retention-limited and unalerted.

This is DEVELOPMENT_RULES §1 applied to an ADR: a capability claim without a state.

### MEDIUM

**M1 — `docs/WORKING_WITH_CLAUDE.md` §5 carries two rows that are no longer true.**

| Row                              | Says                                                 | Reality                                                                    |
| -------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `CLAUDE_CODE_OAUTH_TOKEN`        | "**Not set** — run `claude setup-token`…"            | Set 2026-08-19; the workflow has since run successfully and reviewed PR #8 |
| `DECISIONS.md` in the repository | "**Not present** — lives only in the Claude project" | Present at the repository root since 2026-08-18 (PR #6)                    |

The paragraph beginning "`DECISIONS.md` remains the open item" is stale for the same reason. The branch-protection row and the public-repository paragraph are accurate.

**M2 — `DECISIONS.md` exists but is explicitly not authoritative.**

C1 of the previous audit is **partly** closed. The file is present, so the six documents citing it no longer point at nothing. But its own header reads "RECONSTRUCTED SCAFFOLD, NOT YET AUTHORITATIVE", every row is marked for founder verification, and it carries no rationale, alternatives or dates for D1–D5 because the repository never recorded them.

`DEFINITION_OF_DONE` §2 requires "All architectural decisions recorded (ADRs) or explicitly open (DECISIONS.md)". A register that disclaims its own authority does not yet satisfy that.

**M3 — `SECURITY_AND_PRIVACY.md` does not distinguish implemented from planned.**

`DEFINITION_OF_DONE` §2 requires "Security baseline implemented items distinguished from planned items in SECURITY_AND_PRIVACY.md". The document carries a single blanket status — "DRAFT v0.1 — Designed" — and tags items `[T]` technical or `[P]` policy, which is an orthogonal axis. It does not use the Planned/Designed/Implemented/Tested/Production-ready vocabulary that DEVELOPMENT_RULES §1 mandates.

Several of its items are now genuinely **Implemented and Tested** — tenant isolation in the database, the log redaction layer, tested authorisation with deny cases — and the document gives a reader no way to tell those from the aspirational ones.

**M4 — `docs/foundation/00-FOUNDATION_ASSESSMENT.md` is still referenced and still absent.**

C2 of the previous audit. `01-FOUNDATION_PLAN.md:5` cites its §H as superseded. This is now a single reference inside a dated planning artefact rather than a live gate — `CLAUDE.md` was repointed on 2026-08-15 — so it is downgraded from Critical. It remains a dangling reference.

**C3 is closed:** `STAGE_C_STATUS.md` is referenced nowhere in the repository. Nothing claims it exists.

### LOW

**L1 — A test fixture is shaped like a real Neon credential, in a public repository.**

`packages/observability/test/errors.test.ts` uses `npg_SuperSecretValue123` to prove the scrubber removes Neon-style passwords. It is synthetic and proves a real property, but the `npg_` prefix is the pattern automated secret scanners match, so it invites false-positive alerts on a public repo. Renaming it to something self-evidently inert (e.g. `npg_NOT_A_REAL_SECRET_FIXTURE`) keeps the test honest and the noise down.

**L2 — Non-secret Vercel variables are marked Sensitive.**

`APP_ENV` and `NEXT_PUBLIC_APP_ENV` are flagged Sensitive. Harmless, but `NEXT_PUBLIC_APP_ENV` is compiled into the browser bundle by definition, so the flag implies a confidentiality that does not exist. Only `DATABASE_URL` and `BETTER_AUTH_SECRET` need it.

### INTENTIONAL — DOCUMENTED

**I1 — ADR-0009 step 3 (tenant policies) is not implemented.** Recorded in the ADR's own implementation-status section and sequenced deliberately for the first tenant-scoped learner table. Consequence, correctly documented: the application role reads **zero rows** from every table until policies exist. Fail-closed, and it forces step 3 before any feature can depend on those tables.

**I2 — Authentication is built but not mounted.** `packages/auth` implements ADR-0005 with tested actor-context logic, and `createAuth` deliberately requires an email transport at construction so a sign-up flow cannot exist in a broken state. No route mounts it, because D15 (email provider) is open. The absence is a consequence of an open decision, not drift.

**I3 — `01-FOUNDATION_PLAN.md` still describes D6 as open.** Carried forward from the previous audit: a dated planning artefact recording the state when written.

---

## C. Outstanding decisions surfaced

Not audit findings — founder decisions the audit depends on:

- **ADR-0002 vs repository visibility.** ADR-0002 decides a _private_ repository; it is public since 2026-08-18, changed to obtain branch protection. Recorded as DECISION REQUIRED in `DECISIONS.md` §6, unresolved. Either an ADR ratifies it (superseding ADR-0002 in part) or the repository returns to private.
- **D10 — ICO registration and DPIA.** Ungated. The processor chain to record is now concrete and includes an addition: Vercel, Neon (**contracted through Vercel Marketplace, not directly**), GitHub, and whichever provider closes D15.
- **D15 — transactional email.** Blocks sign-up, and therefore blocks any real `ActorContext`, and therefore blocks the request half of ADR-0009 step 3.
- **D8** — blocks Foundation Stage E.

---

## D. DEFINITION_OF_DONE §2 — foundation-phase checklist

| #   | Item                                                                                 | Status                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Repository structure per TECHNICAL_CONSTITUTION §2                                   | **Met** — 6 packages, 1 app, domain logic framework-free                                                                                                                                                                              |
| 2   | Application starts locally; builds                                                   | **Met** — verified both                                                                                                                                                                                                               |
| 3   | TypeScript strict passes; lint passes                                                | **Met** — 7 projects, CI-enforced                                                                                                                                                                                                     |
| 4   | Test framework runs locally and in CI, real tests                                    | **Met** — 71 tests incl. integration and security                                                                                                                                                                                     |
| 5   | CI pipeline; red blocks merge                                                        | **Met** — enforced by branch protection, observed blocking                                                                                                                                                                            |
| 6   | DB connects; migrations apply and are tested; **dev/preview/production separated**   | **Partly** — connection, migrations and tests met; separation **not met** (H1)                                                                                                                                                        |
| 7   | Environment separation; `.env.example` documents all variables; no secrets committed | **Met** — both connection strings, `sslmode` reasoning, env-loading rules documented; history clean                                                                                                                                   |
| 8   | Authentication foundation per ADR-0005                                               | **Partly** — implemented and tested; not mounted, pending D15 (I2)                                                                                                                                                                    |
| 9   | Authorisation with allow+deny+cross-tenant tests; RLS enabled                        | **Met** — and RLS verified binding in the live database                                                                                                                                                                               |
| 10  | Multi-tenancy documented; schema foundations in place                                | **Met** — MULTI_TENANCY §3 records all three RLS conditions                                                                                                                                                                           |
| 11  | Deployment: preview per PR; controlled production deploy                             | **Partly** — preview per PR confirmed; production auto-deploys on merge to `main`. Defensible (merge requires PR + green CI), but "no auto-deploy of unreviewed changes" deserves an explicit founder ruling rather than an inference |
| 12  | Observability: structured logs, **error tracking**, health endpoint                  | **Not met** — logs and health endpoint present; error tracking absent (H2)                                                                                                                                                            |
| 13  | AI boundary documented (Designed), no implementation                                 | **Met**                                                                                                                                                                                                                               |
| 14  | Security baseline: implemented distinguished from planned                            | **Not met** (M3)                                                                                                                                                                                                                      |
| 15  | Privacy/safeguarding documented; synthetic-data-only verified                        | **Partly** — documented; "verified" is vacuous while the database is empty. Becomes meaningful once seed data exists                                                                                                                  |
| 16  | CLAUDE.md and all docs reflect actual state; criticals resolved                      | **Not met** — M1, M2, M4 outstanding                                                                                                                                                                                                  |
| 17  | No product features implemented                                                      | **Met**                                                                                                                                                                                                                               |
| 18  | All decisions recorded (ADRs) or explicitly open (DECISIONS.md)                      | **Partly** — 10 ADRs; register present but not authoritative (M2), and ADR-0002 unreconciled                                                                                                                                          |

**Met: 10 of 18. Partly: 5. Not met: 3.**

---

## E. Changes made by this audit

None. This audit is observation only — no code, configuration or documentation was modified in producing it. Every finding above is left for a separate, reviewable change.

---

## F. Status

**Foundation remains NOT READY** (DEFINITION_OF_DONE §3).

This is a materially stronger position than 2026-08-15. The three Criticals of that audit are closed or downgraded; CI has been green on `main` for ten consecutive runs; branch protection is enforced and has demonstrably blocked merges; and for the first time the platform runs in its decided regions with tenant isolation proven in the live database rather than asserted in a migration.

What blocks READY is not scale of work but three specific gaps, each small:

1. **H1** — separate the preview database from production (one Neon branch, one Vercel variable scope).
2. **H2** — either implement Sentry per ADR-0007, or record it as Planned with a state tag and amend the DoD item accordingly. Either is acceptable; leaving the claim unqualified is not.
3. **M1–M4** — documentation catching up with reality, which is the cheapest work on this list.

Item 11 additionally needs a founder ruling on whether auto-deploy from a protected `main` satisfies "no auto-deploy of unreviewed changes".

No feature work has been started. The standing gates are unchanged: D8 before any curated content is approved; **D10 before any real child data, anywhere, ever**.
