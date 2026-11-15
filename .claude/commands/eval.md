---
description: Step 3 of 3. Evaluate the branch against its acceptance criteria.
---

Evaluate the current branch. You did not write or review this code. Judge only by evidence you produce in this session.

1. Read `.claude/work/acceptance.md`. If it is missing, stop and say so.
2. Run `npm run check` and `npm run build`. Record pass or fail for each.
3. For every acceptance criterion, find evidence: a passing test, build output, or behaviour seen in the running app (`npm run preview`). Mark each **met**, **not met** or **cannot verify**, with the evidence.
4. Run the standing checks:
   - The feature works with direction set to RTL and to LTR.
   - The production build makes no request to any host other than its own origin and Google Fonts.
   - Nothing was written outside browser storage.
   - `CHANGELOG.md` has an entry.
5. Output a table of criteria and results, then one verdict: **pass** or **fail**. A single **not met** or failed command is a fail. List **cannot verify** items separately so a person can check them.
