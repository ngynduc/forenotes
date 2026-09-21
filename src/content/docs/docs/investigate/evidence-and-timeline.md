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

Normalize times to the investigation's selected timezone before comparing events. Keep the original source timestamp in the description or raw-evidence reference when conversion matters.

## Separate observation from assessment

Use timeline events for observable facts and findings for conclusions. For example, a process execution belongs in the timeline; the assessment that it represents credential dumping belongs in a finding linked to that event.

## Link supporting evidence

From a finding, link the timeline events, systems, accounts, indicators, queries, or tasks that support it. Add a short relationship description when the connection is not obvious.

Before confirming a finding, check that:

1. its severity and confidence match the available evidence;
2. linked records support the claim;
3. contradictory or uncertain evidence is described;
4. impact and recommendations are specific enough to act on.

## Preserve source material outside Forenotes

Forenotes stores investigation records and references; it is not an evidence acquisition system. Preserve original logs, disk images, memory captures, and exports in your approved evidence repository, then reference them consistently from Forenotes.
