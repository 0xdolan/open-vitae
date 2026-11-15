# Contributing to Open Vitae

Thank you for helping. This page covers the rules; the [docs](docs/README.md) cover the detail.

## Ground rules

1. **Nothing leaves the browser.** No analytics, no telemetry, no backend calls. A feature that needs a server will not be merged.
2. **TypeScript only, strict mode.** No `any`.
3. **Both directions.** Every UI change must work in LTR and RTL. Use CSS logical properties (`ps-4`, `ms-2`, `text-start`), never `left` or `right`.
4. **Reusable components.** One component, one job. Configuration lives in `src/config`, not inside components.
5. **Treat all input as hostile.** Imported files, pasted HTML, uploaded images and fonts are validated or sanitised before use.
6. **Accessible.** Keyboard reachable, visible focus, labelled controls, WCAG AA contrast.

## Workflow

1. Branch from `develop`: `git checkout -b feature/<short-name> develop`. See [git flow](docs/03-git-flow.md).
2. Make the change with tests.
3. Run `npm run check`.
4. Add a line under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
5. Open a pull request into `develop`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<optional scope>): <summary in the imperative>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. Add `!` after the type for a breaking change.

Examples:

```text
feat(editor): add superscript and subscript
fix(export): keep RTL bullet order in PDF
docs: explain manual page breaks
```

## Licence

By contributing you agree that your work is released under [GPL-3.0-or-later](LICENSE).
