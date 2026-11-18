import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApi } from '../server/routes/api.mjs';

function client(api) {
  let cookie = '';
  return async (path, method = 'GET', body, origin = 'http://localhost') => {
    const response = await api.handle(new Request(`http://localhost/api${path}`, {
      method, headers: { cookie, origin, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }));
    if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return { status: response.status, body: await response.json(), headers: response.headers };
  };
}
const login = (request, email = 'alex@skillforge.demo', password = 'demo123') => request('/login', 'POST', { email, password });

test('login, restored session, logout and server authorization', async () => {
  const api = createApi(':memory:');
  try {
    const request = client(api);
    assert.equal((await request('/users')).status, 401);
    assert.equal((await login(request, undefined, 'wrong')).status, 401);
    assert.equal((await login(request, 'sarah@skillforge.demo')).status, 200);
    assert.equal((await request('/users')).status, 403);
    assert.equal((await login(request, 'maria@skillforge.demo')).status, 401);
    assert.equal((await request('/login', 'POST', null)).status, 400);
    const result = await login(request, ' ALEX@skillforge.demo ');
    assert.equal(result.status, 200);
    assert.match(result.headers.get('set-cookie'), /HttpOnly/);
    assert.match(result.headers.get('set-cookie'), /SameSite=Strict/);
    assert.equal(result.body.user.password_hash, undefined);
    assert.equal((await request('/session')).body.user.role, 'Admin');
    assert.equal((await request('/users')).body.users.length, 4);
    assert.equal((await request('/users/1/status', 'PATCH', { status: 'Inactive' })).status, 403);
    assert.equal((await request('/users/2/status', 'PATCH', { status: 'bad' })).status, 400);
    assert.equal((await request('/users/999/status', 'PATCH', { status: 'Inactive' })).status, 404);
    assert.equal((await request('/logout', 'POST')).status, 200);
    assert.equal((await request('/session')).body.user, null);
    assert.equal((await request('/users')).status, 401);
  } finally { api.close(); }
});

test('account status and session persist across database reopen; reactivation works', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'skillforge-test-'));
  const path = join(directory, 'test.sqlite');
  let api = createApi(path);
  try {
    const request = client(api);
    await login(request);
    const result = await request('/users/2/status', 'PATCH', { status: 'Inactive' });
    assert.equal(result.body.users.find((user) => user.id === 2).status, 'Inactive');
    const sessionCookie = (await login(request)).headers.get('set-cookie').split(';')[0];
    api.close();
    const legacy = new DatabaseSync(path);
    legacy.prepare('INSERT INTO profiles (user_id, details) VALUES (?, ?)').run(1, JSON.stringify({
      title: 'Engineer', description: 'Builds tools.', years: 3, skills: ['Python', 'AWS'], certifications: [],
    }));
    legacy.close();
    api = createApi(path);
    const restored = await api.handle(new Request('http://localhost/api/session', { headers: { cookie: sessionCookie } }));
    assert.equal((await restored.json()).user.id, 1);
    const directoryResponse = await api.handle(new Request('http://localhost/api/profiles', { headers: { cookie: sessionCookie } }));
    const { profiles } = await directoryResponse.json();
    assert.equal(profiles.filter(({ id }) => id < 0).length, 8);
    assert.deepEqual(profiles.find(({ id }) => id === 1).skills, ['Python', 'AWS']);
    const next = client(api);
    await login(next);
    assert.equal((await next('/users')).body.users.find((user) => user.id === 2).status, 'Inactive');
    assert.equal((await next('/users/2/status', 'PATCH', { status: 'Active' })).body.users.find((user) => user.id === 2).status, 'Active');
  } finally { api.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('cross-origin writes are rejected and sessions expire', async () => {
  let now = Date.now();
  const api = createApi(':memory:', { now: () => now });
  try {
    const request = client(api);
    assert.equal((await request('/login', 'POST', { email: 'alex@skillforge.demo', password: 'demo123' }, 'http://evil.example')).status, 403);
    await login(request);
    assert.equal((await request('/logout', 'POST', undefined, 'http://evil.example')).status, 403);
    now += 8 * 60 * 60 * 1000;
    assert.equal((await request('/session')).body.user, null);
    assert.equal((await request('/users')).status, 401);
  } finally { api.close(); }
});

test('repeated invalid passwords are rate limited', async () => {
  let now = Date.now();
  const api = createApi(':memory:', { now: () => now });
  try {
    const request = client(api);
    for (let i = 0; i < 5; i++) assert.equal((await login(request, undefined, 'wrong')).status, 401);
    assert.equal((await login(request)).status, 429);
    now += 15 * 60 * 1000;
    assert.equal((await login(request)).status, 200);
  } finally { api.close(); }
});

test('registration creates an employee who can sign in and save a profile', async () => {
  const api = createApi(':memory:');
  try {
    const employee = client(api);
    const account = {
      name: ' Sam Rivera ', email: ' Sam@example.com ', department: ' Product ',
      password: 'a long example passphrase', role: 'Admin',
    };
    assert.equal((await employee('/register', 'POST', account, 'http://other.example')).status, 403);
    assert.equal((await employee('/register', 'POST', { ...account, password: 'short' })).status, 400);
    assert.equal((await employee('/register', 'POST', account)).status, 201);
    assert.equal((await employee('/register', 'POST', { ...account, email: 'sam@example.com' })).status, 409);
    assert.equal((await login(employee, 'sam@example.com', 'wrong')).status, 401);
    const { status, body } = await login(employee, 'sam@example.com', account.password);
    assert.equal(status, 200);
    assert.equal(body.user.role, 'Employee');
    assert.equal(body.user.name, 'Sam Rivera');
    assert.equal((await employee('/users')).status, 403);
    assert.equal((await employee('/users/2/status', 'PATCH', { status: 'Inactive' })).status, 403);
    const profile = { title: 'Designer', description: 'Designs internal tools.', years: 3, skills: ['Prototyping'], certifications: [] };
    assert.equal((await employee('/profile', 'PUT', profile)).status, 200);
    assert.equal((await employee('/profiles')).body.profiles.find((entry) => entry.id === body.user.id).name, 'Sam Rivera');

    const links = [{ label: 'Portfolio', url: 'https://github.com/example/work' }];
    assert.deepEqual((await employee('/profile')).body.profile.links, []);
    assert.equal((await employee('/profile', 'PUT', { ...profile, links })).status, 200);
    assert.equal((await employee('/profile', 'PUT', {
      ...profile, links: [{ label: 'Unsafe', url: 'javascript:alert(1)' }],
    })).status, 400);
    for (const url of ['https://github.com.example.com/work', 'https://example.com/work', 'http://github.com/work', 'https://github.com:8443/work']) {
      assert.equal((await employee('/profile', 'PUT', { ...profile, links: [{ label: 'Portfolio', url }] })).status, 400);
    }
    assert.equal((await employee('/profile', 'PUT', profile)).status, 200);
    assert.deepEqual((await employee('/profile')).body.profile.links, links);
    assert.deepEqual((await employee('/profiles')).body.profiles.find((entry) => entry.id === body.user.id).links, links);
    assert.equal((await employee('/profile', 'PUT', { ...profile, links: [] })).status, 200);
    assert.deepEqual((await employee('/profile')).body.profile.links, []);

    const admin = client(api);
    await login(admin);
    await admin(`/users/${body.user.id}/status`, 'PATCH', { status: 'Inactive' });
    assert.equal((await employee('/session')).body.user, null);
    assert.equal((await login(employee, 'sam@example.com', account.password)).status, 401);
  } finally { api.close(); }
});
