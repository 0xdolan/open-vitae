# Architecture

Previous: [Getting started](01-getting-started.md) · Next: [Git flow](03-git-flow.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Principles](#principles)
- [Stack](#stack)
- [Why no Next.js or NestJS](#why-no-nextjs-or-nestjs)
- [Folder structure](#folder-structure)
- [Data model](#data-model)
- [Pages and units](#pages-and-units)
- [Fonts and direction](#fonts-and-direction)
- [Privacy and security model](#privacy-and-security-model)

## Principles

1. **Browser only.** The app is static files. There is no server to send data to.
2. **One data model.** A `ResumeDocument` drives the editor, storage, import and every export.
3. **Configuration over code.** Page sizes, fonts and defaults are data in `src/config`.
4. **Direction is a property, not a mode.** Layout uses CSS logical properties so LTR and RTL share the same components.

## Stack

| Concern        | Choice                                    |
| -------------- | ----------------------------------------- |
| Language       | TypeScript, strict                        |
| UI             | React 19                                  |
| Build          | Vite                                      |
| Styling        | Tailwind CSS 4, shadcn/ui components      |
| Offline        | `vite-plugin-pwa` (Workbox service worker) |
| Tests          | Vitest                                    |
| Lint / format  | ESLint (typescript-eslint strict), Prettier |
| Hosting        | GitHub Pages, or the nginx Docker image   |

## Why no Next.js or NestJS

GitHub Pages serves static files only, and the privacy promise rules out a backend. A single Vite single-page app covers everything: the landing page, the playground and the editor are routes inside it. NestJS would only be needed for a server, which this project deliberately does not have.

## Folder structure

```text
src/
├── components/   Reusable React components (ui/ holds shadcn components)
├── config/       page-sizes.ts, fonts.ts and other constants
├── lib/          Shared helpers such as cn()
├── types/        resume.ts, the document model
├── App.tsx       Application shell
├── main.tsx      Entry point
└── index.css     Tailwind import and theme tokens
```

Folders added in later phases: `features/` (editor, export, import), `stores/`, `samples/`, `i18n/`, `hooks/`.

## Data model

Defined in [`src/types/resume.ts`](../src/types/resume.ts).

```text
ResumeDocument
├── schemaVersion        for migrations
├── layout               page size, orientation, margin, page-break mode, direction, font
├── photo?               data URL, alignment, width
└── sections[]           array order is display order (drag and drop reorders it)
    ├── title, icon?, titleStyle?, visible, breakBefore
    └── items[]
        ├── title, subtitle?, dateRange?, location?
        ├── descriptionHtml      sanitised rich text
        └── icon?, titleStyle?, descriptionStyle?
```

Titles and descriptions carry their own `TextStyle`, which is how each can have a separate colour.

## Pages and units

Page sizes are stored in millimetres, portrait, in [`src/config/page-sizes.ts`](../src/config/page-sizes.ts). A4 is the default. `mmToPx(mm, dpi)` converts for raster export; the default is 300 DPI, accepted range 72 to 1200.

DPI applies to PNG and JPG. PDF and SVG are vector formats, so DPI only affects photos embedded in them.

Page-break mode is `smart` by default (the layout engine avoids splitting an item across pages) or `manual` (sections flagged `breakBefore` start a new page).

## Fonts and direction

Defined in [`src/config/fonts.ts`](../src/config/fonts.ts).

| Source   | Fonts                                  | Notes                                             |
| -------- | -------------------------------------- | ------------------------------------------------- |
| Bundled  | Manrope (LTR default), Sahel (RTL default), Estedad | Work offline. Sahel and Estedad files are added in phase 5 |
| Google   | The Google Fonts catalogue             | Loaded on demand; Google sees the visitor's IP    |
| System   | Arial, Times New Roman                 | Proprietary, so never shipped; fall back to Arimo and Tinos |
| User     | Any font file the user loads           | Kept in the browser; must be reloaded after clearing site data |

## Privacy and security model

- No backend, accounts, analytics or cookies.
- Storage is browser-local. Clearing site data removes everything, including loaded fonts and photos; the app warns about this where it matters.
- A Content Security Policy is injected at build time ([`vite.config.ts`](../vite.config.ts)) and sent as a header by the Docker image ([`docker/security-headers.inc`](../docker/security-headers.inc)). The two must stay in sync.
- `dangerouslySetInnerHTML` is blocked by lint; rich text goes through one sanitising renderer.
- Imports are validated against the schema before they reach the store.

See [SECURITY.md](../SECURITY.md).

---

Previous: [Getting started](01-getting-started.md) · Next: [Git flow](03-git-flow.md) · [Docs home](README.md) · [Main README](../README.md)
