Below is a ready-to-use Phase 2 doc.

````md
# Forenotes Phase 2 — Real UI Implementation

## Phase Goal

Phase 2 converts the completed backend into a real workflow-driven frontend.

Phase 1 proved the backend works through an API/UI console. Phase 2 must replace console-style testing with a production-usable application UI where users can complete real investigation workflows: managing cases, incidents, findings, timeline events, tasks, tags, assignments, notifications, and linked entities.

The UI must not be treated as simple CRUD pages. Forenotes is a workflow application, so the frontend should be optimized for fast analyst/lead action, table-driven review, inline editing, scoped data visibility, and modal-based detail editing.

---

# 1. Phase 2 Scope

## Primary Objectives

Phase 2 must deliver:

- Real application shell and navigation
- Case and incident workspace UI
- Core entity CRUD screens
- Reusable table/shell system
- Inline table editing
- Modal popup detail editing
- Pagination and filtering
- Task Kanban board
- Role-aware UI behavior
- Notification UI
- Browser-based workflow validation

---

# 2. Application Shell

## Goal

Create a consistent app layout that supports day-to-day investigation workflows.

## Required Layout

The app should include:

- Top-level authenticated layout
- Sidebar or tab navigation
- Current case / incident context indicator
- User/account indicator
- Notification indicator with unseen count
- Main content area
- Reusable page header pattern
- Consistent create/edit modal system

## Required Navigation Areas

Minimum navigation:

- Cases
- Incident Workspace
- Findings
- Timeline
- Tasks
- Tags
- Queries
- Notifications
- Admin / Members, if supported

Navigation should be role-aware. Users should not see actions they cannot perform, but backend permission checks remain the source of truth.

---

# 3. Table Shell System

## Goal

The table shell is one of the most important Phase 2 components.

Most Forenotes workflows are table-first. Users should be able to view, filter, edit, assign, tag, and open detail records directly from tables without unnecessary page transitions.

This should be implemented as a reusable table/shell component used by Findings, Timeline, Tasks, Queries, Cases, Members, Systems, Accounts, and other entity lists.

---

## 3.1 Table Shell Requirements

Each table shell should support:

- Pagination
- Column sorting
- Column filtering
- Global search within current scope
- Inline cell editing
- Row selection
- Bulk actions where useful
- Open detail modal
- Create item modal
- Refresh/reload action
- Loading state
- Empty state
- Error state
- Permission-aware actions
- Current incident/case scoping

---

## 3.2 Pagination

Pagination is required for all large entity tables.

### Required Behavior

- Default page size: sensible default such as 25
- Supported page sizes: 10, 25, 50, 100
- Show current page
- Show total count if backend supports it
- Next / previous controls
- Preserve filters when changing pages
- Preserve sort when changing pages
- Preserve current incident/case context

### Acceptance Criteria

- User can move between pages without losing filters.
- User can change page size.
- Table does not fetch all records at once if backend supports paginated queries.
- Empty pages are handled cleanly after delete/filter changes.

---

## 3.3 Inline Shell Editing

Inline editing is required.

The desired UX is similar to a Streamlit-style editable table: the user clicks directly into a cell and edits the value without opening a full form.

### Editable Fields

Inline editing should be supported for fields that are safe and simple to change directly, such as:

- Title
- Description summary
- Status
- Severity
- Priority
- Source
- Owner / Assignee
- Tags
- Timestamps, where appropriate
- Query metadata
- Case status
- Incident status

Fields that require larger context should open the modal instead.

### Non-Editable Fields

Some fields should not be inline editable:

- ID
- Created at
- Created by
- Owner fields where ownership should be permission-controlled
- System-managed fields
- Fields restricted by role

### Required Inline Edit Behavior

- Click cell to edit
- Press Enter to save
- Press Escape to cancel
- Click outside should either save or cancel consistently
- Show pending save state
- Show validation errors directly near the cell
- Revert cell on failed save
- Optimistically update only if rollback is safe
- Respect permissions per field
- Disable editing for unauthorized users
- Backend remains final source of validation

### Example Behavior

For a Finding row:

| Field | Inline Editable |
|---|---|
| Title | Yes |
| Description | Prefer modal for long text |
| Source | Yes |
| Status | Yes |
| Owner | Yes, if user has permission |
| Tags | Yes |
| Created At | No |
| Created By | No |

