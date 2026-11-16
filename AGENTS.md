# Open Vitae: notes for AI coding agents

This file is for agents such as Codex, Gemini CLI, Cursor and Copilot. The rules are the same as in [`CLAUDE.md`](CLAUDE.md); read that file first. In short:

- **No data leaves the browser.** No backend, analytics, telemetry or remote APIs. Google Fonts is the single allowed third-party host; grammar checking talks only to a same-site LanguageTool server.
- **TypeScript strict.** No `any`, no `@ts-ignore`.
- **RTL and LTR equally.** Logical CSS properties; test both directions.
- **Sanitise.** User HTML only through `src/lib/sanitize.ts` and the `SafeHtml` component.
- **Interface text** comes from `src/i18n/messages/`; add every new key to English, Persian, Arabic and Sorani (tests check this).
- **The data model** is `src/schema/resume.ts`. Changing it needs a migration (`src/lib/migrations.ts`) and `npm run schema` to update `public/schema/resume.schema.json`.
- **Brand files** are generated: change `scripts/brand/make-logo.mjs`, never the SVGs.
- Run `npm run check` before finishing. Git flow (`feature/<name>` from `develop`), Conventional Commits, and a line in `CHANGELOG.md` for user-visible changes.

To help people **write resumes** for Open Vitae (rather than change its code), use the skill in [`skills/open-vitae/`](skills/open-vitae/SKILL.md).
