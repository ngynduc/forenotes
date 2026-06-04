# Production Readiness Audit

Date: 2026-05-24
Branch: dev
Commit: e31854f0228ef35efb3ec9c5e7224754619b7930
Auditor: Codex

## Executive Summary

Production readiness verdict: Not production ready.
Score: 42/100.
Recommendation: Do not deploy Forenotes to production until the blockers below are fixed and re-tested. The app is usable for isolated internal demo/private-beta environments only when network access is restricted and demo credentials are understood.

The current codebase has strong foundations: password hashing uses Argon2id, core API tests pass, many database queries are parameterized, incident/case scoping works for the tested read paths, markdown/report rendering is mostly sanitized, and PDF export works through the backend API. However, production deployment is blocked by live header-based impersonation, unauthenticated access to uploaded note images, unsafe default/demo credentials in the Docker path, SSRF exposure through user-configurable LLM endpoints, and incomplete production operations documentation.

No code fixes were applied during this audit. This was intentionally audit-first.

## Blockers

| ID | Area | Severity | Finding | Evidence | Recommended Fix |
|----|------|----------|---------|----------|-----------------|
| B-01 | Authentication | Blocker | Any client can impersonate a user by sending `x-user-id`; the fallback is not restricted to development. | `src/server/services/authService.ts:105-134` checks the session cookie first, then trusts `request.header("x-user-id")`. Live proof: unauthenticated `/api/auth/me` returned 401, while the same request with `x-user-id: 82c5503a-daaf-42ea-9e92-2577da2a653e` returned 200 and the lead user's permissions. `docs/ROADMAP.md` already notes this should be gated to non-production. | Remove the header fallback from production builds. If it remains for tests/demo, gate it behind an explicit non-production env var and fail closed when `NODE_ENV=production`. Add regression tests proving `x-user-id` is ignored in production. |
| B-02 | File Uploads | Blocker | Uploaded markdown/note images are served as public static files without authentication or case/incident authorization. | `src/server/app.ts:18-19` mounts `/api/uploads` and `/uploads` as `express.static(getUploadsDir())` before auth routes. `src/server/services/noteService.ts:122-165` correctly authorizes upload, but returned URLs are public. Live proof: a task note image uploaded by an authorized user returned `public_upload_http=200 size=69` with no cookie. | Replace static upload serving with an authenticated download route that resolves the file to task/note/case/incident ownership and checks membership. Use private storage paths and short cache headers. |
| B-03 | Deployment / Bootstrap | Blocker | The default Docker path seeds weak demo accounts and the login UI advertises demo credentials; bootstrap defaults are unsafe for production. | `docker-compose.yml:23-27` sets `FORENOTES_SEED_DEV_USERS: "1"`. `src/server/db/bootstrap.ts:9-39` defines `admin/admin123`, `commander/commander123`, `lead/lead123`, `analyst/analyst123`, and `viewer/viewer123`. `src/client/src/pages/LoginPage.tsx:175-177` displays `Development seed users include lead / lead123`. `src/server/env.ts:9-12` defaults bootstrap admin to `admin` / `ChangeMe123!`; `src/server/db/bootstrap.ts:134-136` warns but still allows production defaults. | Split demo and production compose files. In production, fail startup if bootstrap credentials or database credentials are defaults. Hide demo credential copy unless an explicit demo mode is enabled. |
| B-04 | LLM / Security | Blocker | User-configurable LLM base URLs and custom headers can be passed to the LLM service, creating SSRF and internal-service access risk. | `src/server/schemas/schemas.ts:223-229` accepts arbitrary `baseUrl` and custom headers. `src/server/services/reportService.ts:555-580` stores them, and `src/server/services/reportService.ts:1215-1229` also supports arbitrary env fallback endpoints. `src/server/services/litellmServiceClient.ts:53-57` forwards provider config. `services/report-llm-service/app.py:62-80` passes `api_base=req.apiBase` and `extra_headers=req.customHeaders` directly to `litellm.completion`. | Use provider allowlists, block private/link-local/metadata IP ranges, restrict schemes to HTTPS except explicit local dev, limit custom header names, and run the LLM service with egress controls. Add SSRF unit tests around URL validation. |
| B-05 | Deployment / Operations | Blocker | A fresh production setup is not reproducible from checked-in docs and safe examples. | No `.env.example` exists. `README.md` is only a two-line placeholder. `docker-compose.yml` includes demo seeding and default database credentials. The task's production criterion says fresh production setup and required env vars must be documented. | Add `.env.example`, production deployment docs, migration/bootstrap instructions, health check documentation, file storage persistence guidance, reverse-proxy/cookie guidance, and LLM service startup instructions. |

