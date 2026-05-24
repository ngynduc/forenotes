## Purpose
Define self-service password changes, server-side password policy enforcement, admin password resets, and forced password-change behavior.

## Requirements

### Requirement: Users SHALL be able to change their own password
The system SHALL provide an authenticated self-service password change flow that requires the current password, a new password, and confirmation of the new password.

#### Scenario: Successful password change
- **WHEN** an authenticated user submits the correct current password and a valid new password with matching confirmation
- **THEN** the system updates the stored password hash and completes the password-change flow successfully

#### Scenario: Wrong current password is rejected
- **WHEN** an authenticated user submits an incorrect current password
- **THEN** the system rejects the password change with a clear validation or authentication error

#### Scenario: New password must differ from current password
- **WHEN** an authenticated user submits a new password that matches the current password
- **THEN** the system rejects the request with a validation error

### Requirement: Password policy SHALL be enforced server-side
The system SHALL enforce password policy for self-service changes and admin resets on the server, including a minimum length of 12 characters and a requirement that the password contain at least one letter and at least one number or symbol.

#### Scenario: Weak password is rejected
- **WHEN** a password change or reset request includes a password that does not meet policy
- **THEN** the system rejects the request with a clear validation error

#### Scenario: Valid password passes policy
- **WHEN** a password change or reset request includes a password that satisfies the policy
- **THEN** the system accepts the password for hashing and persistence if all other checks pass

### Requirement: Admins SHALL be able to reset another user's password
The system SHALL allow authorized admins to reset another user's password without knowing the user's current password, and the reset SHALL mark the target user as requiring a password change on next login.

#### Scenario: Admin resets user password
- **WHEN** an authorized admin sets a new temporary password for another user
- **THEN** the system updates the target user's stored password hash and sets `mustChangePassword` to `true`

#### Scenario: Non-admin cannot reset another user's password
- **WHEN** a non-admin attempts to reset another user's password
- **THEN** the system denies the request with an authorization error

### Requirement: Forced password change SHALL block normal app access until completion
The system SHALL require any user flagged with `mustChangePassword` to complete a successful password change before continuing into the normal application workspace.

#### Scenario: Forced change blocks dashboard
- **WHEN** a user with `mustChangePassword = true` logs in successfully
- **THEN** the application routes the user to the password-change flow instead of the normal dashboard

#### Scenario: Forced change clears after success
- **WHEN** a user completes the required password change successfully
- **THEN** the system clears `mustChangePassword` and allows normal application access under the consistent session rule chosen by the implementation
