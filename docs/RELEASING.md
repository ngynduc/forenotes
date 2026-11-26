# Forenotes Release Guide

Forenotes publishes the application image to Docker Hub from GitHub Actions.

## One-time GitHub setup

Create a Docker Hub access token with permission to push to `ngynduc/forenotes`, then add these repository secrets under **Settings → Secrets and variables → Actions**:

```text
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-access-token
```

Pull requests and version tags run validation. Merging a newly tagged release into
`main` publishes the image without repeating validation. A manual workflow
dispatch can republish a specific release tag that is already contained in
`main`.

## Release a version

Prepare and validate the release branch first. Review the release notes and confirm the Docker Hub repository is available to the publishing token. For `0.2.6`, see [release notes](./releases/0.2.6.md) and [regression checks](./releases/0.2.6-validation.md).

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

Wait for the tag's CI run to pass, then merge the release branch into `main`
through the normal review process. The `main` workflow verifies that the merge
introduces exactly one release tag and confirms that tag's CI run succeeded,
then checks out and publishes the validated tag without running lint, tests, or
the application build again. A normal `main` push that does not introduce a
release tag does not publish. Do not move or overwrite an existing release tag.

The `main` release workflow publishes matching full semver, minor, major, and
SHA tags:

```text
ngynduc/forenotes:<release-tag>
```

Keep shipping defaults pinned to the last published version while preparing a
release. Wait for the image publishing job to succeed and verify the full
version tag can be pulled before promoting the pins in `install.sh`,
`.env.production.example`, and `docker-compose.prod.yml` to `main`. A manual
dispatch requires a `vMAJOR.MINOR.PATCH` tag and republishes the matching full
version, minor, major, and SHA tags.

Production installations should use the full semver tag or SHA tag for deliberate upgrades:

```dotenv
FORENOTES_IMAGE=ngynduc/forenotes:<release-tag>
```

The image build includes GitHub Actions layer caching, provenance attestations,
and an SBOM. Tag CI runs lint, tests, the application build, and Compose
validation. Publishing checks out that exact validated tag after it is merged
into `main`.
