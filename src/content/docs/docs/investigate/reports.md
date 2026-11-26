---
title: Reports
description: Draft reports by chatting with an AI that reads your incident records, then edit and export them as themed HTML.
---

Reports are Markdown narratives built from the incident's records. Draft them with **AI Report Chat**, refine them in the **Report Editor**, and export them as HTML.

## Prepare the source records

Before drafting, review incident metadata, confirmed findings, timeline chronology, affected entities, ATT&CK mapping, and incomplete tasks. The AI can only use what is recorded in Forenotes.

## Draft with AI Report Chat

![AI Report Chat](/user-guide/reports-chat.png)

Open **Reports → AI Report Chat** and ask for what you need, or pick one of the suggested prompts, for example "Write an executive summary" or "Draft a full incident report with timeline, findings and recommendations". The answer streams in as it is written.

The AI does not receive the whole incident up front. It calls read-only tools to fetch an overview and then the findings, timeline events, tasks, indicators, systems, accounts, queries, links, or tags it needs. Each lookup appears in the conversation, for example `query_incident_data (findings) - 4 of 4 records`.

![A reply streaming in after a data lookup](/user-guide/reports-chat-streaming.png) Lookups run with your permissions, and the AI cannot change any record.

Follow up in the same conversation to adjust tone, add a section, or focus on a time window. Use **Stop** to cancel a long answer. The conversation is kept while you switch Reports tabs, but not when you leave the page or change incident.

![A finished answer](/user-guide/reports-chat-answer.png)

When an answer is ready, choose **Save as report and edit** below it. Forenotes saves it as a report, titled from the answer's first top-level (`#`) heading or else "AI report" and the date, and opens it in the editor. Rename it there if needed.

Treat every AI answer as a draft:

1. verify every material claim against linked records;
2. remove unsupported or speculative statements;
3. preserve uncertainty where the evidence is incomplete;
4. confirm names, times, severity, and recommendations.

AI Report Chat needs a configured provider whose model supports tool calling. See [LLM settings](/docs/admin/llm-settings/).

## Set your report instructions

Open **Reports → Chat Prompt** to add instructions applied to every chat request for your account, such as language, audience, required headings, or client naming. Built-in rules are always applied first: they tell the AI to fetch data with its tools and not to invent facts, and they cannot be removed.

![Chat Prompt](/user-guide/reports-chat-prompt.png)

## Edit the report

Open **Reports → Report Editor**, or open a report from **Saved Reports**. Edit the title and Markdown, paste images, and choose **Save Report**. Export is disabled while there are unsaved changes, so an export always matches the saved text. Switch between **Edit** and **Preview** to check the rendered Markdown.

![Report Editor](/user-guide/reports-editor.png)

**Saved Reports** lists every report in the incident. Search and sort the list, open a report in the editor, or export it.

![Saved Reports](/user-guide/reports-saved.png)

## Export

![Export HTML](/user-guide/reports-export-html.png)

Choose **Export HTML**, pick an HTML template (or the built-in default), and choose **Export HTML** again to download the file. HTML templates under **Reports → HTML Templates** wrap the rendered report in your company theme. Keep factual content in the report and visual branding in the template.

![HTML Templates](/user-guide/reports-html-templates.png) Retain the Markdown report with the incident so future reviewers can distinguish source content from styling.

PDF export and Markdown report templates were removed; use HTML export, and print to PDF from a browser if a PDF is required.

LLM provider credentials are encrypted at rest with `FORENOTES_LLM_SECRET_KEY`. Changing that key prevents existing stored credentials from being decrypted.
