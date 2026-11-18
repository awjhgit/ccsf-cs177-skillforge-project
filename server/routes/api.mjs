import { readFileSync } from 'node:fs';
import { openDatabase } from '../config/database.mjs';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const sampleProfiles = JSON.parse(readFileSync(new URL('../database/directory-seed.json', import.meta.url), 'utf8'));
const SESSION_SECONDS = 8 * 60 * 60;
const cookieName = 'skillforge_session';
const seedUsers = [
  [1, 'Alex Morgan', 'alex@skillforge.demo', 'IT', 'Admin', 'Active'],
  [2, 'Sarah Chen', 'sarah@skillforge.demo', 'Engineering', 'Manager', 'Active'],
  [3, 'James Wilson', 'james@skillforge.demo', 'Cloud Operations', 'Employee', 'Active'],
  [4, 'Maria Garcia', 'maria@skillforge.demo', 'Security', 'Employee', 'Inactive'],
];
const digest = (value) => createHash('sha256').update(value).digest('hex');

const trustedReferenceHosts = ['github.com', 'www.github.com', 'linkedin.com', 'www.linkedin.com'];

function parseReferenceUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port ||
        !trustedReferenceHosts.includes(parsed.hostname) || parsed.href.length > 1000) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function parseReferenceLinks(links) {
  if (!Array.isArray(links) || links.length > 10) return null;
  const references = [];
  for (const link of links) {
    const label = typeof link?.label === 'string' ? link.label.trim() : '';
    const url = typeof link?.url === 'string' ? link.url.trim() : '';
    if (!label || label.length > 80 || !url || url.length > 1000) return null;
    const trustedUrl = parseReferenceUrl(url);
    if (!trustedUrl) return null;
    references.push({ label, url: trustedUrl });
  }
  return references;
}

function readProfile(details) {
  const profile = JSON.parse(details);
  return { ...profile, links: (profile.links ?? []).filter(({ url }) => parseReferenceUrl(url)) };
}

