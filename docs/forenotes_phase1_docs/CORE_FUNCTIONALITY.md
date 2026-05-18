# Forenotes Phase 1 Core Functionality

## Purpose

This document defines the required Phase 1 functionality for Forenotes. It should guide implementation, agent tasks, tests, and acceptance review.

## Phase 1 Product Goal

Build a usable incident response workspace where users can:

1. Create and manage cases.
2. Create and manage incidents inside cases.
3. Manage members and permissions.
4. Record findings as analyst conclusions.
5. Record timeline events as chronological observations.
6. Track systems, accounts, and indicators.
7. Link evidence to findings.
8. Manage tasks and assignments.
9. Use global MITRE ATT&CK tags and case-scoped custom tags.
10. Receive and read notifications.
11. Search across accessible records with clear scope context.
12. Preserve audit history for important actions.

## User Roles

Recommended global roles:

| Role | Purpose |
|---|---|
| Commander | Overall case and user management authority |
| Response Lead | Leads case/incident response work |
| Analyst | Performs investigation work inside assigned cases/incidents |

Server-side permissions must decide what each role can do. The UI may hide actions, but API checks are mandatory.

## Case Management

### Required Fields

- Case Name
- Client Name
- Start Date
- End Date
- Status: `open`, `closed`
- Case Summary

### Required Behavior

- Users with permission can create a case through a modal.
- Users with permission can edit case details through the same modal pattern.
- Case list has filtering.
- Case list shows important metadata.
- Case membership can be managed after case creation.
- Only authorized users can add/remove case members.

### Case Table

Suggested columns:

| Column | Notes |
|---|---|
| Case Name | Opens case details or incidents |
| Client Name | Filterable |
| Status | Filterable |
| Start Date | Sortable |
| End Date | Sortable |
| Created By | Display name |
| Actions | Open, Edit |

## Incident Management

### Required Fields

- Incident Name
- Summary
- Severity
- Status
- Case

### Required Behavior

- Incidents belong to a case.
- Users can only see incidents they are allowed to access.
- Incident workspace contains tabs/sections for findings, timeline, systems, accounts, indicators, tasks, queries, tags, and notifications.
- Incident members can be managed by authorized users.
- Adding a member to an incident should notify that user.

## Incident Workspace Layout

Recommended workspace sections:

```txt
Overview
Findings
Timeline
Systems
Accounts
Indicators
Tasks
Queries
Tags
Notifications
Audit
```

Layout requirements:

- Left/right collapse panels should use small arrow controls attached to the panel itself.
- Filters should be visually separate from add buttons.
- Create/edit workflows should use consistent modals.
- Tables should support filtering.
- Tables should support inline editing where required.

## Findings

A finding is an analyst conclusion. It is not just a raw event.

### Required Fields

- Title
- Description
- Severity
- Status
- Confidence
- Impact
- Recommendation
- Owner
- Tags
- Linked Evidence

### Required Behavior

- Users can create findings in an incident.
- Users can edit findings if authorized.
- Findings can be tagged with global MITRE ATT&CK tags.
- Findings can be tagged with custom tags from the current case.
- Findings can link to supporting evidence.
- Finding detail view must show linked evidence.
- Findings should be suitable for future report generation.

### Suggested Finding Statuses

```txt
draft
confirmed
false_positive
resolved
```

## Timeline Events

A timeline event is a chronological observation.

### Required Fields

- Event Time
- Title
- Description
- Source
- Raw Evidence Reference
- Owner
- Tags
- Linked Findings

### Required Behavior

- Users can create timeline events in an incident.
- Users can edit timeline events if authorized.
- Timeline table should be sorted by event time.
- Timeline events can be tagged with global MITRE ATT&CK tags.
- Timeline events can be tagged with custom tags from the current case.
- Timeline events can be linked to one or more findings as evidence.
- Timeline event detail view should show linked findings.

## Evidence Linking

Findings must support generic evidence links, not only timeline links.

### Evidence Types in Phase 1

