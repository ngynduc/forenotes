# Forenotes Release Guide

Forenotes publishes the production image to Docker Hub from GitHub Actions.

## One-time GitHub setup

Create a Docker Hub access token with permission to push to `ngynduc/forenotes`, then add these repository secrets under **Settings → Secrets and variables → Actions**:

```text
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-access-token
```

The workflow does not publish on pull requests. It publishes on pushes to `main` and on version tags.

## Release a version

From a clean checkout:

```bash
git checkout main
git pull --ff-only
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

The tag workflow publishes:

```text
ngynduc/forenotes:0.2.0
ngynduc/forenotes:0.2
ngynduc/forenotes:0
ngynduc/forenotes:sha-<short-sha>
ngynduc/forenotes:latest
```

Pushes to `main` publish `main`, `sha-<short-sha>`, and `latest`. Production installations should use the full semver tag or SHA tag for deliberate upgrades:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:0.2.0
```

The image build includes GitHub Actions layer caching, provenance attestations, and an SBOM. GitHub Actions runs lint, tests, the application build, and Compose validation before publishing is allowed by branch protection.
