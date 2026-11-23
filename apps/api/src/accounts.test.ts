import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { io as connect } from 'socket.io-client';
import { createDb, eq, schema, type Database } from '@spinema/db';
import { createAuth } from './auth';
import type { MailMessage, MailTemplates } from './mail-contract';
import { buildServer, type ServerDeps } from './server';

// Accounts against a real PostgreSQL in Docker (same image as docker-compose.yml).
let container: StartedPostgreSqlContainer;
let database: Database;
const mails: MailMessage[] = [];

const templates: MailTemplates = {
  verificationEmail: ({ username, url }) => ({
    subject: 'verify',
    text: `${username} ${url}`,
    html: url,
  }),
  resetPasswordEmail: ({ username, url }) => ({
    subject: 'reset',
    text: `${username} ${url}`,
    html: url,
  }),
  accountDeletedEmail: ({ username }) => ({ subject: 'deleted', text: username, html: username }),
};

const env = {
  CORS_ORIGINS: ['http://localhost:8080'],
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
  TRUST_PROXY: 0,
  BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-0',
  BETTER_AUTH_URL: 'http://localhost:3000',
  REQUIRE_EMAIL_VERIFICATION: true,
  PWNED_PASSWORD_CHECK: false,
} as const;

async function server(options: { rateLimit?: boolean; requireVerification?: boolean } = {}) {
  const authEnv = { ...env, CORS_ORIGINS: [...env.CORS_ORIGINS] };
  const auth = createAuth({
    db: database.db,
    env: { ...authEnv, REQUIRE_EMAIL_VERIFICATION: options.requireVerification ?? true },
    mailer: { send: async (message) => void mails.push(message) },
    templates,
    rateLimit: options.rateLimit ?? false,
  });
  const { app } = await buildServer({
    env: authEnv as ServerDeps['env'],
    pingDb: async () => true,
    accounts: { auth, db: database.db },
  });
  return app;
}

type App = Awaited<ReturnType<typeof server>>;
let app: App;
let counter = 0;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();
  database = createDb(container.getConnectionUri());
  await database.migrate();
  app = await server();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await database?.close();
  await container?.stop();
});

const PASSWORD = 'un mot de passe assez long';

function fresh(overrides: Record<string, unknown> = {}) {
  counter += 1;
  return {
    email: `lou${counter}@example.test`,
    password: PASSWORD,
    name: `Lou${counter}`,
    username: `Lou${counter}`,
    birthDate: '2000-05-12',
    ...overrides,
  };
}

const post = (target: App, url: string, payload: unknown, cookie?: string) =>
  target.inject({
    method: 'POST',
    url,
    payload: payload as Record<string, unknown>,
    headers: cookie ? { cookie } : {},
  });

/** The session cookie set by a response, as a `Cookie` header value. */
function cookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
  return list.map((c) => String(c).split(';')[0]).join('; ');
}

function lastMailTo(email: string) {
  const mail = [...mails].reverse().find((m) => m.to === email);
  if (!mail) throw new Error(`no mail for ${email}`);
  return mail;
}

/** Path + query of the link inside the last mail sent to `email`. */
function linkIn(email: string) {
  const url = new URL(lastMailTo(email).html);
  return `${url.pathname}${url.search}`;
}

/** Signs up, verifies the email and signs in: returns the session cookie. */
async function signedUpUser(overrides: Record<string, unknown> = {}) {
  const user = fresh(overrides);
  expect((await post(app, '/api/auth/sign-up/email', user)).statusCode).toBe(200);
  await app.inject({ method: 'GET', url: linkIn(user.email) });
  const res = await post(app, '/api/auth/sign-in/email', { email: user.email, password: PASSWORD });
  expect(res.statusCode).toBe(200);
  return { ...user, cookie: cookieOf(res) };
}

