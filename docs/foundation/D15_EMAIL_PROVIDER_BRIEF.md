# D15 — Transactional email provider: decision brief

**Status:** DECISION REQUIRED — founder. This brief does not resolve D15 and no provider has been implemented.
**Prepared:** 2026-08-15. **Blocks:** any sign-up flow (`createAuth` requires an email transport at construction), therefore Stage D.
**Output on decision:** ADR-0009, written after the founder chooses — the ADR records the decision, it does not make it.

---

## 1. Why this is a decision and not an implementation detail

Verification is mandatory in the auth design, and `createAuth` takes an email transport at construction, so the platform cannot have a sign-up flow until a provider exists. The choice is constitutional rather than mechanical because TECHNICAL_CONSTITUTION §5 sets **UK/EU data residency for all storage and processing of personal data** as a hard minimum, and a transactional email provider processes and stores personal data (recipient addresses, message bodies) by definition.

## 2. What data the provider actually sees — narrower than it first appears

Worth establishing before weighing risk, because it bounds the exposure:

- **Recipients are adults only.** v1 is parent-mediated with no child logins (decided). The provider handles parent/guardian email addresses.
- **Message types are verification and password reset.** No content-bearing email, no reports, no child-identifying material.
- **This is still personal data.** A parent's email address is personal data under UK GDPR, and the residency rule in §5 is not scoped to child data. D10 (ICO registration + DPIA) is a separate and stricter gate that this does not touch.

**Design constraint that follows, whichever provider is chosen:** child names, curriculum positions and any needs-profile language must never appear in email subjects or bodies. If a future email type would carry them, that is a new decision, not an extension of this one. Recommend this be written into ADR-0009 as a binding constraint rather than left implicit.

## 3. The residency test eliminated half the candidate list

The handover listed four candidates "needing UK/EU regions". Two of them do not offer EU data residency at all — their EU story is either sending-only or absent. Both were verified against the vendors' own documentation.

### Resend — ELIMINATED

Resend offers an Ireland (`eu-west-1`) **sending** region, on all plans including free. But its own documentation is explicit that this does not move data:

> "All account data, including email metadata, logs, and API records, is stored in the United States regardless of the sending region you select."
> "Choosing `eu-west-1` means your emails are dispatched from Ireland, but your Resend account data still resides in the US."
> — https://resend.com/docs/dashboard/domains/regions

Corroborated by Resend's own blog: _"we're not changing our data residency policy... all of our customers' data is still stored in the United States"_ (https://resend.com/blog/multi-region). Every one of its 21 published sub-processors is US-located, including two AI sub-processors (Anthropic, RunPod) whose data scope is undocumented. Contracting entity is Plus Five Five, Inc. (San Francisco).

**Verdict:** fails §5 on its own documentation. Contractual cover (DPA, SCCs, UK Addendum, DPF certification) exists and is decent, but the constitution requires residency, not just lawful transfer.

### Postmark — ELIMINATED, twice

No EU region exists and none is planned:

> "We currently don't have plans to add servers in the EU (GDPR does not require physical servers in the EU)."
> "Postmark's primary data and servers are hosted at Deft's data center (located outside of Chicago), and Amazon Web Services (AWS)."
> — https://postmarkapp.com/eu-privacy

Second, independent problem — Postmark's Terms of Service reserve a right over message content:

> "As a part of the Service, We may view, copy, and internally use Messaging Content to train and improve the Service, including its functionality and effectiveness, as well as to detect issues."
> — https://postmarkapp.com/terms-of-service

No opt-out was found. It is likely this means anti-spam/deliverability ML rather than generative AI, but the wording is unqualified and the distinction is not documented. Content retention is 45 days by default, **cannot be disabled** ("Message content cannot be hidden or deleted immediately"), and can only be shortened via a paid add-on. Contracting entity is AC PM, LLC (Illinois), following the ActiveCampaign acquisition.

**Verdict:** fails §5 on residency and sits badly against AI_ARCHITECTURE's posture on secondary use of data. Its strong deliverability reputation does not rescue it.

## 4. The two that survive

