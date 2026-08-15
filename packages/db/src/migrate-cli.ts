/** CLI entry: pnpm db:migrate — applies pending migrations to DATABASE_URL. */
import { loadServerConfig } from '@senstar/config/server';
import { createDatabase } from './client';
import { runMigrations } from './migrate';

const config = loadServerConfig();
if (config.isProduction && process.env['CONFIRM_PRODUCTION_MIGRATION'] !== 'yes') {
  throw new Error('Refusing production migration without CONFIRM_PRODUCTION_MIGRATION=yes');
}
const handle = createDatabase(config.databaseUrl);
await runMigrations(handle);
await handle.close();
console.log(`Migrations applied (${config.appEnv}).`);
