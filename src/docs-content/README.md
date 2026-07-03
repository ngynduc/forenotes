# Forenotes Documentation

Forenotes is an open-source DFIR notebook for response teams. It organizes cases, incidents, findings, timelines, tasks, reports, evidence relationships, and MITRE ATT&CK mapping in one collaborative workspace.

> These docs describe the full Forenotes application. The landing-page branch only hosts this static website. Application source, Docker files, migrations, and server code live on the main application branch and in release artifacts.

## Start Here

| Need | Read |
|------|------|
| Install Forenotes on a server | [Production Install](./INSTALL_PRODUCTION.md) |
| Run the static documentation site locally | [Getting Started](./GETTING-STARTED.md) |
| Understand the investigation workflow | [Features](./FEATURES.md) |
| Review the application architecture | [Architecture](./ARCHITECTURE.md) |
| Integrate with the API | [API Reference](./API.md) |
| Understand auth and permissions | [Authentication & Authorization](./AUTHENTICATION.md) |
| Inspect the data model | [Database Schema](./DATABASE.md) |

## Reader Paths

- **Operators:** start with the production install guide, then read backup, restore, upgrade, and security notes before exposing the app to a team.
- **Investigators:** start with Features to see the case-to-report workflow and the main screens.
- **Admins:** read Authentication and Database to understand users, roles, membership, sessions, and audit logging.
- **Developers:** read Getting Started for branch-specific setup, then Architecture, API, and Database.

## Core Concepts

| Concept | Purpose |
|---------|---------|
| Case | Top-level investigation or engagement container |
| Incident | Security event investigated inside a case |
| Finding | Analyst conclusion backed by evidence |
| Timeline event | Time-bound observation from evidence or analysis |
| Indicator | IoC such as host, IP, domain, URL, hash, process, or registry key |
| System and account | Affected infrastructure and identities |
| Task | Assignable investigation work item |
| Query | Saved KQL, SQL, SPL, or other investigation query |
| Entity link | Manual or derived relationship between investigation records |
| Report | Markdown or PDF-ready incident communication |

## Where Source Lives

- Static website branch: this landing page and embedded documentation.
- Full app branch: application server, client, database migrations, Dockerfiles, and production Compose files.
- Repository: [https://github.com/ngynduc/forenotes](https://github.com/ngynduc/forenotes)

Use release tags or the main application branch when following production and full-app development commands.
