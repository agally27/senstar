# ADR-0007: Observability — structured logging (pino) + Sentry (EU region) for errors

**Status:** Accepted (founder, 2026-08-14)
**Date:** 2026-08-14

## Decision

1. **Structured logging** via **pino**: JSON logs, correlation IDs per request, tenant ID, actor role — and a hard redaction layer enforcing SECURITY_AND_PRIVACY.md §3: no child personal data in logs, ever (references, not contents). Logging goes through `packages/observability`, not direct pino imports.
2. **Sentry, EU data residency region**, for error tracking and alerting (application + server errors, failed jobs, AI-pipeline failures), with PII scrubbing on (no request bodies, no user context beyond opaque IDs).
3. A `/api/health` endpoint checking app + database connectivity, as the deployment-verification and uptime-probe target.

## Reason

Prompt 01 §14: "we need to know when the platform is broken before we need to know what children are clicking." This is the minimum that achieves it; product analytics is explicitly out of scope this phase.

## Alternatives

- Axiom / Betterstack / Datadog — log aggregation platforms; deferred until log volume justifies a processor decision (Vercel's built-in log viewing suffices for test phase).
- Self-hosted GlitchTip/Sentry — more ops for no current gain; revisit if processor concerns grow.
- Console logging only — rejected: unqueryable, unalertable.

## Cost

pino free; Sentry free developer tier → Team ~$26/mo. Health endpoint free.

## Scalability

pino is the standard high-throughput Node logger; Sentry scales with paid tiers.

## Security & child-data implications

Sentry EU region keeps error data in-EU; with scrubbing + our redaction rules it should hold no personal data at all, but it is still a processor and goes in the DPIA register before real child data (D10). The redaction layer is tested code, not convention.

## Outcome

Accepted by founder, 2026-08-14.
