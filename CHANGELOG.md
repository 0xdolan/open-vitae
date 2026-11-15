# Changelog

All notable changes to Open Vitae are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See the [release process](docs/04-release-process.md).

## [Unreleased]

### Added

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
