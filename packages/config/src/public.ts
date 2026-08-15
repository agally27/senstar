/**
 * Public (browser-safe) configuration. Only NEXT_PUBLIC_-prefixed values may
 * appear here (ADR-0008). Importing `@senstar/config/server` from client code
 * is forbidden; this module is the only config surface the client sees.
 */
import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'test', 'preview', 'production']),
});

export interface PublicConfig {
  readonly appEnv: 'development' | 'test' | 'preview' | 'production';
}

export function loadPublicConfig(
  env: Record<string, string | undefined> = process.env,
): PublicConfig {
  const parsed = publicEnvSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid public configuration:\n${problems}`);
  }
  return { appEnv: parsed.data.NEXT_PUBLIC_APP_ENV };
}
