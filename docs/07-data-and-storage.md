# Data and storage

Previous: [Roadmap](06-roadmap.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Where data lives](#where-data-lives)
- [The resume schema](#the-resume-schema)
- [Validation rules that protect the page](#validation-rules-that-protect-the-page)
- [Format versions and migrations](#format-versions-and-migrations)
- [Saving and drafts](#saving-and-drafts)
- [Several tabs at once](#several-tabs-at-once)
- [Samples](#samples)
- [Deleting data](#deleting-data)
- [Code map](#code-map)

## Where data lives

| What                      | Where                                   | Notes                                   |
| ------------------------- | --------------------------------------- | --------------------------------------- |
| Resumes and drafts        | IndexedDB database `open-vitae`, store `resumes`, keys `resume:<id>` | Structured objects, not strings |
| Which resume was last open | `localStorage` key `open-vitae:active-resume` | An id only, never content       |
| Photos and user fonts     | IndexedDB (phases 5 and 7)              | Never uploaded                          |

Nothing is sent to a server. Clearing the site's data in the browser removes all of it. The app tells people this in a banner and offers to ask the browser for **persistent storage**, which stops the browser from evicting the data when disk space runs low.

## The resume schema

[`src/schema/resume.ts`](../src/schema/resume.ts) defines the document with [Zod](https://zod.dev). TypeScript types are inferred from it, so the types and the runtime checks can never disagree.

```text
ResumeDocument
├── schemaVersion        format version, currently 1
├── id, name, language   language is a BCP 47 tag such as en, fa, ckb
├── createdAt, updatedAt ISO 8601 timestamps
├── layout               page size, orientation, margin, page breaks, direction,
│                        font, base text size, line height, accent colour
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
        └── icon?, titleStyle?, descriptionStyle?
```

Text fields are always strings (empty when unused) so forms never deal with `undefined`. Styles, icons and the photo are optional.

## Validation rules that protect the page

Data is validated **on every read and every write**. Invalid data is never written, and a corrupted or edited entry never reaches the editor.

| Field                     | Rule                                              | Stops                                 |
| ------------------------- | ------------------------------------------------- | ------------------------------------- |
| Colours                   | Hex only: `#rgb`, `#rrggbb`, `#rrggbbaa`          | CSS injection through `style`         |
| Font names                | Letters, digits, space, `.`, `_`, `-`             | Breaking out of `font-family`         |
| URLs                      | Absolute `http`, `https`, `mailto`, `tel`         | `javascript:` and `data:` links       |
| Photo                     | PNG, JPEG or WebP data URL, about 5 MB at most    | SVG with scripts, oversized storage   |
| Ids                       | 1–64 URL-safe characters, unique in the document  | Broken lists and drag and drop        |
| Rich text                 | 100,000 characters, then sanitised by DOMPurify   | Scripts, event handlers, iframes      |
| Unknown fields            | Dropped                                           | Smuggling data through imports        |

The sanitiser ([`src/lib/sanitize.ts`](../src/lib/sanitize.ts)) keeps formatting, lists, tables, links and the `dir` and `lang` attributes needed for mixed-direction text. It removes everything else and makes links open in a new tab with `rel="noopener noreferrer"`. [`SafeHtml`](../src/components/SafeHtml.tsx) is the only component allowed to insert HTML; lint blocks it everywhere else.

## Format versions and migrations

Every document has a `schemaVersion`. When the shape of stored data changes:

1. Raise `RESUME_SCHEMA_VERSION` in `src/schema/resume.ts`.
2. Add a migration to `MIGRATIONS` in [`src/lib/migrations.ts`](../src/lib/migrations.ts), keyed by the version it upgrades from.
3. Add a test that upgrades a document from the old version.

Documents are migrated before validation, on load and on import. A document from a **newer** app version is refused with a clear message instead of being damaged. Unreadable entries are reported and left in storage untouched.

## Saving and drafts

- Creating, copying or duplicating a resume saves it immediately.
- Edits are kept in memory and saved **600 ms after the last change**, and immediately when the tab is hidden or closed.
- The editor shows **Unsaved changes**, **Saving…**, **Saved in this browser** or **Not saved**.
- If a save fails (invalid value, full disk, blocked storage), the edit stays in memory, a message explains why, and the next edit retries.

## Several tabs at once

Tabs announce saves, deletions and clears to each other over `BroadcastChannel`. A tab picks up a newer version from another tab unless it has unsaved edits of its own, so two tabs never silently overwrite each other. Messages carry ids and timestamps only.

## Samples

Five read-only samples live in [`src/samples/`](../src/samples): technology, finance (US Letter), cybersecurity, cloud and marketing. **Use this sample** creates an editable copy with new ids; the sample itself never changes. All people, companies, schools, emails (`@example.com`) and phone numbers are fictional.

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
| `src/stores/resume-store.ts`           | App state, autosave, cross-tab handling              |

---

Previous: [Roadmap](06-roadmap.md) · [Docs home](README.md) · [Main README](../README.md)
