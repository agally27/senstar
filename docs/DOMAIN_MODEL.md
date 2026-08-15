# Domain Model

**Status:** DRAFT v0.1 — Designed (nothing here is Implemented)
**Authority:** Domain Architecture level — under the three constitutions, above module specs.
**Scope:** the entities, relationships and invariants the platform is built on. This is a conceptual model, not a schema; tables and types derive from it in Stage C, but its invariants bind them.

---

## 1. Modelling conventions

- Every entity has a strongly-typed identity (`LearnerId`, not `string`).
- **Provenance is schema:** every educational content entity carries `provenance` (one of: `authoritative | platform_curated | system_derived | ai_generated | user_generated`), `source_citation` (required for the first two), `version`, and `review_status`. Non-nullable.
- **Evidence is append-only:** correction = new superseding record, never an update.
- All tenant-scoped entities carry the tenant key explicitly (see MULTI_TENANCY.md).
- Versioned entities (curriculum, prompts, learner-model snapshots, consent policy texts) are immutable per version.

## 2. Bounded contexts

Eight, as fixed by the Technical Constitution §1: Identity/Tenancy/Access, Curriculum, Learner, Adaptation & Pedagogy, Learning Experience, Assessment & Evidence, AI Orchestration, Platform Services. Entities below are grouped by owning context; no other context may write them.

## 3. Identity, Tenancy & Access

- **Account** — an authenticated adult (v1: parents/home educators only, per D5). Email-based identity, lifecycle states (invited/active/suspended/closed). _An account is an access concept; it is never a learner._
- **Organisation** — the tenant. `kind: family | school`. One abstraction, two shapes: families are small, flat, guardian-run; schools (Horizon 2/3) add structure (classes, staff roles). Nothing may assume "tenant = school" or "tenant = one child".
- **Membership** — Account ↔ Organisation with one or more roles (see MULTI_TENANCY.md §4). An account may belong to multiple organisations (e.g. a teacher who is also a parent — two memberships, contexts never blended).
- **Guardianship** — Account ↔ Learner, with an authority level (full guardian / contributing adult). Carries consent authority. Designed for multiple guardians per learner from day one, including guardians with separate accounts (split families). What each guardian may see/decide is governed here, not assumed.
- **ConsentRecord** — (who, for which learner, consented to what processing, under which policy version, when, withdrawal state). Consent is versioned and withdrawable; withdrawal consequences are defined per processing purpose (SECURITY_AND_PRIVACY.md).
- **Role / Permission** — see MULTI_TENANCY.md. Roles are data, permissions are code-level capabilities; the mapping is explicit and tested.

## 4. Learner

- **Learner** — the child as an educational entity. Belongs to an organisation; accessed only via guardianship or organisational role. Minimal identity data (first name / preferred name, year-group context); no email, no credentials in v1 (D5). A future child-login attaches an Account to a Learner without remodelling.
- **NeedProfile** — needs-led descriptors of how the child learns and what support helps (communication needs, attention profile, sensory considerations, literacy access, etc.), maintained by guardians/teachers and refined by evidence. **Descriptors, never diagnosis codes.**
- **DiagnosisRecord** — deliberately separate entity. Guardian-supplied context (e.g. "autism diagnosis, 2024"), visible to authorised adults, exportable, deletable. **Structurally unavailable to the Adaptation, Experience, Assessment and AI contexts** — the module boundary simply does not expose it. This is how Educational Constitution §1 is enforced by architecture rather than discipline.
- **StrengthsAndPreferences** — interests, motivators, strengths; used for engagement and content theming.
- **AccessibilityProfile** — presentation needs: text level, font/spacing, colour/contrast, audio support, motor considerations, reduced-motion.
- **CommunicationProfile** — how the child receives and expresses (verbal, minimal-verbal, symbol-supported, etc.); shapes both content and assessment modality.
- **CurriculumPosition** — per subject: current framework version, stage band and position within the progression graph. Stage bands explicitly include pre-subject-specific territory (pre-key-stage / engagement-model ground) — KS1 is not a floor (D2). Wholly decoupled from age; presentation register is a separate axis carried on the AccessibilityProfile/PresentationPlan, never inferred from content stage.
- **LearnerModel** — the evolving system-derived picture: modality effectiveness, scaffold responsiveness, pacing, engagement patterns, mastery map. Versioned snapshots; every element traceable to evidence; always `system_derived`; explainable in plain language to guardians.

