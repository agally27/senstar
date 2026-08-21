/**
 * Credential scrubbing in error logs (ADR-0007, SECURITY_AND_PRIVACY.md §3).
 *
 * The realistic failure this guards: a database is misconfigured, the driver
 * throws with the connection string in the message, and the credential lands
 * in a log aggregator — or in a public CI log — permanently.
 */
import { describe, expect, it } from 'vitest';
import { describeError, scrubConnectionStrings } from '../src/index';

const SECRET = 'npg_SuperSecretValue123';
const CONN = `postgresql://senstar_app:${SECRET}@ep-x.eu-west-2.aws.neon.tech/neondb?sslmode=verify-full`;

describe('scrubConnectionStrings', () => {
  it('removes a Postgres URI, password and all', () => {
    const out = scrubConnectionStrings(`could not connect to ${CONN}`);
    expect(out).not.toContain(SECRET);
    expect(out).not.toContain('senstar_app');
    expect(out).toContain('[redacted-url]');
  });

  it('removes the postgres:// short form', () => {
    const out = scrubConnectionStrings(`postgres://u:${SECRET}@host:5432/db failed`);
    expect(out).not.toContain(SECRET);
  });

  it('removes credentialled URLs of other schemes', () => {
    // Email transports (D15) and object stores carry credentials the same way.
    const out = scrubConnectionStrings(`smtps://user:${SECRET}@smtp.example.com rejected`);
    expect(out).not.toContain(SECRET);
  });

  it('leaves ordinary text and credential-free URLs alone', () => {
    const text = 'connection refused to https://neon.com/docs at 127.0.0.1:5432';
    expect(scrubConnectionStrings(text)).toBe(text);
  });
});

describe('describeError', () => {
  it('keeps the machine-readable code — the fastest route to a cause', () => {
    const error = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
      code: 'ECONNREFUSED',
    });
    expect(describeError(error)).toEqual({
      kind: 'Error',
      message: 'connect ECONNREFUSED 127.0.0.1:5432',
      code: 'ECONNREFUSED',
    });
  });

  it('scrubs a connection string out of the message', () => {
    const described = describeError(new Error(`password authentication failed for ${CONN}`));
    expect(described.message).not.toContain(SECRET);
    expect(described.message).toContain('[redacted-url]');
  });

  it('drops the stack, which can carry interpolated values', () => {
    expect(Object.keys(describeError(new Error('boom')))).not.toContain('stack');
  });

  it('omits code when the thrower provides none', () => {
    expect(describeError(new Error('plain'))).toEqual({ kind: 'Error', message: 'plain' });
  });

  it('handles non-Error throws without leaking their contents', () => {
    expect(describeError(CONN)).toEqual({ kind: 'string' });
    expect(describeError(undefined)).toEqual({ kind: 'undefined' });
  });
});
