---
title: Evidence and timeline
description: Record chronological observations and connect conclusions to supporting evidence.
---

## Build the timeline

Create a timeline event for each meaningful observation. Capture:

- when the activity occurred;
- a concise event title;
- the evidence source;
- a raw-evidence reference when one exists;
- the affected system or account;
- relevant ATT&CK tags.

![Timeline page](/user-guide/timeline.png)

Choose **Add Event** to add a row. Use the time filter above the table to narrow the list to a time range, by event time or by when records were created or updated. Choose **Details** on a row to open the full event.

### Primary and supporting events

Each timeline event has an **Event Role**. Use **primary** for a key moment in the incident and **supporting** for detail that belongs to it, such as the individual log lines behind one sign-in. A supporting event must name its **Primary Event**. Supporting events stay hidden in the relationship graph until you expand their primary event, which keeps the timeline readable.

Normalize times to the investigation's selected timezone before comparing events. Keep the original source timestamp in the description or raw-evidence reference when conversion matters.

![Timeline event details](/user-guide/timeline-event-details.png)

## Record findings

Open **Findings** to list the incident's conclusions with status, severity, confidence, summary, owner, and tags. Choose **Add Finding** to add a new row directly in the table; give it a title, status, severity, confidence, and summary.

![Findings table](/user-guide/findings.png)

![Adding a finding](/user-guide/add-finding.png)

Use statuses to show where a conclusion stands: `draft` while you are still testing it, `confirmed` when the evidence supports it, `false_positive` when it was ruled out, and `resolved` once the issue it describes has been remediated.

## Review record details

Choose **Details** on a finding or timeline event to open it. Under **Investigation context** you see its investigation details: who created it and who owns it, when it was created and last updated, the event time and role, its evidence reference, linked evidence and related entities, and its ATT&CK and custom tags. Deactivated users are still shown as creators and owners, so attribution is preserved. Below the context you can edit every field, change tags, review linked entities, or **Delete** the record.

![Finding details](/user-guide/finding-details.png)

## Separate observation from assessment

Use timeline events for observable facts and findings for conclusions. For example, a process execution belongs in the timeline; the assessment that it represents credential dumping belongs in a finding linked to that event.

## Link supporting evidence

From a finding, link the timeline events, systems, accounts, indicators, queries, or tasks that support it. Add a short relationship description when the connection is not obvious.

Before confirming a finding, check that:

1. its severity and confidence match the available evidence;
2. linked records support the claim;
3. contradictory or uncertain evidence is described;
4. impact and recommendations are specific enough to act on.

## Review agent evidence

![Investigation page](/user-guide/investigation.png)

Select a case and open **Investigation** to review agent runs, evidence records, observations, hypotheses, and draft findings. Observations require evidence support; hypotheses and agent findings require observation support from the same case.

Agent-created findings remain drafts until a human confirms their complete support chain. Use **Agent Actions** to inspect successful and failed tool invocations before accepting the conclusion. See [MCP investigation agents](/docs/admin/mcp/) for the complete workflow.

## Preserve source material outside Forenotes

Forenotes stores investigation records and references; it is not an evidence acquisition system. Preserve original logs, disk images, memory captures, and exports in your approved evidence repository, then reference them consistently from Forenotes.
