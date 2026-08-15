/**
 * Structured logging (ADR-0007). The ONLY logging surface in the platform —
 * nothing else imports pino directly (lint-enforced).
 *
 * The context type is an allowlist by design: correlation and tenancy
 * identifiers, never personal data. Anything else passed as `details` goes
 * through the redaction scrubber first.
 */
import pino, { type Logger as PinoLogger } from 'pino';
import { redact } from './redaction';

/** Known-safe structured context. Identifiers and states only — no personal data. */
export interface LogContext {
  /** Per-request correlation id, propagated across jobs and logs. */
  readonly correlationId?: string;
  /** Tenant scope of the operation. */
  readonly organisationId?: string;
  /** Acting account — an opaque id, never an email. */
  readonly accountId?: string;
  /** Subject learner — an opaque id, never a name. */
  readonly learnerId?: string;
  /** Role in force, for authorisation diagnostics. */
  readonly role?: string;
  /** Logical operation name, e.g. 'learner.profile.read'. */
  readonly operation?: string;
  /** Authorisation outcome reason, e.g. 'cross_tenant_denied'. */
  readonly outcome?: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: LogContext, details?: unknown): void;
  info(message: string, context?: LogContext, details?: unknown): void;
  warn(message: string, context?: LogContext, details?: unknown): void;
  error(message: string, context?: LogContext, details?: unknown): void;
  /** Derive a logger that carries this context on every subsequent line. */
  child(context: LogContext): Logger;
}

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly appEnv?: string;
  /** Injectable sink — used by tests to capture emitted records. */
  readonly destination?: { write(chunk: string): void };
}

function wrap(base: PinoLogger): Logger {
  const emit =
    (level: LogLevel) =>
    (message: string, context?: LogContext, details?: unknown): void => {
      const payload: Record<string, unknown> = { ...(context ?? {}) };
      if (details !== undefined) payload['details'] = redact(details);
      base[level](payload, message);
    };

  return {
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
    child: (context: LogContext) => wrap(base.child({ ...context })),
  };
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const base = pino(
    {
      level: options.level ?? 'info',
      base: options.appEnv === undefined ? {} : { appEnv: options.appEnv },
      // Second line of defence: pino's own redaction over well-known paths,
      // in case a raw object reaches the transport by another route.
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
        censor: '[redacted]',
      },
      formatters: {
        level: (label) => ({ level: label }),
      },
    },
    options.destination as pino.DestinationStream | undefined,
  );
  return wrap(base);
}