```txt
timeline_event
system
account
indicator
query
```

Future evidence type:

```txt
attachment
```

### Required Behavior

- From a finding modal, users can add/remove supporting evidence.
- From a timeline event modal, users can link the event to one or more findings.
- From an indicator modal, users can link the indicator to one or more findings.
- From a system or account modal, users can link the entity to one or more findings.
- Evidence picker only shows entities from the current incident.
- API rejects evidence links across incidents.
- Duplicate links are blocked.

### Evidence Link Display

Finding detail should show evidence grouped by type:

```txt
Timeline Events
Systems
Accounts
Indicators
Queries
```

Each linked evidence item should show enough context to be useful:

- Type
- Title/name/value
- Source if available
- Event time if timeline event
- Link/open action

## Indicators

Indicators represent IoCs or other investigation artifacts.

### Supported Indicator Types

```txt
host
ip
domain
url
email
file_hash
registry
mutex
process
user_agent
other
```

### Required Fields

- Indicator Type
- Value
- Description
- Confidence
- Source
- First Seen
- Last Seen

### Required Behavior

- Users can create indicators inside an incident.
- Users can edit indicators if authorized.
- Indicators can be linked to findings as evidence.
- Indicator table should support filtering by type, value, confidence, and source.
- Duplicate indicator values of the same type should be prevented inside the same incident.

## Systems

Systems represent hosts, endpoints, servers, or infrastructure involved in an incident.

### Required Fields

- Hostname
- IP Address
- OS
- Owner
- Notes

### Required Behavior

- Users can create systems inside an incident.
- System fields should support inline editing where useful.
- Systems can be linked to findings as evidence.
- Systems can be linked to tasks.

## Accounts

Accounts represent users, service accounts, or identities involved in an incident.

### Required Fields

- Username
- Domain
- Status
- Owner
- Notes

### Required Behavior

- Users can create accounts inside an incident.
- Account fields should support inline editing where useful.
- Accounts can be linked to findings as evidence.
- Accounts can be linked to tasks.

## Tasks

Tasks represent work to be completed during an incident.

### Required Fields

- Title
- Description
- Status
- Priority
- Owner
- Assignee
- Due Date
- Linked Entities

### Required Statuses

```txt
todo
in_progress
blocked
done
```

Do not include `ready` status.

### Required Behavior

- Users can create tasks inside an incident.
- Users can assign tasks to incident members.
- Assigning a task creates a notification for the assignee.
- Tasks can link to findings, timeline events, systems, accounts, indicators, and queries.
- Task links must only target entities in the same incident.
- Cross-incident links are not allowed.

## Queries

Queries are reusable investigation queries.

### Required Fields

- Query Name
- Owner
- Language
- Description
- Query Body

### Required Query Table

| Column | Notes |
|---|---|
| ID | Query identifier |
| Query Name | Opens popup |
| Owner | Display name |
| Language | Filterable |
| Description | Short summary |

### Required Behavior

- Query page has a table of existing queries.
- Query filter is based on query fields.
- Clicking a query opens a popup/modal with a code block showing the full query.
- Modal has a copy-to-clipboard button.
- Owner or authorized users can edit query content.
- Add Query uses the same modal pattern.
- Queries can be linked to findings as evidence.
- Queries can be linked to tasks.

## Tags

Forenotes has two tag types.

## Global MITRE ATT&CK Tags

### Required Behavior

- MITRE ATT&CK tags are built in or seeded/imported.
- MITRE tags are globally available across all cases and incidents.
- Normal users cannot edit the built-in MITRE catalog.
- Users can attach MITRE tags to findings and timeline events.
- MITRE tag picker should support search by ID and name.

Examples:

```txt
T1003 - OS Credential Dumping
T1059 - Command and Scripting Interpreter
TA0006 - Credential Access
```

## Custom Tags

### Required Behavior

- Users can create custom tags inside a case.
- Custom tags are case-scoped.
- Custom tags are reusable across incidents in the same case.
- Custom tags are not visible in other cases.
- Users can attach custom tags to findings and timeline events.
- Users can remove custom tags from findings/timeline events if authorized.

