# Forenotes Documentation

**Forenotes** is a collaborative DFIR (Digital Forensics & Incident Response) notebook application. It enables security teams to manage investigation cases, track incidents, document findings, build timelines, and map evidence to the MITRE ATT&CK framework.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Getting Started](./GETTING-STARTED.md) | Setup, installation, and running the application |
| [Architecture](./ARCHITECTURE.md) | System architecture, tech stack, and project structure |
| [API Reference](./API.md) | Complete REST API documentation |
| [Database Schema](./DATABASE.md) | Database tables, relationships, and migrations |
| [Authentication & Authorization](./AUTHENTICATION.md) | Auth flow, RBAC roles, and permissions |
| [Features](./FEATURES.md) | Feature documentation and domain concepts |

## Tech Stack

- **Backend:** Node.js, Express 5, TypeScript
- **Database:** PostgreSQL
- **Frontend:** Vanilla JavaScript (module-based SPA)
- **Validation:** Zod
- **Testing:** Vitest, Supertest, pg-mem

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
