/**
 * ADR-0009: prove row-level security actually binds.
 *
 * MULTI_TENANCY.md §3 layer 4 requires that every enforcement layer ships with
 * tests. This file tests layer 3 *itself* — the failure mode being guarded
 * against is a silent regression to "RLS enabled but not binding", which is
 * precisely the state the repository was in before ADR-0009.
 *
 * The assertions that matter here are about the application ROLE, not about
 * any single query: a role that is superuser, holds BYPASSRLS, or owns the
 * tables defeats row-level security no matter how good the policies are.
 *
 * Note on CI: the Postgres service's POSTGRES_USER is the bootstrap superuser,
 * so it owns the tables and bypasses RLS unconditionally. That is why the
 * owner-side assertion below checks that FORCE is *set* (`relforcerowsecurity`)
 * rather than trying to observe its effect through a superuser, which would
 * prove nothing. The effect is verified through `senstar_app`, which is an
 * ordinary role.
 */
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, runMigrations, type DatabaseHandle } from '../src/index';

const EXPLICIT_URL = process.env['TEST_DATABASE_URL'];
const TEST_URL =
  EXPLICIT_URL ?? 'postgresql://senstar:senstar_local_dev@localhost:5432/senstar_test';

const APP_ROLE = 'senstar_app';
const APP_PASSWORD = 'app_role_test_only';

const TENANT_TABLES = [
  'organisations',
  'auth_user',
  'auth_session',
  'auth_account',
  'auth_verification',
] as const;

async function isReachable(url: string): Promise<boolean> {
  const probe = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 2000, max: 1 });
  try {
    await probe.query('select 1');
    return true;
  } catch {
    return false;
  } finally {
    await probe.end().catch(() => undefined);
  }
}

const reachable = await isReachable(TEST_URL);
// Same contract as migrations.test.ts: skip locally without Postgres, never in CI.
const skipSuite = !reachable && EXPLICIT_URL === undefined;

/** The application role's connection: same database, different credentials. */
function appRoleUrl(ownerUrl: string): string {
  const u = new URL(ownerUrl);
  u.username = APP_ROLE;
  u.password = APP_PASSWORD;
  return u.toString();
}

let owner: DatabaseHandle;
let app: pg.Pool;

describe.skipIf(skipSuite)('row-level security binds (ADR-0009)', () => {
  beforeAll(async () => {
    owner = createDatabase(TEST_URL);
    await owner.pool.query(
      'drop schema public cascade; create schema public; drop schema if exists drizzle cascade;',
    );
    await owner.pool.query(`drop role if exists ${APP_ROLE}`);
    await runMigrations(owner);

    // Credentials are environment-specific and deliberately absent from the
    // migration; the test supplies its own.
    await owner.pool.query(`alter role ${APP_ROLE} with password '${APP_PASSWORD}'`);

    // Seed as the owner. In CI the owner is a superuser, so this succeeds
    // regardless of RLS — which is the point: the rows exist, and the
    // application role still must not see them.
    await owner.pool.query(
      `insert into organisations (kind, name) values ('family', 'Tenant A'), ('family', 'Tenant B')`,
    );

    app = new pg.Pool({ connectionString: appRoleUrl(TEST_URL), max: 1 });
  });

  afterAll(async () => {
    await app?.end().catch(() => undefined);
    await owner?.close();
  });

  describe('the application role cannot defeat RLS by attribute', () => {
    it('is not a superuser and does not hold BYPASSRLS', async () => {
      const res = await owner.pool.query(
        `select rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
           from pg_roles where rolname = $1`,
        [APP_ROLE],
      );
      expect(res.rows).toHaveLength(1);
      const role = res.rows[0];
      // Either of these silently defeats every policy we will ever write.
      // On Neon this is how the control is most likely to be lost: a role
      // created via the Console inherits neon_superuser, which has BYPASSRLS.
      expect(role.rolsuper, `${APP_ROLE} must not be a superuser`).toBe(false);
      expect(role.rolbypassrls, `${APP_ROLE} must not hold BYPASSRLS`).toBe(false);
      expect(role.rolcreatedb).toBe(false);
      expect(role.rolcreaterole).toBe(false);
    });

    it('does not own any tenant-scoped table', async () => {
      const res = await owner.pool.query(
        `select c.relname, pg_get_userbyid(c.relowner) as owner
           from pg_class c
           join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r'`,
      );
      expect(res.rows.length).toBeGreaterThan(0);
      for (const row of res.rows) {
        expect(row.owner, `${APP_ROLE} must not own ${row.relname}`).not.toBe(APP_ROLE);
      }
    });
  });

  describe('every tenant-scoped table is both ENABLE and FORCE', () => {
    it.each(TENANT_TABLES)('%s has RLS enabled and forced', async (table) => {
      const res = await owner.pool.query(
        `select relrowsecurity, relforcerowsecurity from pg_class where relname = $1`,
        [table],
      );
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0].relrowsecurity, `RLS not enabled on ${table}`).toBe(true);
      // Without FORCE the owner bypasses RLS, which is how layer 3 was inert.
      expect(res.rows[0].relforcerowsecurity, `RLS not FORCEd on ${table}`).toBe(true);
    });
  });

  describe('the wall holds in practice', () => {
    it('the application role reads zero rows although rows exist', async () => {
      const asOwner = await owner.pool.query('select count(*)::int as n from organisations');
      expect(asOwner.rows[0].n, 'seed data should exist').toBe(2);

      const asApp = await app.query('select count(*)::int as n from organisations');
      // No policies are defined yet (ADR-0009 step 3), so the correct result is
      // total denial. When policies land this becomes "only its own tenant".
      expect(asApp.rows[0].n, 'application role must not read rows without a policy').toBe(0);
    });

    it('the application role cannot create tables', async () => {
      await expect(app.query('create table should_not_exist (id int)')).rejects.toThrow();
    });

    it('the application role cannot disable row-level security', async () => {
      await expect(
        app.query('alter table organisations no force row level security'),
      ).rejects.toThrow();
    });
  });
});
