/**
 * CLI entry: pnpm db:migrate.
 *
 * A thin wrapper: the refusal logic lives in requireMigrationUrl (migrate.ts)
 * so it can be tested. Migrations run as the OWNER role (ADR-0009), supplied
 * as MIGRATION_DATABASE_URL — never as the application role in DATABASE_URL.
 */
import { loadServerConfig } from '@senstar/config/server';
import { createDatabase } from './client';
import { requireMigrationUrl, runMigrations } from './migrate';

const config = loadServerConfig();
if (config.isProduction && process.env['CONFIRM_PRODUCTION_MIGRATION'] !== 'yes') {
  throw new Error('Refusing production migration without CONFIRM_PRODUCTION_MIGRATION=yes');
}

const handle = createDatabase(requireMigrationUrl(config.migrationDatabaseUrl));
await runMigrations(handle);
await handle.close();
console.log(`Migrations applied (${config.appEnv}).`);
