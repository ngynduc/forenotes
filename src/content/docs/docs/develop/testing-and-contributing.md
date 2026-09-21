---
title: Testing and contributing
description: Validate a focused change and prepare a reviewable contribution.
---

Work on a feature branch and keep each change focused. Update documentation alongside any changed behavior, configuration, or deployment step.

## Run the checks

From the repository root:

```bash
npm run lint
npm run test
npm run build
```

The project uses TypeScript checks, Vitest, Supertest, and `pg-mem`. Add unit or integration coverage for meaningful behavior changes, especially validation, permissions, routing, and data transformations.

## Development safety

- Use generated fixtures or the local demo seed, never customer evidence.
- Test missing environment variables and unauthorized access paths.
- Keep secrets out of source, logs, screenshots, and fixtures.
- Update `.env.example` when adding configuration.
- Update install guidance when changing Docker or Compose behavior.

## Before opening a pull request

```bash
git status
git diff
git diff --staged
```

Use Conventional Commits such as `fix(auth): reject expired sessions` or `docs(setup): clarify upgrade backup`.
