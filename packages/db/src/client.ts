/**
 * Database client (ADR-0004). node-postgres driver: works identically against
 * local PostgreSQL 16 (dev/CI) and Neon over TCP (preview/production).
 * If we later adopt Neon's serverless driver, it swaps inside this module —
 * nothing outside @senstar/db changes.
 */
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  readonly db: Database;
  readonly pool: pg.Pool;
  close(): Promise<void>;
}

export function createDatabase(databaseUrl: string): DatabaseHandle {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  return {
    db,
    pool,
    close: () => pool.end(),
  };
}

/** Liveness check used by /api/health and deployment verification. */
export async function checkDatabaseConnection(handle: DatabaseHandle): Promise<boolean> {
  const result = await handle.pool.query('select 1 as ok');
  return result.rows[0]?.ok === 1;
}
