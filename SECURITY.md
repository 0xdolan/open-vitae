# Security policy

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's **Report a vulnerability** button under the repository's **Security** tab (private vulnerability reporting). Include steps to reproduce and the browser you used. Do not include real personal data.

## Supported versions

Only the latest release receives security fixes.

## Security model

Open Vitae is a static web app with no backend.

- **Data stays local.** Resumes, drafts, photos and user fonts are stored only in the browser.
- **Network.** The app requests its own static files. The only third-party hosts allowed by the Content Security Policy are `fonts.googleapis.com` and `fonts.gstatic.com`, contacted only when a Google font is selected. Google sees the visitor's IP address for those requests.
- **Content Security Policy.** No inline or third-party scripts, no `eval`, no plugins, no form submission.
- **Untrusted input.** Imported files are schema-validated. Rich-text HTML is sanitised before it is stored or rendered.
- **Supply chain.** Dependabot updates, `npm audit` in CI, lockfile installs (`npm ci`).
- **Containers.** Non-root, read-only filesystem, all capabilities dropped, localhost-only ports.

## Out of scope

- Someone with access to your unlocked browser profile can read your local data. Use **Clear data** in the app on shared computers.
