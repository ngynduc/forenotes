# Forenotes

Forenotes is a DFIR case notebook for incident records, findings, timelines, tasks, hunt queries, notes, notifications, and report/PDF generation.

## Production Docker

Copy `.env.production.example` to `.env.production` and replace every placeholder secret before first boot. Production startup refuses checked-in database credentials, demo mode, header authentication, the default bootstrap admin password, and missing `FORENOTES_LLM_SECRET_KEY`.

```bash
docker pull ngynduc/forenotes:latest
```

The production image runs migrations before starting the app. Persist `/app/data` because uploaded note images and markdown note files live there. Run behind HTTPS and keep `SECURE_SESSION_COOKIES=true`. See `docs/INSTALL_PRODUCTION.md` for the complete install flow, environment reference, and troubleshooting.

For Compose deployments:

```bash
cp .env.production.example .env.production
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Development Demo Docker

The demo image is separate from production and is intentionally unsafe for production networks. It seeds demo credentials and full-surface demo records.

```bash
docker build -t forenotes:beta-v1-dev -f Dockerfile.dev .
docker run --env-file .env.demo -p 3000:3000 forenotes:beta-v1-dev
```

One-command Compose demo:

```bash
cp .env.demo.example .env.demo
docker compose -f docker-compose.demo.yml --env-file .env.demo up -d --build
```

Demo credentials:

```text
admin / admin123
commander / commander123
lead / lead123
analyst / analyst123
viewer / viewer123
```

## Local Commands

```bash
npm install
npm --prefix src/client install
npm run db:migrate
npm run db:seed
npm run lint
npm run test
npm run build
```

`npm run db:seed` runs migrations and seeds demo users, cases, incidents, findings, timeline events, tasks, queries, notes, and reports into the configured database. Do not run it against production.

## Security Notes

- Protected APIs require the `forenotes_session` cookie. `x-user-id` header auth is ignored in production.
- Uploaded note images are served through authenticated routes and checked against task/incident membership.
- LLM API keys are encrypted with `FORENOTES_LLM_SECRET_KEY`; set a stable 32+ character value before configuring providers.
- LLM custom endpoints reject local, private, link-local, metadata, and unsafe HTTP URLs by default.