## Notifications

### Required Notification Events

Create notifications for:

- User added to a case.
- User added to an incident.
- Task assigned to user.
- Finding created in an incident where user is a member.
- Finding updated in an incident where user is a member.
- Timeline event created in an incident where user is a member.
- Timeline event updated in an incident where user is a member.
- Indicator created in an incident where user is a member.
- Indicator updated in an incident where user is a member.

### Required Behavior

- Notifications have unseen/read state.
- Notification tab or bell shows unseen count.
- Opening or marking notifications should clear unseen state as designed.
- Users only see their own notifications.
- Notification should link to the related case, incident, or entity where possible.

## Search

### Required Behavior

- Search should respect user permissions.
- Search should clearly show which case and incident each result belongs to.
- Global search should not return vague records without context.
- Search result should include entity type and useful details.

### Search Result Minimum Fields

```txt
Title or value
Entity type
Case name
Incident name
Source or owner when useful
Short description/snippet
Open action
```

## Audit Logs

### Required Behavior

Record audit logs for:

- Case create/update.
- Case membership changes.
- Incident create/update.
- Incident membership changes.
- Finding create/update/delete.
- Evidence link/unlink.
- Timeline event create/update/delete.
- Indicator create/update/delete.
- Task create/update/assign/link.
- Query create/update/delete.
- Custom tag create/update/delete.

Audit logs should include actor, action, entity type, entity ID, scope, timestamp, and before/after snapshots where useful.

## Permissions and Access Control

### Required Behavior

- API must enforce all permissions server-side.
- Non-members cannot access incident-scoped records.
- Case members should not automatically see all incidents unless the product intentionally allows that.
- Incident members can only access assigned incidents.
- Missing permission returns `403`.
- Inaccessible or nonexistent scoped records may return `404` to avoid leaking information.

## Required Browser Acceptance Scenarios

These scenarios should be verified with browser automation.

### Scenario 1: Case and Incident Creation

Expected browser output:

- User creates a case using a modal.
- New case appears in the case table.
- User opens the case.
- User creates an incident using a modal.
- New incident appears under that case.

### Scenario 2: Finding With Evidence

Expected browser output:

- User opens an incident workspace.
- User creates a timeline event.
- User creates an indicator.
- User creates a finding.
- User links the timeline event and indicator to the finding.
- Finding detail displays both evidence links grouped by type.

### Scenario 3: Cross-Incident Evidence Is Blocked

Expected browser output:

- User creates two incidents in the same case.
- User creates a finding in incident A.
- User creates an indicator or timeline event in incident B.
- Evidence picker for finding in incident A does not show incident B evidence.
- Direct API attempt to link incident B evidence to incident A finding fails.

### Scenario 4: Tags

Expected browser output:

- MITRE ATT&CK tag picker shows global built-in tags.
- User creates a custom tag in case A.
- Custom tag appears in incidents under case A.
- Custom tag does not appear in case B.

### Scenario 5: Task Assignment Notification

Expected browser output:

- Response Lead assigns a task to an Analyst.
- Analyst sees unseen notification count increase.
- Analyst opens notification list.
- Notification references the assigned task.
- Marking notification read decreases unseen count.

### Scenario 6: Search Context

Expected browser output:

- User searches for an indicator/tag/finding keyword.
- Results show entity type, case name, and incident name.
- Results do not include inaccessible incidents.

## Phase 1 Done Definition

Phase 1 is done when:

- Core schema exists through migrations.
- Main API routes exist and enforce permissions.
- Main UI workflows exist for cases, incidents, findings, timeline, indicators, tasks, queries, tags, and notifications.
- Evidence links support multiple evidence types.
- MITRE global tags and case custom tags behave correctly.
- Notification unseen/read state works.
- Search results include scope context.
- Critical workflows have unit, API integration, and browser tests.
- Browser test output matches expected visible behavior.

