# Open Vitae

A free, open-source resume builder that runs entirely in your browser. No account, no server, no tracking. Built for left-to-right, right-to-left and mixed-direction resumes.

> **Status:** phase 1 (project scaffold). The editor, exports and samples arrive in later phases. See the [roadmap](docs/06-roadmap.md).

## Contents

- [Why Open Vitae](#why-open-vitae)
- [Quick start](#quick-start)
- [Run with Docker](#run-with-docker)
- [Scripts](#scripts)
- [Project layout](#project-layout)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security and privacy](#security-and-privacy)
- [Licence](#licence)

## Why Open Vitae

- **Private by design.** Your resume, photo and fonts stay in your browser. There is no backend.
- **Real bidirectional text.** Persian, Arabic, Kurdish, Urdu and Hebrew sit next to English correctly.
- **Print-accurate pages.** A4 by default, plus Letter, A3, A5, B5, Legal, Tabloid and Executive.
- **Open formats.** Planned import and export: JSON, CSV, Excel, Markdown, PDF, Word, IDML, PNG, JPG, SVG.
- **Installable.** Works offline as a progressive web app.

## Quick start

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open <http://127.0.0.1:5173>.

First time in a fresh copy? Set up the branches:

```bash
bash scripts/init-git-flow.sh
```

## Run with Docker

```bash
docker compose up --build              # production build at http://127.0.0.1:8080
docker compose --profile dev up dev    # hot-reload dev server at http://127.0.0.1:5173
```

Both containers bind to localhost only, drop all Linux capabilities and run as a non-root user. Details in [Docker](docs/05-docker.md).

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the dev server                          |
| `npm run build`     | Type-check and build to `dist/`               |
| `npm run preview`   | Serve the production build locally            |
| `npm run check`     | Type-check, lint, format check and unit tests |
| `npm run test`      | Unit tests                                    |
| `npm run lint`      | ESLint                                        |
| `npm run format`    | Format with Prettier                          |

## Project layout

```text
open-vitae/
├── .claude/commands/     Implement, review and eval commands for Claude Code
├── .github/              CI, Pages deploy, release workflow, templates
├── docker/               nginx config and security headers
├── docs/                 Full documentation
├── public/               Static assets copied as-is
├── scripts/              Git flow and branch protection helpers
└── src/
    ├── components/       Reusable React components
    ├── config/           Page sizes, fonts and other constants
    ├── lib/              Small shared utilities
    └── types/            The resume data model
```

## Documentation

1. [Documentation home](docs/README.md)
2. [Getting started](docs/01-getting-started.md)
3. [Architecture](docs/02-architecture.md)
4. [Git flow](docs/03-git-flow.md)
5. [Release process](docs/04-release-process.md)
6. [Docker](docs/05-docker.md)
7. [Roadmap](docs/06-roadmap.md)

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [git flow guide](docs/03-git-flow.md). Changes are listed in the [changelog](CHANGELOG.md).

## Security and privacy

Open Vitae collects nothing. The only outside request the app can make is to Google Fonts, and only when you pick a Google font. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Licence

[GPL-3.0-or-later](LICENSE). You may use, study, share and change this software; changed versions you distribute must stay under the same licence.
