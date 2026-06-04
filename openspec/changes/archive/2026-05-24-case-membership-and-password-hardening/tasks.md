## 1. Schema, contracts, and migration groundwork

- [x] 1.1 Audit existing case/incident membership schema and shared role contracts, then add any missing fields for `mustChangePassword`, `isBootstrapAdmin`, and case-level member management.
- [x] 1.2 Add a migration or one-time backfill path that creates missing case memberships from existing incident memberships while preserving the highest effective role per user and case.
- [x] 1.3 Extend shared auth/domain types and API schemas for case member roles, membership payloads, bootstrap-admin state, password-change requests, and admin reset requests.

## 2. Case-authoritative access control

- [x] 2.1 Implement shared case-membership services that add, remove, and update case members with duplicate prevention and last-`case_lead` protection.
- [x] 2.2 Implement incident-membership compatibility sync so case member changes propagate to existing incidents and new incidents inherit current case members automatically.
- [x] 2.3 Introduce or refactor `requireCasePermission` and case-backed `requireIncidentPermission`, then update incident-scoped services/routes to use them.
- [x] 2.4 Audit and update findings, timeline, tasks, entities, notes, reports, evidence, tags, notifications, search, and incident APIs so they authorize through the parent case.

## 3. Membership and auth backend flows

- [x] 3.1 Update case creation APIs to accept initial members, default added users to `analyst`, and always include the creator as `case_lead`.
- [x] 3.2 Add case detail member-management APIs for list, add, role change, and remove operations with case-level permission checks.
- [x] 3.3 Add bootstrap admin creation to startup/bootstrap logic using environment variables, hashed passwords, duplicate prevention, and forced password-change flags for temporary credentials.
- [x] 3.4 Add self-service change-password and admin reset-password endpoints with current-password verification, password-policy enforcement, and `mustChangePassword` handling.

## 4. Frontend access-management workflows

- [x] 4.1 Add member selection and role assignment to the case creation flow, including creator lock/default behavior and duplicate prevention in the UI.
- [x] 4.2 Add a Members tab or panel to case detail for authorized users to view, add, remove, and change roles with clear permission-state messaging.
- [x] 4.3 Remove or hide incident-member management affordances from the incident UI so access is not managed twice.
- [x] 4.4 Add a change-password screen or modal in Settings/Account and add an admin password-reset action in user management.

## 5. Validation and rollout proof

- [x] 5.1 Add unit tests for case-role validation, last-`case_lead` protection, case-to-incident sync, bootstrap-admin behavior, password policy, and forced-password-change flows.
- [x] 5.2 Add API integration tests for case creation with members, case member management permissions, inherited incident access, member removal access revocation, self-service password change, and admin reset.
- [x] 5.3 Run `npm run lint`, `npm run test`, `npm run build`, and `openspec validate --changes case-membership-and-password-hardening`.
- [x] 5.4 Validate the end-to-end workflows with agent-browser: bootstrap admin first login, case creation with members, case member add/remove, incident access inheritance, password change, and permission enforcement by role.
