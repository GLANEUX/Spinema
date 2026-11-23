import Fastify, { type FastifyError, type FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketServer } from 'socket.io';
import type { Health } from '@spinema/shared';
import type { Env } from './env';
import { LIMITS, createMessageLimiter } from './limits';

export const VERSION = '0.1.0';

export interface ServerDeps {
  env: Pick<Env, 'CORS_ORIGINS' | 'LOG_LEVEL' | 'NODE_ENV' | 'TRUST_PROXY'>;
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
  const app = Fastify({
    logger: loggerOptions(env),
    bodyLimit: LIMITS.bodyBytes,
    // Trust the X-Forwarded-For entries added by the TRUST_PROXY proxies closest to the API.
    trustProxy: (_address: string, hop: number) => hop < env.TRUST_PROXY,
  });

  await app.register(helmet, {
    // JSON only: an API response may load nothing, run nothing, be framed nowhere.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // HSTS comes from the server's Nginx, which does HTTPS: sending it twice is pointless.
    strictTransportSecurity: false,
  });
  await app.register(cors, { origin: env.CORS_ORIGINS });
  await app.register(rateLimit, {
    max: LIMITS.requestsPerMinute,
    timeWindow: '1 minute',
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: `Trop de requêtes. Réessaie dans ${Math.ceil(context.ttl / 1000)} secondes.`,
    }),
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);
    const status = error.statusCode ?? 500;
    void reply.status(status).send({
      code: error.code ?? 'INTERNAL_ERROR',
      message: status < 500 ? error.message : 'Une erreur est survenue.',
    });
  });

  // Called every 30 s by the Docker healthcheck: only log it when something goes wrong.
  app.get(
    '/health',
    { logLevel: 'warn', config: { rateLimit: false } },
    async (_request, reply) => {
      const up = await pingDb();
      const body: Health = {
        status: up ? 'ok' : 'degraded',
        version: VERSION,
        database: up ? 'up' : 'down',
      };
      return reply.status(up ? 200 : 503).send(body);
    },
  );

  // Real-time channel for live draws (PLAN.md §6). Rooms and events arrive in step 7.
  const io = new SocketServer(app.server, {
    cors: { origin: env.CORS_ORIGINS },
    maxHttpBufferSize: LIMITS.socketMessageBytes,
  });
  io.on('connection', (socket) => {
    // A connection that floods messages is warned, then cut.
    const allow = createMessageLimiter(LIMITS.socketMessages);
    socket.use((_packet, next) => {
      if (allow(Date.now())) return next();
      socket.emit('error', { code: 'TOO_MANY_MESSAGES', message: 'Trop de messages.' });
      socket.disconnect(true);
    });
    socket.emit('hello', { version: VERSION });
  });
  app.addHook('onClose', async () => {
    await io.close();
  });

  return { app, io };
}