describe('sign-up', () => {
  it('creates the account and its personal space, and sends the verification email', async () => {
    const user = fresh();
    const res = await post(app, '/api/auth/sign-up/email', user);
    expect(res.statusCode).toBe(200);
    const [row] = await database.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, user.email));
    expect(row).toMatchObject({
      username: user.username.toLowerCase(),
      displayUsername: user.username,
    });
    const spaces = await database.db
      .select()
      .from(schema.space)
      .where(eq(schema.space.ownerId, row!.id));
    expect(spaces).toEqual([expect.objectContaining({ kind: 'personal' })]);
    expect(lastMailTo(user.email).subject).toBe('verify');
  });

  it('refuses people under 15', async () => {
    const res = await post(app, '/api/auth/sign-up/email', fresh({ birthDate: '2020-01-01' }));
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'AGE_TOO_YOUNG' });
  });

  it('refuses an invalid birth date', async () => {
    const res = await post(app, '/api/auth/sign-up/email', fresh({ birthDate: '2001-02-30' }));
    expect(res.json()).toMatchObject({ code: 'INVALID_BIRTH_DATE' });
  });

  it('requires a valid pseudo', async () => {
    const missing = await post(app, '/api/auth/sign-up/email', fresh({ username: undefined }));
    expect(missing.json()).toMatchObject({ code: 'USERNAME_REQUIRED' });
    const bad = await post(app, '/api/auth/sign-up/email', fresh({ username: 'Lou Lou' }));
    expect(bad.statusCode).toBe(400);
    expect(bad.json().code).toMatch(/USERNAME/);
  });

  it('refuses a pseudo already taken, whatever the case', async () => {
    const first = fresh();
    await post(app, '/api/auth/sign-up/email', first);
    const res = await post(
      app,
      '/api/auth/sign-up/email',
      fresh({ username: first.username.toUpperCase() }),
    );
    expect(res.json()).toMatchObject({ code: 'USERNAME_IS_ALREADY_TAKEN' });
  });

  it('refuses passwords under 12 characters', async () => {
    const res = await post(app, '/api/auth/sign-up/email', fresh({ password: 'court' }));
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: 'PASSWORD_TOO_SHORT' });
  });
});

describe('sign-in', () => {
  it('needs a verified email, then works with the link of the email', async () => {
    const user = fresh();
    await post(app, '/api/auth/sign-up/email', user);
    const before = await post(app, '/api/auth/sign-in/email', {
      email: user.email,
      password: PASSWORD,
    });
    expect(before.statusCode).toBe(403);
    expect(before.json()).toMatchObject({ code: 'EMAIL_NOT_VERIFIED' });
    const verified = await app.inject({ method: 'GET', url: linkIn(user.email) });
    expect(verified.statusCode).toBeLessThan(400);
    const after = await post(app, '/api/auth/sign-in/email', {
      email: user.email,
      password: PASSWORD,
    });
    expect(after.statusCode).toBe(200);
  });

  it('signs in with the pseudo too', async () => {
    const user = await signedUpUser();
    const res = await post(app, '/api/auth/sign-in/username', {
      username: user.username,
      password: PASSWORD,
    });
    expect(res.statusCode).toBe(200);
  });

  it('gives the same answer for an unknown email and a wrong password', async () => {
    const user = await signedUpUser();
    const wrong = await post(app, '/api/auth/sign-in/email', {
      email: user.email,
      password: 'pas le bon mot de passe',
    });
    const unknown = await post(app, '/api/auth/sign-in/email', {
      email: 'personne@example.test',
      password: PASSWORD,
    });
    expect(wrong.statusCode).toBe(unknown.statusCode);
    expect(wrong.json()).toEqual(unknown.json());
  });

  it('works without verification when it is not required', async () => {
    const open = await server({ requireVerification: false });
    const user = fresh();
    await post(open, '/api/auth/sign-up/email', user);
    const res = await post(open, '/api/auth/sign-in/email', {
      email: user.email,
      password: PASSWORD,
    });
    expect(res.statusCode).toBe(200);
    await open.close();
  });

  it('limits sign-in attempts per address', async () => {
    const limited = await server({ rateLimit: true });
    const codes: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const res = await post(limited, '/api/auth/sign-in/email', {
        email: 'x@example.test',
        password: PASSWORD,
      });
      codes.push(res.statusCode);
    }
    expect(codes.slice(0, 5).every((code) => code !== 429)).toBe(true);
    expect(codes[5]).toBe(429);
    await limited.close();
  });
});

