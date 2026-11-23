import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { z } from 'zod';
import type { Database } from '@spinema/db';
import { and, eq, schema } from '@spinema/db';
import { ageOn, usernameSchema } from '@spinema/shared';
import { CLIENT_IP_HEADER, type Auth } from './auth';

export interface AccountsDeps {
  auth: Auth;
  db: Database['db'];
}

type SessionUser = { id: string };

const fail = (reply: FastifyReply, status: number, code: string, message: string) =>
  reply.status(status).send({ code, message });

/** Headers of a Fastify request as Fetch headers, with the visitor's address for Better Auth. */
export function authHeaders(request: FastifyRequest): Headers {
  const headers = fromNodeHeaders(request.headers);
  headers.delete(CLIENT_IP_HEADER);
  headers.set(CLIENT_IP_HEADER, request.ip);
  return headers;
}

/** Better Auth under /api/auth/*, plus the Spinema account routes (docs/comptes.md). */
export async function registerAccounts(app: FastifyInstance, { auth, db }: AccountsDeps) {
  // Encapsulated scope: Better Auth reads the raw body itself (empty bodies included).
  await app.register(async (scope) => {
    scope.removeContentTypeParser('application/json');
    scope.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) =>
      done(null, body),
    );
    scope.route({
      method: ['GET', 'POST'],
      url: '/api/auth/*',
      handler: async (request, reply) => {
        const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
        const body =
          typeof request.body === 'string' && request.body.length > 0 ? request.body : undefined;
        const response = await auth.handler(
          new Request(url, { method: request.method, headers: authHeaders(request), body }),
        );
        reply.status(response.status);
        response.headers.forEach((value, key) => {
          if (key !== 'set-cookie') void reply.header(key, value);
        });
        const cookies = response.headers.getSetCookie();
        if (cookies.length > 0) void reply.header('set-cookie', cookies);
        return reply.send(await response.text());
      },
    });
  });

  /** The signed-in user, or a 401 already sent. */
  async function signedIn(request: FastifyRequest, reply: FastifyReply) {
    const session = await auth.api.getSession({ headers: authHeaders(request) });
    if (!session) {
      await fail(reply, 401, 'UNAUTHORIZED', 'Connecte-toi pour continuer.');
      return undefined;
    }
    return session.user as SessionUser;
  }

  async function findByUsername(username: string) {
    const [found] = await db
      .select({ id: schema.user.id, displayUsername: schema.user.displayUsername })
      .from(schema.user)
      .where(eq(schema.user.username, username.toLowerCase()));
    return found;
  }

  app.get('/me', async (request, reply) => {
    const user = await signedIn(request, reply);
    if (!user) return reply;
    const [row] = await db
      .select({
        id: schema.user.id,
        email: schema.user.email,
        username: schema.user.username,
        displayUsername: schema.user.displayUsername,
        birthDate: schema.user.birthDate,
        personalSpaceId: schema.space.id,
      })
      .from(schema.user)
      .leftJoin(
        schema.space,
        and(eq(schema.space.ownerId, schema.user.id), eq(schema.space.kind, 'personal')),
      )
      .where(eq(schema.user.id, user.id));
    if (!row) return fail(reply, 401, 'UNAUTHORIZED', 'Connecte-toi pour continuer.');
    const { birthDate, ...profile } = row;
    // The birth date stays private: only the age leaves the server.
    return { ...profile, age: ageOn(birthDate, new Date()) };
  });

  app.get('/me/blocks', async (request, reply) => {
    const user = await signedIn(request, reply);
    if (!user) return reply;
    const rows = await db
      .select({ username: schema.user.displayUsername })
      .from(schema.block)
      .innerJoin(schema.user, eq(schema.user.id, schema.block.blockedId))
      .where(eq(schema.block.blockerId, user.id));
    return { blocks: rows.map((row) => row.username) };
  });

  const blockBody = z.object({ username: usernameSchema });

  app.post('/me/blocks', async (request, reply) => {
    const user = await signedIn(request, reply);
    if (!user) return reply;
    const parsed = blockBody.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'INVALID_USERNAME', 'Pseudo invalide.');
    const target = await findByUsername(parsed.data.username);
    if (!target) return fail(reply, 404, 'USER_NOT_FOUND', 'Aucun compte avec ce pseudo.');
    if (target.id === user.id)
      return fail(reply, 400, 'CANNOT_BLOCK_SELF', 'Tu ne peux pas te bloquer toi-même.');
    await db
      .insert(schema.block)
      .values({ blockerId: user.id, blockedId: target.id })
      .onConflictDoNothing();
    return reply.status(204).send();
  });

  app.delete('/me/blocks/:username', async (request, reply) => {
    const user = await signedIn(request, reply);
    if (!user) return reply;
    const parsed = usernameSchema.safeParse((request.params as { username: string }).username);
    if (!parsed.success) return fail(reply, 400, 'INVALID_USERNAME', 'Pseudo invalide.');
    const target = await findByUsername(parsed.data);
    if (target) {
      await db
        .delete(schema.block)
        .where(and(eq(schema.block.blockerId, user.id), eq(schema.block.blockedId, target.id)));
    }
    return reply.status(204).send();
  });
}
