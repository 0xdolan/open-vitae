# Release process

Previous: [Git flow](03-git-flow.md) · Next: [Docker](05-docker.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Versioning rules](#versioning-rules)
- [Changelog rules](#changelog-rules)
- [Tagging rules](#tagging-rules)
- [Release checklist](#release-checklist)
- [What automation does](#what-automation-does)

## Versioning rules

[Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **MAJOR**: a change that breaks saved resumes or exported files without a migration, or removes a feature.
- **MINOR**: new functionality that keeps existing data working.
- **PATCH**: bug fixes only.

While the version is `0.x`, minor releases may contain breaking changes; they must say so in the changelog.

The resume file format has its own `schemaVersion` (see [Architecture](02-architecture.md#data-model)). Raising it requires a migration from the previous version.

## Changelog rules

[`CHANGELOG.md`](../CHANGELOG.md) follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

- Every user-visible pull request adds a line under `## [Unreleased]`.
- Group lines under `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Write for users, not developers: say what changed for them.
- At release time `## [Unreleased]` content moves under `## [X.Y.Z] - YYYY-MM-DD`, and a fresh empty `Unreleased` heading stays on top.

## Tagging rules

- Tags are `vX.Y.Z`, for example `v0.2.0`.
- Tags are annotated and created only on `main`, on the merge commit of the release or hotfix.
- The tag must equal the `version` in `package.json`. The release workflow refuses to run otherwise.
- Tags are never moved or deleted. A bad release is fixed by a new patch release.

## Release checklist

1. `git checkout -b release/X.Y.Z develop`
2. `npm version X.Y.Z --no-git-tag-version`
3. Move the `Unreleased` notes under `## [X.Y.Z] - YYYY-MM-DD` in `CHANGELOG.md`.
4. `npm run check && npm run build`
5. Commit: `chore(release): X.Y.Z`. Push and open a pull request into `main`.
6. After it merges:

   ```bash
   git checkout main && git pull
   git tag -a vX.Y.Z -m "Open Vitae X.Y.Z"
   git push origin vX.Y.Z
   ```

7. Open a pull request from `release/X.Y.Z` into `develop` so the version bump flows back.
8. Delete the release branch.

Hotfixes follow the same steps from a `hotfix/X.Y.Z` branch created from `main`.

## What automation does

| Trigger                  | Workflow              | Result                                                   |
| ------------------------ | --------------------- | -------------------------------------------------------- |
| Pull request, push to `develop` | `ci.yml`       | Type-check, lint, format check, tests, build, audit, Docker build |
| Push to `main`           | `deploy-pages.yml`    | Site published to GitHub Pages                           |
| Tag `vX.Y.Z`             | `release.yml`         | Checks the tag, builds, attaches a zip, publishes a GitHub release with that version's changelog section |

---

Previous: [Git flow](03-git-flow.md) · Next: [Docker](05-docker.md) · [Docs home](README.md) · [Main README](../README.md)
