import express from 'express';
import { createApi } from './routes/api.mjs';
import { apiMiddleware } from './middleware/api.mjs';
import { databaseUrl, port, sqlitePath } from './config/environment.mjs';

const api = createApi(sqlitePath, { databaseUrl });
try {
  await api.ready;
} catch (error) {
  await api.close();
  throw error;
}

const app = express();
app.disable('x-powered-by');
app.use(apiMiddleware(api.handle));
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`SkillForge API listening on http://127.0.0.1:${port}`);
  process.send?.('ready');
});
server.once('error', async (error) => {
  console.error(error.message);
  await api.close();
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => { void api.close(); }));
}
