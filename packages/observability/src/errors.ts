/**
 * Turning a thrown value into something safe to log (ADR-0007,
 * SECURITY_AND_PRIVACY.md §3).
 *
 * Errors are the most common accidental exfiltration route in a backend: the
 * driver's message often echoes host, user and database, and configuration
 * errors name the variables that failed. A log line is not a secret store —
 * it reaches an aggregator, CI output, and a third-party APM.
 *
 * This lives in the observability package, not in the route that needed it
 * first: it is a safety rule about logging, so it belongs with the redaction
 * scrubber and ships with tests (DEVELOPMENT_RULES).
 */

/** Postgres URIs carry credentials in the userinfo section. */
const CONNECTION_URI = /postgres(?:ql)?:\/\/[^\s'"]*/gi;

/** Generic `scheme://user:password@host` — catches non-Postgres URLs too. */
const CREDENTIALLED_URL = /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/'"]+:[^\s@'"]+@[^\s'"]*/gi;

export interface DescribedError {
  /** Error constructor name, or the typeof for non-Error throws. */
  readonly kind: string;
  /** Message with any credential-bearing URL removed. */
  readonly message?: string;
  /** Machine-readable code where the thrower provides one. */
  readonly code?: string;
}

/** Strip any credential-bearing URL from free text. */
export function scrubConnectionStrings(text: string): string {
  return text
    .replace(CREDENTIALLED_URL, '[redacted-url]')
    .replace(CONNECTION_URI, '[redacted-url]');
}

/**
 * Reduce a thrown value to a fixed, loggable shape.
 *
 * Deliberately drops the stack: it adds little for operational diagnosis and
 * can carry interpolated values from frames. `code` is kept because it is the
 * fastest route to a cause — ECONNREFUSED, 28P01 (auth failed), 42501
 * (permission denied) each point somewhere different.
 */
export function describeError(error: unknown): DescribedError {
  if (!(error instanceof Error)) return { kind: typeof error };
  const code = (error as { code?: unknown }).code;
  return {
    kind: error.name,
    message: scrubConnectionStrings(error.message),
    ...(typeof code === 'string' ? { code } : {}),
  };
}
