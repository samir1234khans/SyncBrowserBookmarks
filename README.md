# SyncBrowserBookmarks

Cross-browser bookmark syncing MVP for Chrome and Edge, implemented as:

- MV3 extension client (bookmark events + dashboard)
- Fastify backend API with JWT auth
- PostgreSQL schema via Prisma

## Project layout

- `extension/` Chromium extension app.
- `backend/` API and persistence layer.
- `docs/ARCHITECTURE.md` full architecture, sync algorithm, schema, and MVP plan.

## Quick start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure backend

Create `backend/.env`:

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/bookmark_sync"
JWT_SECRET="replace-me"
PORT=4000
```

Run migrations (first time):

```bash
npm --workspace backend run prisma:migrate
```

### 3) Run backend

```bash
npm run dev:backend
```

### 4) Build extension

```bash
npm run dev:extension
```

Then load `extension/dist` as an unpacked extension in Chrome/Edge.

## Current MVP status

- ✅ Auth endpoints
- ✅ Device registration
- ✅ Push local bookmark snapshot
- ✅ Pull remote operations
- ✅ Extension dashboard status + manual sync
- ⚠️ Conflict UX and backup/export are scaffolded but not complete