|                               | **AWS SES (`eu-west-2`, London)**                                                                                                                                                                                                                   | **Mailgun EU**                                                                                                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Residency of message data** | Genuine regional service. Identities, DKIM keys, config sets, suppression list all scoped to `eu-west-2`.                                                                                                                                           | Genuine EU region. Message content, event logs, suppression lists, tags, routes, IPs all region-bound.                                                                                                                                                   |
| **Residency gaps**            | Control-plane metadata (billing, CloudTrail, anti-abuse scanning) — AWS publishes no statement on whether this stays in-region. Event destinations are in-region **by customer configuration**, and can be misconfigured cross-region.              | **Account data, user accounts, billing, API keys and domain names are replicated globally by design** — Mailgun documents this explicitly. Webhook delivery infrastructure region-pinning is undocumented.                                               |
| **Physical hosting**          | AWS London.                                                                                                                                                                                                                                         | Google Cloud, Germany and Belgium, for EU customers.                                                                                                                                                                                                     |
| **Contracting entity**        | AWS EMEA SARL (Luxembourg), with a registered UK branch. A genuine EU-domiciled counterparty.                                                                                                                                                       | Unclear. Mailgun Technologies, Inc. (Texas) is the Mailgun-branded entity; the EU/UK entities (Mailjet SAS/GmbH/SaaS Ltd) belong to the sibling product. **Which entity a UK Mailgun customer contracts with was not resolvable from the public terms.** |
| **DPA / UK transfers**        | DPA incorporated into the Customer Agreement automatically; SCCs apply automatically; dedicated UK GDPR Addendum incorporating the ICO IDTA. Countersigned copy obtainable via AWS Artifact.                                                        | DPA incorporated by reference via Sinch; SCCs and UK Addendum explicitly incorporated; governed by Swedish law, IMY as supervisory authority.                                                                                                            |
| **Parent company**            | Amazon (US) — CLOUD Act exposure, which AWS addresses publicly but cannot eliminate.                                                                                                                                                                | Sinch AB (Stockholm-listed, Swedish). Governance signal only — the operating entity still appears to be US.                                                                                                                                              |
| **Content retention**         | SES does not appear to retain message bodies after sending; archiving is opt-in (Mail Manager, default 180 days, configurable). **No primary AWS page states an explicit retention guarantee** — this is a documentation gap, not a confirmed zero. | Configurable per-domain via `message_ttl`. Published figures conflict across pages (7 days for bodies, 30 for logs, 1 day on free tier). Backups persist up to 30 days after deletion.                                                                   |
| **AI/training statement**     | SES is absent from AWS's AI services opt-out policy list, apparently because it is not treated as AI-adjacent. No SES-specific "never used for training" statement found either.                                                                    | **No statement found either way** on any Mailgun page. Absence of a commitment, not a denial.                                                                                                                                                            |
| **Sub-processors**            | 250ok and Email Data Source for deliverability metrics.                                                                                                                                                                                             | Google (infra), Stripe, Atlassian, Zendesk — support tooling is US-headquartered, so support tickets containing personal data can transit the US regardless of message-data pinning.                                                                     |
| **Cost at our volume**        | ~$0.10 per 1,000 emails, no monthly fee. Hundreds to low thousands/month is cents.                                                                                                                                                                  | Free: 100/day, 1-day log retention. Basic: $15/mo for 10,000. No EU surcharge found.                                                                                                                                                                     |
| **SDK**                       | `@aws-sdk/client-sesv2` (v2 API is the one AWS directs new work to; v1 is legacy).                                                                                                                                                                  | `mailgun.js` v12. **Foot-gun:** client `url` must be set explicitly to `https://api.eu.mailgun.net`; the SDK defaults to the US endpoint.                                                                                                                |
| **Operational burden**        | Higher. Domain verification, DKIM, per-region sandbox exit (200/day until approved), and bounce/complaint handling are all ours. Shared IPs by default.                                                                                             | Lower. Managed ESP with suppression handling built in.                                                                                                                                                                                                   |
| **Deliverability**            | Shared-IP reputation is pooled across tenants. The commonly cited weakness is directionally real per AWS's own docs; the magnitude is **not** independently quantified in any source found. Virtual Deliverability Manager narrows the gap.         | Long-established ESP. No independent benchmark obtained. Recent DoS against US-region tracking servers (10–11 Aug 2026, ~9.5h); EU region unaffected in that incident.                                                                                   |

