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
