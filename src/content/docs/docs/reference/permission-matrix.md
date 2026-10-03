---
title: Permission matrix
description: Compare global and scoped roles across common Forenotes actions.
---

Authorization has two layers: a global role grants capabilities, then case membership grants access to the selected investigation and its incidents. Incident membership is a derived view of case access.

| Action | Admin | Commander | Analyst | Viewer |
| --- | :---: | :---: | :---: | :---: |
| Manage users and global roles | ✓ | — | — | — |
| Create cases | ✓ | ✓ | — | — |
| Manage case or incident members | ✓ | ✓ | — | — |
| Create and update investigation records | ✓ | ✓ | ✓ | — |
| Delete investigation records | ✓ | ✓ | Role-dependent | — |
| Assign tasks to another user | ✓ | ✓ | Permission-dependent | — |
| Update an assigned task's progress | ✓ | ✓ | ✓ | — |
| Build graphs and MITRE views | ✓ | ✓ | ✓ | ✓ |
| Read reports | ✓ | ✓ | ✓ | ✓ |
| Create, edit, and export reports | ✓ | ✓ | ✓ | — |
| Read audit logs | ✓ | Permission-dependent | Permission-dependent | — |

The table summarizes default intent. The server enforces named permissions such as `case:create`, `finding:update`, `task:assign`, and `report:export`, as well as membership on every scoped route. MCP tokens inherit those same current permissions and case boundaries; a read-only token also blocks all tool writes.

:::note
Task assignees can update their own task progress. Changing the owner or assignee requires `task:assign`.
:::

See [MCP investigation agents](/docs/admin/mcp/) for token scopes and the human confirmation boundary.
