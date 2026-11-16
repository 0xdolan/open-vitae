# Changelog

All notable changes to Open Vitae are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See the [release process](docs/04-release-process.md).

## [Unreleased]

## [1.1.0] - 2026-11-16

### Added

- An optional page header and footer in **Page setup**, with `{page}` and `{pages}` placeholders for page numbers, start, centre or end alignment and a choice to skip the first page. They show in the preview, printing and page exports, and as real headers and footers in Word.
- A light, dark or system theme for the interface, kept in this browser. Resume pages stay black on white.
- **Hide preview** folds the live preview away on wide screens; the choice is remembered.
- **My resumes** has grid, list and thumbnail views with a small drawing of each resume, the whole card opens the resume, and the samples can be hidden.
- **Page setup** sets the section title colour and the line under titles separately from the accent colour, can hide that line, and sets an icon colour (black by default) and colours for each contact icon. Each icon can also have its own colour.
- Soft length limits for the summary (2,280 characters) and entry descriptions (500), with a counter. Text over the limit is flagged, never cut; each limit can be changed or turned off.

### Changed

- Every drop-down uses one shared menu that follows the theme and the page direction, and the interface language picker shows each language in its own script.
- Menus, pop-ups and dialogs close when you click outside them or press Escape.
- Clearer hover, selected and focus states, a pointer cursor on everything clickable, and no doubled borders.
- Spelling is checked by the browser by default; the LanguageTool grammar check stays strictly opt-in and now explains failures such as 404 and 405 (no LanguageTool server behind that address).
- Section and entry icons in existing resumes now draw in the icon colour (black by default) instead of the accent colour.
- Open Vitae moved to the Kanî Labs organisation on GitHub. The website, app, schema and source links now point to `kanilabs.github.io/open-vitae` and `github.com/kanilabs`.

### Fixed

- The rich text toolbar's font menu now lists Google Fonts in their own group, next to the bundled, system and your own fonts, and loads a Google font when you pick it.
- The website screenshots now show the bundled Manrope, Sahel and Estedad fonts.

## [1.0.0] - 2026-11-15

The first release of Open Vitae: a private resume builder that runs entirely in your browser, for left-to-right, right-to-left and mixed-direction resumes.

### Added

**Writing and editing**

- A library of resumes saved in the browser, with new (left-to-right or right-to-left), open, duplicate and delete, and eight samples to start from: technology, finance, cybersecurity, cloud, marketing, Persian, Arabic and Kurdish (Sorani).
- An editor with a navigator for page setup, profile, sections and version history; drag and drop for sections, entries and links with the mouse, touch or keyboard; show or hide anything without deleting it; undo and redo.
- A full rich text editor: headings, fonts, sizes, colours, alignment, paragraph direction, nested lists, tables, links, images, code blocks, find and replace, format painter and text presets.
- A profile photo with cropping, a print-size guide, shape, width and position; more than 50,000 searchable icons for sections, entries, links and the contact line.
- A date range helper with the Gregorian, Persian, Islamic and Kurdish calendars.
- Autosave, with every save kept as a dated version that can be named, restored or downloaded.

**Pages and printing**

- Real pages at true size in 13 paper sizes (A4 by default), with smart or manual page breaks, zoom, and a print preview that prints exactly what you see.
- Bundled Persian and Arabic fonts (Sahel, Estedad), your own font files, and optional Google Fonts that stay off until you agree.
- A choice of Western, Arabic-Indic or Persian digits on the page; links, email and phone numbers are never changed.

**Import and export**

- Export to PDF with clickable links, Word, InDesign (ICML), PNG, JPG and SVG at 72 to 600 DPI, and to JSON, Excel, CSV and Markdown.
- Import from JSON backups, Excel, CSV and Markdown, with downloadable templates.
- The resume format published as a JSON Schema, and an AI skill that teaches assistants to write resumes Open Vitae imports.

**Languages, privacy and offline use**

- The interface in English, Persian, Arabic and Kurdish (Sorani), with right-to-left layout, plural forms and local digits.
- Nothing leaves the browser: no account, no server, no analytics. Resumes, photos and fonts are stored on the device, and a notice explains how to keep them.
- Installable as an app that works offline and asks before updating.
- Optional grammar checking with a LanguageTool server you run yourself.
- An accessibility pass to WCAG 2.2 AA: keyboard use throughout, screen reader names and announcements, and sufficient contrast.

**Running and contributing**

- A hardened Docker image and Compose file, with optional development and grammar profiles.
- A landing page and the app on GitHub Pages, and GitHub releases with the built app, the AI skill and checksums.
- Documentation for users, self-hosters and contributors, and a logo that joins the chin chevron of deq with Roj, the sun of the flag of Kurdistan.

[Unreleased]: https://github.com/kanilabs/open-vitae/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/kanilabs/open-vitae/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/kanilabs/open-vitae/releases/tag/v1.0.0
