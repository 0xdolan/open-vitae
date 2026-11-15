# Git flow

Previous: [Architecture](02-architecture.md) · Next: [Release process](04-release-process.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Branches](#branches)
- [Everyday work](#everyday-work)
- [Releases and hotfixes](#releases-and-hotfixes)
- [Branch protection](#branch-protection)
- [Commit messages](#commit-messages)

## Branches

| Branch        | Created from | Merges into          | Purpose                                 |
| ------------- | ------------ | -------------------- | --------------------------------------- |
| `main`        | —            | —                    | Released code only. Default, protected. Every commit is deployable |
| `develop`     | `main`       | —                    | Integration branch for the next release. Protected |
| `feature/*`   | `develop`    | `develop`            | New functionality                       |
| `bugfix/*`    | `develop`    | `develop`            | Fix for something not yet released      |
| `release/*`   | `develop`    | `main` and `develop` | Stabilise and version a release         |
| `hotfix/*`    | `main`       | `main` and `develop` | Urgent fix for released code            |
| `docs/*`      | `develop`    | `develop`            | Documentation only                      |
| `chore/*`     | `develop`    | `develop`            | Tooling, dependencies, CI               |

The repository never uses `master`. `scripts/init-git-flow.sh` renames it to `main` if it exists.

## Everyday work

```bash
git checkout develop && git pull
git checkout -b feature/section-drag-drop
# ...work, commit...
npm run check
git push -u origin feature/section-drag-drop
```

Open a pull request into `develop`. CI must pass. Merge with a merge commit (not squash) so the branch history stays visible, then delete the branch.

## Releases and hotfixes

Release:

```bash
git checkout -b release/0.2.0 develop
# bump version, finalise CHANGELOG (see the release process page)
git push -u origin release/0.2.0
# PR into main, merge, tag on main, then PR release/0.2.0 into develop
```

Hotfix:

```bash
git checkout -b hotfix/0.2.1 main
# fix, bump patch version, update CHANGELOG
# PR into main, merge, tag, then PR into develop
```

The full steps are in the [release process](04-release-process.md).

## Branch protection

`scripts/protect-main.sh <owner>/<repo>` applies these rules to `main` and `develop`:

- Changes only through pull requests
- CI checks must pass and the branch must be up to date
- Conversations must be resolved
- No force pushes, no deletion
- Rules apply to administrators too

The script requires zero approvals by default because a solo maintainer cannot approve their own pull request. Once there are reviewers, run it with `APPROVALS=1`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/). The type decides the version bump:

| Type                         | Bump  |
| ---------------------------- | ----- |
| `fix`, `perf`                | patch |
| `feat`                       | minor |
| any type with `!` or a `BREAKING CHANGE:` footer | major |
| `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore` | none |

---

Previous: [Architecture](02-architecture.md) · Next: [Release process](04-release-process.md) · [Docs home](README.md) · [Main README](../README.md)
