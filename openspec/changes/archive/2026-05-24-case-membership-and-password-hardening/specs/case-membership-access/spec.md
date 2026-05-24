## ADDED Requirements

### Requirement: Case creation SHALL support initial member assignment
The system SHALL allow authorized users to add existing users as case members during case creation, assign a case role per selected user, default newly added users to the `analyst` role unless explicitly changed, and always include the creator as a `case_lead`.

#### Scenario: Create case with selected members
- **WHEN** an authorized user creates a case with a list of existing users and selected case roles
- **THEN** the system creates the case and the corresponding case memberships in one successful operation

#### Scenario: Creator is enrolled automatically
- **WHEN** an authorized user submits case creation without explicitly adding themselves
- **THEN** the system still creates a case membership for the creator with the `case_lead` role

#### Scenario: Duplicate members are rejected
- **WHEN** a case creation request includes the same user more than once
- **THEN** the system rejects the request with a validation error and does not create partial duplicate memberships

#### Scenario: Invalid case role is rejected
- **WHEN** a case creation request includes a member role that is not allowed for case membership
- **THEN** the system rejects the request with a clear server-side validation error

### Requirement: Authorized users SHALL manage case members from case detail
The system SHALL provide case-level member management that lets authorized users view members, add existing users, change member roles, and remove members from a case, while preventing removal or demotion of the last `case_lead`.

#### Scenario: Case lead adds a member
- **WHEN** a `case_lead` opens a case and adds an existing user with a valid role
- **THEN** the user becomes a case member and gains access according to that role

#### Scenario: Analyst cannot manage members
- **WHEN** an `analyst` attempts to add, remove, or change case members
- **THEN** the system denies the action with an authorization error

#### Scenario: Last case lead cannot be removed
- **WHEN** a request would remove or demote the only remaining `case_lead` for a case
- **THEN** the system rejects the request with a conflict or validation error and preserves the membership

### Requirement: Incident access SHALL inherit from case membership
The system SHALL authorize incident access and incident-scoped resources through the parent case membership rather than requiring separate manual incident membership management in the user-facing workflow.

#### Scenario: Case member opens existing incident
- **WHEN** a user is a member of a case that already contains incidents
- **THEN** the user can access those incidents and their allowed resources according to the user's case role

#### Scenario: New incident inherits case members
- **WHEN** a new incident is created under a case
- **THEN** all current case members gain access to that incident without needing manual incident-member assignment

#### Scenario: Removed case member loses incident access
- **WHEN** a user is removed from a case
- **THEN** the user loses access to the case and all incidents under that case

### Requirement: Incident membership compatibility SHALL remain synchronized during transition
The system SHALL keep existing incident membership records synchronized from case membership changes until incident memberships are no longer required for compatibility.

#### Scenario: Added case member is synced to existing incidents
- **WHEN** a user is added to a case that already has incidents
- **THEN** the system creates or updates the corresponding compatibility incident memberships for every incident in that case

#### Scenario: Removed case member is synced out of incidents
- **WHEN** a user is removed from a case
- **THEN** the system removes or deactivates the corresponding compatibility incident memberships for every incident in that case

### Requirement: Incident member management SHALL not be required in the UI
The system SHALL not require users to manage access separately at the incident level in order to grant or revoke access to incidents within a case.

#### Scenario: Incident detail omits member-management workflow
- **WHEN** a user opens incident detail
- **THEN** the UI does not present incident-member management as the primary access-control workflow

#### Scenario: Case members gain access without incident edit
- **WHEN** a `case_lead` adds a user from the case members workflow
- **THEN** the added user can access case incidents without any additional incident-level membership action
