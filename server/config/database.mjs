import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';

const sqliteSchema = readFileSync(new URL('../models/schema.sql', import.meta.url), 'utf8');
const postgresSchema = readFileSync(new URL('../models/postgres.sql', import.meta.url), 'utf8');

export function openDatabase(path, databaseUrl) {
  const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl }) : null;
  if (!pool && path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const sqlite = pool ? null : new DatabaseSync(path);
  sqlite?.exec('PRAGMA foreign_keys = ON');
  pool?.on('error', () => console.error('An idle PostgreSQL connection closed unexpectedly.'));
  const scope = new AsyncLocalStorage();
  let pending = Promise.resolve();

  async function execute(sql) {
    if (sqlite) sqlite.exec(sql);
    else await (scope.getStore() ?? pool).query(sql);
  }

  async function transaction(work) {
    const client = pool ? await pool.connect() : null;
    try {
      return await scope.run(client, async () => {
        await execute(sqlite ? 'BEGIN IMMEDIATE' : 'BEGIN');
        try {
          const result = await work();
          await execute('COMMIT');
          return result;
        } catch (error) {
          await execute('ROLLBACK');
          throw error;
        }
      });
    } finally {
      client?.release();
    }
  }

  return {
    initialize: (seed) => transaction(async () => {
      if (pool) await execute('SELECT pg_advisory_xact_lock(862411)');
      await execute(pool ? postgresSchema : sqliteSchema);
      await seed();
    }),
    prepare(sql) {
      if (sqlite) {
        // Statements may be defined while the schema is initializing.
        return {
          get: (...args) => sqlite.prepare(sql).get(...args),
          all: (...args) => sqlite.prepare(sql).all(...args),
          run: (...args) => sqlite.prepare(sql).run(...args),
        };
      }
      let parameter = 0;
      const statement = sql.replace(/\?/g, () => `$${++parameter}`);
      const query = (args) => (scope.getStore() ?? pool).query(statement, args);
      return {
        get: async (...args) => (await query(args)).rows[0],
        all: async (...args) => (await query(args)).rows,
        run: async (...args) => ({ changes: (await query(args)).rowCount }),
      };
    },
    request(work) {
      if (pool) return work();
      const result = pending.then(work);
      pending = result.catch(() => {});
      return result;
    },
    transaction,
    close: () => sqlite ? sqlite.close() : pool.end(),
  };
}
