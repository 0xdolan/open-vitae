# Changelog

All notable changes to Open Vitae are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See the [release process](docs/04-release-process.md).

## [Unreleased]

### Added

- Fonts: bundled Sahel and Estedad for Persian and Arabic (downloaded by `npm run fonts:fetch`, with checksums and licences), a searchable font picker, and the same fonts in the rich text toolbar.
- Your own fonts: load TTF, OTF, WOFF or WOFF2 files, kept only in this browser, with a clear warning that clearing site data means loading them again; rename or remove them.
- Optional Google Fonts, off until you agree, with a curated catalogue or any family by name.
- Notice listing fonts a resume uses that this browser does not have, with the reason and a link to font settings.
- Persian (RTL) sample resume, set in Sahel with Persian digits.
- Documentation page for fonts and right-to-left text.
- Full rich text editor for descriptions and the summary: headings, fonts, sizes, line spacing, bold, italic, underline, strikethrough, subscript, superscript, colours, highlight, alignment, paragraph direction, quotes, horizontal lines, links, emoji, cut, copy and paste as plain text.
- Bulleted and numbered lists that nest, with indent size (default 4 spaces) and an optional nesting limit in Page setup.
- Tables with rows, columns, merged cells, header row and a borderless option.
- Images embedded from files, shrunk and stripped of metadata, with alignment and width.
- Code blocks with syntax highlighting for 20 languages, in a monospaced font.
- Find and replace (match case, whole words in any script), format painter, text presets, word and character counts, spell check toggle.
- Pronunciation guide in the README.
- Separate library and editor screens with addresses that survive reloads and work with the back button.
- Navigator side panel: page setup, profile, sections in page order, add section, version history.
- Drag and drop for sections, entries and links that works with a mouse, touch and the keyboard, with screen reader announcements.
- Show or hide any section or entry without deleting it; duplicate and delete, with Undo for deleted sections.
- Profile, section and entry forms with labels that match each kind of section, and a basic description editor.
- Undo and redo for the whole document, with typing grouped into sensible steps.
- Keyboard shortcuts: undo, redo and save now.
- Clicking a section in the preview opens it for editing.
- Version history: every save is kept as a numbered version with its date and time; name a version, restore or download any version. Keeping all versions is the recommended default.
- JSON backup export with versioned, time-stamped file names such as `maya-okafor-v12-2026-11-14_19-05-23.json`.
- Animated success message after exporting, saving a named version or restoring.
- Resumes are saved in the browser (IndexedDB) with autosave, an unsaved/saving/saved indicator and a save on tab close.
- Five sample resumes: technology, finance, cybersecurity, cloud and marketing. Using one creates an editable copy.
- Resume library: new resume (LTR or RTL), open, duplicate, delete, and delete all data, each with confirmation.
- Live, true-size page preview with page settings: size, orientation, direction, font, page-break mode, margin, text size, line height and accent colour.
- Resume schema with validation on every read and write, format versions and migrations.
- Open tabs stay in sync with each other.
- Banner explaining that data stays in the browser, with a button to request persistent storage.
- HTML sanitising for all rich text.
- Mixed-direction text: English inside RTL resumes (and the reverse) keeps correct punctuation and alignment; Sahel is the fallback for Arabic-script characters in any font.
- Project scaffold: Vite, React, TypeScript, Tailwind CSS, PWA plugin.
- Page size catalogue (A4 default) with millimetre-to-pixel conversion and tests.
- Font configuration: Manrope for LTR, Sahel for RTL, system Arial and Times New Roman.
- Resume data model types.
- Phase 1 shell with page size, orientation and direction switching.
- Hardened Docker image and Compose file for local use.
- GitHub Actions for CI, GitHub Pages deployment and tagged releases.
- Git flow helper scripts and branch protection script.
- Claude Code commands for the implement, review and eval steps.
- Documentation set with navigation.

### Changed

- The font stack adds Sahel only when the chosen font does not cover Arabic script, then a fallback of the right kind.
- Resume format version 2: indent size and nesting limit. Older resumes and backups are upgraded automatically.
- The sanitiser now allows the editor's formatting through strict allowlists and removes remote images entirely.
- Email and link checks are now warnings under the field and never stop the resume from saving. Only safe addresses are ever turned into links.

### Fixed

- Ampersand in the finance sample is now properly escaped.
