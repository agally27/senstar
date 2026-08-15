/**
 * These tests are the proof of a safeguarding rule, not a formality:
 * SECURITY_AND_PRIVACY.md §3 forbids child personal data in logs. If any of
 * these fail, the platform is leaking children's data into log aggregators.
 */
import { describe, expect, it } from 'vitest';
import { createLogger, redact, REDACTED } from '../src/index';

describe('redact', () => {
  it('strips direct identity fields', () => {
    const out = redact({
      name: 'A Child',
      email: 'parent@example.com',
      learnerId: 'abc',
    }) as Record<string, unknown>;
    expect(out['name']).toBe(REDACTED);
    expect(out['email']).toBe(REDACTED);
    expect(out['learnerId']).toBe('abc'); // opaque ids are the whole point — kept
  });

  it('strips secrets and credentials', () => {
    const out = redact({
      password: 'hunter2',
      accessToken: 'tok',
      databaseUrl: 'postgresql://u:p@h/db',
    }) as Record<string, unknown>;
    expect(Object.values(out)).toEqual([REDACTED, REDACTED, REDACTED]);
  });

  it('strips child-data bodies while keeping their references', () => {
    const out = redact({
      observation: 'She was upset at bedtime because...',
      observationId: 'obs-1',
      diagnosis: 'redact me',
      needProfile: { anything: 'here' },
    }) as Record<string, unknown>;
    expect(out['observation']).toBe(REDACTED);
    expect(out['diagnosis']).toBe(REDACTED);
    expect(out['needProfile']).toBe(REDACTED);
    expect(out['observationId']).toBe('obs-1');
  });

  it('matches field names regardless of case and separators', () => {
    const out = redact({ First_Name: 'x', 'date-of-birth': 'y', PASSWORD: 'z' }) as Record<
      string,
      unknown
    >;
    expect(Object.values(out)).toEqual([REDACTED, REDACTED, REDACTED]);
  });

  it('recurses into nested objects and arrays', () => {
    const out = redact({
      learners: [{ learnerId: '1', name: 'Child One' }],
      wrapper: { deep: { email: 'x@y.z' } },
    }) as { learners: Record<string, unknown>[]; wrapper: { deep: Record<string, unknown> } };
    expect(out.learners[0]?.['name']).toBe(REDACTED);
    expect(out.learners[0]?.['learnerId']).toBe('1');
    expect(out.wrapper.deep['email']).toBe(REDACTED);
  });

  it('truncates pathologically deep structures rather than recursing forever', () => {
    let deep: Record<string, unknown> = { safe: 'value' };
    for (let i = 0; i < 20; i += 1) deep = { nested: deep };
    expect(JSON.stringify(redact(deep))).toContain('[truncated]');
  });

  it('passes primitives and dates through unchanged in shape', () => {
    expect(redact('plain')).toBe('plain');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
    expect(typeof redact(new Date('2026-01-01'))).toBe('string');
  });
});

describe('createLogger', () => {
  function capture() {
    const lines: string[] = [];
    const logger = createLogger({
      level: 'debug',
      appEnv: 'test',
      destination: { write: (chunk) => lines.push(chunk) },
    });
    return { logger, lines };
  }

  it('emits structured JSON carrying the safe context', () => {
    const { logger, lines } = capture();
    logger.info('profile read', {
      correlationId: 'corr-1',
      organisationId: 'org-1',
      learnerId: 'lrn-1',
      operation: 'learner.profile.read',
    });
    const record = JSON.parse(lines[0] ?? '{}');
    expect(record.msg).toBe('profile read');
    expect(record.correlationId).toBe('corr-1');
    expect(record.organisationId).toBe('org-1');
    expect(record.level).toBe('info');
  });

  it('redacts personal data passed as details — the careless-spread case', () => {
    const { logger, lines } = capture();
    const learner = { learnerId: 'lrn-1', name: 'A Child', needProfile: { x: 1 } };
    logger.warn('unexpected state', { operation: 'debug' }, { ...learner });
    const emitted = lines[0] ?? '';
    expect(emitted).not.toContain('A Child');
    expect(emitted).toContain(REDACTED);
    expect(emitted).toContain('lrn-1');
  });

  it('child loggers carry inherited context', () => {
    const { logger, lines } = capture();
    logger.child({ correlationId: 'corr-9' }).error('failed');
    const record = JSON.parse(lines[0] ?? '{}');
    expect(record.correlationId).toBe('corr-9');
    expect(record.level).toBe('error');
  });
});
