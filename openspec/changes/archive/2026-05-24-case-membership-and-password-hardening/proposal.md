## Why

Forenotes currently makes access control harder than it needs to be: case creation cannot assign collaborators, case detail has no member management, incident access depends too heavily on separate incident memberships, fresh production bootstraps have no default admin, and users cannot manage passwords safely. These gaps block production readiness and force administrators to patch access manually after the fact.

## What Changes

- Make case membership the primary access boundary for cases and all incidents under each case.
- Add member selection during case creation, including automatic creator enrollment as `case_lead`.
- Add case-level member management for authorized users, including add, remove, and role change workflows with protection against removing the last case lead.
- Remove or hide incident-member management from the UI and treat incident memberships as transitional compatibility data only.
- Update incident-scoped authorization helpers and resource APIs to resolve permissions through the parent case membership.
- Add bootstrap admin creation driven by environment variables when no admin exists, with hashed passwords and forced password rotation for default credentials.
- Add self-service password change plus admin password reset flows with server-side password policy enforcement and `mustChangePassword` handling.

## Capabilities

### New Capabilities
- `case-membership-access`: Case-scoped membership management, incident access inheritance from case membership, compatibility sync to incident memberships, and member-management UI flows.
- `bootstrap-admin`: Safe bootstrap creation of a default admin account on fresh environments with forced password change safeguards.
- `password-management`: Self-service password change, admin password reset, password policy enforcement, and forced password-change flows.

### Modified Capabilities

None.

## Impact

- **Database**: Adds or updates user/account fields for bootstrap and password state, plus any migration/backfill needed to derive case memberships from existing incident memberships.
- **Backend**: Updates central authorization helpers, case and incident membership services, bootstrap logic, user-management routes, and all incident-scoped APIs that currently depend on direct incident membership checks.
- **Frontend**: Updates case creation, case detail, settings/account, and admin user-management flows; removes incident-member management affordances from the UI.
- **Security**: Password hashing, password policy validation, forced password rotation, and reduced authorization drift by centralizing checks on case membership.
- **Operations**: Fresh deployments gain a deterministic bootstrap admin path without creating duplicates on restart.