---

## 3.4 Detail Modal Popup

Every table row should support opening a detail modal.

The modal is used for full editing and review when inline editing is not enough.

### Modal Requirements

Each modal should support:

- View full item details
- Edit allowed fields
- Save changes
- Cancel changes
- Delete/archive if permitted
- Copy ID/reference
- Show linked entities
- Show tags
- Show audit metadata
- Show validation errors
- Respect role permissions

### Modal UX

Opening a modal should not navigate away from the current table unless necessary.

Recommended behavior:

- Click row title opens modal
- Dedicated “Edit” button opens modal in edit mode
- Dedicated “View” button opens modal in read-only mode
- Modal should close back to the same table state
- Filters, pagination, and scroll position should be preserved

### Modal Types

Required modal types:

- Create Case
- Edit Case
- Create Incident
- Edit Incident
- Create Finding
- Edit Finding
- Create Timeline Event
- Edit Timeline Event
- Create Task
- Edit Task
- Create/Edit Query
- Create/Edit Tag, if needed

---

# 4. Task Management Kanban

## Goal

Tasks should support both table and Kanban workflows.

The table view is good for bulk review and inline editing. The Kanban view is better for operational task management.

---

## 4.1 Kanban Board Requirements

Tasks should be displayed in columns by status.

Recommended columns:

- Backlog
- Todo
- In Progress
- Blocked
- Done

Do not include unnecessary statuses such as `Ready` unless there is a clear workflow reason.

### Required Behavior

- Drag task between columns to update status
- Click task card to open detail modal
- Assign/reassign owner from card or modal
- Filter by owner
- Filter by priority
- Filter by tag
- Filter by linked entity
- Show due date if supported
- Show priority/severity
- Show linked finding/timeline item if any
- Show task notification behavior on assignment

### Permission Behavior

- Users without update permission cannot drag cards
- Users without assignment permission cannot change assignee
- Backend permission failure should show clear error and revert UI state

---

## 4.2 Task Table View

In addition to Kanban, Tasks should also have a table view.

Table view should support:

- Pagination
- Inline editing
- Sorting
- Filtering
- Bulk status update
- Bulk assignment, if permitted
- Open modal for details

---

# 5. Workflow-Driven UI Suggestions

The following are strongly recommended for Phase 2 because they improve real investigation workflows.

---

## 5.1 Saved Filters / Views

Users should be able to quickly switch between common views.

Examples:

- My Tasks
- Open Findings
- High Severity Findings
- Timeline Today
- Unassigned Tasks
- Recently Updated
- Items Missing Tags
- Items Linked to Current Incident

This avoids forcing users to rebuild filters repeatedly.

---

## 5.2 Current Scope Indicator

Because data must be scoped to case/incident, the UI should always show the current scope.

Example:

