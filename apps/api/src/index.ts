import { createDb } from '@spinema/db';
import { createAuth } from './auth';
import { loadEnv } from './env';
import { createMailer, templates } from './mail';
import { buildServer } from './server';

const env = loadEnv();
const database = createDb(env.DATABASE_URL);
await database.migrate(process.env.MIGRATIONS_FOLDER);

// Emails are only sent once the server runs, so its logger is ready by then.
const mailLog = { info: (obj: object, msg: string) => app.log.info(obj, msg) };
const auth = createAuth({
  db: database.db,
  env,
  mailer: createMailer(env, mailLog),
  templates,
});
const { app } = await buildServer({
  env,
  pingDb: database.ping,
  accounts: { auth, db: database.db },
});
app.addHook('onClose', () => database.close());

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info(`${signal} received, shutting down`);
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ port: env.API_PORT, host: env.API_HOST });
