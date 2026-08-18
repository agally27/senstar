# Decision register — RECONSTRUCTED SCAFFOLD, NOT YET AUTHORITATIVE

**Status:** Draft for founder verification. **This is not the decision register.**
**Prepared:** 2026-08-16, by a Claude session with no access to the Claude project.
**Baseline:** `agally27/senstar`, branch `main` (originally prepared against `docs/reality-alignment`, since merged and deleted).
**Corrected:** 2026-08-18 — see §6.

## Read this before using the file

The real register lives in the Claude project. It was not available to the session that
wrote this file, and `docs/DEVELOPMENT_RULES.md` §2 forbids inventing founder decisions,
so **nothing below was decided, inferred, or filled in from judgement.**

Every row is an index entry: a D-number the repository already cites, and a quotation or
close paraphrase of what the repository says about it, with the file and line that says
so. Where the repository is silent, the cell reads UNKNOWN rather than a plausible guess.

Three limits follow from that method, and they matter:

1. **This can only see decisions the repo happens to mention.** If the real register holds
   decisions no document cites, they are missing here entirely.
2. **Rationale and alternatives are not recoverable.** The repo records _what_ was decided,
   rarely _why_ or _what else was considered_. Those columns are empty by necessity.
3. **Dates are mostly unknown.** Only the ADR acceptance dates are evidenced.

**To make this authoritative:** open the real register, correct every row against it, fill
the UNKNOWNs, delete this whole header block, and commit. Until that is done, treat a
disagreement between this file and the Claude project as the Claude project being right.

---

## 1. Conventions

| Status              | Meaning                                                                              |
| ------------------- | ------------------------------------------------------------------------------------ |
| `DECIDED`           | Settled by the founder. Binding. Implementation may rely on it.                      |
| `CLOSED BY ADR`     | Decided and formalised in `docs/adr/`. The ADR is the detail; this is the index.     |
| `DECISION REQUIRED` | Open. **Never** resolved by implementation — a session that needs it stops and asks. |
| `SUPERSEDED`        | Replaced by a later decision. Kept for history, with a pointer to the replacement.   |

Numbering is sequential and permanent: a D-number is never reused or renumbered, and a
superseded decision keeps its number.

---

## 2. Register

| #       | Subject                                | Repo says                                                                                                                                                            | Status (verify)    | Source                                                                        |
| ------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| **D1**  | Content provenance categories          | Every piece of educational information belongs to exactly one provenance category, carried as first-class data, visible to adults                                    | DECIDED            | `EDUCATIONAL_CONSTITUTION.md:30`                                              |
| **D2**  | Curriculum position decoupled from age | A learner's curriculum position is fully decoupled from age and school year, from day one; dual-axis stage vs presentation register                                  | DECIDED            | `EDUCATIONAL_CONSTITUTION.md:21`, `SAFEGUARDING.md:33`                        |
| **D3**  | Horizon 1 market                       | Parents and home educators are the wedge; the parent is customer and account holder                                                                                  | DECIDED            | `PRODUCT_CONSTITUTION.md:30`                                                  |
| **D4**  | Infrastructure and residency           | Neon Postgres `aws-eu-west-2`; Vercel functions `lhr1`; synthetic data only outside production                                                                       | DECIDED 2026-08-14 | `ADR-0003:5`, `ADR-0004:5`, `TECHNICAL_CONSTITUTION.md:56`                    |
| **D5**  | Parent-mediated v1                     | Adult accounts only; no child logins in v1; the parent operates the session. Flagged for revisit when children interact directly                                     | DECIDED            | `PRODUCT_CONSTITUTION.md:30`, `DOMAIN_MODEL.md:23`, `MULTI_TENANCY.md:53`     |
| **D6**  | Source repository home                 | GitHub repo as single source of truth; Actions for CI; protected `main`. **ADR-0002 decided a _private_ repo; it is public since 2026-08-18 — unreconciled, see §6** | CLOSED BY ADR-0002 | `ADR-0002:5`, `CLAUDE.md:39`                                                  |
| **D7**  | Product name                           | "Senstar" is provisional. Nothing in code, data or branding may treat it as final                                                                                    | DECISION REQUIRED  | `PRODUCT_CONSTITUTION.md:5`, `package.json:5`                                 |
| **D8**  | Curriculum sign-off authority          | Who signs off platform-curated curriculum content. Blocks any `approved` curated objective; blocks Foundation Stage E                                                | DECISION REQUIRED  | `DOMAIN_MODEL.md:90`, `01-FOUNDATION_PLAN.md:63,74`                           |
| **D9**  | LLM provider and review posture        | Provider(s), processor terms, no-training clauses, and the initial human-review posture (recommended: all child-facing content reviewed)                             | DECISION REQUIRED  | `AI_ARCHITECTURE.md:55`, `TECHNICAL_CONSTITUTION.md:48`                       |
| **D10** | ICO registration + DPIA                | **Hard gate.** No real child data before ICO registration and DPIA are in place                                                                                      | DECISION REQUIRED  | `TECHNICAL_CONSTITUTION.md:61`, `SECURITY_AND_PRIVACY.md:52`                  |
| **D11** | UNKNOWN                                | **Not referenced anywhere in the repository.** Either it exists only in the real register, or the number was never used                                              | UNKNOWN            | —                                                                             |
| **D12** | Database access layer                  | Drizzle as the access layer over Neon Postgres                                                                                                                       | CLOSED BY ADR-0004 | `ADR-0004:5,42`                                                               |
| **D13** | Authentication provider                | Better Auth, self-hosted; identity data in our own database                                                                                                          | CLOSED BY ADR-0005 | `ADR-0005:5,44`                                                               |
| **D14** | Status of generation drafts            | Whether AI generation drafts count as personal data when derived from a learner model                                                                                | DECISION REQUIRED  | `AI_ARCHITECTURE.md:55`                                                       |
| **D15** | Transactional email provider           | Blocks any sign-up flow — `createAuth` requires an email transport. Brief prepared; two candidates survive the residency test                                        | DECISION REQUIRED  | `docs/foundation/D15_EMAIL_PROVIDER_BRIEF.md`, `packages/auth/src/auth.ts:22` |

