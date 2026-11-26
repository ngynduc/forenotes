---
title: Find your way around
description: Sign in, choose the case and incident you are working on, and use the dashboard, notifications, and personal settings.
---

This page is a tour of the Forenotes workspace. Read it once before your first investigation; the rest of the guide assumes you know where these controls are.

## Sign in

Open your Forenotes address and sign in with the username and password your administrator gave you. If the password is temporary, Forenotes asks you to choose a new one before you continue.

![Sign-in page](/user-guide/login.png)

The moon icon in the top-right corner switches between light and dark themes. Your choice is remembered on this browser.

## The workspace layout

Every page has the same three parts:

- **Sidebar** (left): the pages you can open. **Investigation** and **Admin** appear only if your role allows them. The number beside **Notifications** is your unread count.
- **Scope bar** (top): who you are signed in as, the **Case** and **Incident** you are working on, and the **Timezone** used to display times.
- **Page content**: the selected page, filtered to your current case and incident.

Most investigation pages (Findings, Timeline, Tasks, Entities, Queries, Graph, Reports) show records for the selected incident only. Choose a case first, then an incident. If a page asks you to select a scope, use the scope bar.

Times are stored in UTC and shown in the timezone you pick. Change it whenever you compare evidence from another region; the records do not change.

![Dark theme](/user-guide/dark-mode.png)

## Dashboard

The **Dashboard** gives a team-wide picture of work across every case you can access.

![Dashboard overview](/user-guide/dashboard-overview.png)

**Overview** shows four summary cards and three breakdowns:

- **SLA Watch**: tasks, stale incidents, and ageing findings that need attention.
- **Overdue Tasks**: work past its due date and how many people it is assigned to.
- **Due Soon**: due dates in the next 24 and 72 hours.
- **Unread**: notifications addressed to you.
- **Task status**, **SLA risk**, and **Workload** bars; **View details** opens the matching tab.

**SLA Watch** lists every task that needs operational attention, most urgent first. Filter by SLA state, status, priority, assignee, case, incident, or due range, and use **Reset filters** to clear them.

![SLA Watch](/user-guide/dashboard-sla-watch.png)

**Workload** shows open, overdue, due-soon, and completed work for each assignee, so a lead can rebalance work before deadlines slip.

![Workload](/user-guide/dashboard-workload.png)

## Notifications

**Notifications** lists activity addressed to you: new incidents, findings, and timeline events in your cases, tasks assigned to you, and being added to a case or incident. Each row names the case and incident it belongs to. Use **Mark read** to clear an item; the sidebar count updates immediately, and new items arrive without refreshing the page.

![Notifications](/user-guide/notifications.png)

## Your settings

Open **Settings** to manage your own account:

- **User Session**: who you are signed in as, your display timezone, and **Log Out**.
- **Password**: change your password. All your browser sessions end, so you sign in again with the new password.
- **LLM Provider**: your own AI provider, model, API key, and endpoint for AI reports, with **Test connection**. See [LLM settings](/docs/admin/llm-settings/).

![Settings](/user-guide/settings.png)

- **MCP access tokens**: create read-only or read-write tokens for investigation agents, with an optional expiry date. The token is shown once; copy it immediately. Tokens never have more access than you do. See [MCP investigation agents](/docs/admin/mcp/).

![MCP access tokens](/user-guide/settings-mcp-tokens.png)
