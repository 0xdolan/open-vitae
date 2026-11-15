# Security policy

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's **Report a vulnerability** button under the repository's **Security** tab (private vulnerability reporting). Include steps to reproduce and the browser you used. Do not include real personal data.

## Supported versions

Only the latest release receives security fixes.

## Security model

Open Vitae is a static web app with no backend.

- **Data stays local.** Resumes, drafts, photos and user fonts are stored only in the browser.
- **Network.** The app requests its own static files. The only third-party hosts allowed by the Content Security Policy are `fonts.googleapis.com` and `fonts.gstatic.com`, contacted only after the user turns Google Fonts on and picks a font. Google sees the visitor's IP address for those requests. The stylesheet is downloaded and checked before use: only `@font-face` rules with known descriptors and font files from `https://fonts.gstatic.com/` are accepted.
- **Fonts.** User font files are checked by signature bytes and size (25 MB) and stay in the browser. The bundled font manifest is validated against strict name and path patterns.
- **Photos.** Pictures are decoded and re-encoded with canvas in the browser, which drops metadata such as GPS location; nothing is uploaded. Stored photos must be PNG, JPEG or WebP data URLs within a size limit.
- **Icons.** Icon sets are part of the app's own files and never fetched from elsewhere. A resume stores only a set id and an icon name, both matched against strict patterns, and icons are rendered as components, never from stored markup.
- **Content Security Policy.** No inline or third-party scripts, no `eval`, no plugins, no form submission.
- **Untrusted input.** Imported files are schema-validated. Rich text is sanitised whenever it is shown, with allowlists for tags, inline styles and classes.
- **No remote content in resumes.** Only embedded images are allowed, so opening a resume never contacts another site.
- **Supply chain.** Dependabot updates, `npm audit` in CI, lockfile installs (`npm ci`).
- **Containers.** Non-root, read-only filesystem, all capabilities dropped, localhost-only ports.

## Out of scope

- Someone with access to your unlocked browser profile can read your local data. Use **Clear data** in the app on shared computers.
