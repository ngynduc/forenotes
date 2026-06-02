# Forenotes Roadmap: Phases 3, 4, 5

## Context

Backend has matured beyond what the frontend exposes. Phase 3 closes those gaps. Phase 4 adds markdown note-taking for tasks. Phase 5 replaces the dev-only `x-user-id` header with real cookie-session auth.

---

## Phase 3: Close FE-BE Gaps

All gaps are cases where backend routes exist and work, but frontend has no UI. Mostly frontend-only changes.

### 3.1 — Query Attack Tags (Quick Win)

**Gap:** `modal.js:158` only shows tag panel for `"finding"` or `"timeline_event"`. Backend supports query attack tags at `POST /api/incidents/:id/queries/:queryId/attack-tags`.

**Changes:**
| File | Change |
|------|--------|
| `src/client/static/modules/render/modal.js` | Extend condition at line 158 to include `"query"`. For queries, render attack tags only (no custom tags). |
| `src/client/static/modules/actions.js` | Add `"query"` branch in `attachTag()` URL routing (~line 76). |

**Estimate:** Small — 2 files, ~15 lines changed.

---

### 3.2 — Timeline Event System/Account Fields

**Gap:** Backend schema accepts `systemId` and `accountId` on timeline events (migration 003). Frontend modal doesn't include these fields.

**Changes:**
| File | Change |
|------|--------|
| `src/client/static/modules/entities.js` | Add `systemId` and `accountId` select fields to `timeline_event.fields()` (~line 119). Populate from `state.systems` / `state.accounts`. |
| `src/client/static/modules/render/modal.js` | Add `"entity-select"` field type rendering in `renderFieldControl()` — a `<select>` populated from a state collection. |

**Estimate:** Small — 2 files, ~30 lines.

---

### 3.3 — Evidence Links (Finding → Evidence)

**Gap:** Backend has full CRUD at `/evidence-links`. Frontend has zero support — no UI to attach timeline events, systems, accounts, indicators, or queries to findings.

**Changes:**
| File | Change |
|------|--------|
| `src/client/static/modules/render/modal.js` | New `renderEvidenceLinkSection(item)` function. Shows linked evidence list with remove buttons + attach form (evidence type select → entity select). Wire into `renderSupplementalSections()` for findings. |
| `src/client/static/modules/data.js` | Add `loadFindingEvidenceLinks(findingId)` — fetches on modal open, stores in `state.ui.modal.evidenceLinks`. |
| `src/client/static/modules/actions.js` | Add `attachEvidenceLink()` and `removeEvidenceLink()` calling POST/DELETE evidence-link endpoints. |
| `src/client/static/modules/events.js` | Handle `"attach-evidence-link"` and `"delete-evidence-link"` actions. |

**Pattern:** Follows existing `renderUserLinkSection()` (modal.js:239-335) and `renderTagManagementSection()` (modal.js:164-197).

**Estimate:** Medium — 4 files, ~100 lines.

---

### 3.4 — Task Links (Task → Evidence)

**Gap:** Backend has `POST /tasks/:taskId/links` but is missing GET and DELETE. Frontend has zero support.

**Changes:**
| File | Change |
|------|--------|
| `src/server/services/taskService.ts` | Add `listTaskLinks()` and `deleteTaskLink()`. |
| `src/server/routes/incidentRoutes.ts` | Add `GET` and `DELETE` routes for task links. |
| `src/client/static/modules/render/modal.js` | New `renderTaskLinkSection(item)`. Wire into `renderSupplementalSections()` for `"task"`. Follows same pattern as 3.3. |
| `src/client/static/modules/data.js` | Add `loadTaskLinks(taskId)`. |
| `src/client/static/modules/actions.js` | Add `attachTaskLink()` and `removeTaskLink()`. |
| `src/client/static/modules/events.js` | Handle task link actions. |

**Estimate:** Medium — 6 files, ~120 lines (includes backend additions).

---

### 3.5 — Full Entity Links (Arbitrary Entity-to-Entity)

**Gap:** Backend supports full entity-to-entity linking via `incident_entity_links`. Frontend only supports `assigned_to` user links. Need both modal panel and graph interaction.

**Changes:**

**Modal panel:**
| File | Change |
|------|--------|
| `src/client/static/modules/render/modal.js` | Extend `renderUserLinkSection()` → `renderEntityLinkSection()`. Add sub-section showing all entity links involving current entity from `state.entityLinks`. Attach form: entity type → entity → link type (from `GRAPH_EDGE_TYPES`). |
| `src/client/static/modules/actions.js` | Extend entity link creation/deletion (existing `createEntityLink` in graphApi.js already works). |
| `src/client/static/modules/events.js` | Handle `"attach-general-entity-link"` and `"delete-entity-link"` actions. |

