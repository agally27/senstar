# Definition of Done

**Status:** DRAFT v0.1
**Authority:** binds every change and every phase. A thing is done when it is _verified_, not when it is written.

---

## 1. Per-change DoD

A change (PR) is done only when: it implements a decided design (no unresolved DECISION REQUIRED inside it); typecheck, lint, and all tests pass in CI; new domain logic has unit tests, new authorisation has allow+deny tests, new tenant-scoped data has cross-tenant denial coverage; migrations run forward (and reverse where designed) in CI; no secrets, no child-data-in-logs violations, no new dependency without justification; documentation touched by the change is updated **with correct state tags** (Planned/Designed/Implemented/Tested/Production-ready); and the change does not contradict any constitution or design doc without an approved ADR.

## 2. Foundation-phase DoD (from Prompt 01 §20, amended)

The foundation phase is complete only when every item below is genuinely verified — each will be checked in the Foundation Reality Audit, not self-certified:

- Repository structure established (monorepo per TECHNICAL_CONSTITUTION §2)
- Application starts locally; application builds
- TypeScript strict passes; lint passes
- Test framework runs locally and in CI, with real minimal tests (unit, integration, security)
- CI pipeline runs: install → typecheck → lint → unit → integration → build; red blocks merge
- Database connects; migrations apply, roll forward, and are tested; dev/preview/production databases separated
- Environment separation exists; `.env.example` documents all variables; no secrets committed
- Authentication foundation implemented per ADR-0005
- Authorisation enforcement point implemented with allow+deny+cross-tenant tests; RLS enabled
- Multi-tenancy architecture documented and its schema foundations in place
- Deployment pipeline works: preview per PR; controlled production deploy; no auto-deploy of unreviewed changes
- Error/observability foundation exists (structured logs, error tracking, health endpoint)
- AI boundary documented (Designed) — no AI implementation
- Security baseline implemented items distinguished from planned items in SECURITY_AND_PRIVACY.md
- Privacy/safeguarding architecture documented; synthetic-data-only verified in non-production
- CLAUDE.md and all docs reflect actual state (reality audit passed, criticals resolved)
- **No product features implemented**
- All architectural decisions recorded (ADRs) or explicitly open (DECISIONS.md)

## 3. Phase status reporting

Every phase report ends with exactly one status: **NOT READY** / **READY FOR REVIEW** / **READY FOR PRODUCT DEVELOPMENT** — the last only when §2 is fully verified. Ahead of that, the standing gates remain: D8 before any curated content is "approved"; D10 (ICO registration + DPIA) before any real child data, anywhere, ever.
