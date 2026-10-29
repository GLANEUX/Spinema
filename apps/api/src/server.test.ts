import { afterEach, describe, expect, it } from 'vitest';
import { io as connect } from 'socket.io-client';
import { healthSchema } from '@spinema/shared';
import { buildServer, loggerOptions, type ServerDeps } from './server';
import { loadEnv } from './env';

const env: ServerDeps['env'] = {
  CORS_ORIGINS: ['http://localhost:8080'],
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
};
let close: (() => Promise<unknown>) | undefined;
afterEach(async () => {
  await close?.();
  close = undefined;
});

async function start(up: boolean) {
  const { app } = await buildServer({ env, pingDb: async () => up });
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
});
