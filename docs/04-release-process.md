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
3. Move the `Unreleased` notes under `## [X.Y.Z] - YYYY-MM-DD` in `CHANGELOG.md`, update the status line in `README.md`, and commit: `chore(release): X.Y.Z`.
4. `bash scripts/release.sh prepare X.Y.Z` installs, downloads and verifies the bundled fonts, runs `npm run check`, builds the app and the site, commits `package-lock.json` and `public/fonts` if they changed, pushes the branch and opens a pull request into `main`.
5. Merge that pull request **with a merge commit** (not squash or rebase), so `main` and `develop` share the release commits.
6. `bash scripts/release.sh tag X.Y.Z` tags the merge on `main` (annotated `vX.Y.Z`), pushes the tag and opens a pull request from `release/X.Y.Z` into `develop`.
7. Merge that pull request, then delete the release branch.

Without the GitHub CLI the script prints the links to open the pull requests by hand. The same steps by hand:

```bash
git checkout main && git pull
git tag -a vX.Y.Z -m "Open Vitae X.Y.Z"
git push origin vX.Y.Z
```

Hotfixes follow the same steps from a `hotfix/X.Y.Z` branch created from `main`.

## What automation does

| Trigger                         | Workflow           | Result                                                                                                                                                                        |
| ------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull request, push to `develop` | `ci.yml`           | Type-check, lint, format check, tests, build, audit, Docker build                                                                                                             |
| Push to `main`                  | `deploy-pages.yml` | Landing page and app published to GitHub Pages                                                                                                                                |
| Tag `vX.Y.Z`                    | `release.yml`      | Checks the tag, runs every check, builds, and publishes a GitHub release with that version's changelog section, the app as a zip, the AI skill as a zip and SHA-256 checksums |

---

Previous: [Git flow](03-git-flow.md) · Next: [Docker](05-docker.md) · [Docs home](README.md) · [Main README](../README.md)
