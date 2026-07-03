# Authentication And Authorization

Forenotes uses username/password login with database-backed HTTP-only sessions in production.

## Session Login

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
Set-Cookie: forenotes_session=<opaque session id>; HttpOnly; SameSite=Lax; Path=/
```

The session is looked up in PostgreSQL on later API requests. Logout deletes the session and clears the cookie.

## Header Auth Boundary

`x-user-id` header auth is only for tests or explicitly enabled non-production development:

```dotenv
FORENOTES_ALLOW_HEADER_AUTH=true
```

Production ignores header auth and refuses unsafe production settings.

## Password Rules

New passwords must:

- be at least 12 characters
- contain at least one letter
- contain at least one number or symbol
- differ from the current password when changed by the user

Bootstrap and reset flows can mark users with `must_change_password` so the UI requires a first-login password change.

## Roles

| Scope | Roles |
|-------|-------|
| Global | `admin`, `commander`, `analyst`, `viewer` |
| Case | `commander`, `analyst`, `viewer` |
| Incident | `commander`, `analyst`, `viewer` |

Admins can manage the system. Commanders lead investigation work. Analysts contribute records. Viewers review work without mutation access.

## Access Layers

1. Resolve the user from `forenotes_session`.
2. Check the user's global role and permission catalog.
3. Require case membership for case-scoped routes.
4. Require incident membership for incident-scoped routes.
5. Apply service-level rules such as assignment ownership or last-commander protection.

## Permission Groups

| Group | Examples |
|-------|----------|
| Cases | Create cases, update cases, manage case members |
| Incidents | Create incidents, update incidents, manage incident members |
| Findings | Create, update, delete, and link evidence |
| Timeline | Create, update, delete, and tag events |
| Indicators | Create, update, and delete IoCs |
| Tasks | Create, update, assign, and link evidence |
| Queries | Create, update, delete, and tag saved queries |
| Reports | Create, update, delete, generate, and export reports |
| Admin | User management and audit-log review |

Task assignees can update their own task progress without needing the assignment permission. Changing owner or assignee requires assignment authority.

## Production Checks

Before exposing the app:

- Keep `SECURE_SESSION_COOKIES=true` behind HTTPS.
- Disable demo mode.
- Leave header auth disabled.
- Use a long random `FORENOTES_LLM_SECRET_KEY`.
- Change the bootstrap admin password after first login.
