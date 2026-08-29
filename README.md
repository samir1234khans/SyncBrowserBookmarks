# SyncBrowserBookmarks

> [!IMPORTANT]
> **Development has moved to the canonical repository [`samir1234khans/BrowserSync`](https://github.com/samir1234khans/BrowserSync).**
> This repository is retained as a historical full-stack prototype and is not the active implementation. Do not use its placeholder authentication or synchronization flow for production data. It will remain readable until the canonical project completes real Chrome/Edge acceptance testing, after which this repository may be archived without being deleted.

## Historical prototype

This repository explored cross-browser bookmark synchronization for Chrome and Edge using:

- an MV3 extension client with bookmark events and a dashboard;
- a Fastify backend API with JWT auth;
- PostgreSQL through Prisma.

The canonical `BrowserSync` repository now contains the consolidated safety-first implementation, including device-scoped browser-ID mappings, durable mutation retries, numeric change cursors, conflict records, backups before remote deletion, versioned Supabase migrations, automated tests, and the current release checklist.

## Historical project layout

- `extension/` Chromium extension app.
- `backend/` API and persistence layer.
- `docs/ARCHITECTURE.md` original architecture, sync algorithm, schema, and MVP plan.

## Historical quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the prototype backend

Create `backend/.env`:

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/bookmark_sync"
JWT_SECRET="replace-me"
PORT=4000
```

Run migrations:

```bash
npm --workspace backend run prisma:migrate
```

### 3. Run the backend

```bash
npm run dev:backend
```

### 4. Build the extension

```bash
npm run dev:extension
```

Then load `extension/dist` as an unpacked extension in Chrome or Edge.

## Historical MVP status

- Auth endpoint scaffold.
- Device registration.
- Push local bookmark snapshot.
- Pull remote operations.
- Extension dashboard status and manual sync.
- Conflict UX and backup/export remained incomplete.

## Security warning

The backend authentication route in this historical prototype contains deliberately unfinished password handling and must not be deployed as a real authentication service. Continue all implementation and testing in the canonical `BrowserSync` repository instead.