---

## 3. Open items in detail

Only the four that currently gate work. Each needs the founder to supply what the repo
cannot: the decision itself, and its date.

### D7 — Product name

Provisional working name. Not blocking engineering, but every week it stays open is
another week of references to unpick later. No repo evidence of a shortlist or criteria.

### D8 — Curriculum sign-off authority

The question is who is qualified and accountable to approve platform-curated curriculum
content, and what the approval act consists of. It blocks two things concretely: any
objective reaching `review_status: approved`, and Foundation Stage E (the vertical proof
slice). The repo states the constraint but records no candidate answer.

### D10 — ICO registration and DPIA

The hard gate on real child data. Named processors so far, each of which the DPIA must
cover: Vercel, Neon, Sentry, and whichever email provider D15 selects. Development
continues on synthetic data regardless; this gates production only.

### D15 — Transactional email provider

The only one of the four with a prepared brief. AWS SES (`eu-west-2`) and Mailgun EU
survive the UK/EU residency test in `TECHNICAL_CONSTITUTION.md` §5; Resend and Postmark
were eliminated on the vendors' own documentation. On decision: a new ADR at the next free number (0009 is the accepted RLS decision), then
`packages/email` as a gateway, then the Better Auth route handler can be mounted.

---

## 4. Gaps the founder needs to close

1. **D11 is unaccounted for.** No document, code file or config references it.
2. **ADRs 0006, 0007 and 0008 carry no `Decision register ref` line** — unlike 0002–0005.
   Background jobs (pg-boss), observability (Sentry + pino) and config/secrets were
   accepted on 2026-08-14 without a D-number recorded in the ADR, or with one this file
   cannot see.
3. **No decision dates except the ADR ones.** D1, D2, D3, D5 are asserted as DECIDED with
   no date anywhere in the repo.
4. **No rationale or alternatives for any pre-ADR decision.** D1–D5 record outcomes only.
5. **Whether the real register holds decisions above D15** is unknown.

---

## 5. Maintenance

- This file is the index; ADRs in `docs/adr/` carry the detail for anything with an ADR.
  When an open item is closed by an ADR, update the row here in the same commit.
- A decision moves to `DECIDED` or `CLOSED BY ADR` only by founder act — never as a
  side-effect of implementation.
- When a Claude session finds it needs a decision that is not in this file, the correct
  action is to add a row with status `DECISION REQUIRED`, state what is blocked, and stop.

---

## 6. Corrections log

Changes made to this file after it was prepared, each recording reality rather than
deciding anything. Listed so the founder can check them against the real register.

| Date       | Correction                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-18 | Header baseline updated: `docs/reality-alignment` was merged and deleted; repository name is lowercase `agally27/senstar`.                               |
| 2026-08-18 | D15: the forward reference to ADR-0009 was reassigned. **ADR-0009 is the accepted RLS decision** (2026-08-17); the email ADR takes the next free number. |
| 2026-08-18 | D6: repository is public as of 2026-08-18. **ADR-0002 decided a _private_ repository** — see below.                                                      |

### Unreconciled: repository visibility contradicts ADR-0002

**DECISION REQUIRED.** ADR-0002 (accepted 2026-08-14) decides:

> Private GitHub repository (`senstar`, provisional name) as the single source of truth

The repository was made public on 2026-08-18, to obtain branch protection — GitHub gates
branch protection and rulesets behind a paid plan for private repositories, and protecting
`main` was judged the more important control.

That is a change to an accepted architectural decision, which `CLAUDE.md` requires be made
by ADR with founder approval, not by action. It has not been. Either an ADR should record
and ratify it (superseding ADR-0002 in part), or the repository should return to private
and branch protection be obtained another way.

Note what going public does **not** change: ADR-0002's child-data assessment holds, because
no personal or child data may enter the repository in any case (DEVELOPMENT_RULES §4). What
it does change is that the safeguarding and security design — `SAFEGUARDING.md`,
`SECURITY_AND_PRIVACY.md`, `MULTI_TENANCY.md`, and ADR-0009's description of an unclosed RLS
gap — are now publicly readable.
