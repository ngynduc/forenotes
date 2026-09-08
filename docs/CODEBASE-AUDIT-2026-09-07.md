# Forenotes Codebase Audit

**Date:** 2026-09-07
**Revision:** `cde641d605b0dfa66c8ad5edb9c1d7126bc6b56b`
**Version:** `0.2.0`
**Scope:** code quality, security, performance, documentation, and shipping

## Executive assessment

Forenotes has a sound baseline: TypeScript strict mode, parameterized SQL, Argon2id password hashing, database-backed sessions, scoped entity services, sanitized report HTML, and a non-root production container. The codebase is becoming difficult to change because authorization has two competing membership models, report/LLM logic is spread across large modules and duplicate services, and dashboard/entity reads perform repeated work.

The highest-priority work is security and data-boundary correction before further feature work.

## Verified validation

- 84 of 84 Vitest tests passed across seven test files.
- Type checking and production application build passed.
- Production Compose configuration validation passed.
- `install.sh` and `rebuild.sh` passed shell syntax checks.
- Server production dependency audit reported no advisories.
- Client dependency audit reported six affected packages, including five high-severity advisories and one low-severity advisory. Most are development/build dependencies. React Router is currently `7.15.1`; applicability of its framework-mode advisories should be confirmed, but upgrading to a fixed version is recommended.
- GitNexus was reindexed against the audited revision. Import-cycle checks were clean.

The audit was read-only. No tracked source files were changed. The existing untracked `public/` directory was left untouched.

## Priority findings

### HIGH — Audit logs can disclose another case’s evidence

The audit-log route checks only the global `audit:read` permission. The service query does not constrain results by the requesting user’s visible cases or incidents. Audit rows include `before_json` and `after_json` payloads.

This was reproduced with an isolated database fixture: a commander with no case membership received another case’s private audit data.

**Remediation:** pass the authenticated user into the audit service and constrain every query by case/incident visibility. If global audit access is required, make it a separate explicit permission and restrict it to administrators.

### HIGH — Password rotation does not revoke existing sessions

Self-service password changes and administrator resets update the password hash but leave existing session rows valid. A stolen cookie remains usable until its 12-hour expiry and retains the user’s permissions.

This was reproduced for both administrator reset and self-service change.

**Remediation:** revoke sessions atomically during reset. During self-service change, revoke other sessions and rotate the current session.

### HIGH — PDF export performs server-side requests to arbitrary image URLs

Report Markdown permits HTTP/HTTPS image URLs. PDF export launches Chromium against the rendered HTML without network restrictions. A report member with report export permission can cause the server to request loopback or internal services; the response can be embedded in the generated PDF.

The real renderer fetched a temporary localhost fixture and produced a non-empty PDF.

**Remediation:** allow only validated, embedded report uploads; remove remote URLs before rendering; isolate Chromium and restore its sandbox where feasible.

### HIGH — A user-controlled LLM endpoint can receive the deployment API key

An analyst can save a custom HTTPS provider endpoint without a personal API key. The Node client sends an empty key, while the Python service independently falls back to its ambient `LLM_API_KEY`. The service then combines the deployment credential with the user-selected endpoint.

This argument flow was reproduced with a synthetic secret and a mocked provider call; no real credential or external request was used.

**Remediation:** resolve endpoint and credential as one trusted configuration. Never use an ambient deployment credential with a user-selected endpoint. Prefer a server-side allowlist for provider destinations.

## Additional security and correctness findings

### MEDIUM — Forced password rotation is enforced only in the React client

The client redirects users with `mustChangePassword`, but API authentication and permission checks do not enforce the flag. A flagged session can call ordinary protected endpoints directly.

**Remediation:** add a server-side gate that allows only session inspection, password change, and logout until rotation completes.

### MEDIUM — Account creation bypasses the documented password policy

The user-create route accepts passwords with a minimum of eight characters and hashes them directly. The shared policy requires at least twelve characters plus a letter and number or symbol.

**Remediation:** use the shared validator in every password-writing path and decide whether provisioned credentials always require rotation.

### MEDIUM — Incident membership removal does not reliably revoke incident access

The membership-management service deletes an incident-membership row, but authorization checks parent case membership. A migration also recreates incident rows from case membership. The result is inconsistent behavior between the UI’s incident-member controls and actual access decisions.

