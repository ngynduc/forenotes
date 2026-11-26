---
title: Upgrade Forenotes
description: Upgrade Docker Compose, the pinned application image, and database migrations together.
---

Choose a published Git release tag and its matching Docker image tags. Keep the current artifacts until the upgrade is verified. Review [release notes](/docs/reference/releases/) for migration requirements and whether intermediate releases are needed.

The application applies required database migrations at startup. Test the upgrade on a restored backup before updating the live deployment.

## 1. Back up the installation

Follow [Backup and restore](/docs/operations/backup-and-restore/) and confirm the SQL dump, application-data archive, and protected environment file exist. Also save the installed Compose file:

```bash
cp docker-compose.prod.yml docker-compose.prod.yml.pre-upgrade
grep -E '^FORENOTES_(IMAGE|REPORT_LLM_IMAGE)=' .env.production
```

Record the current image pins with the backup. Keep the existing deployment directory and Compose project name so the upgraded stack uses the same volumes. Preserve `FORENOTES_LLM_SECRET_KEY`.

## 2. Download the target Compose file

Run from the existing deployment directory:

```bash
TARGET_RELEASE_TAG='<target-release-tag>'
curl -fsSLo docker-compose.prod.yml.next \
  "https://raw.githubusercontent.com/ngynduc/forenotes/$TARGET_RELEASE_TAG/docker-compose.prod.yml"
diff -u docker-compose.prod.yml docker-compose.prod.yml.next
```

Replace `<target-release-tag>` with the selected Git tag, without angle brackets. Review the diff and reapply any intentional local configuration, such as external-database wiring, before replacing the file. `diff` exits with status 1 when files differ.

```bash
mv docker-compose.prod.yml.next docker-compose.prod.yml
```

Changing only the app image cannot add services missing from an older Compose file.

## 3. Pin the target image

Edit the existing `.env.production`:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<target-image-tag>
```

Replace `<target-image-tag>` with the published Docker version without the Git tag's `v` prefix. Leave existing passwords, keys, and provider settings intact.

Upgrading from 0.2.5 or earlier: the separate report LLM service is gone. Delete `FORENOTES_REPORT_LLM_IMAGE` and `LITELLM_SERVICE_URL` from `.env.production` (they are ignored if left). Your `LLM_*` settings and users' saved provider settings keep working; a custom provider name without `LLM_API_ENDPOINT` now needs that endpoint set. See [LLM settings](/docs/admin/llm-settings/).

MCP is disabled by default. If enabling it, add the settings from [MCP investigation agents](/docs/admin/mcp/).

## 4. Pull and recreate the stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production config --quiet
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --wait --remove-orphans
docker compose -f docker-compose.prod.yml --env-file .env.production ps
docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=150 app
```

`--remove-orphans` stops services no longer in Compose, such as the old `report-llm-service`. If a pull fails, confirm the tag exists before recreating the running deployment. Recreating services preserves the named volumes. Do not use `down -v` during an upgrade.

## 5. Verify

```bash
curl --fail http://localhost:3000/api/health
```

Use your configured host port. Sign in, open an existing case, load its evidence and timeline, and open a report. If a provider is configured, run **Settings → LLM → Test connection** and ask AI Report Chat a short question. If MCP is enabled, check client tool discovery and read an accessible case. Keep the backup until these checks pass.

## Roll back

Inspect logs first. If rollback is needed, restore the matching pre-upgrade database and application-data backup, protected environment file with the previous image pins, and saved Compose configuration. Then recreate the previous stack.

Do not roll back only the container images after a migration unless the release notes explicitly state that the database change is backward-compatible.
