# DECISIONS.md — Senstar decision register

**Status:** Scaffold — **INCOMPLETE, NOT AUTHORITATIVE.**
**Created:** 2026-08-17

---

## Read this before using the file

This register is the file that `CLAUDE.md`, `README.md`, `docs/DEVELOPMENT_RULES.md` §2 and §6, `docs/PRODUCT_CONSTITUTION.md` §5, `docs/DEFINITION_OF_DONE.md`, `docs/adr/0001` and `package.json` all treat as canonical. It was missing from the repository entirely (REALITY_AUDIT_2026-08-15 §C1); the authoritative copy lives in the Claude project.

**This file is a scaffold, not that copy.** It was assembled by walking every `D<n>` reference in the repository and recording what the repository itself says about each one. Nothing here is a founder decision. No decision text has been invented, and where the repository does not state something, the entry says so rather than guessing.

Two consequences, both important:

1. **Every entry needs founder confirmation** before it carries any authority. Entries below reproduce what the _repository_ claims; the founder's register is the source of truth, and where the two differ the founder's wins.
2. **Absence of an entry is not evidence a decision is settled.** The rule "open items are DECISION REQUIRED and are never resolved by implementation" (`docs/DEVELOPMENT_RULES.md` §2) cannot be satisfied from this file until it is completed.

Replace this file wholesale with the founder's register when it is exported, or complete it in place and delete this section.

`D11` does not appear anywhere in the repository. Either it was never allocated or it was withdrawn — **to confirm**.

---

## Summary

| D   | Subject                                                 | Status per repo         | Closed by                   |
| --- | ------------------------------------------------------- | ----------------------- | --------------------------- |
| D1  | Five provenance categories for educational information  | Decided                 | —                           |
| D2  | Curriculum position decoupled from age and school year  | Decided                 | —                           |
| D3  | Horizon-1 wedge: parents and home educators             | Decided                 | —                           |
| D4  | UK/EU residency; Neon `aws-eu-west-2`, Vercel `lhr1`    | Decided                 | ADR-0003, ADR-0004          |
| D5  | Parent-mediated v1; no child logins                     | Decided (revisit later) | constrains ADR-0005         |
| D6  | Repository home and CI                                  | **Closed**              | ADR-0002                    |
| D7  | Product name ("Senstar" provisional)                    | **OPEN**                | —                           |
| D8  | Who signs off platform-curated curriculum content       | **OPEN**                | —                           |
| D9  | AI provider(s), processor terms, human-review posture   | **OPEN**                | —                           |
| D10 | ICO registration + DPIA — hard gate for real child data | **OPEN — hard gate**    | —                           |
| D11 | _no reference found in the repository_                  | **Unknown**             | —                           |
| D12 | Data access layer                                       | **Closed**              | ADR-0004 (Drizzle)          |
| D13 | Authentication provider and session mechanics           | **Closed**              | ADR-0005 (Better Auth)      |
| D14 | Whether AI generation drafts count as personal data     | **OPEN**                | —                           |
| D15 | Transactional email provider                            | **OPEN**                | brief at `docs/foundation/` |

Statuses above are what the repository asserts. **All require founder confirmation.**

---

## Decided (per the repository — confirm each)

### D1 — Provenance categories

**Repository says:** DECIDED. Every piece of educational information belongs to exactly one of five categories: authoritative / platform-curated / system-derived / AI-generated / user-generated. Promotion between categories only by explicit, recorded human review.
**Referenced by:** `docs/EDUCATIONAL_CONSTITUTION.md:30`, `docs/DOMAIN_MODEL.md:45`, `CLAUDE.md` (principle 3).
**Founder confirmation:** _pending_

### D2 — Curriculum position decoupled from age

**Repository says:** DECIDED. A learner's position is per-subject and fully decoupled from age and school year. Content stage and presentation register are independent axes.
**Referenced by:** `docs/EDUCATIONAL_CONSTITUTION.md:21`, `docs/SAFEGUARDING.md:33`, `docs/DOMAIN_MODEL.md:38`, `CLAUDE.md` (principle 2).
**Founder confirmation:** _pending_

### D3 — Horizon-1 wedge

**Repository says:** DECIDED. Parents and home educators. The parent is the customer and account holder.
**Referenced by:** `docs/PRODUCT_CONSTITUTION.md:30`, `CLAUDE.md` (What we are building).
**Founder confirmation:** _pending_

### D4 — Residency and hosting

