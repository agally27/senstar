# ADR-0002: GitHub for source control; GitHub Actions for CI

**Status:** Accepted (founder, 2026-08-14)
**Date:** 2026-08-14
**Decision register ref:** D6 (repo home)

## Decision

Private GitHub repository (`senstar`, provisional name) as the single source of truth; GitHub Actions as the CI system running install → typecheck → lint → unit → integration → build on every PR; protected `main`; CI green required to merge. Founder's personal account initially; transfer to a company organisation after D7 (brand) — GitHub repo transfers preserve history, issues and redirects.

## Alternatives

GitLab (comparable; no advantage for us, smaller ecosystem for the tooling we'll use); self-hosted git (rejected: ops burden, no benefit at our size); other CI (CircleCI etc. — extra vendor for no gain; Actions is co-located with the repo).

## Cost

Free tier covers private repos and generous Actions minutes at our scale; paid tiers modest later.

## Scalability

Industry standard to large-org scale; monorepo-friendly.

## Security & child-data implications

**No personal or child data ever enters the repository** (code, docs, synthetic fixtures only — enforced by DEVELOPMENT_RULES §4). Secrets held in GitHub Actions encrypted secrets, scoped fine-grained PAT for automation, branch protection against force-push. GitHub is a US processor, acceptable because it processes no personal data of our users.

## Outcome

Accepted by founder, 2026-08-14.
