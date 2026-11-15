# Data and storage

Previous: [Roadmap](06-roadmap.md) · Next: [The editor](08-editor.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Where data lives](#where-data-lives)
- [The resume schema](#the-resume-schema)
- [Validation rules that protect the page](#validation-rules-that-protect-the-page)
- [Format versions and migrations](#format-versions-and-migrations)
- [Saving and drafts](#saving-and-drafts)
- [Version history](#version-history)
- [JSON backups](#json-backups)
- [Several tabs at once](#several-tabs-at-once)
- [Samples](#samples)
- [Deleting data](#deleting-data)
- [Code map](#code-map)

## Where data lives

| What                      | Where                                   | Notes                                   |
| ------------------------- | --------------------------------------- | --------------------------------------- |
| Resumes and drafts        | IndexedDB database `open-vitae`, store `resumes`, keys `resume:<id>` | Structured objects, not strings |
| Which resume was last open | `localStorage` key `open-vitae:active-resume` | An id only, never content       |
| Version history           | Same database: `versions:<resumeId>` index, `version:<resumeId>:<versionId>` snapshots | One snapshot per save |
| Photos                    | Same database, `photo:<hash>`, each distinct photo stored once | Never uploaded          |
| How many versions to keep | `localStorage` key `open-vitae:version-retention` | `all` by default                |
| User fonts                | IndexedDB (phase 5)                     | Never uploaded                          |

Nothing is sent to a server. Clearing the site's data in the browser removes all of it. The app tells people this in a banner and offers to ask the browser for **persistent storage**, which stops the browser from evicting the data when disk space runs low.

## The resume schema

[`src/schema/resume.ts`](../src/schema/resume.ts) defines the document with [Zod](https://zod.dev). TypeScript types are inferred from it, so the types and the runtime checks can never disagree.

```text
ResumeDocument
├── schemaVersion        format version, currently 2
├── id, name, language   language is a BCP 47 tag such as en, fa, ckb
├── createdAt, updatedAt ISO 8601 timestamps
├── layout               page size, orientation, margin, page breaks, direction,
│                        font, base text size, line height, accent colour,
│                        indent size (indentCh) and nesting limit (maxDepth)
├── profile              name, headline, email, phone, location, website,
│                        links[], summary (rich text), name and headline styles
├── photo?               data URL, alignment, shape, width
└── sections[]           order = order on the page
    ├── kind             experience, education, skills, projects, certifications,
    │                    languages, awards, publications, volunteering,
    │                    references, interests, custom
    ├── title, visible, breakBefore, icon?, titleStyle?, descriptionStyle?
    └── items[]
        ├── title, subtitle, dateRange, location, url, visible
        ├── descriptionHtml      rich text, sanitised when shown
        └── breakBefore?, icon?, titleStyle?, descriptionStyle?
```

Text fields are always strings (empty when unused) so forms never deal with `undefined`. Styles, icons and the photo are optional.

## Validation rules that protect the page

Data is validated **on every read and every write**. Invalid data is never written, and a corrupted or edited entry never reaches the editor.

| Field                     | Rule                                              | Stops                                 |
| ------------------------- | ------------------------------------------------- | ------------------------------------- |
| Colours                   | Hex only: `#rgb`, `#rrggbb`, `#rrggbbaa`          | CSS injection through `style`         |
| Font names                | Letters, digits, space, `.`, `_`, `-`             | Breaking out of `font-family`         |
| Emails, links, names      | Length limits only; checked in the editor as warnings | Lost work from a half-typed value |
| Links on the page         | Only absolute `http`, `https`, `mailto`, `tel` become links when drawn | `javascript:` and `data:` links |
| Photo                     | PNG, JPEG or WebP data URL, about 5 MB at most    | SVG with scripts, oversized storage   |
| Ids                       | 1–64 URL-safe characters, unique in the document  | Broken lists and drag and drop        |
| Rich text                 | 2 MB (room for small images), then sanitised; styles, classes and images go through allowlists | Scripts, handlers, iframes, remote images, positioning |
| Unknown fields            | Dropped                                           | Smuggling data through imports        |

The sanitiser ([`src/lib/sanitize.ts`](../src/lib/sanitize.ts)) keeps formatting, lists, tables, links and the `dir` and `lang` attributes needed for mixed-direction text. It removes everything else and makes links open in a new tab with `rel="noopener noreferrer"`. [`SafeHtml`](../src/components/SafeHtml.tsx) is the only component allowed to insert HTML; lint blocks it everywhere else.

## Format versions and migrations

Every document has a `schemaVersion`. When the shape of stored data changes:

1. Raise `RESUME_SCHEMA_VERSION` in `src/schema/resume.ts`.
2. Add a migration to `MIGRATIONS` in [`src/lib/migrations.ts`](../src/lib/migrations.ts), keyed by the version it upgrades from.
3. Add a test that upgrades a document from the old version.

| Version | Phase | Change                                                         |
| ------- | ----- | -------------------------------------------------------------- |
| 1       | 2     | First format                                                   |
| 2       | 4     | Adds `layout.indentCh` (default 4) and `layout.maxDepth` (default unlimited) |

Documents are migrated before validation, on load and on import. A document from a **newer** app version is refused with a clear message instead of being damaged. Unreadable entries are reported and left in storage untouched.

## Saving and drafts

- Creating, copying or duplicating a resume saves it immediately.
- Edits are kept in memory and saved **600 ms after the last change**, and immediately when the tab is hidden or closed.
- The editor shows **Unsaved changes**, **Saving…**, **Saved in this browser** or **Not saved**.
- If a save fails (invalid value, full disk, blocked storage), the edit stays in memory, a message explains why, and the next edit retries.

## Version history

Every save that changes something is stored as a **version** with a number and its date and time. Nothing is overwritten.

- **Shown as** "Version 12 · Autosave · Saturday, 14 November 2026 at 19:05:23 · 3 minutes ago · 4.3 KB". Wording and clock format follow the browser's language. The editor header shows "Saved · version 12 · 19:05:23".
- **Kinds:** Created, Autosave, Named version (the person typed a name and pressed **Save version**), Restored, Imported. Exported versions get an **Exported** badge.
- **Identical saves are skipped:** a save whose content matches the previous version adds nothing. The save time alone is not a change.
- **Restore** brings back an older version and records it as a new version ("Restored from version 3"). The state before restoring is already a version, so restoring never loses anything.
- **Download** exports any version as a JSON backup.
- **Keeping versions:** the default is **Keep all versions (recommended)**. People can choose to keep the latest 100, 50 or 20 instead. When a limit applies, only old **autosaves** are removed; named versions and the current version are always kept.
- **Size:** a resume version is a few kilobytes. Photos are stored once and shared by every version that uses them, so keeping everything stays cheap. Photos no version uses any more are removed automatically.
- Deleting a resume deletes its versions. **Delete all data** removes everything.

## JSON backups

**Export JSON backup** (and **Download** on any version) saves a file such as:

```text
maya-okafor-v12-2026-11-14_19-05-23.json
```

The name is the person's name (or the resume name), the version number and the **local** save time, so files sort by time and never overwrite each other. Persian and Arabic names stay readable.

The file contains:

```json
{
  "format": "open-vitae",
  "formatVersion": 1,
  "app": "Open Vitae 0.1.0",
  "exportedAt": "2026-11-14T19:06:02.000Z",
  "exportedAtText": "Saturday, 14 November 2026 at 19:06:02",
  "version": {
    "number": 12,
    "savedAt": "2026-11-14T19:05:23.000Z",
    "savedAtText": "Saturday, 14 November 2026 at 19:05:23",
    "note": "Sent to Larkspur Labs"
  },
  "resume": { "...": "the full resume document" }
}
```

Unsaved edits are saved first, and invalid data is never exported; the person sees what to fix instead. A success message with an animated check mark confirms the file name and version. It closes by itself, pauses while hovered or focused, and stays still for people who prefer reduced motion. Import of these files arrives in phase 8, together with CSV, Excel, Markdown, PDF, Word and image exports.

## Several tabs at once

Tabs announce saves, deletions and clears to each other over `BroadcastChannel`. A tab picks up a newer version from another tab unless it has unsaved edits of its own, so two tabs never silently overwrite each other. Messages carry ids and timestamps only.

## Samples

Eight read-only samples live in [`src/samples/`](../src/samples): technology, finance (US Letter), cybersecurity, cloud and marketing in English, plus Persian, Arabic and Kurdish (Sorani) right-to-left resumes. **Use this sample** creates an editable copy with new ids; the sample itself never changes. All people, companies, schools, emails (`@example.com`) and phone numbers are fictional.

To add a sample: create `src/samples/<id>.ts` exporting a `SampleDefinition`, add the id to `SAMPLE_IDS` in `types.ts`, and add it to `SAMPLES` in `index.ts`. The sample tests validate it automatically.

## Deleting data

- **Delete** on a resume removes it after confirmation.
- **Delete all data in this browser** in the footer removes every resume and the remembered selection after confirmation.
- Clearing site data in the browser settings does the same.

## Code map

| File                                   | Responsibility                                       |
| -------------------------------------- | ---------------------------------------------------- |
| `src/schema/resume.ts`                 | Schema and types                                     |
| `src/lib/resume-factory.ts`            | Build blank resumes, clone with new ids, naming      |
| `src/lib/resume-parse.ts`              | Migrate and validate unknown data, never throws      |
| `src/lib/migrations.ts`                | Format upgrades                                      |
| `src/lib/storage/key-value.ts`         | Storage interface and in-memory store for tests      |
| `src/lib/storage/indexeddb.ts`         | IndexedDB store                                      |
| `src/lib/storage/repository.ts`        | Validated resume persistence                         |
| `src/lib/storage/sync-channel.ts`      | Cross-tab messages                                   |
| `src/lib/storage/persistence.ts`       | Usage estimate and persistent-storage request        |
| `src/lib/versions/repository.ts`       | Version history, photo deduplication, retention      |
| `src/lib/export/json.ts`               | JSON backup format                                   |
| `src/lib/export/file-name.ts`          | Versioned, time-stamped file names                   |
| `src/lib/datetime.ts`                  | Human-readable dates and times                       |
| `src/stores/resume-store.ts`           | App state, autosave, versions, restore, export       |
| `src/stores/toast-store.ts`            | Notifications                                        |

---

Previous: [Roadmap](06-roadmap.md) · Next: [The editor](08-editor.md) · [Docs home](README.md) · [Main README](../README.md)
