# Changelog

All notable changes to Open Vitae are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See the [release process](docs/04-release-process.md).

## [Unreleased]

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

[Unreleased]: https://github.com/0xdolan/open-vitae/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/0xdolan/open-vitae/releases/tag/v1.0.0