## High-Risk Issues

| ID | Area | Severity | Finding | Evidence | Recommended Fix |
|----|------|----------|---------|----------|-----------------|
| H-01 | LLM Secrets | High | LLM API key encryption has a hard-coded development fallback key. | `src/server/services/reportService.ts:1151-1168` derives AES-256-GCM key material from `FORENOTES_LLM_SECRET_KEY ?? "forenotes-development-llm-key"`. | Require a strong `FORENOTES_LLM_SECRET_KEY` outside test/demo. Add startup validation and document rotation behavior. |
| H-02 | Authorization / Data Integrity | High | Several create/update paths accept `ownerUserId` without verifying that the owner is a member of the incident/case. | `src/server/services/findingService.ts:99-124`, `src/server/services/timelineEventService.ts:124-157`, `src/server/services/taskService.ts:72-99`, and `src/server/services/queryService.ts:41-62,92-108` accept owner IDs. Task assignee membership is checked, but owner membership is not consistently checked. | Centralize owner/assignee validation and reject owners outside the current case/incident membership set. Add tests for findings, timeline events, tasks, and queries. |
| H-03 | Query Library | High | Query editing and UI do not meet the stated production contract. | `src/server/services/queryService.ts:77-108` allows any incident member with `query:update` to edit a query, not just the owner or a clearly elevated role. `src/server/permissions/catalog.ts:18-45` grants analysts `query:update`. `src/client/src/config/table-definitions.ts:98-110` omits required ID and Description columns. Browser proof: `/queries` showed Name, Language, Owner, Updated; modal body used a plain textbox rather than syntax-highlighted editor. | Define and enforce query ownership/admin edit rules server-side. Add required columns, full query modal behavior, copy confirmation, and a syntax-highlighted read/edit component. |
| H-04 | Workflow Reliability | High | Some browser-critical UI workflows did not validate cleanly even though direct APIs worked. | Agent-browser login worked, but clicking `Log Out` on Settings repeatedly left the user in the app. Agent-browser PDF download timed out, while direct API PDF export returned a valid PDF. Task "Open Notes" clicks did not open the notes dialog during the audit, while note read/write/upload APIs worked. | Reproduce with browser tests, fix event/state issues, and add Playwright or agent-browser scripted coverage for logout, notes dialog, and report PDF download. |
| H-05 | Docker Runtime | High | The Docker configuration is demo-oriented and not production-safe. | `docker-compose.yml` uses default database credentials, demo seeding, and no persistent volume for uploaded files under `/app/data/uploads`. `SECURE_SESSION_COOKIES` is not enabled by default. | Provide a production compose/profile with externalized secrets, persistent upload storage, secure cookie guidance, no seeded demo users, and explicit database backup/restore docs. |
| H-06 | Brute Force / Browser Security | High | Login has no rate limiting and the Express app does not set common browser security headers. | `src/server/routes/authRoutes.ts:24-31` handles login without rate limiting. `src/server/app.ts:15-49` uses JSON parsing, public static uploads, routes, and an error handler, but no Helmet/security-header middleware, CSRF mitigation, or login throttling. | Add rate limiting to auth routes, set security headers, review CSRF posture for cookie-authenticated mutating requests, and document reverse-proxy requirements. |

