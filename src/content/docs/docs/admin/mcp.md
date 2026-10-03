---
title: MCP investigation agents
description: Enable the MCP endpoint, issue scoped tokens, and review evidence-backed agent findings.
---

Forenotes exposes an optional [Model Context Protocol](https://modelcontextprotocol.io/) endpoint for investigation agents. It runs inside the application and uses your account's current permissions. MCP is available from release 0.2.2 and is disabled by default.

MCP and [LLM report drafting](/docs/admin/llm-settings/) are configured separately. An MCP client supplies its own agent; enabling MCP does not configure a report provider.

## Enable the endpoint

Set these values in the application's `.env.production`:

```dotenv
FORENOTES_MCP_ENABLED=true
FORENOTES_MCP_PUBLIC_URL=https://forenotes.example.com/mcp
FORENOTES_MCP_ALLOWED_ORIGINS=
```

Replace the public URL with your externally reachable HTTPS endpoint. Production requires HTTPS. The server validates the request's `Host` and, when supplied, `Origin` before authentication. Configure the reverse proxy to preserve the public Host header and forward `/mcp` to the app.

The public URL's origin is allowed automatically. If a browser-based client uses another origin, add it to `FORENOTES_MCP_ALLOWED_ORIGINS`; separate multiple origins with commas.

Apply the settings:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
```

Older Compose files may not pass these variables into the app. Update the Compose file using the [upgrade guide](/docs/operations/upgrade/) first.

## Create a token

1. Sign in and open **Settings → MCP access tokens**.
2. Enter a label that identifies the agent.
3. Choose `read_only` for discovery and review, or `read_write` for investigation writes.
4. Choose an optional expiry and create the token.
5. Copy the secret immediately; it is shown only once.

Tokens default to a 90-day expiry and cannot last longer than one year. Only a hash is stored. A token cannot grant more access than its owner: current global role, permissions, case membership, account status, and required password rotation are checked on every request. Disabling the owner or revoking the token blocks access immediately.

Revoke unused or exposed tokens in Settings. Store bearer credentials in your client's protected credential configuration.

## Connect a client

Configure a **Streamable HTTP** connection to the public `/mcp` URL with an `Authorization: Bearer` header. For clients that accept this configuration shape:

```json
{
  "mcpServers": {
    "forenotes": {
      "type": "http",
      "url": "https://forenotes.example.com/mcp",
      "headers": {
        "Authorization": "Bearer fnmcp_REPLACE_WITH_TOKEN"
      }
    }
  }
}
```

Adapt the configuration keys to your client. The endpoint returns JSON and is stateless: clients must not depend on an MCP session ID. Use MCP `tools/list` to discover the current schemas.

Browser session cookies do not authenticate `/mcp`. MCP bearer tokens do not authenticate the browser REST API. Token management through REST requires a browser session; see the [API reference](/docs/reference/api/).

## Find records by name

Start with names and reuse the returned IDs:

```text
list_cases({ query: "Acme" }) → select items[].id as caseId
list_incidents({ caseId, query: "phishing" }) → select items[].id as incidentId
get_tasks({ caseId, incidentId })
list_case_members({ caseId, query: "Analyst" }) → select items[].userId as assigneeUserId
```

Case discovery matches case name, client name, and summary. Incident discovery matches name and summary. Member discovery matches display name and email. Searches use literal text, ignore case, and trim whitespace; empty or omitted `query` lists accessible records.

Discovery results contain `items`, `limit`, `offset`, `total`, and `hasMore`. Search happens before pagination. `limit` defaults to 50 and cannot exceed 100; follow additional pages while `hasMore` is true. Refine a search with no matches. Inspect context or ask the user when several records match before writing. Names are not unique identifiers, and agents must not invent UUIDs.

`search_case` searches evidence, observations, and hypotheses within a known case. Use the other list tools for incidents, tasks, entities, and findings. Task assignment also requires membership in the target incident, inherited from its case.

## Record a supported investigation

Writes require a `read_write` token and a case-level investigation run:

1. Discover the case and call `start_investigation_run` with an objective and `idempotencyKey`. Save the returned run `id`.
2. Call `register_evidence` with metadata and an opaque source locator.
3. Create an observation supported by at least one same-case evidence record.
4. Create a hypothesis supported by at least one same-case observation.
5. Add timeline events, systems, accounts, indicators, relationships, and tasks as needed.
6. Create a draft finding supported by at least one observation.
7. Complete the run, then ask a human to review the results.

Pass the returned `runId` to subsequent writes and reuse returned record IDs for edits and support links. Every write requires `idempotencyKey`: retrying the same key and payload returns the original result; changing the payload with the same key returns a conflict. Completed, failed, and cancelled runs cannot accept further agent mutations.

Forenotes stores source locators as metadata. It does not fetch them or execute instructions contained in evidence text. Preserve original source material in your evidence repository.

## Available tools

Read tools:

```text
list_cases              get_case                 search_case
list_incidents          list_case_members
list_investigation_runs get_investigation_run    get_evidence
get_observations        get_hypotheses            get_timeline
get_entities            get_relationships         get_findings
get_tasks
```

Write tools:

```text
start_investigation_run    complete_investigation_run
register_evidence          update_evidence
create_observation         update_observation
create_hypothesis          update_hypothesis
add_timeline_event         update_timeline_event
create_entity              update_entity
link_entities              create_task
update_task                create_draft_finding
update_draft_finding
```

MCP exposes no delete, unlink, membership management, credential management, arbitrary command, response action, or finding confirmation tools. Structured tool results use camelCase fields.

## Review agent work

Select a case and open **Investigation** to review runs, evidence, observations, hypotheses, draft findings, and **Agent Actions**. Narrow the view with incident and run filters.

An agent-created finding stays `draft` until a human confirms it. Before confirmation, review the evidence → observation → finding chain, assess contradictions, and check confidence and impact. Confirmation requires the full support chain to remain valid within the case.

Corrections to evidence, observations, and hypotheses preserve complete before/after audit data. Successful and failed tool invocations record the actor, client, duration, outcome, safe input, result summary, and produced records. Bearer secrets are excluded from action and audit records.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `404` at `/mcp` | MCP is enabled, Compose passes the settings, and the app was recreated. |
| Invalid Host or Origin | Public URL, proxy Host header, and allowed client origins match. |
| Authentication failure | Token includes its `fnmcp_` prefix and is unexpired and unrevoked. |
| Permission denied | Owner is active, required password rotation is complete, case access exists, and token scope permits the action. |
| Active-run error | Use an active run for the target case. |
| Provenance conflict | All support records exist and belong to the same case. |
| Retry conflict | The idempotency key was previously used with different input. |

Tool errors set `isError` and return `error.code`, `error.message`, and `error.details` in structured content. Codes include `validation`, `authentication`, `permission`, `not_found`, `conflict`, and `internal`.
