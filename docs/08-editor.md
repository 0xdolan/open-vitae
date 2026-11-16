# The editor

Previous: [Data and storage](07-data-and-storage.md) · Next: [Rich text editor](09-rich-text-editor.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Screens](#screens)
- [Layout](#layout)
- [The navigator](#the-navigator)
- [Reordering with mouse, touch or keyboard](#reordering-with-mouse-touch-or-keyboard)
- [Editing content](#editing-content)
- [Undo and redo](#undo-and-redo)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Field checks never block saving](#field-checks-never-block-saving)
- [Code map](#code-map)

## Screens

| Address       | Screen                                              |
| ------------- | --------------------------------------------------- |
| `#/`          | Library: your resumes, the samples, delete all data |
| `#/edit/<id>` | Editor for one resume                               |

**My resumes** shows your resumes as a **grid** of cards, a compact **list**, or **thumbnails** with a small live drawing of each resume's first page. Click anywhere on a resume to open it; **Duplicate** and **Delete** sit on top. **Hide samples** folds the sample gallery away once you no longer need it. The view and the samples choice are kept in this browser.

Hash addresses work on GitHub Pages and any static server with no rewrite rules. Reloading, bookmarking and the browser's back button all work. An address for a resume that is not in this browser shows a short explanation and a link back.

## Layout

| Width             | Layout                                                 |
| ----------------- | ------------------------------------------------------ |
| 1280 px and wider | Navigator · form · live preview, side by side          |
| 1024–1279 px      | Navigator and form side by side; Edit and Preview tabs |
| Narrower          | Everything stacked; Edit and Preview tabs              |

The navigator sits on the reading-start side and the preview on the reading-end side, so in a right-to-left browser the layout mirrors. The header holds the resume name, the save status ("Saved · version 12 · 19:05:23"), undo, redo and **Export** (PDF, Word, InDesign, images and data formats; see [Import and export](13-import-and-export.md)).

On wide screens the header's **Hide preview** button folds the preview away so the form gets the whole width; **Show preview** brings it back. The choice is kept in this browser.

The sun, moon and screen buttons in the header (and at the top of **My resumes**) choose a **light**, **dark** or **system** theme for the interface. The choice is kept in this browser. Resume pages, thumbnails and exports always stay black on white, because that is how they print.

Clicking a section in the preview opens it in the form, and the section being edited is outlined on the page. The preview shows real pages with zoom and a print preview; see [Pages and printing](11-pages-and-printing.md).

Each entry row also has a page-break button to start that entry on a new page; a section's **Start on a new page** box does the same for the whole section.

## The navigator

- **Page setup:** paper size, orientation, direction, language, font, page breaks, margin, text size, line height, indent, nesting levels, digits, accent colour, and fonts.
- **Profile:** name, headline, contact details, links and summary.
- **Sections**, in page order. Each row has a drag handle, the title, the number of entries, and an eye button to show or hide the section on the page without deleting it.
- **Add section:** experience, education, skills, projects, certifications, languages, awards, publications, volunteering, references, interests or a custom section. New sections get a title in the resume's language.
- **Version history:** every saved version (see [Data and storage](07-data-and-storage.md#version-history)).
- **Grammar:** optional grammar and spelling check with your own LanguageTool server (see [Languages, offline use and accessibility](14-languages-and-offline.md#grammar-and-spelling)).

The calendar button beside an entry's **Dates** field writes a date range in the Gregorian, Persian, Islamic or Kurdish calendar (see [Digits and calendars](14-languages-and-offline.md#digits-and-calendars)).

## Reordering with mouse, touch or keyboard

Sections, entries inside a section, and profile links all use the same reorderable list ([`src/components/ui/sortable.tsx`](../src/components/ui/sortable.tsx)). It has no drag-and-drop library behind it.

| Input          | How                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mouse or touch | Press the ⋮⋮ handle and drag. Other items move out of the way. Release to drop, Escape to cancel.                                                               |
| Keyboard       | Tab to the handle. Space or Enter picks the item up. Arrow keys, Home and End choose the place, which is outlined. Space or Enter drops, Escape or Tab cancels. |
| Screen reader  | Each step is announced: "Picked up Experience, position 1 of 5", "Experience, position 3 of 5", "Experience dropped at position 3 of 5".                        |

After a keyboard drop, focus stays on the moved item's handle so it can be moved again.

## Editing content

- **Entries** open and close like an accordion. Each has show/hide, duplicate and delete buttons. Field labels match the section: "Job title" and "Company or organisation" for experience, "Degree or qualification" and "School or university" for education, "Language" and "Level" for languages, and so on.
- **Descriptions and the summary** use the full rich text editor, described in [Rich text editor](09-rich-text-editor.md).
- **Deleting a section** shows a message with an **Undo** button that puts it back where it was.
- All text fields follow the direction of what is typed, so Persian or Arabic entries display correctly in an English interface and the other way round.

## Undo and redo

The whole document has an undo history (up to 100 steps per open resume, kept in memory):

- Every change is one step, and quick typing in one field is grouped, so undo removes a word or phrase rather than one letter.
- Undo and redo are saved and versioned like any other change.
- Restoring a version can be undone.
- Opening another resume, or a change arriving from another tab, starts a fresh history.

## Keyboard shortcuts

| Shortcut                       | Action                                                |
| ------------------------------ | ----------------------------------------------------- |
| Ctrl/⌘ + Z                     | Undo (inside a text field, the field's own undo runs) |
| Ctrl/⌘ + Shift + Z, Ctrl/⌘ + Y | Redo                                                  |
| Ctrl/⌘ + S                     | Save now and show the saved version and time          |

## Field checks never block saving

Email addresses and links are checked as you type, and a message appears under the field ("Use a full address starting with https://"). These checks are **warnings only**: a half-typed address never stops the rest of the resume from saving, and a renamed resume may be briefly empty. Safety does not depend on them, because only valid `http`, `https`, `mailto` and `tel` addresses are ever turned into links when the resume is drawn. Anything else appears as plain text.

The summary and each entry description show a character count against a **soft limit**: 2,280 characters for the summary and 500 for a description by default. Text over the limit is flagged in red with a short note, and is **never cut or blocked**. Change both limits, or turn either off with **No limit**, in **Page setup → Length limits**; they are stored with the resume.

Values that could affect the page itself (colours, font names, ids, photos) are still enforced by the schema on every save.

## Code map

| File                                     | Responsibility                           |
| ---------------------------------------- | ---------------------------------------- |
| `src/hooks/useHashRoute.ts`              | Library and editor addresses             |
| `src/components/editor/EditorView.tsx`   | Layout, panel selection, mobile tabs     |
| `src/components/editor/EditorHeader.tsx` | Name, save status, undo, redo, export    |
| `src/components/editor/Navigator.tsx`    | Side panel                               |
| `src/components/editor/ProfilePanel.tsx` | Profile form and links                   |
| `src/components/editor/SectionPanel.tsx` | Section form and entries                 |
| `src/components/ui/sortable.tsx`         | Accessible reorderable list              |
| `src/lib/document-ops.ts`                | Pure edits: add, move, duplicate, remove |
| `src/lib/plain-text.ts`                  | Simple rich text ⇄ plain text            |
| `src/lib/field-validation.ts`            | Warnings for emails and links            |
| `src/hooks/useEditorShortcuts.ts`        | Keyboard shortcuts                       |

---

Previous: [Data and storage](07-data-and-storage.md) · Next: [Rich text editor](09-rich-text-editor.md) · [Docs home](README.md) · [Main README](../README.md)