## Medium / Low-Risk Issues

| ID | Area | Severity | Finding | Evidence | Recommended Fix |
|----|------|----------|---------|----------|-----------------|
| M-01 | Notifications | Medium | Timeline creation did not notify case members during live testing. | `src/server/services/timelineEventService.ts:124-172` creates an audit log only on create; `src/server/services/timelineEventService.ts:247-260` notifies on update. Browser/API proof: viewer received `finding.created`, `task.assigned`, and `case.member_added`, but no `timeline.created`. | Add timeline creation notifications and tests for members/non-members. |
| M-02 | Migrations | Medium | Migration execution has no migration history table, lock, or per-file applied tracking. | `src/server/db/setup.ts:6-15` sorts all SQL files and executes them every startup. Migrations are mostly idempotent but failures can leave ambiguous state. | Add an `applied_migrations` table, transactional migration runner, and startup failure behavior suitable for production. |
| M-03 | Database Integrity | Medium | Some entity relationships rely on app validation instead of database constraints. | `src/server/db/migrations/001_initial.sql` uses text roles/statuses and polymorphic entity links without foreign keys to each target table. It does include useful indexes in lines 277-288; report indexes exist in `005_reports.sql:67-70`. | Add check constraints for enumerated statuses/roles and strengthen ownership/link integrity where polymorphism permits. |
| M-04 | Performance | Medium | Some list endpoints perform per-row tag lookups and build chunks are large. | `src/server/services/findingService.ts:35-66` and `src/server/services/timelineEventService.ts:53-84` fetch tags per item. Build output included chunks around 370-434 kB before gzip. Browser vitals for `/tasks`: TTFB 4 ms, FCP 80 ms, LCP 436 ms, CLS 0.16. | Batch-load tags, consider route-level splitting for large client chunks, and reduce layout shift below 0.1. |
| M-05 | Report Template Hardening | Medium | PDF template sanitization is present but should be hardened before untrusted templates are enabled broadly. | `src/server/services/reportPdfRenderer.ts:46-77` allows style tags/attributes; `sanitizeCss` strips obvious `expression`, `javascript:`/`file:` URLs and `@import` in `src/server/services/reportPdfRenderer.ts:366-371`. | Keep templates admin-only, add stricter CSS URL parsing, consider sandboxed rendering, and test malicious CSS/HTML payloads. |
| M-06 | Service Testing | Medium | Python LLM services have no checked-in tests and could not be fully installed in this host because `python3-venv`/`ensurepip` is unavailable. | `services/litellm-service/app.py` and `services/report-llm-service/app.py` compiled with `python3 -m py_compile`, but no pytest files were found under `services/`. `python3 -m venv` failed due missing system venv support. | Add service unit tests and a documented Docker-based or `uv`-based test command that does not depend on host package availability. |
| M-07 | Legacy Service | Medium | The older `services/litellm-service` appears stale and returns raw provider exception text. | `services/litellm-service/app.py:33-57` returns `LLM generation failed: {exc}`. The newer `services/report-llm-service/app.py` is safer but still surfaces provider error detail in HTTP exceptions. | Remove or clearly deprecate the old service, and normalize provider errors to safe user-facing messages with server-side structured logs. |
| M-08 | Documentation Drift | Medium | Some docs still describe `x-user-id` header workflows that conflict with cookie sessions. | `docs/API.md`, `docs/AUTHENTICATION.md`, `docs/ARCHITECTURE.md`, and `docs/forenotes_phase3_docs/REACT-MIGRATION.md` contain legacy header-auth guidance. | Update docs after B-01 is fixed so production, demo, and test authentication paths are unambiguous. |
| M-09 | Secret Hygiene | Low | An ignored local `.env` contained a live-looking provider key during the audit. It was not tracked by git. | `.gitignore:12-14` ignores `.env*`; `git ls-files .env` returned no tracked file. The secret value is intentionally omitted here. | Rotate it if it is real, keep local audit logs private, and document secret-handling expectations. |

