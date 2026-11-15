# Open Vitae: rules for AI coding assistants

Open Vitae is a browser-only resume builder. Read this before changing anything.

## Non-negotiables

- **No data leaves the browser.** No backend, analytics, telemetry or remote APIs. Google Fonts is the single allowed third-party host.
- **TypeScript strict.** No `any`, no `@ts-ignore`.
- **RTL and LTR equally.** Use logical CSS properties. Test both directions.
- **Sanitise.** Never render user HTML without the sanitiser. `dangerouslySetInnerHTML` is lint-blocked.
- **Reusable components.** Constants go in `src/config`. The data model is the Zod schema in `src/schema/resume.ts`; change it only with a migration (see `docs/07-data-and-storage.md`).
- **Licence.** GPL-3.0-or-later. Only add dependencies with a GPL-compatible licence.

## Commands

- `npm run dev` starts the dev server.
- `npm run check` runs type-check, lint, format check and tests. Run it before finishing.
- `npm run build` builds to `dist/`.

## Git

- Git flow: branch from `develop` as `feature/<name>`; never commit to `main` or `develop` directly.
- Conventional Commits.
- Add a line to `CHANGELOG.md` under **Unreleased** for user-visible changes.

## The three-step process

Each change goes through three separate steps, each in a fresh session so no step grades its own work:

1. `/implement <task>` builds the change on a feature branch.
2. `/review` reviews the diff against these rules.
3. `/eval` checks the result against the acceptance criteria and the standing checks.

Details are in `.claude/commands/`.

## Skills

- shadcn/ui skill: `npx skills add shadcn/ui` (activates through `components.json`).
- UI/UX Pro Max skill: place it in `.claude/skills/ui-ux-pro-max/` (needs Python 3).
