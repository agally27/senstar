# Product Constitution

**Status:** DRAFT v0.1 — awaiting founder ratification
**Authority:** Top of the document hierarchy. No lower document, module or implementation may contradict this one. Changes require a founder-approved ADR.
**Working name:** "Senstar" is provisional (Decision D7 open). Nothing in code, data or branding may treat it as final.

---

## 1. What this product is

An **adaptive learning platform for children with additional needs**, UK-first, England's National Curriculum first.

The product is the adaptive loop:

> Curriculum → Learner → Adaptation → Learning Experience → Assessment → Evidence → Updated Learner Model → Next Learning Objective

This loop is the core intellectual property. Every feature exists to serve it, strengthen it, or make its results useful to the adults around the child. A feature that cannot be traced to the loop is, by default, out of scope.

## 2. What this product is not

- **Not an AI worksheet generator.** Generated resources are one output of the loop, never the product.
- **Not a diagnostic tool.** We never diagnose, screen for, or suggest the presence of any condition. We describe learning needs and evidence, and signpost families to professionals where appropriate.
- **Not a medical or therapeutic product.** No claims of treatment or clinical benefit.
- **Not a behaviour-surveillance tool.** We record learning evidence, not conduct dossiers on children.
- **Not a simplified mainstream curriculum.** Adaptation means changing _how_ learning is presented and sequenced, not merely watering content down.
- **Not ad-funded, ever.** No advertising to children or about children; learner data is never sold or shared for marketing. This is constitutional, not a current-policy statement.

## 3. Who it serves, in order

**Horizon 1 (the wedge — DECIDED, D3):** parents and home educators. The parent is the customer, the account holder, and in v1 the operator: sessions are **parent-mediated** (DECIDED, D5) — the parent signs in and works with the child; children have no logins yet. The domain model must keep a child-login path open without rework.

**Horizon 2:** teachers and nurture groups — assigning, adapting, reviewing for multiple learners.

**Horizon 3:** SENCOs and whole schools — cohort visibility, organisation management, reporting, administration.

The child is always the _beneficiary_; the horizons describe who operates the platform. No horizon-1 shortcut may structurally block horizons 2–3 (tenancy, roles and guardianship are designed for all three from the start), but neither do we build school administration before a single family is well served.

## 4. Product principles

1. **The learner leads, the diagnosis informs.** Nothing in the product may present a diagnosis as determining how a child learns. (Enforced structurally — see Educational and Technical Constitutions.)
2. **Provenance is a product feature.** Any adult must be able to ask "where did this objective / activity / judgement come from?" and get a truthful, comprehensible answer in-product. The five provenance categories (see Educational Constitution §3) are user-visible, not internal bookkeeping.
3. **Honest about inference.** Mastery estimates, readiness judgements and recommendations are presented as the system's evidenced view, never as fact or as a grade. The evidence behind them is always inspectable.
4. **Modest claims, earned trust.** Our users are expert, sceptical consumers who have been over-promised to before. Marketing and in-product language never outruns evidence. We design for demonstrable impact from the start.
5. **Accessibility is the product, not a setting.** If a child cannot access an experience, that experience is broken, not "unsupported".
6. **Calm by design.** No dark patterns, no streak pressure, no shame mechanics, no engagement-maximising tricks. Progress celebration is gentle and learner-appropriate. A child having a bad day must never be made to feel worse by the product.
7. **The adult is a partner, not a spectator.** Parents and teachers contribute observations that genuinely feed the learner model; the product explains its reasoning to them and accepts correction.
8. **Safeguarding outranks features.** Where a feature and children's safety or privacy conflict, safety wins without discussion. (See SAFEGUARDING.md and SECURITY_AND_PRIVACY.md.)

## 5. Scope discipline

- Features are built only after their domain model is understood and documented.
- A capability can be _designed for_ (in the domain model) long before it is _built_; the constitution distinguishes the two deliberately.
- Open product questions are recorded in `DECISIONS.md` as DECISION REQUIRED, never resolved by silent implementation.

## 6. Change control

This document sits at the top of: Product Constitution → Educational Constitution → Technical Constitution → Domain Architecture → Module Specification → Implementation → Tests. Proposed changes at any level that conflict with a higher level require an ADR (existing decision, proposed change, reason, benefits, risks, affected modules, migration requirements) and founder approval. The founder is the final decision-maker.
