# Authentication & Authorization

## Authentication

Forenotes production authentication is username/password login with a database-backed HTTP-only session cookie.

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "correct horse battery staple"
}
```

On success the server sets:

```text
Set-Cookie: forenotes_session=<uuid>; HttpOnly; SameSite=Lax; Path=/
```

The cookie is looked up in the `sessions` table on later API requests. Sessions expire after 12 hours. `/api/auth/logout` deletes the session and clears the cookie.

## Header Auth

`x-user-id` header auth is supported only for tests or explicitly enabled non-production development:

```dotenv
FORENOTES_ALLOW_HEADER_AUTH=true
```

When `NODE_ENV=production`, header auth is always disabled. Production startup also refuses `FORENOTES_ALLOW_HEADER_AUTH=true`.

## Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Create a session cookie from username/password |
| `POST` | `/api/auth/logout` | Delete the current session |
| `GET` | `/api/auth/me` | Return the current user and permissions |
| `POST` | `/api/auth/change-password` | Change the current user's password |

Login failures are rate-limited per IP and username.

## Password Policy

New passwords must:

- be at least 12 characters
- contain at least one letter
- contain at least one number or symbol
- differ from the current password when changed by the user

Bootstrap and reset flows mark users with `must_change_password` so the UI can require a first-login password change.

## Authorization Model

Authorization combines global RBAC with case and incident membership.

### Global Roles

| Role | Description |
|------|-------------|
| `admin` | System administration and all permissions |
| `commander` | Full investigation leadership access |
| `analyst` | Investigation contributor access |
| `viewer` | Read-only investigation access |

### Case Roles

| Role | Description |
|------|-------------|
| `commander` | Leads the case investigation |
| `analyst` | Contributes to the case investigation |
| `viewer` | Reviews case records |

### Incident Roles

| Role | Description |
|------|-------------|
| `commander` | Leads the incident response |
| `analyst` | Contributes to the incident response |
| `viewer` | Reviews incident records |

## Access Control Layers

1. Authentication resolves the current user from `forenotes_session`.
2. The user's global role grants or denies the requested permission.
3. Case-scoped routes require case membership.
4. Incident-scoped routes require incident membership.
5. Services perform the mutation or read.

## Permission Groups

| Group | Examples |
|-------|----------|
| Cases | `case:create`, `case:update`, `case:member_manage` |
| Incidents | `incident:create`, `incident:update`, `incident:member_manage` |
| Findings | `finding:create`, `finding:update`, `finding:delete`, evidence links |
| Timeline | `timeline:create`, `timeline:update`, `timeline:delete` |
| Indicators | `indicator:create`, `indicator:update`, `indicator:delete` |
| Tasks | `task:create`, `task:update`, `task:assign`, `task:link` |
| Queries | `query:create`, `query:update`, `query:delete` |
| Tags | custom tag create/update and ATT&CK mappings |
| Graph/MITRE | graph and matrix reads |
| Reports | report create/update/delete/export |
| Admin/Audit | user management and audit-log reads |

Task assignees can update their own task progress without `task:assign`; `task:assign` is required to change owner or assignee.
