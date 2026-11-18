import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

function readEnv(relativePath) {
  const file = new URL(relativePath, import.meta.url);
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')) : {};
}

const settings = {
  ...readEnv('../../.env.local'),
  ...readEnv('../.env'),
  ...readEnv('../.env.local'),
  ...process.env,
};

const legacyDatabase = new URL('../../data/skillforge.sqlite', import.meta.url);
const serverDatabase = new URL('../database/skillforge.sqlite', import.meta.url);
const defaultDatabase = existsSync(legacyDatabase) && !existsSync(serverDatabase) ? legacyDatabase : serverDatabase;
export const sqlitePath = settings.SQLITE_PATH ? resolve(settings.SQLITE_PATH) : fileURLToPath(defaultDatabase);
export const databaseUrl = settings.DATABASE_URL;
export const port = Number(settings.PORT ?? 3001);
