# Getting started

Previous: [Docs home](README.md) · Next: [Architecture](02-architecture.md) · [Main README](../README.md)

## Contents

- [Requirements](#requirements)
- [Install and run](#install-and-run)
- [First-time repository setup](#first-time-repository-setup)
- [Publish to GitHub Pages](#publish-to-github-pages)
- [Optional: AI skills](#optional-ai-skills)
- [Troubleshooting](#troubleshooting)

## Requirements

- Node.js 22 or newer (`.nvmrc` pins the major version)
- npm 10 or newer
- git
- Optional: Docker with the Compose plugin, the GitHub CLI (`gh`)

## Install and run

```bash
npm install
npm run dev
```

The app is at <http://127.0.0.1:5173>. Before pushing, run:

```bash
npm run check
```

The first `npm install` creates `package-lock.json`. **Commit it.** CI and the Docker build use `npm ci`, which needs the lockfile.

Then download the bundled Persian and Arabic fonts (Sahel and Estedad) once and commit them, so every build includes them:

```bash
npm run fonts:fetch
git add public/fonts
```

See [Fonts and right-to-left text](10-fonts.md#bundled-fonts-sahel-and-estedad).

## First-time repository setup

```bash
bash scripts/init-git-flow.sh
```

This creates the repository if needed, renames `master` to `main`, makes the first commit, and creates `develop`. Then create an empty repository on GitHub and push:

```bash
git remote add origin git@github.com:<you>/open-vitae.git
git push -u origin main develop
bash scripts/protect-main.sh <you>/open-vitae
```

The last command makes `main` the default branch, protects `main` and `develop`, and switches GitHub Pages to deploy from GitHub Actions.

## Publish to GitHub Pages

Every push to `main` runs `.github/workflows/deploy-pages.yml`, which builds the app with the correct base path and publishes it at `https://<you>.github.io/open-vitae/`.

## Optional: AI skills

The project is set up for two skills used by AI coding tools:

```bash
npx skills add shadcn/ui
```

The shadcn/ui skill reads `components.json`. The UI/UX Pro Max skill goes in `.claude/skills/ui-ux-pro-max/` and needs Python 3; follow its own README to install it.

## Troubleshooting

| Symptom                                | Fix                                                            |
| -------------------------------------- | -------------------------------------------------------------- |
| `npm ci` fails with "no lockfile"      | Run `npm install` once and commit `package-lock.json`          |
| Blank page on GitHub Pages             | The repository name must match the `VITE_BASE` path in the workflow (it is read automatically) |
| Old version keeps showing              | The service worker cached it. Close all tabs of the app and reopen |
| Port 5173 or 8080 already in use       | Stop the other process, or change the port in `vite.config.ts` / `docker-compose.yml` |

---

Previous: [Docs home](README.md) · Next: [Architecture](02-architecture.md) · [Main README](../README.md)
