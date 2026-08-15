/**
 * Health endpoint (ADR-0007 §3): app liveness + database connectivity.
 * The deployment-verification and uptime-probe target. Returns no
 * personal data and no internal details beyond component status.
 */
import { loadServerConfig } from '@senstar/config/server';
import { checkDatabaseConnection, createDatabase } from '@senstar/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const checks: Record<string, 'ok' | 'failed'> = { app: 'ok', database: 'failed' };
  let status = 200;
  try {
    const config = loadServerConfig();
    const handle = createDatabase(config.databaseUrl);
    try {
      checks['database'] = (await checkDatabaseConnection(handle)) ? 'ok' : 'failed';
    } finally {
      await handle.close();
    }
  } catch {
    // config invalid or db unreachable — report unhealthy, leak nothing
  }
  if (checks['database'] !== 'ok') status = 503;
  return Response.json({ status: status === 200 ? 'healthy' : 'unhealthy', checks }, { status });
}
