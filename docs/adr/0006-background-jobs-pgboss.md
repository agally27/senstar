# ADR-0006: Background jobs — pg-boss on Postgres (single platform mechanism)

**Status:** Accepted (founder, 2026-08-14)
**Date:** 2026-08-14

## Decision

One job mechanism for the whole platform, from day one: **pg-boss** — a Postgres-backed job queue (queues, retries, scheduling, dead-letter) using our existing database. Exposed to the rest of the codebase only through our own `packages/jobs` interface (`enqueue`, handlers, schedules) so the engine is swappable. Workers run initially as an invoked process (per ADR-0003 guardrail 3, independent of Vercel primitives); a dedicated worker service (Railway/Fly) is the designed next step when AI generation volume warrants it.

## Reason

Prompt 01 §15: future modules must not invent their own async mechanisms. The cheapest way to guarantee that is to have the one mechanism exist before any module does. Postgres-backed means: no new infrastructure, no new processor, jobs participate in the same transactional world as domain data (enqueue atomically with the domain write), and job history is auditable SQL.

## Alternatives

- **Inngest / Trigger.dev** — excellent DX for serverless, but a third-party processor through which job payloads flow — payloads will eventually reference learner context, so this is a child-data surface we'd rather not create; also vendor lock-in at the architecture's most load-bearing async point.
- **BullMQ + Redis** — solid, but adds Redis (new infra + processor) for no current need.
- **Vercel Cron/Queues** — violates ADR-0003 guardrail 2 (proprietary primitive at a core boundary).

## Cost

Free (MIT); uses existing Postgres. Worker hosting ~$5–10/mo when split out.

## Scalability

Postgres-backed queues comfortably handle our foreseeable volumes (curriculum ingestion, generation, reports, notifications); if we ever exceed that, the `packages/jobs` interface is the swap point — a superseding ADR.

## Security & child-data implications

Job payloads live in our London Postgres under existing controls. Rule inherited from SECURITY_AND_PRIVACY.md: payloads carry references (IDs), not child personal data bodies. No new processor.

## Outcome

Accepted by founder, 2026-08-14.
