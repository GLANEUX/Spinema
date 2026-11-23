import { z } from 'zod';

/** Development and test only: production must set its own secret (checked below). */
export const DEV_AUTH_SECRET = 'spinema-dev-secret-not-for-production-use-0123';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().default(3000),
    API_HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().url(),
    /** Comma-separated origins allowed by CORS (the invitation page). */
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:8080')
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    /**
     * Number of reverse proxies in front of the API (the server's Nginx = 1), so that rate limits
     * and logs see the visitor's address and not the proxy's. 0 when the API is reached directly.
     */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    /** Signs sessions and tokens. 32 characters minimum. */
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    /** Public address of the API, used in the links of the emails. */
    BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
    /** Verified email before the first sign-in (false on staging until emails are wired). */
    REQUIRE_EMAIL_VERIFICATION: z.stringbool().default(true),
    /** Refuse passwords found in data breaches (Have I Been Pwned). False in tests: no network. */
    PWNED_PASSWORD_CHECK: z.stringbool().default(true),
    /** Emails (docs/comptes.md): SMTP when SMTP_HOST is set, otherwise written to the logs. */
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    MAIL_FROM: z.string().default('Spinema <noreply@spinema.fr>'),
    /** Where replies go: the sender address has no mailbox. */
    MAIL_REPLY_TO: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.BETTER_AUTH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_SECRET'],
        message: 'required in production',
      });
    }
  })
  .transform((env) => ({ ...env, BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ?? DEV_AUTH_SECRET }));

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
