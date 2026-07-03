# Features

Forenotes is built around a practical incident-response workflow: create a case, add incidents, collect evidence-backed findings, coordinate tasks, map relationships, and publish reports.

## Investigation Flow

1. Create a case for an engagement, customer, or investigation.
2. Add one or more incidents under that case.
3. Record findings, timeline events, indicators, affected systems, and accounts.
4. Link evidence so conclusions are traceable.
5. Assign tasks and track work state.
6. Map activity to MITRE ATT&CK tags.
7. Generate reports for stakeholders.

## Case Workspace

Cases are top-level investigation containers. They hold incident records and define who can access the work.

![Create case form](/user-guide/create-case.png)

Case membership supports `commander`, `analyst`, and `viewer` roles. Commanders lead the response, analysts contribute records, and viewers review work without changing it.

![Cases list](/user-guide/cases.png)

## Incidents

Incidents are discrete security events within a case. Each incident can have its own severity, status, membership, tasks, evidence, reports, and timeline.

![Create incident form](/user-guide/create-incident.png)

Incident membership keeps sensitive work scoped to the right people while still allowing case-level coordination.

## Findings

Findings capture analyst conclusions with severity, confidence, impact, recommendations, owner, and status.

![Findings table](/user-guide/findings.png)

Findings can be linked to timeline events, systems, accounts, indicators, queries, and tasks so the final conclusion points back to supporting evidence.

![Add finding form](/user-guide/add-finding.png)

## Timeline

Timeline events preserve chronological observations from logs, endpoint data, user interviews, and analyst notes.

![Timeline page](/user-guide/timeline.png)

Use timeline records to connect activity to affected hosts, users, findings, and MITRE ATT&CK tags.

## Entities And Graph

Forenotes tracks systems, accounts, indicators, findings, tasks, timeline events, queries, tags, and manual links as graphable entities.

![Entity list](/user-guide/entities.png)

Derived links come from evidence relationships. Manual links let investigators describe relationships that are not captured by a direct field.

![Entity relationship graph](/user-guide/entity-links-graph.png)

## Tasks And Notes

Tasks coordinate investigation work. They include priority, owner, assignee, due date, status, and optional evidence links.

![Tasks board](/user-guide/tasks.png)

Task notes support richer investigation context and image attachments.

![Task notes](/user-guide/task-notes.png)

## Reports

Reports turn investigation data into stakeholder-ready Markdown and PDF output.

![Reports workspace](/user-guide/reports.png)

Teams can maintain incident-specific templates, generate report drafts from context, and export final reports.

## Team Management

Admins manage users globally. Case and incident commanders manage membership within their response scope.

![Team member management](/user-guide/team-members.png)

## MITRE ATT&CK

Findings, timeline events, and queries can be mapped to ATT&CK techniques. The matrix view shows which techniques are observed and where supporting evidence lives.

## Search, Dashboard, Audit, Notifications

| Area | Purpose |
|------|---------|
| Search | Find cases, incidents, findings, timeline events, indicators, queries, tasks, systems, accounts, and tags |
| Dashboard | Review activity, stale work, overdue tasks, and investigation metrics |
| Audit log | Preserve mutation history with actor, entity, before/after JSON, and context |
| Notifications | Notify team members about assignments and important investigation events |
