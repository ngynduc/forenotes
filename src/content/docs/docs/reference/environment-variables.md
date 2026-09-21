---
title: Environment variables
description: Quick reference for required and optional Forenotes runtime configuration.
---

## Core production settings

| Variable | Required | Purpose |
| --- | --- | --- |
| `FORENOTES_IMAGE` | Yes | Pinned container image: `ngynduc/forenotes:<image-tag>` |
| `APP_HOST` | No | Listen address inside the container; defaults to `0.0.0.0` |
| `APP_PORT` | No | Application port; defaults to `3000` in production Compose |
| `FORENOTES_HOST_PORT` | No | Host port mapped to `APP_PORT`; defaults to `3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `POSTGRES_USER` | Yes* | Bundled PostgreSQL user |
| `POSTGRES_PASSWORD` | Yes* | Bundled PostgreSQL password |
| `POSTGRES_DB` | Yes* | Bundled PostgreSQL database |
| `FORENOTES_DATA_DIR` | No | Persistent upload directory; `/app/data` in Compose |

`POSTGRES_*` values are required when using the bundled database.

## Authentication and secrets

| Variable | Required | Purpose |
| --- | --- | --- |
| `FORENOTES_BOOTSTRAP_ADMIN_USERNAME` | Yes | Initial administrator username |
| `FORENOTES_BOOTSTRAP_ADMIN_EMAIL` | Yes | Initial administrator email |
| `FORENOTES_BOOTSTRAP_ADMIN_DISPLAY_NAME` | Yes | Initial administrator display name |
| `FORENOTES_BOOTSTRAP_ADMIN_PASSWORD` | Yes | Temporary password; minimum 12 characters |
| `FORENOTES_BOOTSTRAP_ADMIN_TEMPORARY` | No | Marks bootstrap password for replacement; defaults to `true` |
| `FORENOTES_LLM_SECRET_KEY` | Yes | Encrypts saved provider credentials; minimum 32 characters |
| `SECURE_SESSION_COOKIES` | Yes | Use `true` with HTTPS; `false` only for local HTTP |
| `FORENOTES_ALLOW_HEADER_AUTH` | No | Non-production test convenience; production rejects it |

## Optional LLM settings

| Variable | Purpose |
| --- | --- |
| `LITELLM_SERVICE_URL` | Report generation service URL |
| `LLM_PROVIDER` | Provider name |
| `LLM_MODEL` | Provider model identifier |
| `LLM_API_KEY` | Deployment-level provider credential |
| `LLM_API_ENDPOINT` | Custom provider endpoint |
| `FORENOTES_LLM_ALLOWED_HOSTS` | Comma-separated custom endpoint hostnames |
| `FORENOTES_ALLOW_UNSAFE_LLM_ENDPOINTS` | Disables endpoint protections; local labs only |
| `LLM_SYSTEM_PROMPT` | Optional deployment prompt override |
| `LLM_CUSTOM_HEADERS_JSON` | Extra provider headers as a JSON object |

Never commit populated environment files. Preserve `FORENOTES_LLM_SECRET_KEY` across upgrades and restores.
