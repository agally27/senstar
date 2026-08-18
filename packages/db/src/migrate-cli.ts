/**
 * CLI entry: pnpm db:migrate.
 *
 * Migrations run as the OWNER role (ADR-0009), supplied as
 * MIGRATION_DATABASE_URL. DATABASE_URL is the non-owning application role and
 * cannot create tables — so falling back to it would fail confusingly partway
 * through. Where MIGRATION_DATABASE_URL is absent we say so explicitly.
 */
import { loadServerConfig } from '@senstar/config/server';
import { createDatabase } from './client';
import { runMigrations } from './migrate';

const config = loadServerConfig();
if (config.isProduction && process.env['CONFIRM_PRODUCTION_MIGRATION'] !== 'yes') {
  throw new Error('Refusing production migration without CONFIRM_PRODUCTION_MIGRATION=yes');
}

const migrationUrl = config.migrationDatabaseUrl;
if (migrationUrl === undefined) {
  throw new Error(
    'MIGRATION_DATABASE_URL is not set. Migrations must run as the owner role, not as the ' +
      'application role in DATABASE_URL (ADR-0009). See .env.example.',
  );
}

const handle = createDatabase(migrationUrl);
await runMigrations(handle);
await handle.close();
console.log(`Migrations applied (${config.appEnv}).`);
