/**
 * The seam between authentication and authorisation (MULTI_TENANCY.md §2).
 *
 * A session says only *who* the account is. Turning that into an ActorContext
 * — which organisation they are acting in, which roles they hold there, which
 * learners they are guardian of — is a domain lookup, and it is deliberately
 * expressed as an injected port so this package never queries the domain
 * itself. Route handlers resolve the context once per request and pass it to
 * domain services, which authorise against it.
 *
 * Status: Designed + partially Implemented. The membership/guardianship
 * repository this port needs arrives with the Identity domain module; until
 * then `resolveActorContext` is exercised against test doubles only.
 */
import type { AccountId, ActorContext, OrganisationId } from '@senstar/domain-identity';

/** What an authenticated session tells us — identity only, never permissions. */
export interface AuthenticatedSession {
  readonly accountId: AccountId;
  readonly emailVerified: boolean;
}

/** Domain-side lookup the resolver depends on (implemented by the Identity module). */
export interface MembershipLookup {
  /** Memberships for an account, newest-first is not assumed — order is irrelevant. */
  listMemberships(accountId: AccountId): Promise<readonly MembershipRecord[]>;
}

export interface MembershipRecord {
  readonly organisationId: OrganisationId;
  readonly roles: ActorContext['roles'];
  readonly guardianLearnerIds: ActorContext['guardianLearnerIds'];
}

export type ResolveFailure = 'email_not_verified' | 'no_membership' | 'organisation_not_permitted';

export type ResolveResult =
  | { readonly ok: true; readonly actor: ActorContext }
  | { readonly ok: false; readonly reason: ResolveFailure };

/**
 * Resolve the acting context for a request.
 *
 * Rules, all of them deliberate:
 *  - an unverified email resolves to nothing (ADR-0005: verification mandatory);
 *  - an account acts in exactly ONE organisation at a time — never a blended
 *    view across tenants;
 *  - if `requestedOrganisationId` is supplied it must match a real membership;
 *    a claimed organisation is never trusted on its own.
 */
export async function resolveActorContext(
  session: AuthenticatedSession,
  lookup: MembershipLookup,
  requestedOrganisationId?: OrganisationId,
): Promise<ResolveResult> {
  if (!session.emailVerified) {
    return { ok: false, reason: 'email_not_verified' };
  }

  const memberships = await lookup.listMemberships(session.accountId);
  if (memberships.length === 0) {
    return { ok: false, reason: 'no_membership' };
  }

  let chosen: MembershipRecord | undefined;
  if (requestedOrganisationId === undefined) {
    // Unambiguous only when there is exactly one membership; otherwise the
    // caller must state which context they mean.
    chosen = memberships.length === 1 ? memberships[0] : undefined;
    if (chosen === undefined) {
      return { ok: false, reason: 'organisation_not_permitted' };
    }
  } else {
    chosen = memberships.find((m) => m.organisationId === requestedOrganisationId);
    if (chosen === undefined) {
      return { ok: false, reason: 'organisation_not_permitted' };
    }
  }

  return {
    ok: true,
    actor: {
      accountId: session.accountId,
      organisationId: chosen.organisationId,
      roles: chosen.roles,
      guardianLearnerIds: chosen.guardianLearnerIds,
    },
  };
}
