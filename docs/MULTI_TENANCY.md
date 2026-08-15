# Multi-Tenancy & Authorisation Architecture

**Status:** DRAFT v0.1 — Designed (nothing here is Implemented)
**Authority:** Domain Architecture level. Implements Technical Constitution §1/§3/§5 and Prompt 01 §8–9 requirements.
**Core guarantee to design for:** a user can never access another tenant's data by manipulating a request — the guarantee holds even when application code has bugs.

---

## 1. The tenancy tree

```
Platform
│
├── Organisation (kind: school)          ← Horizon 2/3
│   ├── Classes / nurture groups
│   ├── Staff (memberships: School Admin, SENCO, Teacher)
│   └── Learners
│
└── Organisation (kind: family)          ← Horizon 1 (the wedge)
    ├── Guardians (memberships: Parent / Home Educator)
    └── Learners
```

- **The tenant is the Organisation.** Families and schools are shapes of the same abstraction; no code path may assume one shape.
- **Platform** is not a tenant; platform-level actors (us) sit outside the tree, with tightly-audited break-glass access only (§6).
- Classes/groups are intra-tenant structure, not tenants.
- A learner belongs to exactly one organisation in Horizon 1. School+home sharing (Horizon 2) will be modelled as explicit, consent-bearing **cross-tenant share grants** — never shared ownership, never widened queries. Designed-for, not built.

## 2. Actor context

Every request resolves, before any domain logic runs, to an **ActorContext**: `(account, organisation, roles-in-that-organisation, guardianships)`. An account with multiple memberships acts in exactly one organisation context at a time; switching context is explicit. There is no "global user" concept below the platform level.

## 3. Enforcement — four layers, all mandatory

1. **Authorisation service (domain layer).** Every domain operation declares its required permission and resource; the service checks (ActorContext, permission, resource → allow/deny) server-side. UI hiding is presentation only.
2. **Tenant-scoped data access.** Repositories require tenant scope as a construction parameter — there is no API to query without one. "Forgot the WHERE clause" must be unrepresentable, not discouraged.
3. **Postgres row-level security.** Tenant key on every tenant-scoped table; RLS policies as defence-in-depth beneath the application. Layer 2 bugs hit a database wall.
4. **Security tests.** Every permission ships with allow **and** deny tests; every module ships cross-tenant denial tests (actor from tenant A requests tenant B resource → denied and audited). CI-enforced.

## 4. Roles

Roles are per-membership (per-organisation), never global. Defined now; only Horizon-1 rows are implemented first.

| Role                       | Scope                                               | Horizon          | Notes                                                                              |
| -------------------------- | --------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| Platform Administrator     | Platform                                            | 1 (us)           | Operations only; no routine access to child content; break-glass audited (§6)      |
| Organisation Administrator | Organisation                                        | 1                | In a family: the founding guardian, implicitly                                     |
| School Administrator       | School org                                          | 3                | Administration, not automatic learner-data access                                  |
| SENCO                      | School org                                          | 3                | Cross-cohort learner visibility within school                                      |
| Teacher                    | School org, limited to assigned classes/learners    | 2                | Assignment-scoped, not school-wide                                                 |
| Parent                     | Family org, limited to guardianship-linked learners | 1                | Guardianship governs learner access, not mere membership                           |
| Home Educator              | Family org                                          | 1                | Parent role + curriculum management permissions; same guardianship rule            |
| Learner                    | Self only                                           | Future (post-D5) | Designed: attaches an Account to a Learner; narrowest permission set in the system |

**Inheritance rules:** roles do not inherit implicitly. Permission sets may share definitions, but "School Admin ⊃ Teacher" is never assumed — administrators do not automatically see learner evidence. Access to a learner always requires a qualifying relationship: guardianship (family) or assignment/role-scope (school), checked per learner, not per tenant.

## 5. Permission model

- Permissions are fine-grained, named capabilities (`learner.evidence.read`, `curriculum.curated.approve`, `learner.profile.manage`, `ai.generation.request`, …), defined in code with types.
- Role → permission mapping is explicit data, versioned, and tested; changing a mapping is a reviewed change, not a data tweak.
- Resource ownership: every resource resolves to (tenant, owning entity); checks always take the _resource's_ tenant, never the request's claimed tenant.
- Sensitive permission classes (evidence read, profile write, curated-content approval, export, erasure) additionally write AuditLogEntries on use.

## 6. Platform-level access

We ourselves are the most dangerous actors in the system. Platform Administrator access to tenant data: disabled by default; enabled per-incident with recorded reason and time-bound grant; every access audited; guardians' data never browsed for convenience, ever. Support tooling is built against this model from the start so the easy path is the safe path.

## 7. Request lifecycle (reference)

session → authenticate (who) → resolve ActorContext (which org, which roles, which guardianships) → authorise (may they, on this resource) → tenant-scoped repository → RLS → audit (where required) → respond. Any step failing = denial; denials are logged with correlation IDs and never leak resource existence.

## 8. What this document does not decide

Authentication provider and session mechanics (ADR-0005 / D13); the exact permission catalogue (grows with modules, under the rules above); cross-tenant share-grant detail (Horizon 2 design task); child-account mechanics (future, post-D5 revisit).
