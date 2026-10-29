import { createDb } from '@spinema/db';
import { loadEnv } from './env';
import { buildServer } from './server';

const env = loadEnv();
const database = createDb(env.DATABASE_URL);
await database.migrate(process.env.MIGRATIONS_FOLDER);

const { app } = await buildServer({ env, pingDb: database.ping });
app.addHook('onClose', () => database.close());

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info(`${signal} received, shutting down`);
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ port: env.API_PORT, host: env.API_HOST });
