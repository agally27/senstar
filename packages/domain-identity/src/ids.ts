/**
 * Branded identifier types (Technical Constitution §2: domain concepts get
 * real types, not primitives). A LearnerId cannot be passed where an
 * OrganisationId is expected — mixing tenants becomes a compile error.
 */
declare const brand: unique symbol;

export type Branded<T, B extends string> = T & { readonly [brand]: B };

export type AccountId = Branded<string, 'AccountId'>;
export type OrganisationId = Branded<string, 'OrganisationId'>;
export type LearnerId = Branded<string, 'LearnerId'>;
export type MembershipId = Branded<string, 'MembershipId'>;
export type GuardianshipId = Branded<string, 'GuardianshipId'>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, kind: string): void {
  if (!UUID_RE.test(value)) {
    throw new Error(`Invalid ${kind}: not a UUID`);
  }
}

export const AccountId = (value: string): AccountId => {
  assertUuid(value, 'AccountId');
  return value as AccountId;
};
export const OrganisationId = (value: string): OrganisationId => {
  assertUuid(value, 'OrganisationId');
  return value as OrganisationId;
};
export const LearnerId = (value: string): LearnerId => {
  assertUuid(value, 'LearnerId');
  return value as LearnerId;
};
