/**
 * The migration connection guard (ADR-0009).
 *
 * Raised in review of PR #8: the refusal path had no coverage, because the
 * integration tests call runMigrations directly and never exercise the CLI.
 * The guard is what stops migrations silently running as the application role
 * — the exact condition ADR-0009 exists to remove — so it ships with tests.
 *
 * No database required: this is pure logic and runs everywhere, including on
 * a machine with no Postgres.
 */
import { describe, expect, it } from 'vitest';
import { requireMigrationUrl } from '../src/migrate';

const OWNER_URL = 'postgresql://owner:pw@localhost:5432/senstar_test';

describe('requireMigrationUrl (ADR-0009)', () => {
  it('returns the owner connection when it is set', () => {
    expect(requireMigrationUrl(OWNER_URL)).toBe(OWNER_URL);
  });

  it('refuses when MIGRATION_DATABASE_URL is unset', () => {
    expect(() => requireMigrationUrl(undefined)).toThrowError(/MIGRATION_DATABASE_URL is not set/);
  });

  it('refuses an empty string rather than treating it as a connection', () => {
    // An unset variable in a shell or CI environment often arrives as '' rather
    // than undefined; both must refuse.
    expect(() => requireMigrationUrl('')).toThrowError(/MIGRATION_DATABASE_URL is not set/);
  });

  it('never falls back to the application role', () => {
    // The whole point of the guard: no argument, environment or default may
    // cause migrations to run on DATABASE_URL.
    let message = '';
    try {
      requireMigrationUrl(undefined);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/must run as the owner role/);
    expect(message).toMatch(/ADR-0009/);
  });

  it('does not leak a connection string in the failure message', () => {
    // Connection strings carry credentials (config server.ts classes
    // DATABASE_URL as secret); a thrown error reaches logs and CI output.
    try {
      requireMigrationUrl(undefined);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toMatch(/postgres(ql)?:\/\//);
      expect(message).not.toMatch(/:\/\/[^\s]*:[^\s]*@/);
    }
  });
});