**Remediation:** choose one source of truth. If access is case-wide, remove misleading incident-level revocation controls. If incident restrictions are intended, enforce incident membership consistently.

### MEDIUM — Entity writes and audit writes are not transactional

Services persist the entity and then insert its audit row. If audit insertion fails, the request reports an error after the entity has already been changed.

**Remediation:** wrap mutation, audit, and related notification writes in a database transaction.

### MEDIUM — Login rate-limit state can grow without bound

Failed-login records are stored in an in-memory map and expired entries are deleted only when the same key is used again. An attacker can submit unique username/IP pairs indefinitely.

**Remediation:** use bounded TTL storage with periodic cleanup and separate per-IP and per-username limits.

### MEDIUM — PDF image embedding allows memory amplification

PDF export reads and base64-encodes every matching image concurrently with `Promise.all`, including duplicate references. A small Markdown body can repeat a large uploaded image many times and allocate substantial memory before Chromium times out.

**Remediation:** deduplicate image reads, cap aggregate embedded bytes, and limit concurrent exports.

### MEDIUM — LLM private-host checks do not resolve DNS

The TypeScript and Python validators reject literal private addresses but accept hostnames that resolve to private addresses. Redirects and DNS rebinding are not controlled.

**Remediation:** enforce destination restrictions at connection time with controlled egress, redirect validation, and DNS-aware checks.

## Performance and maintainability

- One dashboard request issued 50 database queries and loaded the primary dataset six times. Load the dataset once and derive summary, charts, SLA, workload, and case views from it.
- Listing 100 findings issued 202 queries because tags are fetched per finding. Batch tag queries and add pagination and bounded result sizes to list/search endpoints.
- `reportService.ts` is approximately 1,985 lines and combines persistence, uploads, templates, report context, timezone handling, encryption, and provider configuration. Split these responsibilities into focused modules.
- `src/client/src/lib/api.ts` is approximately 1,481 lines and combines transport, domain types, mapping, and endpoint methods. Separate API clients by domain and remove unsafe `as any` mutation casts.
- `src/server/devDemo.ts` is approximately 1,607 lines. Move fixture data and seed helpers into separate modules.
- Two LLM service implementations and two configuration contracts overlap. Select one service contract and remove or clearly mark the dormant path.
- Dynamic SQL inspected during this audit used fixed column/table mappings and parameterized values. No SQL injection was established.

## Documentation and shipping

### Installer behavior

The installer preserves an existing `.env.production` file. Rerunning with `--secure-cookies` therefore does not update the stored setting, even though the command appears successful. Document this explicitly or make the flag update the persisted configuration safely.

### Recovery completeness

The recovery guide backs up PostgreSQL but does not include the `/app/data` volume containing task notes and uploaded images. It also does not call out preserving `FORENOTES_LLM_SECRET_KEY`, which is required to decrypt stored provider credentials.

Add a tested backup/restore procedure covering the database, data volume, environment file, and encryption key.

### Competing production paths

The installer and production documentation use `docker-compose.prod.yml`, while `rebuild.sh --prod` uses `docker-compose.yml` and a different service arrangement. Consolidate these paths so operators have one supported production workflow.

### Mutable image defaults

The installer defaults to `ngynduc/forenotes:latest`. Use a versioned or immutable SHA tag for deliberate upgrades, and publish the matching Compose and environment templates with each release.

### Documentation drift

- README documents `npm run db:seed`, but the package scripts expose `seed:demo` instead.
- The report-LLM README documents `REPORT_LLM_SERVICE_URL`, while the active Node client reads `LITELLM_SERVICE_URL`.
- Migration execution replays every SQL file on startup without a migration ledger. This makes operational behavior harder to reason about and contributed to membership inconsistency.

## Recommended sequence

1. Fix audit-log scoping, session revocation, server-side forced rotation, PDF SSRF, and LLM credential routing.
2. Choose and enforce one membership model; make mutations transactional.
3. Consolidate production Compose, installer, image-tag, backup, and restore workflows.
4. Batch entity queries and cache one dashboard dataset per request.
5. Split the largest services and API modules, then remove duplicate LLM paths.
6. Upgrade client dependencies and add regression tests for each corrected boundary.

## Scope limits

This audit did not test a production deployment, perform sustained load testing, exercise the browser through agent-browser, or complete a Python/container dependency scan. Findings marked as reproduced were tested against local fixtures or mocked providers only.