## Security Review

Blockers are B-01, B-02, B-03, and B-04. Those are sufficient by themselves to block production.

Positive findings:

- Password hashing uses Argon2id in `src/server/services/authService.ts:39-45`.
- Session cookies are `HttpOnly` and `SameSite=Lax`; `Secure` is configurable through `SECURE_SESSION_COOKIES` in `src/server/services/authService.ts:146-162`.
- The API error handler avoids returning stack traces for generic 500s in `src/server/app.ts:30-49`.
- SQL usage reviewed during the audit is generally parameterized. Dynamic entity table selection uses controlled maps and schema validation rather than raw user-selected table names.
- Markdown preview uses ReactMarkdown and safe URL filtering in `src/client/src/components/notes/MarkdownEditor.tsx:130-152,181-188`.
- Report rendering uses escaped placeholders, markdown-it with HTML disabled, and sanitize-html in `src/server/services/reportPdfRenderer.ts:12-17,251-278`.

Security gaps:

- Header impersonation is live.
- Uploaded files are public.
- LLM base URL/custom header handling needs SSRF controls.
- Auth routes need rate limiting.
- Cookie-authenticated mutating routes should receive an explicit CSRF review.
- Production startup should fail on default secrets and demo credentials.

## Auth and RBAC Review

Auth is not production-ready because `x-user-id` bypasses password/session authentication. Cookie login/logout paths pass unit coverage, and direct API invalid-login behavior is clear, but browser logout did not validate cleanly during agent-browser testing.

RBAC and scoping are partially ready. Live API checks showed a non-member could not read a private case's incidents or private incident findings, receiving 404 responses. After membership was added, the viewer received case/task notifications. Global search also respected incident access in the tested path: a non-member search returned 0 results while a member search returned the expected finding.

Remaining RBAC risks are owner membership validation gaps and query edit ownership rules. UI hiding is not enough for these paths; the server must reject unauthorized owners and unauthorized query edits.

## Data Model and Migration Review

The schema is serviceable for demo and internal use, with indexes for common case/incident/report paths. Fresh test migrations ran during `npm run test`. However, production migration handling is too simple: all SQL files are re-run on startup without an applied-migrations ledger or migration lock. Several integrity rules live only in application code, especially polymorphic links and owner assignments.

This is not the top production blocker, but it becomes important before real sensitive DFIR records are stored.

## API Review

API positives:

- Core tests cover auth, cookie sessions, case/incident scoping, cross-incident link blocking, notifications, timezone filters, uploads, and report permissions.
- Most create/update routes use Zod schemas and parameterized queries.
- Error responses use expected 401/403/404/409/500 patterns in tested paths.

API concerns:

- `x-user-id` fallback bypasses authentication.
- Static upload URLs bypass authorization.
- Query update authorization is too broad.
- Owner IDs are not consistently validated against incident/case membership.
- Large-list behavior should add pagination/limits where not already present.

## Frontend UX Review

The React/Vite app is usable for main demo navigation. Login, dashboard, cases, incidents, query library, tasks, settings, and reports loaded under browser testing. Responsiveness checks on Tasks and Settings showed no horizontal overflow at 1440, 1280, 1024, or 768 px; logout remained visible on Settings. The timezone control showed compact text, but the observed label was `UTC+0UTC`, which should be polished.

The main frontend production risks are workflow reliability: Settings logout did not visibly sign the user out in agent-browser, report PDF download timed out through the browser, and task note dialog clicks did not open in the browser session. Direct APIs worked for logout-related unit tests, PDF export, and note read/write/upload, so these need focused UI/browser debugging rather than broad rewrites.

## LLM / Report Generation Review

