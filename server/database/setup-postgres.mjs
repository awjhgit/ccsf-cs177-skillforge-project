import { openDatabase } from '../config/database.mjs';
import { databaseUrl } from '../config/environment.mjs';

async function setup() {
  if (!databaseUrl) throw new Error('Set DATABASE_URL in server/.env.local before running setup.');
  const database = openDatabase(undefined, databaseUrl);
  try {
    await database.initialize(async () => {});
    console.log('SkillForge PostgreSQL tables are ready.');
  } finally {
    await database.close();
  }
}

setup().catch((error) => {
  console.error(`PostgreSQL setup failed: ${error.message}`);
  process.exitCode = 1;
});
