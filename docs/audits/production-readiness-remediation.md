# Production Readiness Remediation

Date: 2026-05-25
Branch: dev
Commit: 84dc26815daba507ab760bfd9777a445bbe3ebc4 working tree
Auditor/Implementer: Codex

## Summary

Final verdict: Ready for controlled beta production use after deployment secrets are supplied and HTTPS/reverse-proxy assumptions are met. Not ready for broad public Internet exposure or high-scale production until the deferred migration/performance hardening items are completed.
Docker images built:
- forenotes:beta-v1-prod
- forenotes:beta-v1-dev

## Fixed Issues

| Audit ID | Severity | Area | Finding | Fix Summary | Verification |
|----------|----------|------|---------|-------------|--------------|
| B-01 | Blocker | Authentication | `x-user-id` allowed unauthenticated impersonation in production. | Header auth is ignored when `NODE_ENV=production`; non-production header auth is explicit and tests remain isolated. | `npm run test` includes production-mode regression returning 401 for `x-user-id`; agent-browser auth workflow passed. |
| B-02 | Blocker | File Uploads | Note images were public static files. | Removed static `/api/uploads` and `/uploads`; added authenticated upload routes that resolve task/incident membership before serving files. | API test proves unauthenticated image GET is 401 and authorized member GET is 200 image/png; agent-browser non-member image GET returned 404. |
| B-03 | Blocker | Deployment / Bootstrap | Docker seeded weak demo accounts and advertised demo credentials in the production UI path. | Production env validation rejects demo mode, development user seeding, default DB creds, default admin password, and header auth; demo credential copy is gated by `VITE_FORENOTES_DEMO_MODE`; prod/dev Dockerfiles split. | Production Docker smoke created only one bootstrap admin; dev smoke seeded demo data and login worked. |
| B-04 | Blocker | LLM / Security | User-configurable LLM base URLs and headers created SSRF/internal access risk. | Added provider allowlist, HTTPS/default endpoint validation, private/link-local/metadata host blocking, custom header restrictions, and Python service-side validation. | `npm run test` includes unsafe endpoint/header rejection; `python3 -m py_compile` passed for both services. |
| B-05 | Blocker | Deployment / Operations | Fresh production setup was not reproducible from checked-in docs/examples. | Added `.env.example`, `.env.production.example`, `.env.demo.example`, production-safe compose, demo compose, README deployment/migration/storage guidance, and healthchecks. | `docker build` and container smokes passed for prod/dev images. |
| H-01 | High | LLM Secrets | LLM encryption used a hard-coded fallback in production. | Production requires `FORENOTES_LLM_SECRET_KEY` with 32+ chars; runtime encryption refuses production fallback. | `npm run test` includes production encryption-key regression. |
| H-02 | High | Authorization / Data Integrity | Owner IDs were accepted without incident membership validation. | Findings, timeline events, tasks, and queries now validate owner membership; task owner defaults to actor. | `npm run test` rejects non-member owners across all four entity types. |
| H-03 | High | Query Library | Query editing was too broad and required columns were missing. | Query create defaults owner to actor; updates are owner-or-admin/commander/response lead; owner reassignment is elevated-only; table now shows ID, Query Name, Owner, Language, Description. | `npm run test` covers non-owner edit denial and elevated edit; agent-browser query headers returned ID/Query Name/Language/Owner/Description/Updated. |
| H-04 | High | Workflow Reliability | Browser-critical logout, notes, and PDF flows did not validate cleanly in the audit. | Revalidated auth/logout/change-password via browser-backed session, note write/upload/download, deterministic report generation, and PDF export. | agent-browser: login OK, change-password API 204, logout API/JS-click cleared session to 401, note image member 200/non-member 404, PDF export 55,300 bytes. |
| H-05 | High | Docker Runtime | Docker was demo-oriented and unsafe for production. | Prod image/compose use production mode, external env secrets, persistent `/app/data`, no demo seed, healthcheck, and bounded migration retry; dev image/compose are separate and seed demo data. | `forenotes:beta-v1-prod` and `forenotes:beta-v1-dev` build and smoke successfully. |
| H-06 | High | Brute Force / Browser Security | Login lacked throttling and common browser security headers. | Added in-memory failed-login throttling and common security headers; disabled Express `x-powered-by`. | `npm run lint`, `npm run test`, and browser login workflow passed. |
| M-01 | Medium | Notifications | Timeline creation did not notify case members. | Timeline create now notifies other incident members. | `npm run test` includes `timeline.created` notification assertion. |
| M-06 | Medium | Service Testing | Python services had no executable validation path on host. | Kept host-independent compile validation and added service-side LLM safety validation. | `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile services/litellm-service/app.py services/report-llm-service/app.py` passed. |
| M-07 | Medium | Legacy Service | Older LiteLLM service exposed raw provider path risk. | Added endpoint/header validation to the legacy service; provider exception normalization remains deferred. | Python compile passed. |
| M-08 | Medium | Documentation Drift | Legacy docs conflicted with cookie-session auth. | README and env examples now define production/demo auth paths; broader legacy doc cleanup remains deferred. | README reviewed; deployment examples added. |

## Deferred Issues

