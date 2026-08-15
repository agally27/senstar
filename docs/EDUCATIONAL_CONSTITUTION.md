# Educational Constitution

**Status:** DRAFT v0.1 — awaiting founder ratification
**Authority:** Second in the document hierarchy, under the Product Constitution. The Technical Constitution and everything below it must conform to this document.
**Professional review:** This document is the founding team's synthesis of established practice. Before public launch it must be reviewed by qualified SEN practitioners and, for curriculum fidelity, against the statutory documents it cites. That review is a standing obligation, not a one-off.

---

## 1. The learner leads; the diagnosis informs

A diagnosis or identified need is context that helps adults understand a child. It is **never** an instruction to the system.

**Structural rule (binding on all architecture and code):** no adaptation, recommendation, content-selection or presentation logic may branch on a diagnosis field. Diagnoses may be recorded (as parent/teacher-supplied context, visible to guardians), displayed to adults, and used by humans; the adaptive machinery is blind to them.

Adaptation is driven instead by the **needs profile and evidence**: learner ability, observed performance, learning history, communication needs, strengths, preferences, engagement signals, assessment evidence, and parent/teacher observations. The system's job is to continuously learn what works _for this child_ — including noticing when what worked stops working.

Corollary: the platform never predicts what a child "will be able to" learn from their profile. It observes what they are learning and responds. Low expectations encoded in software are a form of harm.

## 2. Curriculum position is not age

**DECIDED (D2):** a learner's position in the curriculum is fully decoupled from their age and school year, from day one.

- A learner has a `CurriculumPosition` **per subject** (a 10-year-old may be working within KS2 reading and KS1 number).
- Positions extend **below subject-specific study**: the model must accommodate the territory of the pre-key stage standards and the Engagement Model, not treat KS1 as a floor.
- Age-appropriate _presentation_ is separate from stage-appropriate _content_: a 12-year-old working on early number must never be given an experience that looks or feels like it was made for a 5-year-old. Content stage and presentation register are independent axes.
- No feature, report or recommendation may describe a child as "behind". Language throughout is about where the learner is and what comes next.

## 3. The five provenance categories

**DECIDED (D1).** Every piece of educational information in the platform belongs to exactly one category, carried as first-class data and visible to adult users:

1. **Authoritative** — statutory and official sources: DfE programmes of study, statutory guidance, official assessment frameworks. Reproduced faithfully (Crown copyright, Open Government Licence, with attribution), versioned, never edited — only superseded by new versions.
2. **Platform-curated** — our derived interpretation: the decomposition of coarse programmes of study into objectives, skills, sub-skills, prerequisites and progressions that the adaptive loop needs. AI-assisted at most, **human-reviewed before it becomes platform truth**, versioned, and always citing the authoritative source(s) it interprets. The sign-off policy is Decision D8 (open); until D8 is resolved, nothing platform-curated is treated as approved.
3. **System-derived** — inference from evidence: mastery estimates, readiness, progress, recommendations. Always labelled as the system's view, always traceable to the evidence that produced it, never presented as fact.
4. **AI-generated** — explanations, activities, examples, visual representations, adapted resources. Born in a _proposed_ state; reaches a child only through the validation gates in AI_ARCHITECTURE.md (initially including human review — D9). Reuse never launders it into a higher category.
5. **User-generated** — parent and teacher observations, notes, custom material. Always attributed to its author; informs the learner model as testimony, not as ground truth.

**Conflation of categories is the cardinal data sin of this platform.** Promotion between categories (e.g. AI-generated draft → platform-curated) happens only through an explicit, recorded review act by an authorised human.

## 4. How learning is designed

**Concrete before abstract.** Where appropriate, concepts progress Concrete → Visual → Representational → Symbolic → Abstract (the CPA tradition). The learner's current stage on this ladder is part of their model, per concept area — and movement is bidirectional: returning to concrete when abstraction fails is progress-in-service-of-progress, not regression.

**Visual-first where appropriate — adaptive, not dogmatic.** Visual numbers, objects, symbols, manipulatives, diagrams, sequences, matching, minimal-text interfaces are default design tools, but modality is a per-learner, per-context, evidence-driven choice. "This child is autistic therefore visual" is exactly the shortcut §1 forbids.

**Cognitive load is managed deliberately.** One new thing at a time; remove decorative noise; predictable structure and interaction patterns; instructions in minimal, concrete language (or none — modelled instead); no time pressure unless fluency is the explicit, evidenced goal.

**Retrieval, spacing and mastery.** Learning is consolidated through low-stakes retrieval and spaced revisiting, not one-shot teaching. Mastery of prerequisites gates progression — but mastery thresholds are per-learner judgements, not fixed percentages, and overlearning (practising beyond first success) is a supported, normal path.

**Scaffolding fades.** Support is explicit in the design (modelling → guided → independent) and its removal is planned and evidenced, never abrupt. Generalisation matters: mastery shown in one representation or context is deliberately checked in others before being trusted.

**Predictability is a feature.** Consistent session shapes, clear beginnings and endings, and no surprising changes — novelty is introduced knowingly, as a variable the system controls and observes.

## 5. Assessment principles

- Assessment's purpose is **evidence for the loop**, not judgement of the child. Wherever possible it is invisible — woven into activities rather than staged as tests.
- Low-stress by design: no time pressure by default, no failure spirals (difficulty responds within the session), no scores or grades surfaced to children.
- Evidence is **append-only**: observations and responses are recorded with context (modality, support level, time of day if relevant) and never rewritten. Interpretations (system-derived) may be revised; the record may not.
- Absence of evidence is absence of evidence. A child who cannot show a skill through one modality is offered another before any inference is drawn.
- Parent and teacher observations are first-class assessment evidence, clearly attributed, and can challenge the system's view. When testimony and telemetry disagree, the disagreement is surfaced to humans, not silently resolved.

## 6. The adults in the loop

Parents and teachers are co-educators, not report recipients. The platform explains _why_ it recommends what it recommends (in plain language, citing its evidence), teaches the adult what the practice is for, accepts correction, and makes it easy to contribute observations. In v1 (parent-mediated, D5) the parent is also the hands at the keyboard: session design must assume a parent-and-child pair, and give the parent quiet in-the-moment guidance without undermining the child's sense of doing it themselves.

## 7. What would violate this constitution

Illustrative, not exhaustive: branching adaptation on a diagnosis; shipping AI-generated curriculum decomposition without human sign-off; presenting a mastery estimate as a fact or grade; a "behind/ahead of expected level" indicator; a leaderboard; age-locked content; a timed test as a default; deleting or editing evidence records; treating one modality failure as inability.
