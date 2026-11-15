---
description: Step 1 of 3. Implement a task on a feature branch.
argument-hint: <task description or issue number>
---

Implement this task: $ARGUMENTS

1. Read `CLAUDE.md` and the relevant pages under `docs/`.
2. Confirm you are on a `feature/*` or `bugfix/*` branch created from `develop`. If not, create one.
3. Write down the acceptance criteria as a checklist in `.claude/work/acceptance.md` (create the folder if needed). Each criterion must be observable.
4. Implement the smallest change that meets the criteria. Reuse existing components and config before adding new ones.
5. Add or update unit tests.
6. Run `npm run check` and fix everything it reports.
7. Add a line under **Unreleased** in `CHANGELOG.md`.
8. Commit using Conventional Commits.
9. Stop. Do not review or evaluate your own work; that happens in `/review` and `/eval` in fresh sessions.
