---
title: Reports
description: Turn structured investigation records into reviewed Markdown and PDF communication.
---

Reports combine selected investigation context with a reusable narrative structure. They remain editable Markdown until exported.

![Reports workspace](/user-guide/reports.png)

## Prepare the source records

Before generating a report, review incident metadata, confirmed findings, timeline chronology, affected entities, ATT&CK mapping, and incomplete tasks. Generated text can only be as reliable as the source context.

## Choose a template

Report templates organize the Markdown narrative. PDF templates control the exported presentation. Keep factual content in the report and visual branding in the PDF template.

## Generate and review

If an LLM service is configured, Forenotes can generate a draft from incident context. Treat the output as an editable draft:

1. verify every material claim against linked records;
2. remove unsupported or speculative statements;
3. preserve uncertainty where the evidence is incomplete;
4. confirm names, times, severity, and recommendations;
5. save the reviewed report before export.

LLM provider credentials are encrypted at rest with `FORENOTES_LLM_SECRET_KEY`. Changing that key prevents existing stored credentials from being decrypted.

## Export

Preview the PDF template, export the reviewed report, and inspect pagination, uploaded images, code blocks, and long tables. Retain the Markdown report with the incident so future reviewers can distinguish source content from export styling.
