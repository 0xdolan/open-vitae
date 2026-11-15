---
description: Step 2 of 3. Independent code review of the current branch.
---

Review the diff between this branch and `develop` (`git diff develop...HEAD`). You did not write this code. Do not change it; report findings only.

Check, in this order:

1. **Privacy.** Any new network request, storage of data outside the browser, or third-party script is a blocker.
2. **Security.** Unsanitised HTML, unvalidated imports, unsafe URL handling (`javascript:` links), secrets in code, weakened Content Security Policy.
3. **Correctness.** Logic errors, unhandled edge cases, broken types, missing error handling.
4. **Direction.** Physical CSS properties (`left`, `right`, `ml-*`, `pr-*`) where logical ones are required. Anything that would break in RTL.
5. **Accessibility.** Unlabelled controls, missing keyboard support, focus traps, contrast.
6. **Reuse.** Duplicated components or constants that belong in `src/config`.
7. **Tests.** Behaviour that changed without a test.

Output a list ordered by severity. For each finding give the file and line, what is wrong, a concrete failure scenario, and a suggested fix. Label each **blocker**, **should fix** or **nit**. End with a single verdict: **approve** or **changes requested**.
