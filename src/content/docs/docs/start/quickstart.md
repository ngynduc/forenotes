---
title: Production quickstart
description: Install a pinned Forenotes release with Docker Compose and verify the first login.
sidebar:
  order: 1
---

This path is for a new operator installing the published image on a Linux host. It uses the bundled PostgreSQL service and persistent Docker volumes.

## Before you begin

You need Docker, the Docker Compose plugin, and an unused host port. A practical starting point is 2 CPU cores, 4 GB RAM, and 20 GB free storage.

For an internet-facing deployment, prepare an HTTPS reverse proxy. The installer defaults to HTTP-friendly session cookies unless you pass `--secure-cookies`.

## Install

Run the installer from the directory that should contain the deployment:

```bash
curl -fsSL https://raw.githubusercontent.com/ngynduc/forenotes/main/install.sh | bash
```

It creates `forenotes-prod/`, generates secrets, downloads the production Compose file, starts PostgreSQL and Forenotes, waits for the health endpoint, and prints the first administrator password.

To choose another directory or host port:

```bash
curl -fsSL https://raw.githubusercontent.com/ngynduc/forenotes/main/install.sh | \
  bash -s -- --dir /opt/forenotes --port 8080
```

For a host already served through HTTPS:

```bash
curl -fsSL https://raw.githubusercontent.com/ngynduc/forenotes/main/install.sh | \
  bash -s -- --dir /opt/forenotes --secure-cookies
```

## Pin the release image

The installer preserves an existing environment file, including its image tag. Confirm the deployment uses the intended release:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<image-tag>
```

Replace `<image-tag>` with the published Docker image tag you intend to run, without angle brackets.

Then pull and recreate the app:

```bash
cd forenotes-prod
docker compose --env-file .env.production -f docker-compose.prod.yml pull app
docker compose --env-file .env.production -f docker-compose.prod.yml up -d app
```

## Verify the deployment

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=100 app
curl --fail http://127.0.0.1:3000/api/health
```

Use your configured host port instead of `3000` when it differs.

## Complete first login

Open the application, sign in as `admin` with the generated password stored in `.bootstrap-admin-password`, and set a permanent password when prompted.

Before inviting users:

- put the deployment behind HTTPS;
- set `SECURE_SESSION_COOKIES=true`;
- create a complete [database and app-data backup](/docs/operations/backup-and-restore/);
- restrict PostgreSQL and the deployment files to trusted administrators.

For an audited manual setup, external PostgreSQL, or every environment option, continue to [Production installation](/docs/operations/production-install/).
