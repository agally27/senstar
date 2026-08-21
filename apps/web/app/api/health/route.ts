/**
 * Health endpoint (ADR-0007 §3): app liveness + database connectivity.
 * The deployment-verification and uptime-probe target.
 *
 * Two audiences, deliberately different:
 *  - the CALLER gets component status and nothing else. No error text, no
 *    connection details, no hint about why (SECURITY_AND_PRIVACY.md §3 —
 *    responses must not leak internals to an unauthenticated probe).
 *  - the OPERATOR gets a structured log line with the cause, through the one
 *    sanctioned logging surface (ADR-0007), so a failing deployment is
 *    diagnosable without redeploying with debug code.
 *
 * Before this, the failure path was `catch {}` — nothing logged anywhere. The
 * endpoint whose purpose is diagnosing the service discarded the diagnosis.
 */
import { loadServerConfig } from '@senstar/config/server';
import { checkDatabaseConnection, createDatabase } from '@senstar/db';
import { createLogger, describeError } from '@senstar/observability';

export const dynamic = 'force-dynamic';

// exactOptionalPropertyTypes: an absent APP_ENV must mean the property is
// absent, not present-and-undefined.
const appEnv = process.env['APP_ENV'];
const logger = createLogger(appEnv === undefined ? {} : { appEnv });

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
  } catch (error) {
    // `details` passes through the redaction scrubber, which strips
    // databaseurl/connectionstring/password keys as a second line of defence.
    logger.error(
      'health: database check failed',
      { operation: 'health.check' },
      describeError(error),
    );
  }
  if (checks['database'] !== 'ok') status = 503;
  return Response.json({ status: status === 200 ? 'healthy' : 'unhealthy', checks }, { status });
}
