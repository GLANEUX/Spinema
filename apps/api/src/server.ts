import Fastify, { type FastifyError, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketServer } from 'socket.io';
import type { Health } from '@spinema/shared';
import type { Env } from './env';

export const VERSION = '0.1.0';

export interface ServerDeps {
  env: Pick<Env, 'CORS_ORIGINS' | 'LOG_LEVEL' | 'NODE_ENV'>;
  /** Resolves to true when the database answers. */
  pingDb: () => Promise<boolean>;
}

/** Silent in tests, pretty in development, JSON lines in production. */
export function loggerOptions(env: ServerDeps['env']): FastifyServerOptions['logger'] {
  if (env.NODE_ENV === 'test') return false;
  if (env.NODE_ENV === 'development')
    return { level: env.LOG_LEVEL, transport: { target: 'pino-pretty' } };
  return { level: env.LOG_LEVEL };
}

export async function buildServer({ env, pingDb }: ServerDeps) {
  const app = Fastify({ logger: loggerOptions(env) });

  await app.register(cors, { origin: env.CORS_ORIGINS });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);
    const status = error.statusCode ?? 500;
    void reply.status(status).send({
      code: error.code ?? 'INTERNAL_ERROR',
      message: status < 500 ? error.message : 'Une erreur est survenue.',
    });
  });

  // Called every 30 s by the Docker healthcheck: only log it when something goes wrong.
  app.get('/health', { logLevel: 'warn' }, async (_request, reply) => {
    const up = await pingDb();
    const body: Health = {
      status: up ? 'ok' : 'degraded',
      version: VERSION,
      database: up ? 'up' : 'down',
    };
    return reply.status(up ? 200 : 503).send(body);
  });

  // Real-time channel for live draws (PLAN.md §6). Rooms and events arrive in step 7.
  const io = new SocketServer(app.server, { cors: { origin: env.CORS_ORIGINS } });
  io.on('connection', (socket) => {
    socket.emit('hello', { version: VERSION });
  });
  app.addHook('onClose', async () => {
    await io.close();
  });

  return { app, io };
}