**Graph interaction:**
| File | Change |
|------|--------|
| `src/client/static/modules/render/graph.js` | Add "Link from this node" button in node inspector panel. When clicked, enter linking mode → next node click opens link-type selector → calls `createEntityLink()`. |
| `src/client/static/modules/events.js` | Handle graph linking mode state + link creation. |

**Estimate:** Large — 4 files, ~200 lines. Most complex gap.

---

### Phase 3 Implementation Order

```
3.1 Query Attack Tags  ──→  3.2 Timeline Fields  ──→  3.3 Evidence Links  ──→  3.4 Task Links  ──→  3.5 Entity Links
     (quick win)              (isolated)              (establishes pattern)    (follows pattern)     (most complex)
```

---

## Phase 4: Task Notes (File-based Markdown)

### Architecture Decision

Store markdown files on disk at `data/notes/{taskId}.md`, not in PostgreSQL. Keeps DB lean. Task ID is UUID (globally unique), so no collision across incidents.

### 4.1 — Backend: Note Service + Routes

| File | Status | Description |
|------|--------|-------------|
| `src/server/services/noteService.ts` | NEW | `readNote(taskId)` reads file, returns content or `""`. `writeNote(taskId, content)` writes file. Creates `data/notes/` with `recursive: true` on first write. Validates task exists + incident membership. |
| `src/server/routes/incidentRoutes.ts` | MODIFY | Add `GET /api/incidents/:id/tasks/:taskId/notes` and `PUT /api/incidents/:id/tasks/:taskId/notes`. Zod validates content string (max 1MB). |
| `.gitignore` | MODIFY | Add `data/` directory. |

### 4.2 — Frontend: Note Editor Component

| File | Status | Description |
|------|--------|-------------|
| `src/client/static/modules/render/noteEditor.js` | NEW | Full-page markdown editor. Top bar: task title + toggle (Edit/Preview) + Save + Back. Edit mode: `<textarea>`. Preview mode: rendered HTML via `marked`. Dirty tracking for unsaved changes warning. |
| `src/client/static/modules/state.js` | MODIFY | Add `noteEditor: null` to `ui` state (`{ taskId, content, savedContent, mode, loading }`). |
| `src/client/static/modules/render/shell.js` | MODIFY | Add `"noteEditor"` case in `renderActiveSection()`. |
| `src/client/static/modules/render/modal.js` | MODIFY | Add "Open Notes" button in task modal (update mode only). |
| `src/client/static/modules/events.js` | MODIFY | Handle: `open-note-editor`, `save-note`, `toggle-note-mode`, `close-note-editor`. |

### 4.3 — Markdown Library

Use `marked` via CDN ESM import inside `noteEditor.js`:
```javascript
const { marked } = await import("https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js");
```

No npm dependency needed. Fallback: vendor `marked.min.js` into `src/client/static/vendor/`.

### Phase 4 Order

```
4.1 Backend (service + routes)  ──→  4.2 Frontend (editor + wiring)  ──→  4.3 Test end-to-end
```

---

## Phase 5: Real Authentication (Cookie Sessions)

### Architecture

- `bcryptjs` for password hashing (pure JS, no native deps)
- `cookie-parser` middleware for reading cookies
- Custom session table in PostgreSQL (no `express-session` — simpler)
- `x-user-id` header kept for development only (`NODE_ENV !== "production"`)
- Existing RBAC unchanged — only auth mechanism changes

### 5.1 — Dependencies + Migration

| File | Status | Description |
|------|--------|-------------|
| `package.json` | MODIFY | Add `bcryptjs`, `cookie-parser` + their `@types/` |
| `src/server/db/migrations/004_sessions.sql` | NEW | `sessions` table: `id uuid PK`, `user_id uuid FK → users`, `expires_at timestamptz`, `created_at timestamptz`. Indexes on `user_id` and `expires_at`. |

### 5.2 — Session Service

| File | Status | Description |
|------|--------|-------------|
| `src/server/services/sessionService.ts` | NEW | `createSession(db, userId, durationHours=168)` → generates UUID, inserts, returns session. `getSession(db, sessionId)` → validates not expired, returns session+user or null. `deleteSession(db, sessionId)`. `cleanExpiredSessions(db)`. |

