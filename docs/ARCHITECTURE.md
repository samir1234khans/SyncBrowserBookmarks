# Bookmark Sync Architecture (Chrome + Edge MVP)

## 1) Technical architecture

### Components
1. **Chromium Extension (MV3)**
   - Background service worker observes bookmark events and runs sync.
   - Popup dashboard shows status, last sync, bookmark count, and manual sync action.
   - `chrome.storage.local` stores device/session sync state.
2. **Sync API (Fastify + TypeScript)**
   - JWT-based auth.
   - Device registration endpoint.
   - Push/pull sync endpoints.
   - Persists normalized bookmark graph + browser mappings.
3. **PostgreSQL (Prisma ORM)**
   - Canonical bookmark tree (`BookmarkNode`) per user.
   - Per-device/browser ID mappings (`BookmarkMapping`).
   - Change log (`ChangeEvent`), sessions, and conflicts.

### Data flow
1. Extension startup / bookmark event triggers sync.
2. Extension exports local bookmark tree and pushes diff payload to backend.
3. Backend writes/upserts canonical nodes and emits change events.
4. Extension pulls remote changes newer than cursor.
5. Extension applies non-destructive operations locally.

---

## 2) Database schema

Implemented in `backend/prisma/schema.prisma`.

### Core tables
- `User`: account and auth record.
- `Device`: one browser-install instance.
- `BookmarkNode`: canonical bookmark/folder node tree with soft delete.
- `BookmarkMapping`: maps canonical node IDs to browser-native IDs.
- `ChangeEvent`: append-only sync event log.
- `SyncSession`: observability for sync runs.
- `SyncConflict`: explicit conflict records.

### Key MVP choices
- **Soft deletes** via `deletedAt`.
- **Stable app IDs** via `BookmarkNode.id`.
- **Browser-specific IDs** isolated in `BookmarkMapping`.
- **Path hash indexing** for import matching and duplicate checks.

---

## 3) Browser extension folder structure

```txt
extension/
  public/
    manifest.json
  src/
    background/
      index.ts              # event listeners + scheduled sync
      bookmarkAdapter.ts    # read/apply bookmark operations
      syncOrchestrator.ts   # push/pull orchestration
    popup/
      index.ts              # dashboard UI logic
    shared/
      apiClient.ts          # backend HTTP client
      storage.ts            # persisted extension state
      types.ts              # DTO contracts
  popup.html
  vite.config.ts
  tsconfig.json
```

---

## 4) Backend folder structure

```txt
backend/
  prisma/
    schema.prisma
  src/
    plugins/
      auth.ts               # JWT plugin + auth helper
      prisma.ts             # Prisma lifecycle plugin
    routes/
      auth.ts               # login/register
      health.ts             # liveness
      sync.ts               # register, push, pull
    services/
      syncService.ts        # sync core logic
    types/
      contracts.ts          # DTO types
    server.ts
```

---

## 5) Sync algorithm design (MVP)

1. **Detect local change**
   - Bookmark event or timer alarm triggers `runSync`.
2. **Snapshot local tree**
   - Walk full browser bookmark tree into normalized DTOs.
3. **Push phase**
   - Upsert by `(deviceId, browserNodeId)` mapping.
   - Create canonical node if mapping missing.
   - Emit `ChangeEvent` with source device.
4. **Pull phase**
   - Request remote events after cursor excluding same source device.
   - Convert to operations: `UPSERT`, `DELETE`, `CONFLICT`.
5. **Apply phase**
   - Apply upserts with duplicate guard.
   - Deletions logged for manual review (safety-first MVP).
6. **Commit cursor**
   - Save new cursor and sync timestamp in extension storage.

---

## 6) Conflict resolution strategy

### Detection
Conflict when two devices change same canonical node before seeing each other’s update.

### Policy
1. **Auto-merge safe fields**
   - Folder moves and position updates can merge when URL/title unchanged.
2. **Last-write-wins for non-destructive metadata**
   - Title-only conflicts resolved by newer `clientUpdatedAt`.
3. **Escalate destructive conflicts**
   - Delete vs update becomes `SyncConflict` and warning in UI.
4. **Never hard-delete automatically in early MVP**
   - Show warning and require explicit confirmation path.

---

## 7) Step-by-step MVP build plan

1. **Monorepo bootstrap** (done)
2. **Backend API skeleton + Prisma schema** (done)
3. **Extension MV3 worker + popup dashboard** (done)
4. **End-to-end auth + device registration** (done baseline)
5. **Initial push/pull synchronization** (done baseline)
6. **Conflict records + non-destructive delete workflow** (partially done)
7. **Backup/export before bulk apply** (next)
8. **Improved dedupe and hierarchy reparenting** (next)
9. **Integration tests and fixture trees** (next)
10. **Firefox compatibility abstraction layer** (next)

---

## 8) Firefox expansion path

- Replace direct `chrome.*` references with a thin browser adapter interface.
- Use `webextension-polyfill` promise API globally.
- Keep backend browser enum extensible and add `FIREFOX` later.
- Use per-browser capability flags for API edge cases.