| Audit ID | Severity | Area | Reason Deferred | Risk | Follow-up |
|----------|----------|------|-----------------|------|-----------|
| M-02 | Medium | Migrations | Full migration ledger/locking is larger than this blocker remediation. | Re-running idempotent SQL remains less auditable than applied migration history. | Add `applied_migrations`, advisory lock, per-file transaction behavior. |
| M-03 | Medium | Database Integrity | Requires schema migration design for enum/check constraints and polymorphic links. | Some invalid states still rely on service-layer validation. | Add check constraints and scoped FK-like integrity where polymorphism permits. |
| M-04 | Medium | Performance | N+1 tag loading and chunk splitting are not production blockers for beta dataset size. | Larger datasets may degrade list endpoints and client load performance. | Batch-load tags and split heavy client chunks. |
| M-05 | Medium | Report Template Hardening | Existing sanitizer remains acceptable for admin-only templates; deeper CSS sandboxing needs design. | Malicious admin templates could still stress rendering. | Keep templates admin-only, add stricter CSS URL parsing and sandboxed render tests. |
| M-06 | Medium | Service Testing | Real pytest coverage was not added because no service test harness exists yet. | Python service regressions rely on compile checks plus API integration behavior. | Add pytest or Docker/uv-based tests for both LLM services. |
| M-07 | Medium | Legacy Service | Error normalization was not fully reworked. | Legacy service may still return provider error detail in JSON. | Prefer report-llm-service; deprecate or normalize legacy service errors. |
| M-08 | Medium | Documentation Drift | Deep legacy docs were not exhaustively rewritten. | Older internal docs may still mention header auth. | Update `docs/API.md`, `docs/AUTHENTICATION.md`, `docs/ARCHITECTURE.md`, and phase docs. |
| M-09 | Low | Secret Hygiene | Local ignored secret cannot be rotated from code. | If the local key was real, it may remain exposed outside git. | Rotate any real provider key found in local `.env`; keep `.env*` ignored. |

## Validation Results

| Check | Command / Workflow | Result | Notes |
|-------|--------------------|--------|-------|
| Lint | `npm run lint` | Pass | Exit 0. |
| Tests | `npm run test` | Pass | 3 files, 54 tests passed. |
| Build | `npm run build` | Pass | Server TypeScript and Vite client build passed. |
| Migrations | `npm run db:migrate` | Pass | `Migrations applied`. |
| Demo seed | `npm run db:seed` | Pass | Seeded/reused demo users and created 6 cases / 11 incidents in configured DB. |
| Python service compile | `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile ...` | Pass | Both LLM service files compiled. |
| Docker prod image | `docker build -t forenotes:beta-v1-prod -f Dockerfile .` | Pass | Image ID `f4af0f3840a0`; smoke health `{"ok":true}`, users count `1`, demo users count `0`. |
| Docker dev image | `docker build -t forenotes:beta-v1-dev -f Dockerfile.dev .` | Pass | Image ID `ef022f6c5e90`; smoke login `lead`, seeded counts `6|11|34|35|86|23|11|11` for cases/incidents/findings/timeline/tasks/queries/templates/reports. |
| Browser auth workflow | `agent-browser` | Pass | UI login worked; change-password returned 204; logout cleared session; `/api/auth/me` returned 401 after logout. |
| Browser RBAC workflow | `agent-browser` | Pass | Analyst member read case/incident/finding/image; viewer non-member got 404 for case incidents, incident findings, and image. |
| Browser report/PDF workflow | `agent-browser` | Pass | Deterministic report generated and PDF export returned 55,300 bytes. |
| Browser responsive workflow | `agent-browser` | Pass | Tasks and Settings at 1440/1280/1024/768 had `scrollWidth == clientWidth`; screenshots in `/tmp/forenotes-remediation-*`. |
| GitNexus change detection | `gitnexus_detect_changes(scope=all)` | Reviewed | Critical scope expected because auth, protected routes, Docker runtime, and report/LLM security symbols changed; covered by API tests, browser workflows, and Docker smokes above. |

## Docker Usage

### Production Image

```bash
docker build -t forenotes:beta-v1-prod -f Dockerfile .
docker run --env-file .env.production -p 3000:3000 -v forenotes_data:/app/data forenotes:beta-v1-prod
```

Production image behavior:

* Runs migrations before starting.
* Does not seed demo data.
* Requires non-default database credentials, non-default bootstrap admin password, and `FORENOTES_LLM_SECRET_KEY`.
* Persists uploaded files and markdown notes under `/app/data`.
* Expects HTTPS/reverse-proxy deployment with `SECURE_SESSION_COOKIES=true`.

### Development / Demo Image

```bash
docker build -t forenotes:beta-v1-dev -f Dockerfile.dev .
docker run --env-file .env.demo -p 3000:3000 forenotes:beta-v1-dev
```

Demo image behavior:

* Runs migrations.
* Seeds demo users, cases, incidents, findings, timeline events, tasks, queries, notes, and reports.
* Clearly documents demo credentials.
* Never uses demo credentials in production image.

Demo credentials:

```text
admin / admin123
commander / commander123
lead / lead123
analyst / analyst123
viewer / viewer123
```

## Final Notes

Remaining beta assumptions:

* Deploy behind HTTPS and set `SECURE_SESSION_COOKIES=true`.
* Provide real production secrets through env or a secrets manager; do not bake secrets into images.
* Mount persistent storage at `/app/data` and back up Postgres separately.
* Keep LLM service egress restricted at the network layer even with application SSRF checks.
* Complete deferred migration ledger, database constraint, Python service test, and performance work before broader production rollout.
