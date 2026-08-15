# AI Architecture

**Status:** DRAFT v0.1 — **Designed** (no AI functionality is implemented; nothing here is a capability claim)
**Authority:** Domain Architecture level. Implements Technical Constitution §4 and Prompt 01 §16.
**Prime directive:** AI is never an uncontrolled source of truth. It is a gated executor of decisions made by inspectable domain logic.

---

## 1. Layering

```
Application (UI / API)
        ↓  (never calls AI directly)
Domain Service            e.g. "prepare experience for (learner, objective)"
        ↓  produces a PresentationPlan (deterministic, inspectable)
AI Orchestrator           use-case level: which generation, with which context
        ↓
Model Gateway             provider abstraction: models, retries, timeouts, cost
        ↓
LLM Provider(s)           per ADR (D9) — pseudonymised context only
```

Two module rules enforce this: the provider SDK is a dependency of the Model Gateway package **only** (lint-enforced), and the Orchestrator's outputs land exclusively in `proposed` states — it has no write path into the Curriculum or Learner contexts.

## 2. What AI is for (and not)

**For:** realising PresentationPlans as content (explanations, activities, examples, visual descriptions, adapted resources); drafting platform-curated curriculum decomposition _for human review_ (D1/D8); assisting adults (e.g. summarising progress in plain language — always labelled system-derived/AI-assisted).

**Not for:** deciding adaptations (the Adaptation domain does that deterministically); assessing children (evidence interpretation is domain logic); conversing with children (SAFEGUARDING.md §1.2); writing curriculum truth; anything whose failure mode is "a child sees something wrong or harmful with no human between".

## 3. Prompt management

Prompts are versioned artefacts (`PromptVersion`): identity, semantic version, template, input schema, output schema, model requirements, safety notes, changelog. Stored in the repo, reviewed like code, referenced by ID+version in every generation. No inline prompt strings anywhere in application code.

## 4. Generation lifecycle

request (domain service, with plan + pseudonymised learner descriptors) → orchestrator assembles context → gateway calls model (timeouts, bounded retries, model selection per prompt requirements) → **validation pipeline** (§6) → result stored as ContentAsset/draft in `proposed` state with a full `GenerationRecord` → review gate (§6) → `approved` or `rejected`.

`GenerationRecord` (audit, per Technical Constitution §4): prompt ID+version, model+version, full input context, raw output, validation outcomes, reviewer identity/decision where applicable, latency, token counts, cost. Queryable; this is how we debug, control spend, and answer "why did the system produce this?".

## 5. The pseudonymisation boundary

Nothing identifying crosses the gateway. Permitted context: anonymous learning descriptors — curriculum position, modality preferences, scaffold level, interest themes ("dinosaurs"), presentation register. Forbidden: names, ages/DoB, diagnosis context (walled anyway), free-text observations, anything user-written that could embed identity. The boundary is a typed schema — context is _constructed_ from allowed fields, not filtered from rich objects — so leaking is a type error, not a runtime hope. Provider terms must include no-training-on-inputs (D9).

## 6. Validation & review gates

Every generation passes, in order: **schema validation** (structured outputs against the prompt's output schema; failure = rejected + logged, never hand-patched); **content-safety checks** (child-appropriateness, forbidden content classes, register/dignity check per D2); **pedagogical constraints** (matches the PresentationPlan: modality, CPA stage, cognitive-load limits like one-new-thing); then **human review** — while D9's human-in-the-loop posture holds, a qualifying adult approves before any child sees it. Relaxation of human review is per-content-type, evidence-based, founder-approved, and recorded — never a silent drift.

## 7. Operational controls

Cost tracked per generation, aggregated per tenant and per feature, with caps and alerts (budget exhaustion degrades gracefully to existing approved content, never to unvalidated output). Latency/error observability through the standard platform stack (ADR-0007). Model changes (provider updates, new models) are ADR-worthy events with regression checks against golden prompt test sets.

## 8. Open decisions

**D9:** provider(s), processor terms, no-training clauses, and the initial human-review posture (recommended: all child-facing content human-reviewed). **New — D14:** whether generation drafts count as personal data when derived from learner descriptors (interacts with erasure; flagged for the DPIA workstream). Model evaluation/golden-set methodology: Designed in outline here, detailed before first implementation.
