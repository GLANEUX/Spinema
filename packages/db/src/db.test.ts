import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { sql } from 'drizzle-orm';
import { createDb, type Database } from './index';

// Runs against a real PostgreSQL in Docker (same image as docker-compose.yml).
let container: StartedPostgreSqlContainer;
let database: Database;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();
  database = createDb(container.getConnectionUri());
}, 120_000);

afterAll(async () => {
  await database?.close();
  await container?.stop();
});

describe('database', () => {
  it('applies the migrations, twice without error', async () => {
    await database.migrate();
    await database.migrate();
    const rows = await database.db.execute(
      sql`select extname from pg_extension where extname = 'citext'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('answers the healthcheck ping', async () => {
    expect(await database.ping()).toBe(true);
  });

  it('reports a database that is down', async () => {
    const broken = createDb('postgres://nobody:nothing@127.0.0.1:1/none');
    expect(await broken.ping()).toBe(false);
    await broken.close();
  }, 20_000);
});
