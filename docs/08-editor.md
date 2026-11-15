# The editor

Previous: [Data and storage](07-data-and-storage.md) · [Docs home](README.md) · [Main README](../README.md)

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

| Address        | Screen                                                    |
| -------------- | --------------------------------------------------------- |
| `#/`           | Library: your resumes, the five samples, delete all data  |
| `#/edit/<id>`  | Editor for one resume                                     |

Hash addresses work on GitHub Pages and any static server with no rewrite rules. Reloading, bookmarking and the browser's back button all work. An address for a resume that is not in this browser shows a short explanation and a link back.

## Layout

| Width                 | Layout                                                       |
| --------------------- | ------------------------------------------------------------ |
| 1280 px and wider     | Navigator · form · live preview, side by side                |
| 1024–1279 px          | Navigator and form side by side; Edit and Preview tabs       |
| Narrower              | Everything stacked; Edit and Preview tabs                    |

The navigator sits on the reading-start side and the preview on the reading-end side, so in a right-to-left browser the layout mirrors. The header holds the resume name, the save status ("Saved · version 12 · 19:05:23"), undo, redo and **Export JSON**.

Clicking a section in the preview opens it in the form, and the section being edited is outlined on the page.

## The navigator

- **Page setup:** paper size, orientation, direction, font, page breaks, margin, text size, line height, accent colour.
- **Profile:** name, headline, contact details, links and summary.
- **Sections**, in page order. Each row has a drag handle, the title, the number of entries, and an eye button to show or hide the section on the page without deleting it.
- **Add section:** experience, education, skills, projects, certifications, languages, awards, publications, volunteering, references, interests or a custom section. New sections get a title in the resume's language.
- **Version history:** every saved version (see [Data and storage](07-data-and-storage.md#version-history)).

## Reordering with mouse, touch or keyboard

Sections, entries inside a section, and profile links all use the same reorderable list ([`src/components/ui/sortable.tsx`](../src/components/ui/sortable.tsx)). It has no drag-and-drop library behind it.

| Input            | How                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------- |
| Mouse or touch   | Press the ⋮⋮ handle and drag. Other items move out of the way. Release to drop, Escape to cancel. |
| Keyboard         | Tab to the handle. Space or Enter picks the item up. Arrow keys, Home and End choose the place, which is outlined. Space or Enter drops, Escape or Tab cancels. |
| Screen reader    | Each step is announced: "Picked up Experience, position 1 of 5", "Experience, position 3 of 5", "Experience dropped at position 3 of 5". |

After a keyboard drop, focus stays on the moved item's handle so it can be moved again.

## Editing content

- **Entries** open and close like an accordion. Each has show/hide, duplicate and delete buttons. Field labels match the section: "Job title" and "Company or organisation" for experience, "Degree or qualification" and "School or university" for education, "Language" and "Level" for languages, and so on.
- **Descriptions and the summary** use a basic editor for now: write paragraphs, and start a line with "- " for a bullet. Text with formatting the basic editor cannot keep (bold, links, tables) is shown read-only, with an explicit option to convert it to plain text. The full rich text editor replaces this in phase 4.
- **Deleting a section** shows a message with an **Undo** button that puts it back where it was.
- All text fields follow the direction of what is typed, so Persian or Arabic entries display correctly in an English interface and the other way round.

## Undo and redo

The whole document has an undo history (up to 100 steps per open resume, kept in memory):

- Every change is one step, and quick typing in one field is grouped, so undo removes a word or phrase rather than one letter.
- Undo and redo are saved and versioned like any other change.
- Restoring a version can be undone.
- Opening another resume, or a change arriving from another tab, starts a fresh history.

## Keyboard shortcuts

| Shortcut                          | Action                                                     |
| --------------------------------- | ---------------------------------------------------------- |
| Ctrl/⌘ + Z                        | Undo (inside a text field, the field's own undo runs)      |
| Ctrl/⌘ + Shift + Z, Ctrl/⌘ + Y    | Redo                                                       |
| Ctrl/⌘ + S                        | Save now and show the saved version and time               |

## Field checks never block saving

Email addresses and links are checked as you type, and a message appears under the field ("Use a full address starting with https://"). These checks are **warnings only**: a half-typed address never stops the rest of the resume from saving, and a renamed resume may be briefly empty. Safety does not depend on them, because only valid `http`, `https`, `mailto` and `tel` addresses are ever turned into links when the resume is drawn. Anything else appears as plain text.

Values that could affect the page itself (colours, font names, ids, photos) are still enforced by the schema on every save.

## Code map

| File                                         | Responsibility                                  |
| -------------------------------------------- | ----------------------------------------------- |
| `src/hooks/useHashRoute.ts`                  | Library and editor addresses                    |
| `src/components/editor/EditorView.tsx`       | Layout, panel selection, mobile tabs            |
| `src/components/editor/EditorHeader.tsx`     | Name, save status, undo, redo, export           |
| `src/components/editor/Navigator.tsx`        | Side panel                                      |
| `src/components/editor/ProfilePanel.tsx`     | Profile form and links                          |
| `src/components/editor/SectionPanel.tsx`     | Section form and entries                        |
| `src/components/editor/DescriptionField.tsx` | Basic description editor                        |
| `src/components/ui/sortable.tsx`             | Accessible reorderable list                     |
| `src/lib/document-ops.ts`                    | Pure edits: add, move, duplicate, remove        |
| `src/lib/plain-text.ts`                      | Simple rich text ⇄ plain text                   |
| `src/lib/field-validation.ts`                | Warnings for emails and links                   |
| `src/hooks/useEditorShortcuts.ts`            | Keyboard shortcuts                              |

---

Previous: [Data and storage](07-data-and-storage.md) · [Docs home](README.md) · [Main README](../README.md)