Backend report generation and PDF export are partially ready. Unit tests cover safe LLM error handling, secret masking, permission checks, sanitized template rendering, and PDF buffer export. Direct API PDF export returned HTTP 200 and a valid PDF document.

Production blockers remain around LLM provider configuration: arbitrary provider endpoints/custom headers create SSRF risk, and stored LLM secrets use a development fallback encryption key. LLM failure handling was graceful in live API testing: with the service unavailable, report generation returned HTTP 502 and `{"error":"LLM generation service failed.","details":null}` instead of crashing.

## File Upload Review

Upload handling has some good pieces: authorized upload route, 10 MB file limit, generated UUID filenames, safe path segments, and image MIME checks. The production blocker is download access: uploaded images are served publicly from `/api/uploads` and `/uploads` without checking auth or case membership. URLs include task IDs and can be fetched without cookies.

Before production, upload storage must be private by default, downloads must be authorized, and storage persistence/cleanup must be documented.

## Notification Review

Notification behavior is partial. Live testing confirmed task assignment and case member notifications. Finding creation notifications were observed. Timeline update code sends notifications, but timeline creation did not notify members in live testing. Non-member notification leakage was not observed in the tested workflow.

Notification correctness matters for incident response workflows, so timeline creation and any other missing workflow notifications should be covered with automated tests.

## Search and Query Review

Search access control passed the focused test: non-member search did not return private finding data, while member search did. `src/server/services/searchService.ts` scopes through accessible incidents derived from incident/case membership.

The query library is not production-ready. It lacks required columns, does not use a syntax-highlighted query body editor in the observed modal, and server-side editing rules allow broader mutation than the requested owner-or-allowed-role model.

## Timezone Review

Timezone storage and filtering have existing unit coverage, and browser responsiveness did not show header overflow in Settings. The observed compact timezone text `UTC+0UTC` should be cleaned up. Reports and exports should explicitly state the selected timezone if they do not already in every template.

No evidence was found that timezone conversion corrupts stored data, but this area should remain in regression coverage because DFIR timelines are time-sensitive.

## Performance Review

The app performed well on the small seeded demo dataset. Browser vitals for `/tasks` were TTFB 4 ms, FCP 80 ms, LCP 436 ms, and CLS 0.16. The CLS value is above the recommended 0.1 threshold and should be improved.

The main code-level performance issue found is per-row tag loading in findings and timeline list services. Client build chunks are large enough to merit route/component splitting review, especially Markdown editor and select-related chunks.

## Deployment Review

Deployment is not production-ready. There is no `.env.example`, the root README does not document production setup, Docker compose is demo-oriented, default database credentials are present, demo users are seeded by default, uploaded files are not persisted through a named volume, and secure cookie/reverse-proxy expectations are not documented.

The health endpoint exists and returned OK. `docker compose config` parsed successfully, but it also confirmed the unsafe demo defaults.

## Test Results

- `npm install`: Passed. Root dependencies were already up to date; npm audit reported 0 vulnerabilities.
- `npm --prefix src/client install`: Passed. Client dependencies were already up to date; npm audit reported 0 vulnerabilities.
- `npm run lint`: Passed. Root TypeScript check completed with exit 0.
- `npm run test`: Passed. Vitest ran 3 test files and 46 tests successfully:
  - `src/server/tests/demoSeed.test.ts`: 1 passed.
  - `src/server/tests/reportService.test.ts`: 13 passed.
  - `src/server/tests/api.test.ts`: 32 passed.
- `npm run build`: Passed. Vite built successfully. Notable generated chunks included approximately 370.60 kB, 408.68 kB, and 434.27 kB before gzip.
- `docker compose config`: Passed, but confirmed demo seeding and default DB credentials.
- Python service checks: `python` was not on PATH. `python3 -m venv` failed because host `python3-venv`/`ensurepip` support is unavailable. `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile services/litellm-service/app.py services/report-llm-service/app.py` passed. No service pytest files were found.
- GitNexus: The index was stale by 6 commits; `npx gitnexus analyze` refreshed it successfully with 3,524 nodes, 7,785 edges, 91 clusters, and 289 flows.

