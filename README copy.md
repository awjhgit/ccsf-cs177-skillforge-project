# Skill Forge

A local skills-directory and account-management prototype built with React, TypeScript, Vite, Express, and SQLite or PostgreSQL.

## Run locally

Use Node.js 24 or newer (required for the built-in SQLite API).

```sh
npm install
npm run dev
```

The root command starts Express and Vite together. Open the local address printed by Vite. Select **Create an account** to register an employee, or sign in with `alex@skillforge.demo` and `demo123` to try account management.

The first server start creates four sample accounts in `server/database/skillforge.sqlite` on a new checkout. Passwords are stored as salted scrypt hashes. The included accounts still share a publicly documented demo password; use this project locally with sample data only.

## Project layout

- `client/src/pages/` contains React screens. The React entry points use TypeScript JSX (`.tsx`). CSS lives in `client/src/styles/` and API calls live in `client/src/services/`.
- `server/server.js` starts Express. Request handling lives in `server/routes/` and `server/middleware/`, database configuration in `server/config/`, schema in `server/models/`, and seed and migration files in `server/database/`.
- Root npm scripts manage both packages. The Makefile provides equivalent commands such as `make dev`, `make build`, and `make test`.

The Express API listens locally on port 3001 by default. Set `PORT` in `server/.env.local` to change it. The root dev and preview commands point Vite's API proxy at that port.

## Skills directory

Signing in opens `/directory`, which combines the search, department/experience/certification filters, sorting, and profile previews from the original prototype with the current login flow. The directory loads sample profiles and profiles saved by active accounts from the configured database through the API. The server seeds the eight sample profiles from `server/database/directory-seed.json`. Saved profile skills use the `skills` and `profile_skills` tables. Existing saved skills are migrated on startup. Select **My Profile** to view your skills, experience, certifications, and recognition, or to create or edit your profile. The dashboard can display stored recognition records. Awarding recognition through the app is still planned. Administrators also see an account-management link. Profile dialogs support keyboard focus and Escape to close.

The directory lives in `client/src/App.tsx`. Directory styles are scoped in `client/src/styles/Directory.css` so they do not affect login or account management. The `.old` files remain as backups and are not imported. Connections, rewards, and analytics remain placeholders.

## Account management and sessions

- The API reads and updates the same database used for login.
- Deactivation and reactivation survive logout, browser refresh, and server restart.
- Administrator accounts cannot be deactivated, including through direct API requests.
- The server verifies that requests have an active administrator session before listing or updating accounts.
- Sessions use random tokens in HttpOnly, SameSite cookies and expire after eight hours. Refresh restores the session, and logout revokes it on the server.
- Registration creates active employee accounts with passwords of 15–128 characters. The server limits registration attempts per client address and login attempts per email in the running process. Cross-origin writes are rejected.
- Failed saves and connection errors appear in the interface; an unsuccessful save does not change the displayed account status.

SQLite database files are ignored by Git. Existing checkouts with `data/skillforge.sqlite` continue to use that file until it is moved to `server/database/`. Stop the app before moving it. Back up the active database to retain your local changes.

## Verify

```sh
npm run lint
npm test
npm run build
npm run preview
```

The root preview command starts the Express API and serves the built frontend from `client/dist/`. Tests use temporary databases and do not modify your local accounts.

## Remaining work

Defined-skills management is still planned. Registration is open to anyone who can reach the app and does not verify email ownership. Restrict enrollment before using it as an internal directory.

Public deployment still requires production hosting for the built frontend and Express API (Vite dev/preview servers are for local use), HTTPS with Secure session cookies, removal of demo credentials, email verification, and password recovery, and deployment-appropriate rate limiting. Publishing only `client/dist/` will not run the API. This is a local prototype, not a complete production authentication service.

## Run with PostgreSQL

SQLite remains the default. To switch, create an empty PostgreSQL database owned by a dedicated Skill Forge database role. Put the connection string in the ignored `server/.env.local` file:

```dotenv
DATABASE_URL=postgresql://skillforge:your-password@localhost:5432/skillforge
```

Stop the SQLite-backed app before cutting over so changes cannot be made after the migration snapshot. To bring over existing accounts and profiles, run:

```sh
npm run db:migrate:postgres
npm run dev
```

Pass a different SQLite file with `npm run db:migrate:postgres -- /path/to/skillforge.sqlite`. The command reads a snapshot of SQLite, preserves account IDs and password hashes, and copies profiles, skills, and recognition. It refuses to import over existing PostgreSQL accounts. Sessions are excluded, so everyone signs in again. The application seeds the eight sample directory profiles when it first starts.

A fresh PostgreSQL database does not seed demo accounts. Import an existing administrator account if you need account management. Imported credentials keep their existing passwords.

### PostgreSQL schema file

The PostgreSQL table definitions live in `server/models/postgres.sql`. The API and migration command use this file directly. The SQLite schema remains in `server/models/schema.sql`.

After creating a PostgreSQL database and its owner, copy `server/.env.example` to `server/.env.local` and enter your connection details. Run `npm run db:setup:postgres` from the project root to create the tables. Running setup again preserves existing records. To copy your SQLite accounts and profiles into the empty tables, run `npm run db:migrate:postgres`, then `npm run dev`.

The schema defines users, profiles, skills, profile-skill relationships, recognition, sessions, and sample profiles. Profile descriptions, certifications, and reference links currently remain in the profile details field. Changes to existing table definitions will require a database migration, since setup creates missing tables.
