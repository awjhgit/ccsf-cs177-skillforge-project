import { backup, DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApi } from '../routes/api.mjs';
import { openDatabase } from '../config/database.mjs';
import { databaseUrl, sqlitePath } from '../config/environment.mjs';

const sourcePath = process.argv[2] ?? sqlitePath;

const tables = {
  users: ['id', 'name', 'email', 'department', 'role', 'status', 'salt', 'password_hash'],
  profiles: ['user_id', 'details'],
  skills: ['id', 'key'],
  profile_skills: ['user_id', 'skill_id', 'label', 'position'],
  recognition: ['id', 'user_id', 'title', 'description', 'awarded_at'],
};

async function migrate() {
  if (!databaseUrl) throw new Error('Set DATABASE_URL to your PostgreSQL connection string.');
  const temporary = await mkdtemp(join(tmpdir(), 'skillforge-migration-'));
  const snapshot = join(temporary, 'source.sqlite');
  try {
    const source = new DatabaseSync(sourcePath, { readOnly: true });
    try {
      if (!source.prepare('SELECT 1 FROM users LIMIT 1').get()) throw new Error('The SQLite source has no accounts.');
      await backup(source, snapshot);
    } finally {
      source.close();
    }

    const sqliteApi = createApi(snapshot);
    try { await sqliteApi.ready; } finally { await sqliteApi.close(); }

    const sqlite = new DatabaseSync(snapshot, { readOnly: true });
    const target = openDatabase(undefined, databaseUrl);
    try {
      await target.initialize(async () => {
        await target.prepare('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE').run();
        if (await target.prepare('SELECT 1 FROM users LIMIT 1').get()) {
          throw new Error('The PostgreSQL destination already has accounts. Use an empty SkillForge database.');
        }
        for (const [table, columns] of Object.entries(tables)) {
          const fields = columns.join(', ');
          const insert = target.prepare(`INSERT INTO ${table} (${fields}) VALUES (${columns.map(() => '?').join(', ')})`);
          for (const row of sqlite.prepare(`SELECT ${fields} FROM ${table}`).iterate()) {
            await insert.run(...columns.map((column) => row[column]));
          }
        }
        for (const table of ['users', 'skills', 'recognition']) {
          await target.prepare(`
            SELECT setval(pg_get_serial_sequence(?, 'id'),
              COALESCE(MAX(id), 1), COUNT(*) > 0)
            FROM ${table}
          `).run(table);
        }
      });
    } finally {
      sqlite.close();
      await target.close();
    }
    console.log('Migration complete. Accounts, profiles, skills, and recognition copied. Sign in again to start a new session.');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

migrate().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
