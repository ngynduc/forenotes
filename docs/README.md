# Forenotes Documentation

**Forenotes** is a collaborative DFIR (Digital Forensics & Incident Response) notebook application. It enables security teams to manage investigation cases, track incidents, document findings, build timelines, and map evidence to the MITRE ATT&CK framework.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Production Install](./INSTALL_PRODUCTION.md) | Docker Compose production install, upgrades, backup, and troubleshooting |
| [Releasing](./RELEASING.md) | GitHub Actions image publishing and versioned releases |
| [Getting Started](./GETTING-STARTED.md) | Local development and demo setup |
| [Architecture](./ARCHITECTURE.md) | System architecture, tech stack, and project structure |
| [API Reference](./API.md) | Complete REST API documentation |
| [Database Schema](./DATABASE.md) | Database tables, relationships, and migrations |
| [Authentication & Authorization](./AUTHENTICATION.md) | Auth flow, RBAC roles, and permissions |
| [Features](./FEATURES.md) | Feature documentation and domain concepts |

## Tech Stack

- **Backend:** Node.js, Express 5, TypeScript
- **Database:** PostgreSQL
- **Frontend:** React, Vite, TypeScript
- **Validation:** Zod
- **Testing:** Vitest, Supertest, pg-mem
- **Deployment:** Docker image plus Docker Compose

## Key Concepts

- **Cases** - Top-level investigation containers (e.g., a client engagement)
- **Incidents** - Security events within a case being investigated
- **Findings** - Analyst conclusions about what happened
- **Timeline Events** - Chronological observations from evidence
- **Indicators** - Indicators of Compromise (IoCs)
- **Systems / Accounts** - Affected infrastructure and identities
- **Tasks** - Investigation work items assigned to team members
- **Queries** - Saved investigation queries (KQL, SQL, etc.)
- **Entity Links** - Relationships between investigation artifacts
- **MITRE ATT&CK Tags** - Mapping findings and events to ATT&CK techniques

## Runtime Notes

- Production deployments should use the published Docker image and `docker-compose.prod.yml`.
- Production auth uses the `forenotes_session` HTTP-only cookie created by `/api/auth/login`.
- `x-user-id` header auth is only for tests or explicitly enabled non-production development.
- Uploaded app data is stored under `/app/data` in the container and must be persisted.
