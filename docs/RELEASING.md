# Forenotes Release Guide

Forenotes publishes the application and report LLM images to Docker Hub from GitHub Actions.

## One-time GitHub setup

Create a Docker Hub access token with permission to push to `ngynduc/forenotes` and `ngynduc/forenotes-report-llm`, then add these repository secrets under **Settings → Secrets and variables → Actions**:

```text
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-access-token
```

The workflow publishes on version tags or a manual workflow dispatch. Pull requests and pushes to `main` run CI without publishing a container image.

## Release a version

Prepare and validate the release branch first. Review the release notes and confirm both Docker Hub repositories are available to the publishing token. For `0.2.4`, see [release notes](./releases/0.2.4.md) and [regression checks](./releases/0.2.4-validation.md).

Push the release branch for review, using the chosen version without the `v` prefix:

```bash
RELEASE_TAG="<release-tag>"
git checkout "release/v$RELEASE_TAG"
git status --short # Must be clean.
git push origin "release/v$RELEASE_TAG"
```

Tag the validated release commit directly on the release branch:

```bash
RELEASE_TAG="<release-tag>"
git checkout "release/v$RELEASE_TAG"
git status --short # Must be clean.
git tag -a "v$RELEASE_TAG" -m "Release v$RELEASE_TAG"
git push origin "v$RELEASE_TAG"
```

The tag workflow repeats validation before publishing. Merge the release branch
into `main` through the normal review process afterward; publication does not
depend on that merge. Do not move or overwrite an existing release tag.

The tag workflow publishes matching full semver, minor, major, and SHA tags for both repositories:

```text
ngynduc/forenotes:<release-tag>
ngynduc/forenotes-report-llm:<release-tag>
```

Keep shipping defaults pinned to the last published version while preparing a
release. Wait for both image publishing jobs to succeed and verify both full
version tags can be pulled before promoting the pins in `install.sh`,
`.env.production.example`, and `docker-compose.prod.yml` to `main`. A manual
dispatch on a branch produces SHA tags; dispatch on a version tag to publish
matching versioned tags.

Production installations should use the full semver tag or SHA tag for deliberate upgrades:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
FORENOTES_REPORT_LLM_IMAGE=ngynduc/forenotes-report-llm:<release-tag>
```

The image build includes GitHub Actions layer caching, provenance attestations, and an SBOM. GitHub Actions runs lint, tests, the application build, and Compose validation before publishing is allowed by branch protection.
