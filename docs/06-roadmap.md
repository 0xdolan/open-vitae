# Roadmap

Previous: [Docker](05-docker.md) · Next: [Data and storage](07-data-and-storage.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Phases](#phases)
- [Decisions already made](#decisions-already-made)
- [Open questions](#open-questions)

## Phases

| #   | Phase                         | Scope                                                                                                                                                                               | Status  |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Scaffold                      | Tooling, git flow, Docker, CI, Pages, docs skeleton                                                                                                                                 | Done    |
| 2   | Data and samples              | Runtime validation, local storage, drafts, version history, JSON backup export, five sample resumes (tech, finance, cybersecurity, cloud, marketing)                                | Done    |
| 3   | Editor shell                  | Library and editor views, navigator panel, accessible drag and drop for sections, entries and links, show/hide, profile and entry forms, undo/redo, shortcuts                       | Done    |
| 4   | Rich text editor              | Formatting, lists with nesting and indent settings, tables, links, images, code blocks with highlighting, emoji, find and replace, format painter, presets, spell check, sanitising | Done    |
| 5   | Typography and direction      | Sahel and Estedad bundled, Google Fonts picker, user fonts with warning, RTL sample resume                                                                                          | Done    |
| 6   | Pages                         | True-size preview, all page sizes, margins, smart and manual page breaks, zoom, print preview                                                                                       | Done    |
| 7   | Images and icons              | Photo upload, crop tool, size guide, alignment; Lucide and react-icons search                                                                                                       | Done    |
| 8   | Import and export             | JSON, CSV, Excel, Markdown in; plus PDF, Word, InDesign (ICML), PNG, JPG, SVG out; DPI control; templates                                                                           | Done    |
| 9   | PWA, accessibility, languages | Install and offline polish, WCAG AA audit, translated interface (Persian, Arabic, Sorani), numerals and calendars, optional self-hosted grammar checking (LanguageTool)             | Done    |
| 10  | Brand and docs                | Landing page, about, playground, icon set, screenshots, social images, AI skill                                                                                                     | Planned |
| 11  | First release                 | `v1.0.0` tagged and published                                                                                                                                                       | Planned |

## Decisions already made

- **Single Vite app, no backend.** See [Architecture](02-architecture.md#why-no-nextjs-or-nestjs).
- **InDesign export is ICML.** A browser cannot write `.indd`. ICML is a styled text story that InDesign places into any layout, which suits a designer re-laying out a resume better than a fixed IDML page; it is the same approach Pandoc uses. Full IDML pages may follow later.
- **Two kinds of PDF.** **Export › PDF** is made by a library (pdf-lib) from pictures of the pages, so it looks identical everywhere and in every script, with clickable links and a searchable text layer for Latin script. **Print preview › Save as PDF** uses the browser and keeps all text selectable in every script. Both are offered, and the app says which to use for non-Latin text.
- **Grammar checking stays local.** The browser's spell checker, plus an optional self-hosted LanguageTool container (`docker compose --profile grammar up`) reached only through the app's own address. See [Languages, offline use and accessibility](14-languages-and-offline.md#grammar-and-spelling).
- **Interface languages ship with the app.** English, Persian, Arabic and Sorani, in typed catalogues that tests keep complete. Interface language and resume language are separate settings.
- **Calendars write text, not data.** The date helper produces an ordinary Dates string in the chosen calendar; resumes do not store calendar dates, so every format and every older version keeps working.
- **Updates ask first.** The service worker waits for **Update now**, which saves pending edits before reloading.
- **Rich text uses TipTap 3** (MIT). Remote images are never allowed in resumes, so opening one cannot notify a third party.
- **Arial and Times New Roman are not shipped.** The user's installed copies are used.

## Open questions

- Which interface languages come next, and who can review the Persian, Arabic and Sorani translations?
- Automated accessibility checks (axe) in CI.
- Should Google Fonts be proxied through a self-hosted mirror option for users who want zero third-party requests?

---

Previous: [Docker](05-docker.md) · Next: [Data and storage](07-data-and-storage.md) · [Docs home](README.md) · [Main README](../README.md)
