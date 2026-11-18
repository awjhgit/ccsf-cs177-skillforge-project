import { fork, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { port } from '../server/config/environment.mjs';

const command = process.argv[2];
const client = new URL('../client/', import.meta.url);
const require = createRequire(new URL('package.json', client));
const vite = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const server = fork(fileURLToPath(new URL('../server/server.js', import.meta.url)), {
  env: { ...process.env, PORT: String(port) },
});
const children = [server];

let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }
}

function watch(child) {
  child.once('exit', (code) => {
    if (!stopping) process.exitCode = code ?? 1;
    stop('SIGTERM');
  });
  child.once('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
    stop('SIGTERM');
  });
}
watch(server);
server.once('message', (message) => {
  if (message !== 'ready' || stopping) return;
  const frontend = spawn(process.execPath, [vite, command, ...process.argv.slice(3)], {
    cwd: client,
    env: { ...process.env, SKILLFORGE_API_PORT: String(port) },
    stdio: 'inherit',
  });
  children.push(frontend);
  watch(frontend);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => stop(signal));