## 5. Proposal (mine, not a decision)

**AWS SES in `eu-west-2`**, for four reasons that compound:

1. **It is the only option with a genuinely EU-domiciled contracting entity** (AWS EMEA SARL, Luxembourg, UK branch). Mailgun's message data sits in the EU but the counterparty appears to be a Texas corporation, which weakens the residency story precisely where it needs to be strongest — in the contract.
2. **AWS is already the substrate.** Neon runs in `aws-eu-west-2` per D4/ADR-0004. Using SES in the same region adds a service, not a vendor, and keeps the residency argument in the DPIA to one cloud provider rather than two.
3. **Mailgun's global replication of account data is documented and unavoidable**; SES's control-plane question is undocumented and therefore uncertain. An uncertain gap is worse than a known one in most circumstances — but here the known gap (Mailgun's) is certain to exist, whereas AWS's may not, and AWS's UK IDTA coverage is the more complete of the two.
4. **Cost is negligible either way**, so it should carry no weight — and it doesn't.

**The honest cost of this choice** is operational: sandbox exit, DKIM, and bounce/complaint handling become our work, and shared-IP deliverability is the one place a managed ESP would have been better. For verification and password-reset mail to parents who are actively expecting it, that is an acceptable trade — but it is a real trade, and if inbox placement on reset emails proves poor in Stage D, revisiting via a superseding ADR is the right response rather than treating this as settled forever.

**Contrary view worth stating:** if you weight operational simplicity and deliverability above contractual domicile, Mailgun EU is defensible — its message data genuinely does stay in the EU, which is what §5 is actually about, and the contracting-entity question may resolve favourably once asked directly. I would not call that choice wrong; I would call it a different reading of which residency risk matters more.

## 6. Open questions to close before ADR-0009 is written

1. **AWS:** does SES control-plane metadata and anti-abuse scanning stay within `eu-west-2`? No authoritative statement was found either way. This is the one material unknown in the recommendation and is worth asking AWS directly.
2. **AWS:** is there an SES-specific commitment that message content is never used for model training? Only general Service Terms language was found.
3. **Mailgun (if chosen):** which legal entity does a UK Mailgun customer actually contract with?
4. **Either:** confirm the DPIA (D10) treatment of the provider as a processor, and whether the ICO registration scope needs to name it.
5. **Free-tier mechanics:** whether the legacy SES EC2-linked free allowance still exists in 2026 was ambiguous on AWS's pricing page. Immaterial to the decision, relevant to Stage D budgeting.

## 7. Architectural constraint, independent of the choice

Whichever provider is chosen, DEVELOPMENT_RULES §3 requires that the provider SDK be a dependency of its gateway package only, and TECHNICAL_CONSTITUTION §7 requires a wrapper interface over proprietary platform primitives. So:

- A `packages/email` gateway exposing a provider-agnostic contract, with the SDK confined to it.
- The transport handed to `createAuth` is our interface, never the vendor client.
- A memory/no-op implementation for tests and for non-production environments, matching the existing pattern in `packages/jobs` (`memory-queue` alongside `pgboss-queue`) — that precedent should be followed rather than a new shape invented, per §2's one-abstraction-per-concept rule.

This keeps the provider decision reversible, which matters given that two of four candidates were eliminated on facts that could change in either direction within a year.

---

**Sources:** Resend regions doc and multi-region blog; Resend sub-processor list and DPA; Postmark EU privacy page, Terms of Service, and retention support articles; AWS SES developer guide (regions, quotas, production access, Mail Manager archiving), AWS GDPR Center, AWS CLOUD Act page, AWS sub-processor list, SES pricing; Mailgun regions page, domain API reference, GDPR page, Sinch DPA and sub-processor list, Mailgun pricing and status page. Direct quotations in §3 were verified against the vendors' own pages on 2026-08-15.