export function createApi(databasePath, { now = Date.now, databaseUrl } = {}) {
  const db = openDatabase(databasePath, databaseUrl);
  const ready = db.initialize(async () => {
    if (!databaseUrl && Number((await db.prepare('SELECT COUNT(*) AS count FROM users').get()).count) === 0) {
      const insert = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      for (const user of seedUsers) {
        const salt = randomBytes(16).toString('hex');
        await insert.run(...user, salt, scryptSync('demo123', salt, 64).toString('hex'));
      }
    }
    const seed = db.prepare('INSERT INTO sample_profiles VALUES (?, ?) ON CONFLICT(id) DO NOTHING');
    for (const profile of sampleProfiles) await seed.run(profile.id, JSON.stringify(profile));
    if (databaseUrl) return;
    const legacy = await db.prepare("SELECT user_id, details FROM profiles WHERE json_type(details, '$.skills') = 'array'").all();
    const update = db.prepare('UPDATE profiles SET details = ? WHERE user_id = ?');
    for (const { user_id, details } of legacy) {
      const { skills, ...profile } = JSON.parse(details);
      await replaceProfileSkills(user_id, skills);
      await update.run(JSON.stringify(profile), user_id);
    }
  });
  // Requests and server startup can both observe initialization failures.
  ready.catch(() => {});

  const insertSkill = db.prepare('INSERT INTO skills (key) VALUES (?) ON CONFLICT(key) DO NOTHING');
  const findSkill = db.prepare('SELECT id FROM skills WHERE key = ?');
  const insertProfileSkill = db.prepare('INSERT INTO profile_skills VALUES (?, ?, ?, ?) ON CONFLICT(user_id, skill_id) DO NOTHING');
  const listProfileSkills = db.prepare('SELECT label FROM profile_skills WHERE user_id = ? ORDER BY position');

  async function replaceProfileSkills(userId, skills) {
    await db.prepare('DELETE FROM profile_skills WHERE user_id = ?').run(userId);
    for (const [position, label] of skills.entries()) {
      const key = label.trim().toLowerCase();
      await insertSkill.run(key);
      const { id } = await findSkill.get(key);
      await insertProfileSkill.run(userId, id, label, position);
    }
  }

  async function loadProfile(userId, details) {
    return { ...readProfile(details), skills: (await listProfileSkills.all(userId)).map(({ label }) => label) };
  }

  const publicFields = 'id, name, email, department, role, status';
  const attempts = new Map();
  const registrations = new Map();
  const reply = (status, body, headers = {}) => Response.json(body, {
    status, headers: { 'Cache-Control': 'no-store', ...headers },
  });
  const sessionCookie = (token, secure, age = SESSION_SECONDS) =>
    `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${age}${secure ? '; Secure' : ''}`;

  async function handle(request, address = 'local') {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const secure = url.protocol === 'https:';
    // Browser writes must originate from this application; no cross-origin API access.
    if (method !== 'GET' && request.headers.get('origin') !== url.origin) {
      return reply(403, { error: 'Request origin is not allowed.' });
    }
    const token = request.headers.get('cookie')?.split(';').map((part) => part.trim())
      .find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    await db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now());
    const session = token ? await db.prepare(`SELECT ${publicFields} FROM users WHERE id = (
      SELECT user_id FROM sessions WHERE token_hash = ? AND expires > ?
    )`).get(digest(token), now()) : undefined;
    const user = session?.status === 'Active' ? session : undefined;

    if (path === '/api/session' && method === 'GET') return reply(200, { user: user ?? null });
    if (path === '/api/register' && method === 'POST') {
      let input;
      try { input = await request.json(); } catch { return reply(400, { error: 'Invalid request.' }); }
      const name = typeof input?.name === 'string' ? input.name.trim() : '';
      const department = typeof input?.department === 'string' ? input.department.trim() : '';
      const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
      const password = input?.password;
      if (!name || name.length > 100 || !department || department.length > 100 ||
          email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          typeof password !== 'string' || password.length < 15 || password.length > 128) {
        return reply(400, { error: 'Enter your name, department, a valid email address, and a password of 15–128 characters.' });
      }
      const time = now();
      for (const [key, value] of registrations) if (value.until <= time) registrations.delete(key);
      const registration = registrations.get(address);
      if (registration?.count >= 10 || (!registration && registrations.size >= 1000)) {
        return reply(429, { error: 'Too many registration attempts. Try again later.' });
      }
      registrations.set(address, { count: (registration?.count ?? 0) + 1, until: registration?.until ?? time + 15 * 60 * 1000 });
      const salt = randomBytes(16).toString('hex');
      const hash = scryptSync(password, salt, 64).toString('hex');
      const result = await db.prepare(`
        INSERT INTO users (name, email, department, role, status, salt, password_hash)
        VALUES (?, ?, ?, 'Employee', 'Active', ?, ?) ON CONFLICT(email) DO NOTHING
      `).run(name, email, department, salt, hash);
      if (!result.changes) return reply(409, { error: 'An account with that email already exists.' });
      return reply(201, {});
    }
    if (path === '/api/login' && method === 'POST') {
      let input;
      try { input = await request.json(); } catch { return reply(400, { error: 'Invalid request.' }); }
      if (typeof input?.email !== 'string' || typeof input?.password !== 'string' ||
          input.email.length > 254 || input.password.length > 1024) {
        return reply(400, { error: 'Enter a valid email and password.' });
      }
      const email = input.email.trim().toLowerCase();
      // Bound memory use and expire old entries even when a client changes email addresses.
      for (const [key, value] of attempts) if (value.until <= now()) attempts.delete(key);
      if (attempts.size >= 1000 && !attempts.has(email)) return reply(429, { error: 'Too many attempts. Try again later.' });
      const attempt = attempts.get(email);
      if (attempt?.count >= 5) return reply(429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const account = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      const candidate = scryptSync(input.password, account?.salt ?? 'invalid-account', 64);
      const valid = timingSafeEqual(candidate, account ? Buffer.from(account.password_hash, 'hex') : Buffer.alloc(64));
      if (!account || !valid || account.status !== 'Active') {
        attempts.set(email, { count: (attempt?.count ?? 0) + 1, until: attempt?.until ?? now() + 15 * 60 * 1000 });
        return reply(401, { error: 'Invalid email or password, or this account is inactive.' });
      }
      attempts.delete(email);
      if (token) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token));
      const newToken = randomBytes(32).toString('hex');
      await db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(newToken), account.id, now() + SESSION_SECONDS * 1000);
      return reply(200, { user: await db.prepare(`SELECT ${publicFields} FROM users WHERE id = ?`).get(account.id) }, {
        'Set-Cookie': sessionCookie(newToken, secure),
      });
    }
    if (path === '/api/logout' && method === 'POST') {
      if (token) await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token));
      return reply(200, { user: null }, { 'Set-Cookie': sessionCookie('', secure, 0) });
    }
    if (!user) return reply(401, { error: 'Please sign in again.' });
    if (path === '/api/profiles' && method === 'GET') {
      const rows = await db.prepare(`
        SELECT users.id, users.name, users.department, profiles.details
        FROM profiles JOIN users ON users.id = profiles.user_id
        WHERE users.status = 'Active' ORDER BY users.id
      `).all();
      const samples = (await db.prepare('SELECT details FROM sample_profiles ORDER BY id DESC').all())
        .map(({ details }) => JSON.parse(details));
      const profiles = await Promise.all(rows.map(async ({ details, ...identity }) => ({ ...await loadProfile(identity.id, details), ...identity })));
      return reply(200, { profiles: [...samples, ...profiles] });
    }
    if (path === '/api/profile' && method === 'GET') {
      const row = await db.prepare('SELECT details FROM profiles WHERE user_id = ?').get(user.id);
      const recognition = await db.prepare(`
        SELECT id, title, description, awarded_at AS "awardedAt" FROM recognition
        WHERE user_id = ? ORDER BY awarded_at DESC, id DESC
      `).all(user.id);
      return reply(200, { profile: row ? await loadProfile(user.id, row.details) : null, recognition, trustedReferenceHosts });
    }
    if (path === '/api/profile' && method === 'PUT') {
      let input;
      try { input = await request.json(); } catch { return reply(400, { error: 'Invalid request.' }); }
      const title = typeof input?.title === 'string' ? input.title.trim() : '';
      const description = typeof input?.description === 'string' ? input.description.trim() : '';
      const { years, skills, certifications } = input ?? {};
      const validList = (values) => Array.isArray(values) && values.length <= 20 &&
        values.every((value) => typeof value === 'string' && value.trim() && value.length <= 80);
      if (!title || title.length > 100 || !description || description.length > 1000 ||
          !Number.isInteger(years) || years < 0 || years > 80 ||
          !validList(skills) || !skills.length || !validList(certifications)) {
        return reply(400, { error: 'Enter a job title, summary, 0–80 years of experience, and 1–20 skills. Skills and certifications can have up to 80 characters each.' });
      }
      const normalize = (values) => [...new Set(values.map((value) => value.trim()))];
      const suppliedLinks = input.links === undefined ? undefined : parseReferenceLinks(input.links);
      if (suppliedLinks === null) {
        return reply(400, { error: 'Add up to 10 links with a label and an HTTPS URL on one of the listed trusted domains.' });
      }
      const profile = await db.transaction(async () => {
        const previous = await db.prepare('SELECT details FROM profiles WHERE user_id = ?').get(user.id);
        const links = suppliedLinks ?? (previous ? readProfile(previous.details).links : []);
        const details = JSON.stringify({ title, description, years, certifications: normalize(certifications), links });
        await db.prepare(`
          INSERT INTO profiles (user_id, details) VALUES (?, ?)
          ON CONFLICT(user_id) DO UPDATE SET details = excluded.details
        `).run(user.id, details);
        await replaceProfileSkills(user.id, normalize(skills));
        return loadProfile(user.id, details);
      });
      return reply(200, { profile });
    }
    if (user.role !== 'Admin') return reply(403, { error: 'Administrator access is required.' });
    if (path === '/api/users' && method === 'GET') {
      return reply(200, { users: await db.prepare(`SELECT ${publicFields} FROM users ORDER BY id`).all() });
    }
    const match = path.match(/^\/api\/users\/(\d+)\/status$/);
    if (match && method === 'PATCH') {
      let input;
      try { input = await request.json(); } catch { return reply(400, { error: 'Invalid request.' }); }
      if (input?.status !== 'Active' && input?.status !== 'Inactive') return reply(400, { error: 'Invalid account status.' });
      const account = await db.prepare('SELECT role FROM users WHERE id = ?').get(Number(match[1]));
      if (!account) return reply(404, { error: 'Account not found.' });
      if (account.role === 'Admin') return reply(403, { error: 'Administrator accounts cannot be deactivated.' });
      await db.prepare('UPDATE users SET status = ? WHERE id = ?').run(input.status, Number(match[1]));
      if (input.status === 'Inactive') await db.prepare('DELETE FROM sessions WHERE user_id = ?').run(Number(match[1]));
      return reply(200, { users: await db.prepare(`SELECT ${publicFields} FROM users ORDER BY id`).all() });
    }
    return reply(404, { error: 'API endpoint not found.' });
  }

  async function dispatch(request, address) {
    await ready;
    return db.request(() => handle(request, address));
  }

  return { handle: dispatch, ready, close: () => db.close() };
}
