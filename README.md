# Forenotes website

This branch contains the standalone Forenotes marketing site and public documentation. It uses Astro Starlight for `/docs/` and keeps the React landing and donation pages at `/` and `/donate/`.

## Run locally

```bash
npm ci
npm run dev
```

Astro prints the local URL, normally `http://localhost:4321`.

## Validate

```bash
npm run lint
npm run build
```

Documentation lives in `src/content/docs/docs`. Navigation is configured in `astro.config.mjs`; add a page there when it should appear in the sidebar.

Production examples use explicit release placeholders and require a pinned image tag.
