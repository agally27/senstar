# Security & Privacy Architecture

**Status:** DRAFT v0.1 — Designed. Each item is tagged **[T]** technical capability (ours to build) or **[P]** legal/policy decision (requires professional/legal review — we make no compliance claims here).
**Authority:** Domain Architecture level. Implements Technical Constitution §5 and Prompt 01 §17–18.
**Standing rule:** this platform processes children's data. Nothing in this document is a "future enhancement".

---

## 1. Data classification

| Class                             | Examples                                                           | Handling                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Child personal data** (highest) | learner name, needs profile, evidence, learner model, observations | UK/EU residency; audit on read & write; never in logs; never to AI providers un-pseudonymised; never outside production |
| Child-adjacent context            | DiagnosisRecord                                                    | As above, plus structurally walled from adaptation (DOMAIN_MODEL.md §4)                                                 |
| Adult personal data               | guardian/teacher accounts, contact details                         | UK/EU residency; standard PII controls                                                                                  |
| Organisational data               | school structure, classes                                          | Tenant-isolated                                                                                                         |
| Platform data                     | curriculum content, prompts, config                                | Versioned, access-controlled, not personal                                                                              |

Special-category considerations **[P]**: needs profiles and diagnosis context may constitute health-related special-category data under UK GDPR. Lawful basis, condition for processing, and DPIA treatment require professional review before any real child data exists (the **D10 hard gate**).

## 2. Privacy-by-architecture commitments [T]

- **Data minimisation:** we collect what the adaptive loop demonstrably needs; every field in the domain model must justify itself. No speculative collection ("might be useful later" is a rejection reason).
- **Purpose limitation:** processing purposes are enumerated with the consent model; a new purpose = a new consent version, not a quiet reuse.
- **Consent as data:** ConsentRecord (versioned policy text, per-purpose, withdrawable) per DOMAIN_MODEL.md §3. What withdrawal stops, per purpose, is specified alongside each purpose **[P for the policy text; T for the machinery]**.
- **Erasure:** whole-learner erasure paths built and tested before real data exists — including evidence, derived models, generation records containing learner context, and backups strategy **[T]**; retention periods per class **[P]**.
- **Export/portability:** guardian-triggered learner data export in a comprehensible format **[T]**.
- **Residency:** all storage and processing in UK/EU regions (D4: Neon `aws-eu-west-2`, Vercel `lhr1`); every additional processor (email, error tracking, AI) must pass the same test before adoption — region + processor agreement + no-training clause where applicable **[T + P]**.
- **Non-production = synthetic only** (D4). A realistic synthetic data generator is foundation tooling, not an afterthought.

## 3. Security baseline [T]

- **Transport & headers:** TLS everywhere; strict security headers (CSP, HSTS, frame-ancestors, referrer policy); CSRF protection on state-changing routes.
- **Input/output validation:** every boundary (HTTP, jobs, AI outputs) schema-validates inbound and outbound; no unvalidated data crosses a module boundary.
- **AuthN/AuthZ:** per ADR-0005 and MULTI_TENANCY.md; sessions httpOnly/secure/sameSite; server-side, four-layer authorisation.
- **Rate limiting:** on authentication endpoints and expensive operations (AI generation) from day one; strategy per route class.
- **Secrets:** managed store only (platform env vars in the interim), never committed, `.env.example` documents names only; rotation procedure documented; secrets never logged.
- **Dependencies:** lockfiles, automated vulnerability scanning in CI, update cadence; new dependencies need recorded justification (Technical Constitution §2).
- **Database:** least-privilege connection roles; RLS (MULTI_TENANCY.md §3); migrations only; no production manual DDL.
- **Logging:** structured, correlation IDs, tenant IDs — and **no child personal data in logs, ever** (names, free-text observations, generated content bodies are all excluded; log references, not contents).

## 4. Auditability [T]

AuditLogEntry on: all child-data reads and writes, permission-sensitive actions (§5 of MULTI_TENANCY.md), consent changes, erasures/exports, platform break-glass access, curated-content approvals, AI generation requests. Audit records are append-only and retained on their own schedule **[P]**.

## 5. Incident readiness

Minimal but real from the start **[T]**: error tracking and alerting (ADR-0007), a written incident-response note (who is told, what is preserved, how access is revoked), and the audit trail to reconstruct events. Breach-notification obligations and thresholds **[P]**.

## 6. Requires professional/legal review before launch (register)

ICO registration; DPIA (children + profiling ⇒ required — the adaptive LearnerModel is profiling); lawful bases and special-category conditions; privacy notices (adult-facing and, when children interact directly, child-comprehensible); ICO Age Appropriate Design Code conformance review; retention schedule; processor agreements (hosting, DB, AI, email, error tracking); terms of service. **None of these may be claimed as satisfied by any documentation or marketing until professionally reviewed — and no real child data enters the system before ICO registration + DPIA (D10, hard gate, enforced in DEFINITION_OF_DONE.md).**