**Repository says:** DECIDED. All storage and processing in UK/EU regions — Neon `aws-eu-west-2`, Vercel `lhr1`. Non-production environments hold synthetic data only.
**Referenced by:** `docs/TECHNICAL_CONSTITUTION.md:39,56,72`, `docs/SECURITY_AND_PRIVACY.md:28`, ADR-0003, ADR-0004.
**Founder confirmation:** _pending_

### D5 — Parent-mediated v1

**Repository says:** v1 is parent-mediated with adult accounts only; no child logins. Direct child interaction is a later revisit ("post-D5").
**Referenced by:** `docs/MULTI_TENANCY.md:53`, `docs/SAFEGUARDING.md:42`, ADR-0005 ("constrained by D5").
**Founder confirmation:** _pending_ — including whether D5 is decided or merely deferred.

### D6 — Repository home — CLOSED

**Repository says:** Closed. `agally27/senstar`, GitHub Actions for CI.
**Closed by:** ADR-0002 (accepted).
**Referenced by:** `CLAUDE.md:39`, `docs/adr/0002-github-and-actions.md:5`.
**Founder confirmation:** _pending_

### D12 — Data access layer — CLOSED

**Closed by:** ADR-0004 — Drizzle ORM, accepted by founder 2026-08-14.
**Referenced by:** `docs/adr/0004-neon-postgres-drizzle.md:5,12,18`.
**Founder confirmation:** _pending_

### D13 — Authentication — CLOSED

**Closed by:** ADR-0005 — Better Auth, accepted by founder 2026-08-14.
**Referenced by:** `docs/adr/0005-authentication-better-auth.md:5,15,44`, `docs/MULTI_TENANCY.md:74`.
**Founder confirmation:** _pending_

---

## DECISION REQUIRED

These are recorded as open in the repository. **None may be resolved by implementation.**

### D7 — Product name

**DECISION REQUIRED.** "Senstar" is a provisional working name. Nothing in code, data or branding may treat it as final.
**Referenced by:** `CLAUDE.md:3`, `docs/PRODUCT_CONSTITUTION.md:5`, `package.json:5`.
**Decision:** _to be recorded by founder_

### D8 — Curriculum sign-off authority

**DECISION REQUIRED.** Who signs off platform-curated curriculum content. Blocks any curated objective reaching `approved` state.
**Referenced by:** `docs/DOMAIN_MODEL.md:90`.
**Decision:** _to be recorded by founder_

### D9 — AI provider and review posture

**DECISION REQUIRED.** Provider(s), processor terms, no-training clauses, and the initial human-review posture. The architecture's recommendation on record is that all child-facing content is human-reviewed. Human review applies while D9 is open.
**Referenced by:** `docs/AI_ARCHITECTURE.md:20,55`, `docs/SAFEGUARDING.md:30`.
**Decision:** _to be recorded by founder_

### D10 — ICO registration and DPIA — HARD GATE

**DECISION REQUIRED — the strictest gate in the project.** No real child data enters the system before ICO registration and the DPIA are in place. Synthetic data only until then, enforced in `docs/DEFINITION_OF_DONE.md`.

Processors needing DPIA cover before real data: Neon, Vercel, and whichever AI provider D9 selects.

**Referenced by:** `CLAUDE.md:21` (principle 5), `docs/TECHNICAL_CONSTITUTION.md:61`, `README.md:37`, `docs/SECURITY_AND_PRIVACY.md`, ADR-0003, ADR-0004.
**Decision:** _to be recorded by founder_

### D14 — Status of AI generation drafts under data protection

**DECISION REQUIRED.** Whether generation drafts count as personal data when derived from learner descriptors. Interacts with erasure; flagged for the DPIA workstream.
**Referenced by:** `docs/AI_ARCHITECTURE.md:55`.
**Decision:** _to be recorded by founder_

### D15 — Transactional email provider

**DECISION REQUIRED.** No provider implemented; `packages/auth` records the gap in code.

A decision brief exists at `docs/foundation/D15_EMAIL_PROVIDER_BRIEF.md`. It rejects Resend on residency grounds and reduces the field to AWS SES (`eu-west-2`) and Mailgun EU, with a stated proposal that is explicitly **not** a decision.

**Referenced by:** `packages/auth/src/auth.ts:22`, `docs/foundation/D15_EMAIL_PROVIDER_BRIEF.md`.
**Decision:** _to be recorded by founder_

---

## Related architecture decisions

ADRs record architectural decisions and close D-numbers where noted. See `docs/adr/`. ADR-0009 (row-level security enforcement, accepted 2026-08-17) has **no D-number**, because this register was absent when it was written — assign one on completion.
