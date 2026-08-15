# ADR-0005: Authentication — self-hosted via Better Auth

**Status:** Accepted (founder, 2026-08-14)
**Date:** 2026-08-14
**Decision register ref:** D13; constrained by D5 (parent-mediated v1: adult accounts only)

## Decision (recommendation)

**Better Auth** (open-source, TypeScript, self-hosted) as the authentication layer: email + password with mandatory email verification, session cookies (httpOnly/secure/sameSite), all identity data stored **in our own London Postgres**. v1 scope: adult (guardian) accounts only per D5. Designed-for later: OAuth sign-in for adults, 2FA for guardians, and — post-D5-revisit — child account attachment with its own safeguarding review (SAFEGUARDING.md §4).

## Why self-hosted rather than an auth SaaS

This is the decisive axis, and it's a child-data decision more than a developer-experience one. A hosted provider (Clerk, Auth0, Supabase Auth, WorkOS) becomes a **processor holding our guardians' PII** — another DPIA entry, another residency question, another dependency in the trust chain — for capability we don't need at our scale. Self-hosting keeps every credential and identity record in the same London Postgres already covered by our residency posture, and keeps the future child-account question entirely under our control.

## Why Better Auth specifically (D13 recommendation)

Currently the leading self-hosted TypeScript option: first-class Next.js support, owns the awkward parts (verification flows, password hashing, session rotation, rate-limited endpoints), Drizzle adapter (composes with ADR-0004), plugin architecture for later needs (2FA, organisations), active development. Independent 2026 comparisons consistently place it ahead of Auth.js for new self-hosted builds.

## Alternatives

- **Auth.js / NextAuth v5** — mature, but credentials-based flows are second-class by design and the project's momentum has shifted; more assembly for our exact needs.
- **Clerk** — excellent DX, but hosted US processor holding guardian PII + per-MAU pricing; rejected on residency/processor grounds at this stage.
- **Supabase Auth** — good, but pulls in a second platform when we already have Postgres+auth needs met.
- **Build our own** — rejected: hand-rolling auth is how platforms end up in breach write-ups.

## Cost

Free (MIT). No per-MAU fees ever — relevant given parent accounts at consumer scale.

## Scalability

Sessions in Postgres fine for a long way; cache layer later if needed.

## Security & child-data implications

All identity data in-region under our controls (audit, RLS, backups, erasure). We own patching and configuration discipline — mitigated by the library handling the cryptographic/flow logic and by our CI dependency scanning. Guardian account strength is a safeguarding control (SAFEGUARDING.md §2): rate limiting and verification are v1 requirements, 2FA offered early. No child credentials exist in v1 at all (D5) — the strongest possible child-auth posture.

## Affected modules

`packages/auth` (Better Auth config + adapters); Identity/Tenancy domain consumes its session → ActorContext resolution (MULTI_TENANCY.md §2).

## Outcome

Accepted by founder, 2026-08-14 (closes D13).
