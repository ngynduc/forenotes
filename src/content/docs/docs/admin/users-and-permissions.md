---
title: Users and permissions
description: Create users and assign the minimum global and case roles they need.
---

Forenotes combines a **global role** with a **case role**. Access to a specific case is the more restrictive result of the two.

## Global roles

| Role | Use it for |
| --- | --- |
| Admin | User administration, system settings, and all investigation work |
| Commander | Creating cases and coordinating investigations |
| Analyst | Investigating assigned cases and producing reports |
| Viewer | Read-only access to assigned cases |

## Add a user

1. Open **Admin → Users**.
2. Select **Add user**.
3. Enter a unique username, email address, display name, and temporary password.
4. Choose the lowest global role that covers the person's responsibilities.
5. Ask the user to sign in and replace the temporary password.

Only admins can manage users and global roles.

## Edit an existing user

Open **Admin → Users**, choose the user's edit action, and update their username, email, display name, global role, or active/disabled status. Saving updates the existing account. Duplicate usernames or email addresses are rejected, and edits are recorded in the audit trail.

Role and profile changes refresh open workspaces. Disabling an account blocks browser and MCP access. Password changes and resets revoke browser sessions; the user must sign in again.

## Grant case access

Open a case, select **Members**, and add the user as a commander, analyst, or viewer. Case membership does not grant global administration access.

Case membership grants the corresponding incident access throughout the case. Removing case membership removes access to all its incidents. The compatibility incident-member removal endpoint also removes parent-case membership; it cannot limit removal to one incident.

MCP tokens inherit the owner's current roles and case access. A read-write token cannot grant permissions the owner lacks. See [MCP investigation agents](/docs/admin/mcp/).

:::tip
Review case membership when an investigation closes. Removing access is safer than leaving dormant memberships in place.
:::

See the [permission matrix](/docs/reference/permission-matrix/) for an action-by-action summary.