describe('password reset', () => {
  it('sends a single-use link that changes the password', async () => {
    const user = await signedUpUser();
    const asked = await post(app, '/api/auth/request-password-reset', {
      email: user.email,
      redirectTo: 'spinema://reinitialiser',
    });
    expect(asked.statusCode).toBe(200);
    const link = await app.inject({ method: 'GET', url: linkIn(user.email) });
    const token = new URL(String(link.headers.location)).searchParams.get('token');
    expect(token).toBeTruthy();
    const newPassword = 'un tout nouveau mot de passe';
    expect((await post(app, '/api/auth/reset-password', { newPassword, token })).statusCode).toBe(
      200,
    );
    expect((await post(app, '/api/auth/reset-password', { newPassword, token })).statusCode).toBe(
      400,
    );
    const res = await post(app, '/api/auth/sign-in/email', {
      email: user.email,
      password: newPassword,
    });
    expect(res.statusCode).toBe(200);
  });

  it('answers the same for an unknown email', async () => {
    const res = await post(app, '/api/auth/request-password-reset', {
      email: 'inconnu@example.test',
      redirectTo: 'spinema://reinitialiser',
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('/me', () => {
  it('needs a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('gives the profile with the age, never the birth date', async () => {
    const user = await signedUpUser({ birthDate: '2001-01-01' });
    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie: user.cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toMatchObject({ email: user.email, displayUsername: user.username });
    expect(body.age).toBeGreaterThanOrEqual(25);
    expect(body.personalSpaceId).toEqual(expect.any(String));
    expect(body).not.toHaveProperty('birthDate');
  });
});

describe('blocks', () => {
  it('blocks by exact pseudo, idempotently, and unblocks', async () => {
    const lou = await signedUpUser();
    const lea = await signedUpUser();
    const headers = { cookie: lou.cookie };
    expect((await post(app, '/me/blocks', { username: lea.username }, lou.cookie)).statusCode).toBe(
      204,
    );
    expect((await post(app, '/me/blocks', { username: lea.username }, lou.cookie)).statusCode).toBe(
      204,
    );
    const list = await app.inject({ method: 'GET', url: '/me/blocks', headers });
    expect(list.json()).toEqual({ blocks: [lea.username] });
    const removed = await app.inject({
      method: 'DELETE',
      url: `/me/blocks/${lea.username}`,
      headers,
    });
    expect(removed.statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: '/me/blocks', headers })).json()).toEqual({
      blocks: [],
    });
  });

  it('refuses unknown pseudos, invalid ones and yourself', async () => {
    const lou = await signedUpUser();
    expect(
      (await post(app, '/me/blocks', { username: 'personne_ici' }, lou.cookie)).json(),
    ).toMatchObject({
      code: 'USER_NOT_FOUND',
    });
    expect((await post(app, '/me/blocks', { username: 'a b' }, lou.cookie)).json()).toMatchObject({
      code: 'INVALID_USERNAME',
    });
    expect(
      (await post(app, '/me/blocks', { username: lou.username }, lou.cookie)).json(),
    ).toMatchObject({
      code: 'CANNOT_BLOCK_SELF',
    });
    const bad = await app.inject({
      method: 'DELETE',
      url: '/me/blocks/a%20b',
      headers: { cookie: lou.cookie },
    });
    expect(bad.statusCode).toBe(400);
    const unknown = await app.inject({
      method: 'DELETE',
      url: '/me/blocks/personne_ici',
      headers: { cookie: lou.cookie },
    });
    expect(unknown.statusCode).toBe(204);
  });

  it('needs a session', async () => {
    expect((await app.inject({ method: 'GET', url: '/me/blocks' })).statusCode).toBe(401);
    expect((await post(app, '/me/blocks', { username: 'abc' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'DELETE', url: '/me/blocks/abc' })).statusCode).toBe(401);
  });
});

describe('account deletion', () => {
  it('asks for the password', async () => {
    const user = await signedUpUser();
    const res = await post(app, '/api/auth/delete-user', {}, user.cookie);
    expect(res.json()).toMatchObject({ code: 'PASSWORD_REQUIRED' });
  });

  it('deletes everything: account, personal space, blocks both ways, and sends an email', async () => {
    const lou = await signedUpUser();
    const lea = await signedUpUser();
    await post(app, '/me/blocks', { username: lea.username }, lou.cookie);
    await post(app, '/me/blocks', { username: lou.username }, lea.cookie);
    const res = await post(app, '/api/auth/delete-user', { password: PASSWORD }, lou.cookie);
    expect(res.statusCode).toBe(200);
    expect(
      await database.db.select().from(schema.user).where(eq(schema.user.email, lou.email)),
    ).toEqual([]);
    const [leaRow] = await database.db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, lea.email));
    expect(
      await database.db.select().from(schema.block).where(eq(schema.block.blockedId, leaRow!.id)),
    ).toEqual([]);
    expect(
      await database.db.select().from(schema.block).where(eq(schema.block.blockerId, leaRow!.id)),
    ).toEqual([]);
    expect(lastMailTo(lou.email).subject).toBe('deleted');
    expect(
      (await app.inject({ method: 'GET', url: '/me', headers: { cookie: lou.cookie } })).statusCode,
    ).toBe(401);
  });
});

describe('socket', () => {
  async function url() {
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    return `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  }

  it('refuses a connection without session, accepts one with a session', async () => {
    const base = await url();
    const anonymous = connect(base, { transports: ['websocket'], reconnection: false });
    const refused = await new Promise<Error>((resolve) => anonymous.once('connect_error', resolve));
    expect(refused.message).toBe('UNAUTHORIZED');
    anonymous.close();

    const user = await signedUpUser();
    const client = connect(base, {
      transports: ['websocket'],
      reconnection: false,
      extraHeaders: { cookie: user.cookie },
    });
    const hello = await new Promise<unknown>((resolve) => client.once('hello', resolve));
    expect(hello).toHaveProperty('version');
    client.close();
  });
});
