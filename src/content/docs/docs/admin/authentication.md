---
title: Authentication
description: Understand browser sessions, bootstrap credentials, and development-only header authentication.
---

Forenotes uses database-backed browser sessions. After a successful login, the browser receives an opaque `forenotes_session` cookie; credentials and role information are not stored in the cookie.

## Bootstrap administrator

The first production start creates the administrator configured by the `FORENOTES_BOOTSTRAP_ADMIN_*` variables. Use a unique temporary password of at least 12 characters, sign in once, and change it immediately.

Keeping `FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true` makes the forced password-change intent explicit.

## Session cookies

Set `SECURE_SESSION_COOKIES=true` whenever users reach Forenotes over HTTPS. Use `false` only for a local HTTP installation.

Sessions can be revoked by disabling the user or changing their credentials. Do not share user accounts: individual accounts preserve useful audit attribution.

Changing or resetting a password revokes browser sessions, including the current session. Sign in again using the new password. Role, profile, and membership changes refresh open workspaces; the server always checks current access.

## MCP bearer tokens

The optional `/mcp` endpoint uses user-owned bearer tokens created in Settings. Tokens are stored as hashes and inherit current owner permissions and case memberships. Required password rotation or disabling the owner blocks MCP access immediately.

Browser cookies cannot authenticate MCP, and MCP tokens cannot authenticate `/api`. Follow [MCP investigation agents](/docs/admin/mcp/) for endpoint configuration, expiry, and revocation.

## Header authentication

`FORENOTES_ALLOW_HEADER_AUTH=true` enables a development and test convenience mode. It is always disabled in production, and production startup refuses to run when it is enabled.

:::caution
Never expose a header-auth development server to an untrusted network.
:::
