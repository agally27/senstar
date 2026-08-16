# Development Rules

**Status:** DRAFT v0.1 — binding on all engineering work once ratified.
**Authority:** operationalises the Technical Constitution; where they conflict, the Constitution wins and the conflict is an ADR.

---

## 1. Documentation describes reality

Every capability claim in any document carries exactly one state: **Planned → Designed → Implemented → Tested → Production-ready**. "The platform supports X" without a state tag is a defect. State upgrades happen in the same change that earns them; downgrades (regressions) are recorded, never quietly deleted. Marketing and in-product copy may only reference Tested-or-better capabilities; for safeguarding claims this is a critical rule (SAFEGUARDING.md §6).

## 2. Change discipline

- Work happens on branches; `main` is protected; merges require green CI. **CI is the source of truth for merge readiness** — "works locally" is an anecdote.
- No silent contradiction of any constitution or design doc: conflicts become ADRs (`docs/adr/`, template in 0000) with founder approval.
- Founder decisions live in `DECISIONS.md`; open items are DECISION REQUIRED and are never resolved by implementation. Discovering a needed-but-unmade decision means **stop and ask**, not invent.
- One abstraction per concept: before adding a mechanism (job runner, config reader, HTTP client wrapper, validation approach), search for the existing one. Duplicates are removed on sight.
- Dependencies: each new package gets a one-line recorded justification in the PR; prefer platform/stdlib/boring choices; security scanning must pass.

## 3. Code placement rules

- Domain logic lives in `packages/domain-*`; these packages build and test **with no framework installed**. Business logic in a UI component or route handler is a rejected review, full stop.
- Route handlers and UI: validate input → call domain service → render. Nothing else.
- Provider SDKs (AI, email, etc.) are dependencies of their gateway package only.
- Strong types: no `any` in domain code; domain identifiers are branded types; module boundaries expose typed, documented contracts only.

## 4. Data rules

- Schema changes by migration only, reviewed, reversible, tested; no manual DDL anywhere, ever.
- Tenant key + RLS on every tenant-scoped table; repositories require tenant scope by construction (MULTI_TENANCY.md §3).
- Provenance columns non-nullable on educational content; evidence tables append-only (DOMAIN_MODEL.md invariants — enforce in review and by constraint where possible).
- No child personal data in: logs, error reports, analytics events, AI provider calls, or any non-production environment. Synthetic data generator is the only seed source outside production.

## 5. Testing rules

- Domain logic ships with unit tests in the same PR. Authorisation ships with **allow and deny** tests; every module carries cross-tenant denial tests.
- Integration tests cover DB boundaries and module contracts; E2E covers critical journeys once journeys exist; no meaningless coverage-padding tests.
- A red pipeline blocks merge with no override culture; flaky tests are fixed or quarantined-with-ticket the day they flake.

## 6. AI-assisted development rules (for Claude/tooling sessions)

Read `CLAUDE.md`, `DECISIONS.md`, and any doc being touched before working. State assumptions when working unattended; keep them reversible. Distinguish cited-authoritative / established-practice / proposal in analysis. Never generate migrations, authz changes, or safeguarding-relevant code without tests in the same change. End sessions with durable state pushed to the repo, and founder decisions mirrored into the Claude project.

## 7. Reality audits

At the end of every phase (and before any "READY" claim): compare documentation vs code vs infrastructure vs CI vs database enforcement vs deployed reality. Classify discrepancies Critical / High / Medium / Low / Intentional-documented. Criticals block; the audit output is committed with the phase report. Hiding a discrepancy is the one unforgivable process failure.
