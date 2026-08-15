/**
 * These tests guard the authentication/authorisation boundary: an account
 * must never end up acting in a tenant it has no membership in, and an
 * unverified email must never resolve to an acting context at all.
 */
import { describe, expect, it } from 'vitest';
import { AccountId, LearnerId, OrganisationId } from '@senstar/domain-identity';
import { resolveActorContext, type MembershipLookup, type MembershipRecord } from '../src/index';

const account = AccountId('33333333-3333-4333-8333-333333333333');
const orgFamily = OrganisationId('11111111-1111-4111-8111-111111111111');
const orgSchool = OrganisationId('22222222-2222-4222-8222-222222222222');
const child = LearnerId('44444444-4444-4444-8444-444444444444');

const familyMembership: MembershipRecord = {
  organisationId: orgFamily,
  roles: ['parent'],
  guardianLearnerIds: [child],
};
const schoolMembership: MembershipRecord = {
  organisationId: orgSchool,
  roles: ['teacher'],
  guardianLearnerIds: [],
};

function lookupOf(...records: MembershipRecord[]): MembershipLookup {
  return { listMemberships: async () => records };
}

const verified = { accountId: account, emailVerified: true };

describe('resolveActorContext', () => {
  it('resolves the single membership when there is no ambiguity', async () => {
    const result = await resolveActorContext(verified, lookupOf(familyMembership));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor.organisationId).toBe(orgFamily);
      expect(result.actor.roles).toEqual(['parent']);
      expect(result.actor.guardianLearnerIds).toEqual([child]);
    }
  });

  it('refuses an unverified email — verification is mandatory (ADR-0005)', async () => {
    const result = await resolveActorContext(
      { accountId: account, emailVerified: false },
      lookupOf(familyMembership),
    );
    expect(result).toEqual({ ok: false, reason: 'email_not_verified' });
  });

  it('refuses an account with no memberships', async () => {
    const result = await resolveActorContext(verified, lookupOf());
    expect(result).toEqual({ ok: false, reason: 'no_membership' });
  });

  it('refuses to guess when the account belongs to several organisations', async () => {
    const result = await resolveActorContext(
      verified,
      lookupOf(familyMembership, schoolMembership),
    );
    expect(result).toEqual({ ok: false, reason: 'organisation_not_permitted' });
  });

  it('honours an explicit organisation the account is genuinely a member of', async () => {
    const result = await resolveActorContext(
      verified,
      lookupOf(familyMembership, schoolMembership),
      orgSchool,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.actor.roles).toEqual(['teacher']);
  });

  it('never trusts a claimed organisation without a matching membership', async () => {
    const result = await resolveActorContext(verified, lookupOf(familyMembership), orgSchool);
    expect(result).toEqual({ ok: false, reason: 'organisation_not_permitted' });
  });

  it('keeps contexts unblended — a teacher-and-parent acts in one tenant at a time', async () => {
    const asParent = await resolveActorContext(
      verified,
      lookupOf(familyMembership, schoolMembership),
      orgFamily,
    );
    expect(asParent.ok).toBe(true);
    if (asParent.ok) {
      expect(asParent.actor.roles).toEqual(['parent']);
      // school-side guardianship/scope must not leak into the family context
      expect(asParent.actor.organisationId).toBe(orgFamily);
    }
  });
});
