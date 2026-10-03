# MCP Investigation Interface

Forenotes exposes an optional, stateless Model Context Protocol endpoint for investigation agents. An operator can enable the endpoint, create a scoped token in Settings, and use an MCP client to record a complete evidence-to-finding provenance chain.

## Enable the endpoint

The endpoint is disabled by default. Configure these variables on the Forenotes application service:

```env
FORENOTES_MCP_ENABLED=true
FORENOTES_MCP_PUBLIC_URL=https://forenotes.example.com/mcp
FORENOTES_MCP_ALLOWED_ORIGINS=https://agent.example.com
```

`FORENOTES_MCP_PUBLIC_URL` must use HTTPS in production. Its origin and any comma-separated additions in `FORENOTES_MCP_ALLOWED_ORIGINS` are accepted. Forenotes validates both `Host` and `Origin` before authentication to prevent DNS-rebinding attacks.

Restart Forenotes after changing the environment. A disabled endpoint returns `404`.

## Create an access token

1. Sign in to Forenotes and open **Settings**.
2. Under **MCP access tokens**, select read-only or read-write access.
3. Enter an agent label and optional expiry, then create the token.
4. Copy the token immediately. Forenotes shows it once and stores only its hash.

Tokens expire after 90 days by default and cannot exceed one year. A token always uses its owner's current account status, password-rotation state, global role, permissions, and case memberships. Disabling the owner, requiring a password change, or removing case membership takes effect immediately. Revoke an unused or exposed token from Settings.

Session cookies do not authenticate `/mcp`. MCP bearer tokens are not accepted by browser `/api` routes.

## Configure a client

Use the public endpoint and send the token as a bearer credential:

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

The endpoint uses Streamable HTTP with JSON responses and supports current request metadata plus legacy initialization negotiation. Every request is independent; clients must not depend on an MCP session ID.

## Investigation workflow

### Discover IDs from names

Users describe cases, incidents, and records using names. Agents obtain UUIDs from tool results and pass them to later calls; never invent UUIDs or require the user to look them up.

1. Call `list_cases` with `query` (case name, client name, or summary).
2. Select a matching item using `caseName`, `clientName`, `status`, and `summary`. Its `id` is the `caseId`.
3. Call `list_incidents` with that `caseId` and optional `query` (incident name or summary). Its selected item's `id` is the `incidentId`.
4. Use those IDs with `get_tasks`, `get_entities`, `get_timeline`, or the provenance list tools. Reuse each record's returned `id` for edits and support links.
5. For assignment, call `list_case_members` with `caseId` and optional display-name/email `query`; use `userId` as `assigneeUserId`. The user must also belong to the target incident.

For example, “Show tasks for the phishing incident in the Acme case” becomes:

```text
list_cases({ query: "Acme" }) → items[].id as caseId
list_incidents({ caseId, query: "phishing" }) → items[].id as incidentId
get_tasks({ caseId, incidentId })
```

These discovery tools match literal text, ignoring case and surrounding whitespace. Omit `query` or use empty text to list all accessible matches. They return `items`, `limit`, `offset`, `total`, and `hasMore`; search is applied before pagination. Follow additional pages while `hasMore` is true. No matches means refine the search; multiple plausible matches means inspect context or ask the user before writing. Names are not unique identifiers.

`search_case` searches evidence, observations, and hypotheses within a known case; use the other list tools to discover incidents, entities, tasks, or findings. Write tools return created record IDs, including the run ID from `start_investigation_run`.

Agent mutations require a read-write token and an active case-level run:

1. Use `list_cases`, then `start_investigation_run` with an idempotency key.
2. Use `register_evidence` for metadata and an opaque source locator. Forenotes never fetches the locator or treats evidence text as instructions.
3. Create an observation supported by at least one same-case evidence record.
4. Create a hypothesis supported by at least one same-case observation.
5. Add timeline events, systems, accounts, indicators, relationships, and tasks as needed.
6. Create a draft finding supported by at least one observation.
7. Complete the run and let a human review the Agent Actions trail and confirm the finding.

Every write tool requires `idempotencyKey`. Repeating the same key and payload returns the original result; using the key with different input returns a conflict. MCP does not expose delete, unlink, membership, credential, arbitrary-command, response-action, or finding-confirmation tools.

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

List tools use bounded pagination. `limit` defaults to 50 and cannot exceed 100. Structured results use camelCase fields.

For `link_entities`, use the UUID returned by creation or discovery. Indicator
endpoints accept either `indicator` or `ioc`; stored relationships use `ioc`.
Entity and relationship types are validated against the graph's supported types.
An observation requires at least one `evidenceIds` entry, and a hypothesis requires
at least one `observationIds` entry. If observation creation fails, resolve that
error and retry it before creating a hypothesis with the returned observation ID.

## Provenance and review

Forenotes preserves these invariants:

- An observation always has same-case evidence support.
- A hypothesis always has same-case observation support.
- An agent-created finding remains `draft` and always has observation support.
- A human can confirm an agent draft only when its complete support chain remains valid.
- Evidence, observations, and hypotheses can be corrected, but every edit stores complete before/after audit data.

Open **Investigation** after selecting a case to review runs, evidence, observations, hypotheses, draft findings, and successful or failed agent actions. Optional incident and run filters narrow the view.

## Errors and troubleshooting

MCP errors use normalized validation, authentication, permission, not-found, and conflict messages without including credentials.

| Symptom | Check |
| --- | --- |
| `404` at `/mcp` | `FORENOTES_MCP_ENABLED` is `true` and the service was restarted. |
| Invalid host or origin | Public URL, reverse-proxy `Host`, and allowed origins match the client. |
| Authentication failure | Token is unexpired, unrevoked, and copied with the `fnmcp_` prefix. |
| Permission denied | Owner is active, password rotation is complete, membership still exists, and scope is sufficient. |
| Active-run error | Start a run for the target case; completed, failed, and cancelled runs are immutable. |
| Provenance conflict | Every support record exists and belongs to the run's case. |

Forenotes records each successful and failed tool invocation with its actor, client, duration, outcome, safe input, result summary, and produced-record references. Bearer secrets are never stored in action or audit records.