```text
Case: Client A Investigation
Incident: Test 1
Role: Commander
````

This helps prevent accidental cross-incident work.

---

## 5.3 Scoped Entity Linking

When linking a task to another item, the selector must only show items from the current incident.

Required behavior:

* Link task to finding from current incident only
* Link task to timeline event from current incident only
* Do not show entities from other incidents
* Backend should also reject invalid cross-incident links

---

## 5.4 Command Palette / Quick Search

A command palette would be useful after the core UI is stable.

Example shortcut:

```text
Ctrl+K
```

Actions:

* Search current incident
* Open finding
* Open task
* Open timeline event
* Create finding
* Create task
* Jump to case
* Jump to incident

This is very useful for analyst workflows.

---

## 5.5 Global Search With Context

Global search results must show where each item belongs.

Bad result:

```text
recon
tag
Entity: finding
Source: Tag
Test 1
```

Better result:

```text
Tag: recon
Entity: Finding
Finding: Suspicious PowerShell Recon
Incident: Test 1
Case: Client A Investigation
Source: Tag
```

Every search result should include:

* Result type
* Title/name
* Case
* Incident
* Source field
* Matched text
* Open action

---

## 5.6 Activity Feed

Each incident should have an activity feed.

Examples:

* Finding created
* Finding updated
* Timeline event added
* Task assigned
* Member added
* Tag changed
* Query added
* Incident status changed

This helps users understand what changed without checking every table.

---

## 5.7 Notification Center

Notifications should be visible and actionable.

Required behavior:

* Notification tab/bell shows unseen count
* Notifications have read/unseen state
* Clicking a notification opens the related item
* Assignment creates notification
* Membership change creates notification
* Finding/timeline/task create/update can notify relevant incident members
* Users can mark notification as read
* Users can mark all as read

---

## 5.8 Bulk Actions

Tables should support bulk actions where useful.

Examples:

* Assign selected tasks
* Change status for selected findings
* Add tag to selected findings
* Remove tag from selected items
* Archive selected records
* Mark selected notifications as read

Bulk actions must respect permissions.

---

## 5.9 Keyboard-First Workflow

Recommended keyboard behavior:

* Enter saves inline edit
* Escape cancels edit/modal
* Ctrl/Cmd+K opens command palette
* `/` focuses table search
* Arrow keys move between editable cells, if practical
* Ctrl/Cmd+Enter saves modal form

This is useful for fast analyst workflows.

---

## 5.10 Dirty State Protection

The UI should protect unsaved work.

Required behavior:

* Warn before closing modal with unsaved changes
* Warn before navigating away from unsaved form
* Preserve local form state after validation error
* Do not silently discard edits

---

## 5.11 Loading, Error, and Empty States

Every main UI area must have proper states.

### Loading State

Show skeletons or structured loading indicators.

### Empty State

Empty state should explain what to do next.

Example:

```text
No findings yet.
Create the first finding for this incident.
```

### Error State

Errors should be specific and actionable.

Example:

```text
You do not have permission to assign this task.
Required permission: record:assign
```

---

# 6. Entity-Specific UI Requirements

## 6.1 Cases

Required:

* Case table
* Case filters
* Create case modal
* Edit case modal
* Open case action

Case fields:

* Case name
* Client name
* Start date
* End date
* Status
* Case summary

---

## 6.2 Incidents

Required:

* Incident table/list under case
* Create incident modal
* Edit incident modal
* Member management
* Open workspace action

Incident workspace should become the primary work area.

---

## 6.3 Findings

Required:

* Findings table shell
* Create finding modal
* Edit finding modal
* Inline edit simple fields
* Tag add/remove
* Current incident scoping
* Filters

Suggested filters:

* Status
* Severity
* Owner
* Tag
* Source
* Created date
* Updated date

---

## 6.4 Timeline

Required:

* Timeline table shell
* Create timeline event modal
* Edit timeline event modal
* Inline edit simple fields
* Tags visible in table
* Tags editable if permitted
* Current incident scoping

Suggested filters:

* Time range
* Source
* Tag
* Created by
* Event type

---

## 6.5 Tasks

Required:

* Task table view
* Task Kanban view
* Create task modal
* Edit task modal
* Assignment workflow
* Linked entity selector scoped to current incident
* Notification on assignment

Suggested filters:

* Status
* Assignee
* Priority
* Due date
* Linked entity
* Tag

---

## 6.6 Queries

Required:

* Query table
* Query filters
* Query detail modal
* Query create modal
* Query edit modal if user is owner or has permission
* Copy query button
* Code block display for query body

Query table columns:

| Field       | Required |
| ----------- | -------- |
| ID          | Yes      |
| Query Name  | Yes      |
| Owner       | Yes      |
| Language    | Yes      |
| Description | Yes      |

Modal should include:

* Query name
* Language
* Description
* Query body in code block/editor
* Copy button
* Edit button if permitted

---

# 7. Permissions and Role-Aware UI

The UI should reflect permissions but never replace backend enforcement.

## Required Behavior

* Hide unavailable actions when appropriate
* Disable unavailable actions when useful for explanation
* Show clear errors when backend denies action
* Do not leak cross-incident data
* Do not allow linking across incidents
* Do not allow global tag access if tags are incident-local

## Important Rule

Frontend permission checks are for UX only.

Backend permission checks are mandatory and final.

---

# 8. Acceptance Scenarios

Phase 2 is not complete until these workflows pass in the real browser UI.

---

## Scenario 1 — Case and Incident Setup

As a Commander or permitted user:

1. Open Cases page
2. Create a case through modal
3. Edit case details through modal
4. Open the case
5. Create an incident
6. Add a member to the incident
7. Confirm the added member receives a notification

Expected output:

* Browser test log
* Screenshot of case table
* Screenshot of create/edit modal
* Screenshot of incident workspace
* Screenshot of notification indicator

---

## Scenario 2 — Finding Workflow

As a permitted incident member:

1. Open an incident
2. Create a finding through modal
3. Add tags to the finding
4. Confirm finding appears in table
5. Inline edit finding status
6. Open finding detail modal
7. Edit long description in modal
8. Save
9. Confirm table updates

Expected output:

* Browser test log
* Screenshot before edit
* Screenshot during inline edit
* Screenshot of modal edit
* Screenshot after save

---

## Scenario 3 — Timeline Workflow

As a permitted incident member:

1. Open Timeline
2. Create timeline event
3. Add tag
4. Confirm tag displays in table
5. Inline edit source/status if supported
6. Filter timeline by tag
7. Open event modal and edit details

Expected output:

* Browser test log
* Screenshot of timeline table with tag visible
* Screenshot of filtered timeline
* Screenshot of edit modal

---

## Scenario 4 — Task Kanban Workflow

As a Commander:

1. Open Tasks
2. Create task
3. Assign task to another member
4. Confirm assignee receives notification
5. Drag task from Todo to In Progress
6. Open task modal
7. Link task to a finding from the same incident
8. Confirm cross-incident entities are not available in selector

Expected output:

* Browser test log
* Screenshot of Kanban board
* Screenshot after drag/drop
* Screenshot of scoped linked entity selector
* Screenshot of notification

---

## Scenario 5 — Permissions Workflow

As a lower-permission analyst:

1. Open incident workspace
2. Confirm unauthorized actions are hidden or disabled
3. Attempt restricted action if UI exposes it
4. Confirm backend returns clear permission error
5. Confirm UI does not corrupt local state

Expected output:

* Browser test log
* Screenshot of disabled/hidden action
* Screenshot of permission error

---

# 9. Browser Testing Requirement

Phase 2 must be validated through browser-based workflow tests.

Testing should not stop at unit/API tests.

Required testing levels:

* Component-level tests for reusable UI pieces
* API integration tests for frontend/backend wiring
* Browser workflow tests for real user paths

Browser tests must produce useful output:

* Steps executed
* Actual result
* Expected result
* Screenshots for important states
* Error logs if failed

If browser output does not match expected workflow behavior, continue fixing until it does.

---

# 10. Definition of Done

Phase 2 is complete only when:

* Real UI replaces console-driven backend testing
* Main workflows are usable from the browser
* Table shell is reusable and used across major entities
* Pagination works
* Inline editing works
* Modal editing works
* Task Kanban works
* Notifications are visible and actionable
* Permissions are reflected in UI
* Backend remains source of truth
* Current incident/case scoping is enforced
* Browser workflow tests pass
* Screenshots/logs prove the workflows work

---

# 11. Recommended Implementation Order

## Step 1 — App Shell

* Authenticated layout
* Navigation
* Current case/incident context
* Notification indicator placeholder

## Step 2 — Reusable Table Shell

* Pagination
* Filters
* Sorting
* Inline edit foundation
* Row actions
* Empty/loading/error states

## Step 3 — Modal System

* Shared create/edit modal pattern
* Form validation
* Dirty-state protection
* Permission-aware fields

## Step 4 — Cases and Incidents UI

* Case table
* Case create/edit modal
* Incident list
* Incident create/edit modal
* Incident member management

## Step 5 — Findings and Timeline UI

* Table shell integration
* Inline editing
* Tags
* Filters
* Detail modals

## Step 6 — Tasks UI

* Task table
* Task Kanban
* Assignment
* Linked entity selector
* Notifications

## Step 7 — Queries UI

* Query table
* Query detail modal
* Copy button
* Owner-based editing
* Code editor for query - linecount/syntax highlight supported

## Step 8 — Notifications and Activity

* Notification center
* Unseen count
* Mark read/unread
* Activity feed if feasible

## Step 9 — Browser Acceptance Testing

* Validate all core workflows
* Capture screenshots/logs
* Fix until expected output matches actual output

```

My main extra suggestions for a workflow-driven UI are: **saved views**, **activity feed**, **command palette**, **bulk actions**, **dirty-state protection**, and **clear current case/incident scope**. Those will make the UI feel like an investigation workspace instead of just CRUD tables.
```
