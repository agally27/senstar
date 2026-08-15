# Foundation Plan — merged from Prompt 01 (ChatGPT) and Foundation Assessment Phases 2–5

**Status:** PROPOSED — awaiting founder approval
**Date:** 2026-08-14
**Supersedes:** the phase sequence in `00-FOUNDATION_ASSESSMENT.md` §H (Phases 2–5), which this document merges with the Prompt 01 scaffolding brief. The constitutions are unaffected and continue to outrank everything here.

---

## 1. Review verdict on Prompt 01

Prompt 01 is a strong scaffolding brief and is ~80% compatible with the existing plan. Assessment:

**Adopt wholesale (better than, or absent from, our plan):**

- **§21 Foundation Reality Audit** — comparing documentation vs code vs infrastructure vs CI vs database vs deployment, with severity-classified discrepancies. Excellent discipline; adopted as a standing practice at the end of _every_ phase, not just this one.
- **§19 explicit documentation states** — Planned / Designed / Implemented / Tested / Production-ready on every capability claim. Adopted immediately into DEVELOPMENT_RULES.md (when written) and applied to all existing docs.
- **§20 Definition of Done checklist + §23 three-state completion report** (NOT READY / READY FOR REVIEW / READY FOR PRODUCT DEVELOPMENT) — adopted; §20 seeds `DEFINITION_OF_DONE.md`.
- **§5 environment separation, §10 central typed config, §15 single job mechanism rule** — all consistent with our guardrails; adopted as written.

**Correct in spirit, resequenced in practice:**

- Prompt 01 goes straight from assessment to scaffolding. Our plan interposes design documents (domain model, multi-tenancy/authz, security/privacy, safeguarding, AI architecture) and ADRs first. The conflict is smaller than it looks: Prompt 01 §§8, 9, 15, 16, 17, 18 mostly demand these things be _documented and designed_, not built. So the merge is: **Prompt 01's "determine and document" sections become Stage A (design docs) and Stage B (ADRs); its physical work becomes Stage C/D.** This honours both prompts: no scaffolding decision is invented mid-implementation, which is exactly what Prompt 01 §22 forbids.

**Push back / amend:**

- **§2 "Do not assume the repository is empty."** Verified: there is no repository at all (Prompt 00 inspection). The inspection step is satisfied trivially; the real blocker is that one must be created — Decision D6, founder action, and the true critical path of this phase.
- **§7 auth provider "determine" during scaffolding** — too casual for this platform. Auth for a child-adjacent, parent-mediated product is a proper ADR with alternatives and child-data assessment (Stage B), decided _before_ any auth code is wired. Same for the DB access layer/ORM.
- **§13 deployment verification** requires founder-owned Vercel and Neon accounts (both pinned to London per D4). I cannot and should not create these; they are founder actions with a short checklist.
- **Missing from Prompt 01 entirely:** the vertical proof slice (Assessment Phase 5). Retained — it is the test that the foundation actually supports the adaptive loop, and it happens _after_ the foundation is declared READY but _before_ feature development. Also missing: any reference to provenance, the D10 regulatory gate, and synthetic-data-only in non-production — all already constitutional, all binding on this phase.

## 2. Merged plan

### Stage 0 — Founder actions (blocking; ~30 min total)

- **F1 (blocks Stage C):** Create the GitHub repository (resolves D6) and connect it to this project (GitHub app/connector or fine-grained PAT). Private repo; name can be provisional.
- **F2 (blocks Stage D only):** Create Vercel account/team and Neon account. **Neon project must be created in `aws-eu-west-2` (London) — region is unchangeable later.** Vercel functions pinned to `lhr1`. I will provide exact click-by-click steps when we reach it.

### Stage A — Design documents (no blockers; can start immediately)

Satisfies Prompt 01 §§8, 9, 14–18 "determine and document" requirements:

1. `DOMAIN_MODEL.md` — entities from Assessment §E elaborated; special care: Guardianship/consent, CurriculumPosition, provenance as schema.
2. `MULTI_TENANCY.md` — tenancy tree (Platform → Organisation{Family|School} → members/learners), roles (all eight from Prompt 01 §8), permission model, resource ownership, inheritance, and the request-cannot-cross-tenants guarantee (RLS + scoped queries).
3. `SECURITY_AND_PRIVACY.md` — Prompt 01 §17 baseline + §18 requirements, each item tagged Technical-capability vs Legal/policy-decision, with professional-review flags. No compliance claims invented.
4. `SAFEGUARDING.md` — safeguarding-specific architecture: what the platform must never do, audit of child-data access, escalation-relevant design.
5. `AI_ARCHITECTURE.md` — the §16 layering (Domain Service → AI Orchestrator → Model Gateway → Provider), prompt versioning, structured outputs, proposal states, pseudonymisation, cost controls. Documented as **Designed**, not implemented.
6. `DEVELOPMENT_RULES.md` + `DEFINITION_OF_DONE.md` — seeded from Prompt 01 §19–20 plus Technical Constitution §6/§8.

### Stage B — ADRs (needs founder sign-off per ADR; short)

`docs/adr/`: 0001 adopt ADR process; 0002 GitHub + Actions CI; 0003 hosting (Vercel London, exit criteria); 0004 database (Neon London) **and access layer/ORM choice** — DECISION REQUIRED with recommendation; 0005 **authentication provider** — DECISION REQUIRED with recommendation, parent-accounts-only per D5; 0006 background jobs mechanism (one mechanism, platform-wide); 0007 observability/error tracking; 0008 config & secrets handling.

### Stage C — Scaffolding (needs F1)

Prompt 01 §§4–12 implemented per the ADRs: monorepo (`apps/web`, `packages/domain-*`, `packages/shared`, `packages/config`); strict TS, lint, format; typed config module (public/server/secret separation, `.env.example`, nothing committed); Postgres connectivity + migration tooling with a deliberately minimal schema (enough to prove migrate/rollback/test — not the product schema); auth foundation per ADR-0005; **authorisation enforcement point** (server-side, tenancy-scoped, with allow _and_ deny tests) and RLS enabled; test pyramid wiring (unit/integration/security) with real minimal tests; CI: install → typecheck → lint → unit → integration → build, red blocks merge; health endpoint, structured logging, error tracking hook.

### Stage D — Deploy + Reality Audit (needs F2)

Vercel preview-on-PR + controlled production deploy; environment/secret separation verified; then the **Foundation Reality Audit** (§21) and the **§23 completion report** with an honest three-state status. Critical discrepancies resolved before READY.

### Stage E — Vertical proof (retained from Assessment Phase 5)

Thin end-to-end slice of the adaptive loop (candidate: KS1 Number & Place Value) exercised in the domain layer with tests and synthetic data — the gate between "foundation ready" and feature development. Depends on D8 (curation sign-off policy) for any content treated as platform-curated.

## 3. Standing rules for this phase (from both sources)

No product features (both prompts agree — enforced). Stop and ask on any unmade important decision (Prompt 01 §22 = our DECISION REQUIRED discipline). Synthetic data only, everywhere, until the D10 gate. Documentation describes reality, with explicit states. Reality Audit before any "done" claim. All work lands in the git repository once it exists; the Claude project mirrors durable state meanwhile.

## 4. Open decisions surfaced by this plan

- **D6 (now critical path):** GitHub repo + access method — founder action F1.
- **D12 (new):** database access layer/ORM — will be presented with recommendation in ADR-0004.
- **D13 (new):** authentication provider — will be presented with recommendation in ADR-0005.
- D8 remains open and now visibly blocks Stage E.
