---
title: Upgrade Forenotes
description: Upgrade a Docker Compose deployment from its current pinned image to a chosen release.
---

This guide applies to any pinned Forenotes release. Replace `<target-image-tag>` with the Docker image tag you intend to deploy. Keep the current tag available until the upgrade is verified.

The application applies required database migrations when the new container starts. Review the target release notes for version-specific requirements and whether intermediate releases are required.

## 1. Back up the installation

Follow [Backup and restore](/docs/operations/backup-and-restore/) and confirm the three artifacts exist: the SQL dump, application-data archive, and protected environment file.

## 2. Record the current pinned image

```bash
grep '^FORENOTES_IMAGE=' .env.production
```

Save that value with the backup. It identifies the application image used before the upgrade.

## 3. Choose the target image

Select a published version from the project releases. Do not use `latest`, `main`, or another moving tag for an audited deployment.

Change the pinned image in `.env.production`:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<target-image-tag>
```

Replace the entire `<target-image-tag>` placeholder with the chosen image tag, without angle brackets.

## 4. Pull the target image

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production pull app
```

If the pull fails, confirm that the tag exists before changing the running deployment.

## 5. Recreate the application

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d app
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=150 app
```

Recreating only `app` preserves the existing PostgreSQL and application-data volumes.

## 6. Verify

```bash
curl --fail http://localhost:3000/api/health
```

Sign in, open an existing case, load its evidence and timeline, and open one report. If optional LLM support is configured, generate a small test draft. Keep the pre-upgrade backup until these checks pass.

## Roll back

If verification fails, inspect the application logs first. To return to the previous release, restore the database and application-data backup, restore the previous `FORENOTES_IMAGE` value, then recreate `app`.

Do not roll back only the container image after a migration unless the release notes explicitly say the database change is backward-compatible.

:::note
Do not use a floating image tag for an audited deployment. A pinned tag makes rollback and incident review reproducible.
:::
