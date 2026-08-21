/**
 * Programmatic migration runner (used by tests, CI, and the migrate CLI).
 * Migrations are the ONLY schema-change mechanism (Technical Constitution §3).
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { DatabaseHandle } from './client';

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'migrations',
);

export async function runMigrations(handle: DatabaseHandle): Promise<void> {
  await migrate(handle.db, { migrationsFolder });
}

/**
 * Resolve the connection migrations must run on (ADR-0009).
 *
 * Extracted from the CLI so the refusal is testable: this is a safety guard,
 * and DEVELOPMENT_RULES requires safety-relevant logic ship with tests rather
 * than live untested inside a script's top-level body.
 *
 * There is deliberately NO fallback to DATABASE_URL. That is the non-owning
 * application role, which cannot create tables — falling back would fail
 * partway through a migration with a confusing permission error instead of
 * refusing at the first line. Worse, it would quietly re-create the very
 * condition ADR-0009 exists to remove: migrations running as the app role.
 */
export function requireMigrationUrl(migrationDatabaseUrl: string | undefined): string {
  if (migrationDatabaseUrl === undefined || migrationDatabaseUrl === '') {
    throw new Error(
      'MIGRATION_DATABASE_URL is not set. Migrations must run as the owner role, not as the ' +
        'application role in DATABASE_URL (ADR-0009). See .env.example.',
    );
  }
  return migrationDatabaseUrl;
}
