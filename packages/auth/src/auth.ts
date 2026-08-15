/**
 * Authentication (ADR-0005). Answers "who are you?" and nothing else —
 * authorisation lives in @senstar/domain-identity (MULTI_TENANCY.md §2).
 *
 * v1 scope per D5 (parent-mediated): adult guardian accounts only, email +
 * password, verification mandatory. There are no child credentials anywhere
 * in this configuration, which is the strongest child-auth posture available.
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { authAccount, authSession, authUser, authVerification, type Database } from '@senstar/db';

export interface AuthOptions {
  readonly db: Database;
  readonly authSecret: string;
  readonly baseUrl: string;
  /**
   * Transport for verification and reset emails. **Required, deliberately.**
   * Verification is mandatory (below), so an auth instance without a working
   * email transport is one where no guardian can ever complete sign-up — a
   * broken flow that must fail at construction, not in production. The
   * concrete provider is an open decision (see DECISIONS.md D15).
   */
  readonly sendEmail: (message: EmailMessage) => Promise<void>;
}

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  readonly kind: 'verification' | 'password_reset';
}

/**
 * Session cookie and password policy.
 *
 * Guardian account strength is a safeguarding control, not merely a security
 * one (SAFEGUARDING.md §2): these accounts are the door to children's data.
 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days
export const MIN_PASSWORD_LENGTH = 12;

export function createAuth(options: AuthOptions) {
  const send = options.sendEmail;

  return betterAuth({
    secret: options.authSecret,
    baseURL: options.baseUrl,

    database: drizzleAdapter(options.db, {
      provider: 'pg',
      schema: {
        user: authUser,
        session: authSession,
        account: authAccount,
        verification: authVerification,
      },
    }),

    emailAndPassword: {
      enabled: true,
      /** Mandatory: an unverified email must not reach a child's data. */
      requireEmailVerification: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      sendResetPassword: async ({ user, url }) => {
        await send({
          to: user.email,
          subject: 'Reset your password',
          body: url,
          kind: 'password_reset',
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        await send({
          to: user.email,
          subject: 'Confirm your email address',
          body: url,
          kind: 'verification',
        });
      },
    },

    session: {
      expiresIn: SESSION_MAX_AGE_SECONDS,
      updateAge: 60 * 60 * 24, // refresh at most daily
    },

    advanced: {
      cookiePrefix: 'senstar',
      useSecureCookies: options.baseUrl.startsWith('https://'),
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
      },
    },

    /** Rate limiting on auth endpoints is a v1 requirement (ADR-0005). */
    rateLimit: {
      enabled: true,
      window: 60,
      max: 20,
    },

    /** No social providers in v1; adding one is an ADR, not a config tweak. */
    socialProviders: {},
  });
}

export type Auth = ReturnType<typeof createAuth>;
