import { describe, expect, it } from 'vitest';
import {
  AccountId,
  LearnerId,
  OrganisationId,
  authorise,
  type ActorContext,
  type LearnerResource,
  type Role,
} from '../src/index';

const orgA = OrganisationId('11111111-1111-4111-8111-111111111111');
const orgB = OrganisationId('22222222-2222-4222-8222-222222222222');
const parentAccount = AccountId('33333333-3333-4333-8333-333333333333');
const child = LearnerId('44444444-4444-4444-8444-444444444444');
const otherChild = LearnerId('55555555-5555-4555-8555-555555555555');

const parentOfChild: ActorContext = {
  accountId: parentAccount,
  organisationId: orgA,
  roles: ['parent'],
  guardianLearnerIds: [child],
};

const childResource: LearnerResource = { kind: 'learner', learnerId: child, organisationId: orgA };

describe('authorise — allow cases', () => {
  it('allows a guardian parent to read their child profile in their own tenant', () => {
    expect(authorise(parentOfChild, 'learner.profile.read', childResource)).toEqual({
      allowed: true,
    });
  });

  it('allows a home educator the same learner permissions as a parent', () => {
    const homeEd: ActorContext = { ...parentOfChild, roles: ['home_educator'] };
    expect(authorise(homeEd, 'learning.assign', childResource).allowed).toBe(true);
  });
});

describe('authorise — deny cases (every permission ships with denies)', () => {
  it('denies cross-tenant access even with a valid role and guardianship claim', () => {
    const resourceInOtherTenant: LearnerResource = {
      kind: 'learner',
      learnerId: child,
      organisationId: orgB,
    };
    const decision = authorise(parentOfChild, 'learner.profile.read', resourceInOtherTenant);
    expect(decision).toEqual({ allowed: false, reason: 'cross_tenant_denied' });
  });

  it('denies a parent access to a learner they hold no guardianship over, same tenant', () => {
    const someoneElsesChild: LearnerResource = {
      kind: 'learner',
      learnerId: otherChild,
      organisationId: orgA,
    };
    const decision = authorise(parentOfChild, 'learner.profile.read', someoneElsesChild);
    expect(decision).toEqual({ allowed: false, reason: 'no_qualifying_learner_relationship' });
  });

  it('denies permissions a role does not hold (parent cannot approve curated curriculum)', () => {
    const decision = authorise(parentOfChild, 'curriculum.curated.approve', childResource);
    expect(decision).toEqual({ allowed: false, reason: 'permission_not_granted' });
  });

  it('denies organisation administrators learner access without a qualifying relationship', () => {
    const orgAdmin: ActorContext = {
      accountId: parentAccount,
      organisationId: orgA,
      roles: ['organisation_administrator'],
      guardianLearnerIds: [],
    };
    expect(authorise(orgAdmin, 'learner.profile.read', childResource).allowed).toBe(false);
  });

  it('grants platform administrators nothing by default (break-glass only)', () => {
    const platformAdmin: ActorContext = {
      accountId: parentAccount,
      organisationId: orgA,
      roles: ['platform_administrator'],
      guardianLearnerIds: [],
    };
    expect(
      authorise(platformAdmin, 'organisation.manage', {
        kind: 'organisation',
        organisationId: orgA,
      }).allowed,
    ).toBe(false);
  });

  it('denies — never throws — when a role outside the catalogue arrives from the database', () => {
    // Roles are read from persistence, so the compile-time union is not a
    // runtime guarantee: a stale row or a role dropped by a later migration
    // produces an unknown string here. It must deny, not crash the request.
    const staleRole: ActorContext = {
      ...parentOfChild,
      roles: ['deputy_senco_2019' as Role],
    };
    expect(() => authorise(staleRole, 'learner.profile.read', childResource)).not.toThrow();
    expect(authorise(staleRole, 'learner.profile.read', childResource)).toEqual({
      allowed: false,
      reason: 'permission_not_granted',
    });
  });
});

describe('branded ids', () => {
  it('rejects non-UUID identifiers at construction', () => {
    expect(() => LearnerId('not-a-uuid')).toThrowError(/LearnerId/);
  });
});
