# Authentication & Authorization

## Authentication

Forenotes uses header-based authentication. The client must set the `x-user-id` header with a valid user UUID on every request.

```
GET /api/cases
x-user-id: 550e8400-e29b-41d4-a716-446655440000
```

The `authService` resolves the user from this header:
- Looks up the user by ID in the `users` table
- Verifies user status is `active`
- Returns 401 if user not found or inactive

## Authorization Model (RBAC)

Authorization uses a three-tier Role-Based Access Control system.

### Global Roles

| Role | Description | Access Level |
|------|-------------|-------------|
| `admin` | System administration | All permissions |
| `commander` | Full system access | All permissions |
| `analyst` | Investigation contributor | Limited permissions |
| `viewer` | Read-only investigation access | Read permissions |

### Case Roles

Assigned per case via `case_members`:

| Role | Description |
|------|-------------|
| `commander` | Leads the case investigation |
| `analyst` | Contributes to the case investigation |
| `viewer` | Reviews case records |

### Incident Roles

Assigned per incident via `incident_members`:

| Role | Description |
|------|-------------|
| `commander` | Leads the incident response |
| `analyst` | Contributes to the incident response |
| `viewer` | Reviews incident records |

## Permission System

35 granular permissions control access to operations:

### Case Permissions
| Permission | Description |
|-----------|-------------|
| `case:create` | Create new cases |
| `case:update` | Update case details |
| `case:member_manage` | Add/remove case members |

### Incident Permissions
| Permission | Description |
|-----------|-------------|
| `incident:create` | Create incidents within a case |
| `incident:update` | Update incident details |
| `incident:member_manage` | Add/remove incident members |

### Finding Permissions
| Permission | Description |
|-----------|-------------|
| `finding:create` | Create findings |
| `finding:update` | Update findings |
| `finding:delete` | Delete findings |
| `finding:evidence_link` | Link findings to evidence |
| `finding:evidence_unlink` | Unlink findings from evidence |

### Timeline Permissions
| Permission | Description |
|-----------|-------------|
| `timeline:create` | Create timeline events |
| `timeline:update` | Update timeline events |
| `timeline:delete` | Delete timeline events |

### Indicator Permissions
| Permission | Description |
|-----------|-------------|
| `indicator:create` | Create indicators |
| `indicator:update` | Update indicators |
| `indicator:delete` | Delete indicators |

### Task Permissions
| Permission | Description |
|-----------|-------------|
| `task:create` | Create tasks |
| `task:update` | Update task details |
| `task:assign` | Change task owner/assignee |
| `task:link` | Link tasks to evidence entities |

### Query Permissions
| Permission | Description |
|-----------|-------------|
| `query:create` | Create queries |
| `query:update` | Update queries |
| `query:delete` | Delete queries |

### Tag Permissions
| Permission | Description |
|-----------|-------------|
| `tag:custom_create` | Create custom tags |
| `tag:custom_update` | Update custom tags |

### Other Permissions
| Permission | Description |
|-----------|-------------|
| `entity_link:read` | View entity relationships |
| `entity_link:create` | Create entity relationships |
| `entity_link:delete` | Delete entity relationships |
| `graph:read` | View incident graph |
| `mitre_matrix:read` | View MITRE ATT&CK matrix |
| `notification:read` | View notifications |
| `audit:read` | View audit logs |

## Access Control Layers

Authorization is enforced at three levels:

### 1. Permission Check
The user's global role must grant the required permission for the operation.

### 2. Case Membership
The user must be a member of the case to access any data within it. Checked via `case_members` table.

### 3. Incident Membership
The user must be a member of the incident to access incident-scoped data. Checked via `incident_members` table.

### Enforcement Flow

```
Request
  → Authenticate (x-user-id → user lookup)
  → Check permission (role → permission mapping)
  → Check case membership (if case-scoped)
  → Check incident membership (if incident-scoped)
  → Execute operation
```

## Role-Permission Matrix

| Permission Group | Admin | Commander | Analyst | Viewer |
|-----------|:-----:|:---------:|:-------:|:------:|
| Administration and membership | Y | Y | - | - |
| Create/update investigation records | Y | Y | Y | - |
| Delete investigation records | Y | Y | - | - |
| Reports | Y | Y | Y | Read/export |
| Graph and MITRE reads | Y | Y | Y | Y |
| Entity links | Y | Y | Read/create | Read |
| Notifications | Y | Y | Y | Y |
| Audit and user management | Y | Y | - | - |

**Note:** Task assignees can update their own task's progress without needing `task:assign` permission. The `task:assign` permission is only required to change the owner or assignee of a task.
