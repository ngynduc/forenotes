# Getting Started

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

## Installation

```bash
git clone <repository-url>
cd forenotes
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=8787
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/forenotes
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8787` | Server port |
| `DATABASE_URL` | `postgres://postgres:postgres@127.0.0.1:5432/forenotes` | PostgreSQL connection string |

## Database Setup

Create the database and run migrations:

```bash
createdb forenotes
npm run db:migrate
```

Migrations are located in `src/server/db/migrations/` and run sequentially:

1. `001_initial.sql` - Core schema (users, cases, incidents, findings, etc.)
2. `002_graph_workspace.sql` - Graph workspace tables
3. `003_timeline_relationship_fields.sql` - Timeline event relationship fields

## Running the Application

### Development

```bash
npm run dev
```

This starts the server with file watching via `tsx`. The server runs on `http://localhost:8787`.

### Demo Mode

```bash
npm run dev:demo
```

### Production

```bash
npm run build    # Compile TypeScript
npm start        # Run compiled output
```

## Running Tests

```bash
npm run test
```

Tests use `vitest` with `pg-mem` for in-memory PostgreSQL simulation and `supertest` for HTTP assertions.

## Type Checking

```bash
npm run lint
```

Runs `tsc --noEmit` to check TypeScript types without producing output.

## Project Structure

```
forenotes/
├── src/
│   ├── client/static/           # Frontend SPA
│   │   ├── app.js               # Entry point
│   │   ├── index.html           # HTML shell
│   │   ├── styles.css           # Styles
│   │   └── modules/             # JS modules
│   │       ├── state.js         # Global state management
│   │       ├── api.js           # HTTP client
│   │       ├── data.js          # Data fetching
│   │       ├── entities.js      # Entity CRUD operations
│   │       ├── graphApi.js      # Graph API client
│   │       ├── code-editor.js   # Code editor component
│   │       ├── tableDefinitions.js
│   │       └── render/          # UI rendering modules
│   │           ├── shell.js     # Main layout
│   │           ├── dashboard.js # Dashboard view
│   │           ├── table.js     # Table component
│   │           ├── graph.js     # Graph visualization
│   │           ├── tasks.js     # Task board (Kanban)
│   │           ├── modal.js     # Modal dialogs
│   │           └── admin.js     # Admin/settings views
│   ├── server/
│   │   ├── index.ts             # Server entry point
│   │   ├── app.ts               # Express app setup
│   │   ├── db/
│   │   │   ├── pool.ts          # PostgreSQL connection pool
│   │   │   ├── setup.ts         # Migration runner
│   │   │   └── migrations/      # SQL migration files
│   │   ├── graph/
│   │   │   ├── graphBuilder.ts  # Graph construction
│   │   │   ├── graphTypes.ts    # Graph type definitions
│   │   │   └── entityLinksRepository.ts
│   │   ├── permissions/
│   │   │   └── catalog.ts       # Permission definitions
│   │   ├── routes/
│   │   │   ├── caseRoutes.ts
│   │   │   ├── incidentRoutes.ts
│   │   │   ├── tagRoutes.ts
│   │   │   ├── searchRoutes.ts
│   │   │   ├── dashboardRoutes.ts
│   │   │   ├── auditLogRoutes.ts
│   │   │   ├── notificationRoutes.ts
│   │   │   └── userRoutes.ts
│   │   ├── schemas/
│   │   │   └── schemas.ts       # Zod validation schemas
│   │   └── services/            # Business logic (20+ services)
│   └── shared/
│       └── domain.ts            # Domain constants and types
├── docs/                        # Documentation
├── package.json
└── tsconfig.json
```
