---
title: Production install
description: Install a pinned Forenotes release with Docker Compose and secure bootstrap settings.
---

The supported production path uses Docker Compose, PostgreSQL, and a versioned `ngynduc/forenotes:<image-tag>` image.

## Prerequisites

- Docker Engine with the Compose plugin
- A Linux host with persistent storage
- HTTPS termination for any network-accessible deployment

## Fast local install

For a local evaluation, use the installer published with the release:

```bash
curl -fsSL https://raw.githubusercontent.com/ngynduc/forenotes/<release-tag>/scripts/install.sh | bash
```

Replace `<release-tag>` with the Git release tag you want to install, without angle brackets.

The local installer permits HTTP cookies. For an HTTPS host, use the audited manual setup in the repository and enable secure cookies.

## Manual install

```bash
git clone --branch <release-tag> --depth 1 https://github.com/ngynduc/forenotes.git
cd forenotes
cp .env.example .env.production
```

Edit `.env.production` and set at least:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<image-tag>
POSTGRES_USER=forenotes
POSTGRES_PASSWORD=replace-with-a-long-random-password
POSTGRES_DB=forenotes
DATABASE_URL=postgres://forenotes:replace-with-a-long-random-password@postgres:5432/forenotes
FORENOTES_BOOTSTRAP_ADMIN_USERNAME=admin
FORENOTES_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME=Forenotes Admin
FORENOTES_BOOTSTRAP_ADMIN_PASSWORD=replace-with-a-long-random-temporary-password
FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY=true
FORENOTES_LLM_SECRET_KEY=replace-with-at-least-32-random-characters
SECURE_SESSION_COOKIES=true
```

Replace `<release-tag>` and `<image-tag>` with published values. Git release tags may include a `v` prefix while Docker image tags may not, so copy each value from its respective release artifact.

Start the stack:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

Open `http://localhost:3000`, or your HTTPS hostname. Sign in with the bootstrap account and change its temporary password.

## Verify health

```bash
curl --fail http://localhost:3000/api/health
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 app
```

The application runs database migrations during startup. Do not interrupt the container while an upgrade migration is running.
