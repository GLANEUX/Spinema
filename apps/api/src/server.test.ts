import { afterEach, describe, expect, it } from 'vitest';
import { io as connect } from 'socket.io-client';
import { healthSchema } from '@spinema/shared';
import { buildServer, loggerOptions, type ServerDeps } from './server';
import { LIMITS, createMessageLimiter } from './limits';
import { DEV_AUTH_SECRET, loadEnv } from './env';

const env: ServerDeps['env'] = {
  CORS_ORIGINS: ['http://localhost:8080'],
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
  TRUST_PROXY: 0,
};
let close: (() => Promise<unknown>) | undefined;
afterEach(async () => {
  await close?.();
  close = undefined;
});

async function start(up: boolean, overrides: Partial<ServerDeps['env']> = {}) {
  const { app } = await buildServer({ env: { ...env, ...overrides }, pingDb: async () => up });
  close = () => app.close();
  return app;
}

describe('GET /health', () => {
  it('answers ok when the database is up', async () => {
    const app = await start(true);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(healthSchema.parse(res.json())).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('answers 503 when the database is down', async () => {
    const app = await start(false);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'degraded', database: 'down' });
  });
});

describe('errors', () => {
  it('hides internal details and keeps client errors readable', async () => {
    const app = await start(true);
    app.get('/boom', async () => {
      throw new Error('secret stack');
    });
    app.get('/bad', async () => {
      throw Object.assign(new Error('Requête invalide'), { statusCode: 400, code: 'BAD_INPUT' });
    });
    const boom = await app.inject({ method: 'GET', url: '/boom' });
    expect(boom.statusCode).toBe(500);
    expect(boom.json()).toEqual({ code: 'INTERNAL_ERROR', message: 'Une erreur est survenue.' });
    const bad = await app.inject({ method: 'GET', url: '/bad' });
    expect(bad.json()).toEqual({ code: 'BAD_INPUT', message: 'Requête invalide' });
  });
});

