/**
 * Server-side configuration. NEVER import this module from client code.
 * (ADR-0008: fail fast and loudly on missing/invalid environment.)
 *
 * Classes:
 *  - server: server-only, non-secret
 *  - secret: server-only, sensitive — never logged, never serialised
 */
import { z } from 'zod';

const appEnvSchema = z.enum(['development', 'test', 'preview', 'production']);
export type AppEnv = z.infer<typeof appEnvSchema>;

const serverEnvSchema = z.object({
  APP_ENV: appEnvSchema,
  DATABASE_URL: z
    .string()
    .url()
    .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a Postgres connection string',
    }),
  BETTER_AUTH_SECRET: z.string().min(16, 'BETTER_AUTH_SECRET must be at least 16 characters'),
  BETTER_AUTH_URL: z.string().url(),
});

export interface ServerConfig {
  readonly appEnv: AppEnv;
  /** Secret class — never log or serialise. */
  readonly databaseUrl: string;
  /** Secret class — never log or serialise. */
  readonly authSecret: string;
  readonly authUrl: string;
  readonly isProduction: boolean;
}

/**
 * Parse and validate server configuration from an environment map.
 * Throws (with every problem listed) rather than starting misconfigured —
 * a preview environment silently pointing at the wrong database is a
 * child-data incident, not an inconvenience.
 */
export function loadServerConfig(
  env: Record<string, string | undefined> = process.env,
): ServerConfig {
  const parsed = serverEnvSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid server configuration:\n${problems}`);
  }
  const e = parsed.data;
  return {
    appEnv: e.APP_ENV,
    databaseUrl: e.DATABASE_URL,
    authSecret: e.BETTER_AUTH_SECRET,
    authUrl: e.BETTER_AUTH_URL,
    isProduction: e.APP_ENV === 'production',
  };
}
