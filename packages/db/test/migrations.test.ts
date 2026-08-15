/**
 * Integration tests: prove the database foundation actually works
 * (Prompt 01 §6): connect, migrate forward from empty, re-run idempotently,
 * and verify the tenancy/RLS pattern is enforced by the database itself.
 *
 * Requires a local Postgres with the senstar_test database (CI provides one).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  checkDatabaseConnection,
  createDatabase,
  runMigrations,
  type DatabaseHandle,
} from '../src/index';

const TEST_URL =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://senstar:senstar_local_dev@localhost:5432/senstar_test';

let handle: DatabaseHandle;

beforeAll(async () => {
  handle = createDatabase(TEST_URL);
  // start from empty every run: migrations must build the world from scratch
  // (including drizzle's own migration-tracking schema — otherwise a previous
  // run's journal makes the migrator skip everything against an empty public schema)
  await handle.pool.query(
    'drop schema public cascade; create schema public; drop schema if exists drizzle cascade;',
  );
});

afterAll(async () => {
  await handle.close();
});

describe('database foundation', () => {
  it('connects', async () => {
    expect(await checkDatabaseConnection(handle)).toBe(true);
  });

  it('migrates forward from an empty database', async () => {
    await runMigrations(handle);
    const tables = await handle.pool.query(
      `select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const names = tables.rows.map((r) => r.table_name);
    expect(names).toContain('organisations');
  });

  it('re-running migrations is a no-op (roll-forward safety)', async () => {
    await expect(runMigrations(handle)).resolves.not.toThrow();
  });

  it('accepts both tenant shapes and rejects unknown kinds (enum enforced by the database)', async () => {
    await handle.pool.query(
      `insert into organisations (kind, name) values ('family', 'Test Family'), ('school', 'Test School')`,
    );
    await expect(
      handle.pool.query(`insert into organisations (kind, name) values ('startup', 'Nope')`),
    ).rejects.toThrow();
  });

  it('has row-level security enabled on the tenant root (defence-in-depth pattern)', async () => {
    const rls = await handle.pool.query(
      `select relrowsecurity from pg_class where relname = 'organisations'`,
    );
    expect(rls.rows[0]?.relrowsecurity).toBe(true);
  });

  it('creates the authentication tables in our own database (ADR-0005)', async () => {
    const tables = await handle.pool.query(
      `select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const names = tables.rows.map((r) => r.table_name);
    expect(names).toEqual(
      expect.arrayContaining(['auth_user', 'auth_session', 'auth_account', 'auth_verification']),
    );
  });

  it('has row-level security enabled on every identity table', async () => {
    const rls = await handle.pool.query(
      `select relname, relrowsecurity from pg_class
       where relname in ('auth_user','auth_session','auth_account','auth_verification')`,
    );
    expect(rls.rows).toHaveLength(4);
    for (const row of rls.rows) {
      expect(row.relrowsecurity, `RLS missing on ${row.relname}`).toBe(true);
    }
  });

  it('enforces one account per email address', async () => {
    await handle.pool.query(
      `insert into auth_user (id, name, email, email_verified)
       values ('u1', 'Test Guardian', 'guardian@example.com', false)`,
    );
    await expect(
      handle.pool.query(
        `insert into auth_user (id, name, email, email_verified)
         values ('u2', 'Someone Else', 'guardian@example.com', false)`,
      ),
    ).rejects.toThrow();
  });

  it('cascades session deletion when an account is erased (UK GDPR erasure path)', async () => {
    await handle.pool.query(
      `insert into auth_user (id, name, email, email_verified)
       values ('u3', 'Erasable Guardian', 'erase@example.com', true)`,
    );
    await handle.pool.query(
      `insert into auth_session (id, user_id, token, expires_at)
       values ('s1', 'u3', 'tok-1', now() + interval '1 day')`,
    );
    await handle.pool.query(`delete from auth_user where id = 'u3'`);
    const sessions = await handle.pool.query(`select id from auth_session where user_id = 'u3'`);
    expect(sessions.rows).toHaveLength(0);
  });
});