describe('socket', () => {
  it('greets a connecting client', async () => {
    const app = await start(true);
    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const client = connect(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
    const hello = await new Promise<unknown>((resolve) => client.once('hello', resolve));
    client.close();
    expect(hello).toHaveProperty('version');
  });
});

describe('logger', () => {
  it('is silent in tests, pretty in development, plain in production', () => {
    expect(loggerOptions(env)).toBe(false);
    expect(loggerOptions({ ...env, NODE_ENV: 'development' })).toMatchObject({
      transport: { target: 'pino-pretty' },
    });
    expect(loggerOptions({ ...env, NODE_ENV: 'production' })).toEqual({ level: 'info' });
  });
});

describe('env', () => {
  it('parses defaults and splits CORS origins', () => {
    const parsed = loadEnv({
      DATABASE_URL: 'postgres://u:p@db:5432/x',
      CORS_ORIGINS: 'https://a.fr, https://b.fr',
    });
    expect(parsed).toMatchObject({
      API_PORT: 3000,
      CORS_ORIGINS: ['https://a.fr', 'https://b.fr'],
    });
  });
  it('explains what is missing', () => {
    expect(() => loadEnv({})).toThrow(/DATABASE_URL/);
  });
  it('uses a development secret outside production, requires a real one in production', () => {
    const base = { DATABASE_URL: 'postgres://u:p@db:5432/x' };
    expect(loadEnv(base)).toMatchObject({
      BETTER_AUTH_SECRET: DEV_AUTH_SECRET,
      REQUIRE_EMAIL_VERIFICATION: true,
      PWNED_PASSWORD_CHECK: true,
    });
    expect(() => loadEnv({ ...base, NODE_ENV: 'production' })).toThrow(/BETTER_AUTH_SECRET/);
    const secret = 's'.repeat(32);
    expect(
      loadEnv({
        ...base,
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: secret,
        REQUIRE_EMAIL_VERIFICATION: 'false',
      }),
    ).toMatchObject({ BETTER_AUTH_SECRET: secret, REQUIRE_EMAIL_VERIFICATION: false });
  });
});

async function listen(app: Awaited<ReturnType<typeof start>>) {
  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  return `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
}

describe('security headers', () => {
  it('forbids loading or framing API responses and sniffing their type', async () => {
    const app = await start(true);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['content-security-policy']).toBe(
      "default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none'",
    );
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    // Added once, by the server's Nginx.
    expect(res.headers['strict-transport-security']).toBeUndefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('limits', () => {
  it('refuses request bodies over 64 KiB', async () => {
    const app = await start(true);
    app.post('/echo', async () => ({ ok: true }));
    const small = await app.inject({ method: 'POST', url: '/echo', payload: { a: 'x' } });
    expect(small.statusCode).toBe(200);
    const big = await app.inject({
      method: 'POST',
      url: '/echo',
      payload: { a: 'x'.repeat(LIMITS.bodyBytes) },
    });
    expect(big.statusCode).toBe(413);
  });

  it('limits requests per address, in French, but never /health', async () => {
    const app = await start(true);
    app.get('/ping', async () => ({ ok: true }));
    for (let i = 0; i < LIMITS.requestsPerMinute; i += 1) {
      expect((await app.inject({ method: 'GET', url: '/ping' })).statusCode).toBe(200);
    }
    const refused = await app.inject({ method: 'GET', url: '/ping' });
    expect(refused.statusCode).toBe(429);
    expect(refused.json()).toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(refused.json().message).toMatch(/Trop de requêtes/);
    expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200);
  });

  it('counts each visitor separately behind the trusted proxy', async () => {
    const app = await start(true, { TRUST_PROXY: 1 });
    app.get('/ip', async (request) => ({ ip: request.ip }));
    const res = await app.inject({
      method: 'GET',
      url: '/ip',
      headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.7' },
    });
    expect(res.json()).toEqual({ ip: '203.0.113.7' });
  });

  it('ignores X-Forwarded-For when no proxy is trusted', async () => {
    const app = await start(true);
    app.get('/ip', async (request) => ({ ip: request.ip }));
    const res = await app.inject({
      method: 'GET',
      url: '/ip',
      headers: { 'x-forwarded-for': '203.0.113.7' },
    });
    expect(res.json().ip).not.toBe('203.0.113.7');
  });
});

describe('message limiter', () => {
  it('allows max messages per window, then refuses until the window slides', () => {
    const allow = createMessageLimiter({ max: 3, windowMs: 1000 });
    expect([allow(0), allow(10), allow(20), allow(30)]).toEqual([true, true, true, false]);
    expect(allow(1000)).toBe(true);
    expect(allow(1001)).toBe(false);
    expect(allow(1011)).toBe(true);
  });
});

describe('socket limits', () => {
  it('cuts a connection that floods messages', async () => {
    const app = await start(true);
    const client = connect(await listen(app), { transports: ['websocket'] });
    await new Promise((resolve) => client.once('hello', resolve));
    const refused = new Promise<unknown>((resolve) => client.once('error', resolve));
    const cut = new Promise((resolve) => client.once('disconnect', resolve));
    for (let i = 0; i <= LIMITS.socketMessages.max; i += 1) client.emit('ping', i);
    expect(await refused).toMatchObject({ code: 'TOO_MANY_MESSAGES' });
    await cut;
    client.close();
  });

  it('cuts a connection that sends a message over 64 KiB', async () => {
    const app = await start(true);
    const client = connect(await listen(app), { transports: ['websocket'], reconnection: false });
    await new Promise((resolve) => client.once('hello', resolve));
    const cut = new Promise((resolve) => client.once('disconnect', resolve));
    client.emit('big', 'x'.repeat(LIMITS.socketMessageBytes + 1));
    await cut;
    client.close();
  });
});