## 5. Curriculum

- **CurriculumFramework** — versioned (e.g. "National Curriculum in England, 2014, as amended"). Multiple frameworks anticipated (internationalisation later).
- **Subject / KeyStage / ProgrammeOfStudy** — faithful, `authoritative`, OGL-attributed reproductions of the statutory structure.
- **CurriculumObjective** — the granular, teachable unit the loop operates on. Almost always `platform_curated` (D1): derived from a ProgrammeOfStudy, citing it, human-reviewed under the D8 policy before `review_status: approved`. Nothing unapproved feeds the loop.
- **Skill / SubSkill** — decomposition below objectives where useful; same provenance rules.
- **PrerequisiteEdge / ProgressionMap** — the directed graph over objectives/skills that recommendation walks. Curated, versioned; edges carry rationale.

## 6. Adaptation & Pedagogy

- **AdaptationProfile** — the deterministic summary of "how this learner best meets new material now", computed from LearnerModel + NeedProfile + AccessibilityProfile. Inspectable; every field traceable.
- **PresentationPlan** — for (learner, objective): modality mix, CPA stage (concrete→abstract position, per Educational Constitution §4), scaffold level, presentation register (age-respecting), interaction types, session shape. Produced by domain logic; **consumed** by AI generation — never produced by it.

## 7. Learning Experience

- **LearningExperience** — a planned session/sequence for a learner against one or more objectives, realising a PresentationPlan.
- **Activity** — an interactive unit (matching, sequencing, drag-drop, guided practice…), with modality and support metadata.
- **ContentAsset** — any renderable resource. Carries full provenance + `review_status` (`proposed | approved | rejected | retired`). `ai_generated` assets reach a child only when the gates in AI_ARCHITECTURE.md §6 pass (initially including human review, D9).
- **Assignment** — links experiences to learners with intent ("practice", "introduce", "revisit"), created by recommendation or by an adult.

## 8. Assessment & Evidence

- **AssessmentEvent** — anything evidential: an activity attempt, an embedded check, an adult-recorded moment. Carries context: modality, support level in force, setting.
- **Response** — the learner's actual responses within an event, raw and uninterpreted.
- **Observation** — `user_generated` adult testimony, attributed, timestamped, free-text + optional structured tags. First-class evidence (Educational Constitution §5).
- **EvidenceRecord** — the append-only unification of the above; the substrate of all inference.
- **MasteryEstimate** — `system_derived`, per (learner, objective/skill): level, confidence, evidence links, model version. Never a grade; never shown to children.
- **Recommendation** — `system_derived` next-step proposal with a plain-language reasoning trace (which evidence, which progression edges, which adaptation choices). Adults can accept, adjust or reject; rejections are themselves evidence.

## 9. Platform Services

- **AuditLogEntry** — who did what to which resource when, from where; mandatory for all child-data reads and writes (see SECURITY_AND_PRIVACY.md).
- **Job** — a background work unit under the single platform job mechanism (ADR-0006).
- **PromptVersion / GenerationRecord** — see AI_ARCHITECTURE.md; every generation is fully accounted for.
- **Subscription / Billing** — Planned only; modelled no further in this phase.

## 10. Invariants (binding on all implementation)

1. No adaptation/recommendation/content path reads DiagnosisRecord.
2. No educational content row without provenance + (where required) citation + review status.
3. No `ai_generated` content in `approved` state without a recorded human review act; no promotion to `platform_curated` except by the D8 process.
4. EvidenceRecords are never updated or deleted (erasure rights are honoured by whole-learner erasure, which is audited — see SECURITY_AND_PRIVACY.md).
5. No entity access without tenant scope + authorisation check (MULTI_TENANCY.md).
6. CurriculumPosition never derived from age; age never limits available content stages.
7. A Learner is never an Account in v1; the future association is additive.
8. System-derived values always carry model/version and evidence links.

## 11. Open modelling questions

- **D8** — who signs off platform-curated curriculum content (blocks any `approved` curated objective).
- **Shared learner across organisations** (school + home): Designed as explicit cross-tenant _share grants_ rather than shared ownership — detail deferred to Horizon 2; the Guardianship/Membership split keeps it possible.
- Retention periods per data class — legal/policy input required (D10 workstream).
