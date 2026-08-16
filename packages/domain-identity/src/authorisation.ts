/**
 * Authorisation foundation (MULTI_TENANCY.md §3–§5).
 *
 * Layer 1 of the four enforcement layers: the domain-level permission check.
 * Roles are per-membership (per-organisation), never global. Roles do NOT
 * inherit implicitly; each role's permission set is explicit and tested.
 *
 * v1 implements the Horizon-1 roles only; the full catalogue is declared so
 * later horizons extend data, not architecture.
 */
import type { AccountId, LearnerId, OrganisationId } from './ids';

/** Full role catalogue (MULTI_TENANCY.md §4). Horizon-1 rows implemented first. */
export type Role =
  | 'platform_administrator'
  | 'organisation_administrator'
  | 'school_administrator'
  | 'senco'
  | 'teacher'
  | 'parent'
  | 'home_educator'
  | 'learner';

/** Fine-grained capabilities. Grows with modules; never checked by string outside this package. */
export type Permission =
  | 'organisation.manage'
  | 'organisation.members.manage'
  | 'learner.profile.read'
  | 'learner.profile.manage'
  | 'learner.evidence.read'
  | 'learner.evidence.record'
  | 'learning.assign'
  | 'curriculum.curated.approve';

/**
 * Explicit role → permission mapping (versioned data; changing it is a
 * reviewed change). Note deliberate absences — e.g. organisation
 * administrators do NOT automatically hold learner permissions: access to a
 * learner always additionally requires a qualifying relationship (§4).
 */
const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  platform_administrator: [], // break-glass only — no routine permissions (MULTI_TENANCY.md §6)
  organisation_administrator: ['organisation.manage', 'organisation.members.manage'],
  school_administrator: ['organisation.manage', 'organisation.members.manage'],
  senco: ['learner.profile.read', 'learner.evidence.read'],
  teacher: [
    'learner.profile.read',
    'learner.evidence.read',
    'learner.evidence.record',
    'learning.assign',
  ],
  parent: [
    'learner.profile.read',
    'learner.profile.manage',
    'learner.evidence.read',
    'learner.evidence.record',
    'learning.assign',
  ],
  home_educator: [
    'learner.profile.read',
    'learner.profile.manage',
    'learner.evidence.read',
    'learner.evidence.record',
    'learning.assign',
  ],
  learner: [],
};

/** The resolved actor for a request (MULTI_TENANCY.md §2): one organisation context at a time. */
export interface ActorContext {
  readonly accountId: AccountId;
  readonly organisationId: OrganisationId;
  readonly roles: readonly Role[];
  /** Learners this actor holds guardianship over (family orgs). */
  readonly guardianLearnerIds: readonly LearnerId[];
}

export interface LearnerResource {
  readonly kind: 'learner';
  readonly learnerId: LearnerId;
  readonly organisationId: OrganisationId;
}

export interface OrganisationResource {
  readonly kind: 'organisation';
  readonly organisationId: OrganisationId;
}

export type Resource = LearnerResource | OrganisationResource;

export type Decision =
  { readonly allowed: true } | { readonly allowed: false; readonly reason: string };

/**
 * Roles reach this function from persistence, where TypeScript's guarantee does
 * not hold: a stale row, a role removed by a later migration, or a typo yields a
 * string outside the catalogue. Falling back to an empty permission set makes
 * that case a *denial* rather than a TypeError — fail closed by construction,
 * not by crash.
 */
function roleGrants(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((role) => (ROLE_PERMISSIONS[role] ?? []).includes(permission));
}

/**
 * The single authorisation decision point. Checks, in order:
 *  1. tenant match — the RESOURCE's organisation, never the request's claim;
 *  2. role grants the permission;
 *  3. learner resources additionally require a qualifying relationship
 *     (guardianship in Horizon 1; class/assignment scope in Horizon 2).
 *
 * Deny reasons are for audit logs — they must never leak resource existence
 * to the caller (MULTI_TENANCY.md §7).
 */
export function authorise(
  actor: ActorContext,
  permission: Permission,
  resource: Resource,
): Decision {
  if (actor.organisationId !== resource.organisationId) {
    return { allowed: false, reason: 'cross_tenant_denied' };
  }
  if (!roleGrants(actor.roles, permission)) {
    return { allowed: false, reason: 'permission_not_granted' };
  }
  if (resource.kind === 'learner' && !actor.guardianLearnerIds.includes(resource.learnerId)) {
    return { allowed: false, reason: 'no_qualifying_learner_relationship' };
  }
  return { allowed: true };
}
