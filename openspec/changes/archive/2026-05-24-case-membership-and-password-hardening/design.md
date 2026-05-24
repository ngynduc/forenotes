## Context

The current Forenotes access model mixes case-level and incident-level membership in ways that create extra UI work and inconsistent authorization behavior. Users can be incident members without a clear case membership workflow, case creation cannot assign collaborators up front, and incident detail currently carries membership concepts that should not be part of the day-to-day UX. On the authentication side, production bootstrap lacks a guaranteed admin path, and password management is incomplete because users cannot rotate their own passwords or be forced off bootstrap credentials safely.

This change is cross-cutting: it touches schema and seed/bootstrap behavior, shared auth contracts, backend authorization helpers, case and incident services, React workspace flows, and user/account security behavior. The implementation has to preserve existing data, keep admin access recoverable in fresh environments, and minimize risk while incident-membership compatibility is phased down.

## Goals / Non-Goals

**Goals:**
- Make case membership the authoritative access boundary for cases and all child incidents.
- Let authorized users assign case members during case creation and manage them later from case detail.
- Preserve compatibility with existing incident-membership-backed code while shifting enforcement to case membership first.
- Guarantee a bootstrap admin path for fresh deployments without duplicating admin accounts.
- Add secure password lifecycle flows for self-service change, admin reset, and forced password rotation.

**Non-Goals:**
- Removing incident membership tables immediately if existing code still uses them for joins or audit history.
- Introducing new identity providers, MFA, SSO, invitation emails, or external auth integrations.
- Redesigning the full role/capability taxonomy outside the case-access and password concerns in this brief.
- Building a full user-invitation onboarding flow; member assignment continues to target existing users only.

## Decisions

### 1. Treat case membership as the source of truth and sync incident memberships for compatibility
Authorization will resolve through case membership first. Existing incident membership tables stay in place temporarily so older code paths and historical data do not break during rollout. Case member changes will propagate to all incidents in the case, and new incidents will inherit all current case members automatically.

Alternatives considered:
- Remove incident memberships immediately: simpler end state, but too risky for a codebase that may still join or seed against those tables.
- Leave both models authoritative: preserves current ambiguity and guarantees long-term drift.

### 2. Centralize access checks in case-aware helpers
Server-side permission checks should converge on a `requireCasePermission(userId, caseId, permission)` primitive, with incident-level helpers resolving `caseId` from the incident first and then delegating. This keeps API routes from re-implementing membership logic inconsistently.

Alternatives considered:
- Patch each route independently: fast locally, but high regression risk and poor auditability.
- Keep incident membership as the main helper and add case fallbacks piecemeal: still duplicates logic and leaves the wrong primary model in place.

### 3. Model case roles explicitly and protect the last `case_lead`
The creator becomes `case_lead` automatically, added members default to `analyst`, and only authorized actors can change or remove members. Server validation must reject duplicate memberships, unknown roles, and any attempt to remove or demote the final `case_lead` unless a replacement is assigned in the same operation.

Alternatives considered:
- Let the UI enforce uniqueness and last-lead protection alone: insufficient because direct API callers could bypass it.
- Collapse `case_lead` into global admin only: does not satisfy delegated per-case administration.

### 4. Bootstrap admin creation belongs in deterministic startup/bootstrap logic, not ad hoc seed scripts only
Fresh environments need a guaranteed recovery path even when no seed data exists. Startup/bootstrap should check for any existing admin, create one if none exists, hash the configured password, set `isBootstrapAdmin`, and set `mustChangePassword` when the configured password is the default or otherwise flagged as temporary. Plaintext credentials must never be logged.

Alternatives considered:
- Ship a manual SQL/seed step only: easy to miss and brittle in production.
- Always recreate/update the configured admin on startup: risks overriding intentional admin changes.

### 5. Separate password-change and admin-reset flows while sharing password policy enforcement
Users changing their own password must verify the current password and choose a new one that passes policy and differs from the old secret. Admin reset should not require the target user's current password, but it must mark `mustChangePassword = true` and use the same password hashing and validation pipeline. Self-service password change should keep behavior consistent by either preserving the current session or reauthenticating every time; the implementation should pick one rule and enforce it everywhere.

Alternatives considered:
- Reuse the same endpoint for both self-change and admin reset: weak audit separation and confusing authorization rules.
- Allow admin resets without forced password change: unsafe for temporary credentials.

### 6. Expose membership and password management in the existing React workflows instead of adding a second admin-only access model
Case creation should include a lightweight member picker, case detail should gain a Members tab/panel, incident detail should stop surfacing membership management, Settings/Account should expose password change, and User Management should expose admin reset. This aligns the UX with the new domain boundary instead of asking users to manage access in multiple places.

Alternatives considered:
- Keep case management API-only and rely on scripts/admin intervention: fails the production-usability goal.
- Preserve incident membership UI and “also” add case membership UI: doubles the mental model and creates contradictory edits.

## Risks / Trade-offs

- **[Compatibility sync can drift if any write path bypasses case membership services]** -> Route all membership mutations through shared services and cover sync behavior with integration tests.
- **[Case-based authorization changes can unintentionally broaden access]** -> Audit all incident-scoped APIs, backfill memberships before switching checks, and validate negative-access scenarios in browser and API tests.
- **[Bootstrap admin credentials may remain weak in deployed environments]** -> Force password change on default/temporary credentials and emit a startup warning without logging the secret.
- **[Password changes may interact with existing session semantics unexpectedly]** -> Choose one post-change session rule, document it, and test old-password invalidation plus next-login behavior.
- **[Removing incident-member UI may hide a still-needed workflow during transition]** -> Keep compatibility data synced and verify no visible workflow still depends on manual incident membership edits before fully deleting code paths.

## Migration Plan

1. Audit existing membership schema and routes, then add any user/account columns needed for `mustChangePassword` and `isBootstrapAdmin`.
2. Add a backfill migration/script that derives case memberships from existing incident memberships, preserving the highest effective case role when duplicates exist.
3. Introduce case-authoritative membership services plus sync logic that updates existing incidents and new-incident creation flows.
4. Switch backend authorization helpers and incident-scoped APIs to resolve permissions through case membership.
5. Add bootstrap admin creation to startup/bootstrap, then add password change and admin reset endpoints.
6. Update the React client for case creation, case detail members, removed incident-member UI, account password change, and admin reset actions.
7. Validate with automated tests, `openspec validate`, and agent-browser coverage for bootstrap, access inheritance, removal, and password workflows.

Rollback: retain old incident membership data and gate the new case-authoritative checks behind a revertable code path during rollout. Because the schema changes are additive, rollback is primarily about switching enforcement and UI exposure back, not deleting data.

## Open Questions

- What exact case-role identifiers already exist in shared domain contracts, and does `case_lead` need to be introduced or mapped from an existing highest role?
- If the app currently has persistent login sessions, should self-service password change preserve the current session and invalidate others, or force a full re-login everywhere?
- Does notification delivery already exist for membership changes, or should notification hooks be deferred to a follow-up if the current system is not ready?
