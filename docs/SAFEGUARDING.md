# Safeguarding Architecture

**Status:** DRAFT v0.1 — Designed. Tagged **[T]** technical capability / **[P]** policy or professional-review item.
**Authority:** Domain Architecture level. Sits alongside SECURITY_AND_PRIVACY.md; where they overlap, the stricter reading applies.
**Scope note:** this document covers the _platform's_ safeguarding posture. Schools' statutory safeguarding duties (KCSIE etc.) remain theirs; in Horizons 2–3 the platform must support, and never obstruct or appear to replace, those duties **[P]**.

---

## 1. Safeguarding stance

The platform's strongest safeguarding features are the things it **does not do**. These are constitutional-level commitments:

1. **No communication features involving children.** No chat, messaging, comments, forums, or any child-to-child or child-to-adult channel. If a future feature ever proposes one, it requires a Product Constitution amendment (ADR + founder), not a feature decision.
2. **No free-form AI conversation with children.** Children never chat with a model. AI produces reviewed learning content through the gated pipeline (AI_ARCHITECTURE.md); it is never an open-ended interlocutor for a child.
3. **No public child presence.** Nothing about a learner is ever publicly visible, shareable by link, or indexable. No child photos are required or solicited anywhere in the product.
4. **No behavioural surveillance.** We record learning evidence, not conduct dossiers (Product Constitution §2). Engagement telemetry serves adaptation and is visible to guardians — it is never scoring, ranking, or covert monitoring of children.
5. **No dark patterns toward children:** no streaks, shame mechanics, artificial urgency, or manipulation to extend usage (Product Constitution §4.6). Session-end is always calm and honoured.

## 2. Adult access is the threat model

For a platform with no child communication features, the primary safeguarding risks are around _adults and data_:

- **Access control:** an adult sees a learner only through a qualifying relationship — guardianship or scoped school role (MULTI_TENANCY.md §4) — checked per learner **[T]**.
- **Every access is audited** (SECURITY_AND_PRIVACY.md §4), including our own platform-level access, which is break-glass, per-incident, time-bound **[T]**.
- **Contested guardianship:** the Guardianship model supports multiple guardians with defined authority; the platform never adjudicates family disputes — policy for handling conflicting guardian instructions or access-restriction claims (e.g. court orders) is a **[P]** item requiring professional guidance before Horizon-1 launch.
- **Account compromise:** guardian accounts protect children's data, so authentication strength (ADR-0005), rate limiting, and session hygiene are safeguarding controls, not just security ones **[T]**.

## 3. Content safety [T]

- Everything child-facing passes content-safety validation as part of the AI gate (AI_ARCHITECTURE.md §6) — and human review while D9's human-in-the-loop posture holds.
- Curated (non-AI) content follows the same review gate before `approved`.
- A guardian/teacher **report-content** mechanism exists from v1: one tap, content is pulled from rotation pending review, reporter informed of outcome.
- Age/stage appropriateness is dual-axis (content stage vs presentation register, D2): the register axis is itself a safety property — material must respect the child's dignity.

## 4. Distress and disclosure

Even without child free-text input, safeguarding-relevant information will reach the platform — chiefly through **adult free-text observations** ("she said X at bedtime…"), and through future child interaction surfaces.

- Observations are private to authorised adults of that learner, audited, excluded from AI provider context, and never mined for any purpose beyond the learner's education **[T]**.
- The platform is **not** a monitoring or referral service and must never imply it is **[P]**: we do not scan testimony for risk and must not create a false sense that "the platform would have flagged it".
- What, if anything, the product should do when a user _asks it_ about a safeguarding concern (e.g. signposting to NSPCC guidance) is a **[P]** design decision needing professional input — recorded as open, not improvised.
- If children later interact directly (post-D5 revisit): session design must include calm-exit, distress-avoidance (no failure spirals — Educational Constitution §5), and a fresh safeguarding review of every input surface. That review is a mandatory gate on any child-login ADR.

## 5. People and process [P]

Pre-launch register: designated safeguarding lead for the company (even a company of one names one); safeguarding policy and incident procedure written and professionally reviewed; DBS considerations if the company ever has staff interacting with families' children directly; complaint and escalation routes for guardians; periodic review cycle. None of this is claimable until done.

## 6. Reality rule

Per DEVELOPMENT_RULES.md: no marketing, documentation, or in-product text may describe safeguarding capabilities beyond what is Implemented and Tested. Safeguarding over-claiming is treated as a critical defect.
