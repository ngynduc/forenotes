## ADDED Requirements

### Requirement: Fresh environments SHALL create a bootstrap admin when no admin exists
The system SHALL create a default admin user during bootstrap or startup when no admin user exists, using configured environment variables for email, username, display name, and password.

#### Scenario: Fresh database gets one admin
- **WHEN** the application starts against a database with no admin users
- **THEN** the system creates exactly one admin user from the bootstrap configuration

#### Scenario: Existing admin prevents duplicate bootstrap
- **WHEN** the application starts and at least one admin user already exists
- **THEN** the system does not create an additional bootstrap admin

### Requirement: Bootstrap admin credentials SHALL be stored securely
The system SHALL hash the bootstrap admin password before persistence and SHALL NOT log the plaintext password during bootstrap or startup.

#### Scenario: Stored password is hashed
- **WHEN** the bootstrap admin is created
- **THEN** the persisted password value is a hash rather than the provided plaintext secret

#### Scenario: Startup logs do not reveal password
- **WHEN** bootstrap admin creation succeeds or is skipped
- **THEN** application logs do not include the configured bootstrap password value

### Requirement: Temporary bootstrap credentials SHALL require password rotation
The system SHALL mark bootstrap-created users with `mustChangePassword` when they are created with the default or otherwise temporary bootstrap password, and the user SHALL be forced to change that password before reaching the normal application workspace.

#### Scenario: Default bootstrap password triggers password change
- **WHEN** the bootstrap admin logs in with a password that is flagged as temporary
- **THEN** the application requires a successful password change before granting normal dashboard access

#### Scenario: Production warning for default password
- **WHEN** the application is configured with the default bootstrap password in production mode
- **THEN** the system emits a clear warning without exposing the plaintext password
