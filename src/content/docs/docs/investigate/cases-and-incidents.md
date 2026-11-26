---
title: Cases and incidents
description: Create a case, add the right people, and open incidents inside it.
---

A **case** is the engagement: one client or investigation, with its own members. An **incident** is a security event inside the case, with its own timeline, findings, tasks, entities, and reports. Case membership controls who can see everything inside the case.

## Find a case

Open **Cases** to see every case you belong to, with its client, status, your role, the number of active incidents, and when it was last updated. Use **Search** to filter by name or client.

![Cases list](/user-guide/cases.png)

Each row has three actions:

- **Open Case** makes it your current case in the scope bar.
- **Edit** changes the case name, client, dates, status, and summary.
- **Create Incident** starts a new incident in that case.

## Create a case

Choose **Create Case** and fill in:

- **Case Name** (required) and **Client Name**;
- **Start Date** and **End Date** for the engagement window;
- **Status** (`open` or `closed`) and a short **Summary** of the scope;
- **Initial Member** and **Initial Member Role**, to add the first person straight away.

![Create case form](/user-guide/create-case.png)

You need the `case:create` permission, which commanders and admins have by default.

## Review the selected case

Below the list, the selected case shows its status, client, active incidents, and your role, with three tabs.

**Case Details** shows the case fields at a glance.

![Case details](/user-guide/case-details.png)

**Members** lists everyone with access and their case role. Pick a user and a role, then choose **Add**. Change a member's role with the drop-down on their card, or remove them with **Remove**. Incidents inherit case members automatically, so you do not manage incident access separately.

![Case members](/user-guide/team-members.png)

| Case role | Can do |
| --- | --- |
| `commander` | Manage members and incidents, and do all investigation work |
| `analyst` | Create and edit investigation records and reports |
| `viewer` | Read only |

A case always keeps at least one active commander, so you cannot remove or demote the last one.

**Incidents** lists the incidents in the case with severity, status, and last update. **Selected** marks the incident in your scope bar.

![Case incidents](/user-guide/case-incidents.png)

## Create an incident

Choose **Create Incident** and set an **Incident Name**, **Severity**, **Status**, and **Summary**. Severity and status can change as the evidence develops.

![Create incident form](/user-guide/create-incident.png)

Use separate incidents when events need independent timelines, task boards, or reports. Keep related activity in one incident so its timeline and graph stay complete.

After creating an incident, select it in the scope bar. The Findings, Timeline, Tasks, Entities, Queries, Graph, and Reports pages now show its records.