## Browser Verification

### Workflow 1: Auth and Bootstrap

- Steps performed: Started `PORT=8787 npm run dev:demo` and Vite on port 5174. Loaded login page. Tested invalid login with `lead/wrongpass`. Logged in with `lead/lead123`. Called direct auth APIs with and without cookies.
- Expected result: Protected app requires login, invalid login fails clearly, valid login works, logout clears state, unauthenticated users cannot access protected APIs.
- Actual result: Login page appeared; invalid login showed `Invalid username or password`; valid login reached Dashboard. Direct unauthenticated `/api/auth/me` returned 401. However, `x-user-id` allowed unauthenticated impersonation, and browser logout did not visibly clear the session during agent-browser testing.
- Pass/fail: Fail.
- Notes: Screenshot not required for the auth bypass; curl proof is more direct.

### Workflow 2: Case Membership

- Steps performed: Created a private case and incident as lead through API. Tested viewer access before membership. Added viewer as member. Retested access and notification state.
- Expected result: Case member can access case/incidents; non-member cannot.
- Actual result: Before membership, viewer received 404 for private case incidents and private incident findings. After membership, viewer access and notifications worked.
- Pass/fail: Partial pass because normal scoping worked, but global auth bypass B-01 invalidates production security.

### Workflow 3: Incident Core Workflow

- Steps performed: Created an incident, finding, timeline event, task, task assignment, markdown note, and note image upload through API and browser navigation where possible.
- Expected result: Core entities are created in current case/incident scope and linked entities remain scoped.
- Actual result: API creation paths worked. Task assignment was scoped to a case member. Existing tests cover cross-incident link blocking. Browser Tasks page loaded, but the notes dialog did not open reliably through agent-browser clicks.
- Pass/fail: Partial.

### Workflow 4: Notifications

- Steps performed: Added viewer to a private case. Created a finding, timeline event, and task assigned to viewer. Read viewer notifications.
- Expected result: Assigned/member users receive scoped notifications; non-members do not.
- Actual result: Viewer received `case.member_added`, `finding.created`, and `task.assigned`. No `timeline.created` notification appeared.
- Pass/fail: Partial.

### Workflow 5: Query Library

- Steps performed: Opened `/queries` as lead, selected the demo incident, inspected the table, opened a query modal, and checked fields/actions.
- Expected result: Table has ID, Query Name, Owner, Language, Description; filter works; modal shows syntax-highlighted query with copy and owner-aware edit controls.
- Actual result: Table showed Name, Language, Owner, Updated. Modal opened and had Copy/edit affordances, but query text was a plain textbox. Required ID and Description columns were missing.
- Pass/fail: Fail.

### Workflow 6: Markdown Notes and Images

- Steps performed: Wrote and read a task note through API. Uploaded a 1x1 PNG image to the note. Fetched the uploaded image without cookies.
- Expected result: Authorized note editing works; image persists; other users cannot access private images.
- Actual result: Note read/write/upload worked. The uploaded image was publicly fetchable without authentication.
- Pass/fail: Fail.

### Workflow 7: Report and PDF Generation

- Steps performed: Opened Reports page in browser, inspected template/generation UI, attempted browser download, then exported an existing report PDF through API.
- Expected result: Generate report, handle LLM failure gracefully, download PDF, no debug data.
- Actual result: Reports UI loaded. Browser download timed out in agent-browser. Direct API export returned HTTP 200 and a valid PDF. LLM failure with the service unavailable returned HTTP 502 with a safe error.
- Pass/fail: Partial.

### Workflow 8: Responsiveness

