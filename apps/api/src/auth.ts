import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { haveIBeenPwned, username } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
import type { Database } from '@spinema/db';
import { schema } from '@spinema/db';
import {
  birthDateSchema,
  isOldEnough,
  MINIMUM_AGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  usernameSchema,
} from '@spinema/shared';
import type { Env } from './env';
import type { Mailer, MailTemplates } from './mail-contract';

/** Deep-link schemes of the three app variants (apps/mobile/app.config.ts). */
export const APP_SCHEMES = ['spinema://', 'spinema-preview://', 'spinema-development://'];

/**
 * Header carrying the visitor's address to Better Auth. The Fastify bridge sets it from
 * `request.ip` (which honours TRUST_PROXY) and drops any value sent by the client.
 */
export const CLIENT_IP_HEADER = 'x-spinema-client-ip';

export type AuthEnv = Pick<
  Env,
  | 'BETTER_AUTH_SECRET'
  | 'BETTER_AUTH_URL'
  | 'CORS_ORIGINS'
  | 'REQUIRE_EMAIL_VERIFICATION'
  | 'PWNED_PASSWORD_CHECK'
>;

export interface AuthDeps {
  db: Database['db'];
  env: AuthEnv;
  mailer: Mailer;
  templates: MailTemplates;
  /** Rate limits (on by default; tests turn them off to create many accounts quickly). */
  rateLimit?: boolean;
}

const badRequest = (code: string, message: string) =>
  new APIError('BAD_REQUEST', { code, message });

/** Better Auth options shared by the server and the schema generator. */
export function authOptions({ db, env, mailer, templates, rateLimit = true }: AuthDeps) {
  const nameOf = (user: { name: string; displayUsername?: string | null }) =>
    user.displayUsername ?? user.name;

  return {
    appName: 'Spinema',
    basePath: '/api/auth',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [...env.CORS_ORIGINS, ...APP_SCHEMES],
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await mailer.send({
          to: user.email,
          ...templates.resetPasswordEmail({ username: nameOf(user), url }),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 24 * 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        await mailer.send({
          to: user.email,
          ...templates.verificationEmail({ username: nameOf(user), url }),
        });
      },
    },
    user: {
      additionalFields: {
        // Only ever returned to its owner (session); never exposed to other users.
        birthDate: { type: 'string', required: true, input: true },
      },
      deleteUser: {
        enabled: true,
        afterDelete: async (user) => {
          await mailer.send({
            to: user.email,
            ...templates.accountDeletedEmail({ username: nameOf(user) }),
          });
        },
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 20,
        usernameValidator: (value) => usernameSchema.safeParse(value).success,
      }),
      ...(env.PWNED_PASSWORD_CHECK
        ? [
            haveIBeenPwned({
              customPasswordCompromisedMessage:
                'Ce mot de passe a déjà fuité sur Internet. Choisis-en un autre.',
            }),
          ]
        : []),
      expo(),
    ],
    hooks: {
      // Deleting the account always asks for the password, even with a fresh session.
      before: createAuthMiddleware(async (ctx) => {
        // The pseudo is optional in the username plugin, but required by Spinema.
        if (ctx.path === '/sign-up/email' && !ctx.body?.username) {
          throw badRequest('USERNAME_REQUIRED', 'Choisis un pseudo.');
        }
        if (ctx.path === '/delete-user' && !ctx.body?.password) {
          throw badRequest(
            'PASSWORD_REQUIRED',
            'Entre ton mot de passe pour supprimer ton compte.',
          );
        }
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const birthDate = (user as { birthDate?: unknown }).birthDate;
            const parsed = birthDateSchema.safeParse(birthDate);
            if (!parsed.success)
              throw badRequest('INVALID_BIRTH_DATE', 'Date de naissance invalide.');
            if (!isOldEnough(parsed.data, new Date())) {
              throw badRequest(
                'AGE_TOO_YOUNG',
                `Il faut avoir au moins ${MINIMUM_AGE} ans pour créer un compte.`,
              );
            }
            return { data: user };
          },
          after: async (user) => {
            await db
              .insert(schema.space)
              .values({ kind: 'personal', name: 'Mon espace', ownerId: user.id });
          },
        },
      },
    },
    rateLimit: {
      enabled: rateLimit,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-in/username': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
        '/request-password-reset': { window: 300, max: 3 },
        '/reset-password': { window: 60, max: 5 },
        '/delete-user': { window: 60, max: 3 },
      },
    },
    advanced: {
      ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
    },
  } satisfies BetterAuthOptions;
}

export function createAuth(deps: AuthDeps) {
  return betterAuth(authOptions(deps));
}

export type Auth = ReturnType<typeof createAuth>;
