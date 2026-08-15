# ADR-0003: Vercel for application hosting (test phase, with exit criteria)

**Status:** Accepted (founder, 2026-08-14)
**Date:** 2026-08-14
**Decision register ref:** D4 (decided in principle 2026-08-14; this ADR formalises)

## Decision

Vercel hosts the Next.js application: preview deployment per PR, controlled production deployments (no auto-deploy of unreviewed changes). Serverless function execution pinned to **London (`lhr1`)**. Environment variables separated per environment in Vercel's encrypted store.

## Guardrails (conditions of adoption)

1. Domain logic in framework-agnostic packages — Next.js is delivery only.
2. No Vercel-proprietary primitives (KV, Blob, Cron, Queues) without a wrapper interface behind our own abstraction.
3. Background jobs are architecturally independent of Vercel (ADR-0006).
4. Synthetic data only until the D10 gate; DPIA covers Vercel as processor before real data.

## Exit criteria (any of these triggers a re-platforming ADR)

Sustained function-duration/timeout pressure from AI workloads; cost curve exceeding a containerised alternative at ~2×; residency/processor terms becoming unsatisfiable for children's data; need for long-lived processes.

## Alternatives

Railway / Fly.io (`lhr`) / Render — containerised, EU/UK regions, better for long-running work, slightly more ops; AWS (max control, highest ops burden — premature); self-hosted (rejected for now). Migration path: the app containerises cleanly if guardrails hold.

## Cost

Free/Pro tier (~$20/user/mo) ample for test phase; costs scale with usage — watched via exit criteria.

## Security & child-data implications

TLS, encrypted env vars, preview-URL access control on. Vercel is a US company; compute pinned to London and DB traffic stays in-region, but Vercel remains a processor — must be named in the DPIA with a DPA reviewed before real child data (D10). Test phase carries synthetic data only, which is what makes this adoption safe now.

## Outcome

Accepted by founder, 2026-08-14.
