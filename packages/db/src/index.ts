import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

export { schema };

/** Folder holding the SQL migrations, resolved next to this package. */
export const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

export function createDb(url: string) {
  const client = postgres(url, { max: 10, connect_timeout: 5 });
  const db = drizzle(client, { schema });
  return {
    db,
    /** Runs pending migrations; called by the API at startup. */
    migrate: (folder = migrationsFolder) => migrate(db, { migrationsFolder: folder }),
    /** True when the database answers. */
    ping: async () => {
      try {
        await db.execute(sql`select 1`);
        return true;
      } catch {
        return false;
      }
    },
    close: () => client.end({ timeout: 5 }),
  };
}

export type Database = ReturnType<typeof createDb>;