### 5.3 — Password Hashing

| File | Status | Description |
|------|--------|-------------|
| `src/server/services/userService.ts` | MODIFY | `createUser()` accepts optional `password`, hashes with `bcrypt.hash(password, 12)`. Add `validatePassword(db, email, password)` — lookup user by email, `bcrypt.compare()`, return user or throw 401. |

### 5.4 — Auth Routes (Login/Logout)

| File | Status | Description |
|------|--------|-------------|
| `src/server/routes/authRoutes.ts` | MODIFY | `POST /api/auth/login` — validate credentials, create session, set `forenotes_session` cookie (HttpOnly, SameSite=Lax, Secure in prod). `POST /api/auth/logout` — delete session, clear cookie. |

### 5.5 — Session Middleware

| File | Status | Description |
|------|--------|-------------|
| `src/server/app.ts` | MODIFY | Add `cookieParser()` before routes. |
| `src/server/services/authService.ts` | MODIFY | `getAuthenticatedUser()`: try cookie session first → fallback to `x-user-id` only if `NODE_ENV !== "production"` → throw 401 if neither. |

### 5.6 — Login Page

| File | Status | Description |
|------|--------|-------------|
| `src/client/static/login.html` | NEW | Simple form: email + password. Submit via `fetch` to `POST /api/auth/login`. On success → redirect `/`. On failure → show error. Uses existing `styles.css`. |

### 5.7 — Frontend Auth Flow

| File | Status | Description |
|------|--------|-------------|
| `src/client/static/modules/api.js` | MODIFY | Remove `x-user-id` header. Add `credentials: "include"` to fetch. On 401 response → `window.location.href = "/login.html"`. |
| `src/client/static/modules/render/shell.js` | MODIFY | Replace user-switcher `<select>` with current user display name + "Logout" button. |
| `src/client/static/modules/events.js` | MODIFY | Handle `"logout"` action → `POST /api/auth/logout` → redirect to `/login.html`. |
| `src/server/app.ts` | MODIFY | For `GET /` — if no valid session cookie, redirect to `/login.html`. Allow static assets and `/api/auth/login` without auth. |

### 5.8 — Seed Demo Passwords

| File | Status | Description |
|------|--------|-------------|
| Dev seeder / bootstrap | MODIFY | Set passwords for demo users. Log default admin credentials on first run. |

### Phase 5 Order

```
5.1 Deps + migration  ──→  5.2 Session service  ──→  5.3 Password hashing
                                                            ↓
                        5.6 Login page  ←──  5.4 Auth routes  ──→  5.5 Session middleware
                              ↓
                        5.7 Frontend auth flow  ──→  5.8 Seed passwords
```

---

## Overall Roadmap Summary

| Phase | Scope | New Files | Modified Files | Backend Changes |
|-------|-------|-----------|----------------|-----------------|
| **3** | FE-BE gaps | 0 | ~8 FE + 2 BE | Minor (task link GET/DELETE) |
| **4** | Task notes | 2 (noteService, noteEditor) | ~5 | Note read/write endpoints |
| **5** | Real auth | 3 (sessionService, migration, login.html) | ~7 | Full auth overhaul |

### Risks

1. **Phase 5 breaks dev workflow** — Mitigated: `x-user-id` kept behind `NODE_ENV !== "production"`.
2. **File-based notes not in DB backups** — Document. Recommend volume backup for `data/notes/`.
3. **CDN dependency for marked** — Fallback: vendor the file locally.

---

## Verification

### Phase 3
- Open finding modal → evidence link panel visible, can attach/detach evidence
- Open task modal → task link panel visible, can attach/detach evidence
- Open query modal → attack tag panel visible, can attach/detach tags
- Create timeline event → system/account dropdowns populated and working
- Graph view → right-click node → can create entity links
- Entity modals → can create arbitrary entity-to-entity links

### Phase 4
- Open task in update mode → "Notes" button visible
- Click "Notes" → full-page editor loads with textarea
- Type markdown → toggle to Preview → rendered HTML displayed
- Save → content persists in `data/notes/{taskId}.md`
- Reopen → content loaded correctly
- Back button → returns to task board, warns if unsaved changes

### Phase 5
- `npm run dev` → still works with x-user-id header (dev mode)
- `NODE_ENV=production npm start` → redirects to login page
- Login with email/password → session cookie set → SPA loads
- All API calls work with cookie auth → existing RBAC unchanged
- Logout → session destroyed → redirected to login
- Invalid/expired session → 401 → redirected to login
