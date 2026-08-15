/**
 * The redaction layer (SECURITY_AND_PRIVACY.md §3, ADR-0007).
 *
 * "No child personal data in logs, ever — log references, not contents."
 * This file is the enforcement of that rule as *tested code, not convention*.
 *
 * Two mechanisms, deliberately belt-and-braces:
 *  1. An allowlist-shaped API (see logger.ts): callers pass a typed LogContext
 *     of known-safe fields, so the ordinary path cannot carry a child's name.
 *  2. This defensive scrubber, applied to every payload regardless, so a
 *     careless `{ ...learner }` spread is stripped rather than persisted.
 *
 * Adding a field name here is cheap. Discovering a child's name in a log
 * aggregator is not.
 */

/** Field names whose VALUES must never be logged. Matched case-insensitively. */
const FORBIDDEN_KEYS: readonly string[] = [
  // direct identity
  'name',
  'firstname',
  'lastname',
  'preferredname',
  'fullname',
  'email',
  'emailaddress',
  'phone',
  'telephone',
  'address',
  'postcode',
  'dob',
  'dateofbirth',
  'birthdate',
  'age',
  // credentials / secrets
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie',
  'sessiontoken',
  'apikey',
  'databaseurl',
  'connectionstring',
  // child-data bodies (log the reference, never the content)
  'observation',
  'observations',
  'note',
  'notes',
  'response',
  'responses',
  'answer',
  'answers',
  'evidence',
  'diagnosis',
  'diagnoses',
  'needprofile',
  'needsprofile',
  'learnermodel',
  'generatedcontent',
  'prompt',
  'promptinput',
  'completion',
  'freetext',
];

export const REDACTED = '[redacted]';

const MAX_DEPTH = 6;

function isForbidden(key: string): boolean {
  return FORBIDDEN_KEYS.includes(key.toLowerCase().replace(/[_\-\s]/g, ''));
}

/**
 * Recursively strip forbidden fields from a log payload.
 * Unknown-but-harmless fields pass through: the goal is to make the dangerous
 * case impossible, not to make logging useless.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[truncated]';
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isForbidden(key) ? REDACTED : redact(item, depth + 1);
  }
  return out;
}
