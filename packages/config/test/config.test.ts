import { describe, expect, it } from 'vitest';
import { loadServerConfig } from '../src/server';
import { loadPublicConfig } from '../src/public';

const validEnv = {
  APP_ENV: 'test',
  DATABASE_URL: 'postgresql://senstar:pw@localhost:5432/senstar_test',
  BETTER_AUTH_SECRET: 'a-sufficiently-long-test-secret',
  BETTER_AUTH_URL: 'http://localhost:3000',
};

describe('loadServerConfig', () => {
  it('parses a valid environment', () => {
    const config = loadServerConfig(validEnv);
    expect(config.appEnv).toBe('test');
    expect(config.isProduction).toBe(false);
    expect(config.databaseUrl).toContain('senstar_test');
  });

  it('fails fast when a required variable is missing', () => {
    const { DATABASE_URL: _omitted, ...incomplete } = validEnv;
    expect(() => loadServerConfig(incomplete)).toThrowError(/DATABASE_URL/);
  });

  it('rejects a non-postgres DATABASE_URL', () => {
    expect(() =>
      loadServerConfig({ ...validEnv, DATABASE_URL: 'mysql://nope:5432/db' }),
    ).toThrowError(/Postgres/);
  });

  it('rejects an unknown APP_ENV rather than defaulting', () => {
    expect(() => loadServerConfig({ ...validEnv, APP_ENV: 'staging' })).toThrowError(/APP_ENV/);
  });

  it('rejects a too-short auth secret', () => {
    expect(() => loadServerConfig({ ...validEnv, BETTER_AUTH_SECRET: 'short' })).toThrowError(
      /BETTER_AUTH_SECRET/,
    );
  });
});

describe('loadPublicConfig', () => {
  it('parses a valid public environment', () => {
    expect(loadPublicConfig({ NEXT_PUBLIC_APP_ENV: 'preview' }).appEnv).toBe('preview');
  });

  it('fails fast when missing', () => {
    expect(() => loadPublicConfig({})).toThrowError(/NEXT_PUBLIC_APP_ENV/);
  });
});
