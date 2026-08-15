# ADR-0008: Configuration & secrets handling

**Status:** Accepted (founder, 2026-08-14)
**Date:** 2026-08-14

## Decision

A single typed configuration module (`packages/config`) validated with **zod** at boot:

- **Three explicit classes:** `public` (safe for the browser, `NEXT_PUBLIC_`-prefixed), `server` (server-only, non-secret), `secret` (server-only, sensitive). The type system prevents importing server/secret config into client code (separate entry points; lint rule).
- Boot fails fast, loudly and completely on missing/invalid variables — no silent defaults for anything environment-critical.
- **Secrets storage:** GitHub Actions encrypted secrets (CI) and Vercel encrypted environment variables (runtime), separated per environment; local development uses `.env.local` (gitignored). Nothing secret is ever committed; `.env.example` documents every variable name + purpose with placeholder values.
- **Feature flags:** a minimal typed flag set inside the same config module for now (e.g. gating unfinished surfaces); a flag service is deliberately not adopted — revisit by ADR if runtime flags are ever needed.

## Reason

Prompt 01 §10; Technical Constitution §5. Central, typed, fail-fast config is cheap now and impossible to retrofit cleanly later.

## Alternatives

Scattered `process.env` reads (rejected: untyped, silently wrong); dotenv-only (no validation); external secret managers (Doppler/Vault/Infisical — extra processor/infra unjustified at this scale; revisit with team growth); LaunchDarkly-style flag SaaS (premature).

## Cost

Free.

## Security & child-data implications

Fail-fast validation prevents the classic "preview environment quietly pointed at production database" failure — which for us is a child-data incident, not an inconvenience. Class separation makes leaking a server secret to the browser a build failure. Rotation procedure documented in SECURITY_AND_PRIVACY.md §3.

## Outcome

Accepted by founder, 2026-08-14.
