/**
 * Database schema (Drizzle, ADR-0004).
 *
 * Foundation-phase scope (Prompt 01 §6): the deliberate minimum proving the
 * migration system and establishing the tenancy pattern every future table
 * follows. The product schema arrives module-by-module with its domain
 * designs — NOT here, NOT yet.
 *
 * Patterns established by `organisations` (the tenant root):
 *  - uuid primary keys, application-supplied or defaulted
 *  - explicit tenancy: every future tenant-scoped table carries organisation_id
 *  - RLS enabled in the companion SQL migration (0001) as defence-in-depth
 *  - timestamps with time zone, never naive
 */
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** DOMAIN_MODEL.md §3: family and school are shapes of one tenant abstraction. */
export const organisationKind = pgEnum('organisation_kind', ['family', 'school']);

export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: organisationKind('kind').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
