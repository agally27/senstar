# Technical Constitution

**Status:** DRAFT v0.1 — awaiting founder ratification
**Authority:** Third in the document hierarchy, under the Product and Educational Constitutions. Domain architecture, module specs, implementation and tests must conform to it. Deviations require an ADR.

---

## 1. Architectural shape

**Modular monolith with enforced internal boundaries.** One deployable application; domain modules with explicit public contracts; no module reaches into another's internals or tables. The boundaries are the future seams for extraction — microservices are a possible future, never a starting point.

**The eight boundaries** (full detail in DOMAIN_MODEL.md and MULTI_TENANCY.md when written):

1. **Identity, Tenancy & Access** — accounts, organisations (family and school as tenant shapes), memberships, guardianship, roles, permissions, consent records.
2. **Curriculum** — versioned frameworks, subjects, key stages, programmes of study, objectives, skills, prerequisites. Read-mostly; human-curated; **no AI process may write here**.
3. **Learner** — needs profiles, strengths/preferences, accessibility and communication profiles, per-subject curriculum positions, the learner model.
4. **Adaptation & Pedagogy** — deterministic, inspectable logic translating (objective + learner model) → presentation plan. AI executes plans; it does not make them.
5. **Learning Experience** — activities, lessons, sequences, content assets (each carrying provenance + review status).
6. **Assessment & Evidence** — events, responses, observations, the append-only evidence store; derived mastery/readiness estimates.
7. **AI Orchestration** — the sole gateway to model providers.
8. **Platform Services** — jobs, audit, notifications, analytics, observability, billing (later).

**Dependency rules:** everything may depend on Identity/Tenancy; Curriculum depends on nothing educational; nothing depends on AI Orchestration except through its gateway interface; Platform Services are education-agnostic.

## 2. Code organisation

- **TypeScript, strict mode, everywhere.** No `any` in domain code; domain concepts get real types, not primitives (`LearnerId`, not `string`).
- **Monorepo.** Domain logic lives in framework-agnostic packages (`packages/domain-*`); the web app (`apps/web`) is a delivery layer only. **No business logic in UI components or route handlers** — they validate input, call domain services, render output.
- Public module contracts are typed and documented; cross-module imports go through them (lint-enforced once tooling is set up).
- Dependencies require justification; prefer the platform, the standard library, and boring, widely-audited packages.

## 3. Data

- **PostgreSQL** is the system of record. Migration-based schema changes only — no drift, no manual production DDL.
- **Tenant isolation is enforced in the database layer**, not just application code: every tenant-scoped table carries the tenant key; Postgres row-level security is enabled as defence-in-depth. Cross-tenant access is impossible by construction, not by discipline.
- **Evidence is append-only** (Educational Constitution §5): corrections are new records that supersede, never updates that erase.
- **Provenance is schema, not convention:** educational content tables carry provenance category, source citation, version and review status as non-nullable structure.
- Soft deletes and full audit logging for anything touching child data; hard deletion paths exist to honour UK GDPR erasure rights, and are themselves audited.
- Non-production environments contain **synthetic data only** (D4). Real learner data never leaves production.

## 4. AI rules

Full detail in AI_ARCHITECTURE.md; the constitutional core:

1. **One gateway.** All model calls go through the AI Orchestration module. No direct provider SDK usage anywhere else.
2. **Versioned prompts.** Every prompt is a versioned artefact; every generation records prompt version, model, inputs, output, validation result, and cost (`GenerationRecord`).
3. **Schema-validated output.** Generations are validated against typed schemas and content-safety checks before entering any workflow. Invalid output is rejected and logged, never patched by hand into the database.
4. **Proposal state.** AI output is born _proposed_. It cannot write to Curriculum or Learner domains, and reaches children only via the review gates in force (initially human review — D9). Promotion to platform-curated status is an explicit human act (Educational Constitution §3).
5. **Pseudonymisation before providers.** No learner personal data leaves our system: model context is expressed as anonymous learning descriptors ("working within KS1 number, strong visual preference, minimal text"), never names, dates of birth, or free-text that may embed identity. Provider agreements must exclude training on our data. (Provider choice is D9.)
6. **Cost is observable and capped** per tenant and per feature.

## 5. Security & privacy

Constitutional minimums (full treatment in SECURITY_AND_PRIVACY.md and SAFEGUARDING.md):

- **UK/EU data residency** for all storage and processing of personal data (D4: Neon in `aws-eu-west-2`, Vercel functions pinned to `lhr1`).
- **Authorisation is server-side, contextual, and tested.** Every domain operation checks (actor, tenant, role, guardianship). UI-level hiding is presentation, never protection.
- **Least privilege and data minimisation** throughout: we collect what the loop needs, nothing speculative.
- Consent is a first-class, versioned record: what processing, agreed by whom, when, under which policy version.
- Secrets in a managed store, never in code; encryption in transit and at rest; dependency and vulnerability scanning in CI.
- **Hard gate (D10):** no real child data enters the system before ICO registration and the DPIA are in place.

## 6. Engineering quality

- **Domain logic is tested logic.** Business rules ship with unit tests; authorisation rules ship with tests proving both allow _and_ deny; the adaptive loop's stages ship with integration tests. UI snapshots are not a substitute.
- CI runs typecheck, lint, tests and migrations on every change; a red pipeline blocks merge.
- **Observability from day one:** structured logs with request/tenant correlation, error tracking, and audit trails for sensitive access. If we can't see it, we don't ship it.
- Definition of done lives in DEFINITION_OF_DONE.md and binds every change.

## 7. Approved infrastructure and its guardrails

Per D4 (test phase; formal ADRs to follow in Phase 3): GitHub for source and CI; Vercel (London functions) for hosting; Neon Postgres (London, created in-region from day one); TypeScript/Next.js under the §2 structure. Guardrails that keep these reversible: no proprietary platform primitives (KV/Blob/Cron/etc.) without a wrapper interface; background jobs designed as an independent concern; domain packages must build and test with no framework installed.

## 8. Forbidden practices

Silent contradiction of a higher document; business logic in UI; UI-only permissions; branching adaptation on diagnosis fields (Educational Constitution §1 — enforce in review); AI output written directly to authoritative or curated stores; unvalidated AI output persisted; manual production schema changes; real child data outside production or before the D10 gate; competing duplicate abstractions for the same concept; new dependencies without recorded justification.
