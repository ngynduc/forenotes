---
title: Permission matrix
description: Compare global and scoped roles across common Forenotes actions.
---

Authorization has two layers: a global role grants capabilities, then case or incident membership grants access to the selected investigation.

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

The table summarizes default intent. The server enforces named permissions such as `case:create`, `finding:update`, `task:assign`, and `report:export`, as well as membership on every scoped route.

:::note
Task assignees can update their own task progress. Changing the owner or assignee requires `task:assign`.
:::