- Steps performed: Captured Tasks and Settings views at 1440, 1280, 1024, and 768 px.
- Expected result: Header, logout, settings, tables, and task board remain usable without horizontal overflow.
- Actual result: No horizontal overflow was detected on the tested pages; logout remained visible on Settings. Timezone text displayed as `UTC+0UTC`, which needs polish. CLS for `/tasks` was 0.16.
- Pass/fail: Partial pass.
- Screenshot notes: `/tmp/forenotes-tasks-1440.png`, `/tmp/forenotes-tasks-1280.png`, `/tmp/forenotes-tasks-1024.png`, `/tmp/forenotes-tasks-768.png`, `/tmp/forenotes-settings-1440.png`, `/tmp/forenotes-settings-1280.png`, `/tmp/forenotes-settings-1024.png`, `/tmp/forenotes-settings-768.png`.

## Production Readiness Checklist

| Category | Status | Notes |
|----------|--------|-------|
| Auth | Fail | `x-user-id` impersonation bypass is live; browser logout needs debugging. |
| RBAC | Partial | Case/incident scoping worked in tested paths, but owner/query authorization gaps remain. |
| Database | Partial | Fresh test setup works; production migration tracking and constraints need hardening. |
| API | Partial | Tests pass, but auth/upload/owner/query issues block production. |
| Frontend | Partial | Main navigation works; query, logout, notes, and PDF browser workflows need fixes. |
| Security | Fail | Auth bypass, public uploads, SSRF risk, demo credentials, rate limiting gaps. |
| Reports/PDF | Partial | API PDF works and tests pass; browser download and LLM config security need fixes. |
| File Uploads | Fail | Upload route authorizes writes, but downloads are public. |
| Notifications | Partial | Task/finding/member notifications worked; timeline create notification missing. |
| Search | Partial | Access scoping passed focused test; result context/query UX still needs product work. |
| Timezone | Partial | Existing coverage present; compact display needs cleanup and report timezone review. |
| Performance | Partial | Small dataset is fast; CLS and N+1 tag queries need improvement. |
| Deployment | Fail | No safe reproducible production setup docs; Docker defaults are demo/unsafe. |
| Tests | Partial | Root lint/test/build pass; Python services lack real test coverage. |

## Recommended Remediation Plan

### Phase 0: Production Blockers

1. Remove or strictly gate `x-user-id` auth fallback.
2. Replace public upload static serving with authorized file download routes.
3. Split demo and production deployment paths; fail startup on default credentials and disable demo credential copy outside demo mode.
4. Add LLM endpoint/header validation and egress restrictions.
5. Add `.env.example` and production deployment documentation.

### Phase 1: High-Risk Issues

1. Require `FORENOTES_LLM_SECRET_KEY` outside demo/test and document rotation.
2. Enforce owner membership validation for findings, timeline events, tasks, and queries.
3. Rework query library authorization and UI contract.
4. Add login rate limiting, security headers, and CSRF review/fixes.
5. Make upload storage persistent and production-configurable.

### Phase 2: Reliability and UX

1. Add browser regression tests for login/logout, case membership, notes/images, query modal, reports/PDF, and responsive layouts.
2. Fix browser logout, notes dialog, and PDF download issues observed in agent-browser.
3. Add timeline creation notifications and tests.
4. Improve timezone compact display and report/export timezone labeling.

### Phase 3: Hardening and Polish

1. Add migration history and stronger database constraints.
2. Batch-load tags and reduce large client chunks.
3. Harden report template CSS sanitization.
4. Remove or deprecate stale LLM service code.
5. Update stale docs that still describe header-auth workflows.

## Final Verdict

Forenotes is not production ready.

The app is internally usable for controlled demos and private validation, and the core implementation is moving in the right direction. It should not be exposed to production networks or real sensitive DFIR data until the authentication bypass, public upload access, demo credential defaults, LLM SSRF risk, and production deployment documentation are fixed and re-verified.
