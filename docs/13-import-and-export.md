# Import and export

Previous: [Photos and icons](12-photos-and-icons.md) · Next: [Languages, offline use and accessibility](14-languages-and-offline.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Exporting](#exporting)
- [Which format to choose](#which-format-to-choose)
- [Resolution](#resolution)
- [Importing](#importing)
- [Templates](#templates)
- [The table format (CSV and Excel)](#the-table-format-csv-and-excel)
- [The Markdown format](#the-markdown-format)
- [Safety](#safety)
- [Code map](#code-map)

## Exporting

Choose **Export** at the top of the editor, pick a format and its options, then **Export**. Pending changes are saved first, and the file name holds the name, the version and the save time, for example `maya-okafor-v12-2026-11-14_19-05-23.pdf`. Names in Persian, Arabic or Kurdish stay in their own script. An animated message confirms the download and says anything the format cannot hold, and the version is marked as exported in the version history.

Everything happens in the browser; nothing is uploaded.

## Which format to choose

| Format               | What you get                                                                                                                                    | Import again |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **PDF**              | Every page exactly as in the preview, with clickable links, document details and searchable text for Latin script                               | No           |
| **Word** (.docx)     | An editable document: headings, paragraphs, bullet and numbered lists, tables, links and the photo, in your fonts, sizes, colours and direction | No           |
| **InDesign** (.icml) | A text story with named paragraph and character styles; in InDesign use File › Place                                                            | No           |
| **PNG**              | A sharp picture of each page, the resolution stored in the file                                                                                 | No           |
| **JPG**              | A smaller picture of each page, with a quality setting                                                                                          | No           |
| **SVG**              | A scalable picture of each page for web browsers                                                                                                | No           |
| **JSON**             | A complete backup: every setting, style, icon and the photo                                                                                     | Yes          |
| **Excel** (.xlsx)    | One row per setting, profile field, link, section and entry                                                                                     | Yes          |
| **CSV**              | The same table as plain text                                                                                                                    | Yes          |
| **Markdown** (.md)   | Plain text with headings and lists                                                                                                              | Yes          |

Picture formats with more than one page download as a zip, or choose a single page.

**PDF and selectable text.** The exported PDF is a picture of each page, so it looks right in every script. An invisible text layer makes Latin text searchable and readable by applicant tracking systems. The standard PDF fonts do not cover Persian, Arabic or Kurdish, so for those scripts the text cannot be selected; use **Print preview › Save as PDF** for a PDF with fully selectable text in any script.

**SVG** pages show correctly in web browsers. Illustrator and Inkscape may not show their text, because the page is stored as HTML inside the SVG; use PDF for design apps.

**InDesign** gets the text and its styles, not the layout: place the story in your own frames and adjust the styles (Name, Headline, Contact, Section title, Entry title, Entry details, Body, Bullet 1–4, Numbered 1–4, Code, Quote). Place the photo separately.

## Resolution

PDF, PNG and JPG offer 72 DPI (screen), 150 (draft), **300 (print, the default)** and 600 (high-quality print). An A4 page at 300 DPI is 2480 pixels wide. If a large page at a high resolution would be more than the browser can draw, the resolution is lowered and the message says so.

## Importing

On the **My resumes** screen choose **Import** and pick a file. The new resume opens straight away; the original file is not changed.

| File                                  | How it is read                                                        |
| ------------------------------------- | --------------------------------------------------------------------- |
| JSON (`.json`)                        | An Open Vitae backup from any version, upgraded to the current format |
| CSV (`.csv`, `.tsv`)                  | The table format below; commas, semicolons and tabs all work          |
| Excel (`.xlsx`)                       | The first sheet, in the table format below                            |
| Markdown (`.md`, `.markdown`, `.txt`) | The Markdown format below                                             |

Rows or fields that cannot be used are skipped, and the message says how many. Imported resumes get new ids, so importing the same file twice gives two separate resumes.

## Templates

**Templates** on the **My resumes** screen downloads a blank template, or any sample resume, as Excel, CSV, Markdown or JSON. Fill it in with any spreadsheet app or text editor, then import it.

## The table format (CSV and Excel)

| Column   | Use                                                                                     |
| -------- | --------------------------------------------------------------------------------------- |
| Type     | `setting`, `profile`, `link`, `section` or `entry`                                      |
| Section  | The section heading (section and entry rows)                                            |
| Kind     | `experience`, `education`, `skills`, `projects`, … (optional: guessed from the heading) |
| Title    | Setting or profile field name, link label, or entry title                               |
| Subtitle | Company, school or issuer                                                               |
| Dates    | Any text, such as `2021 – Present`                                                      |
| Location | City or "Remote"                                                                        |
| URL      | Link address (link and entry rows)                                                      |
| Details  | Setting or field value, or the entry description in Markdown                            |
| Hidden   | `yes` to hide a section or entry on the page                                            |

Settings are Name, Language, Direction, Page size, Orientation, Font and Accent colour. Profile fields are Full name, Headline, Email, Phone, Location, Website and Summary.

A simpler sheet works too: columns may be in any order, and a sheet with only Section, Title and Dates columns is read as entries, with section kinds guessed from headings in English, Persian, Arabic or Kurdish ("Work history" becomes Experience).

Descriptions are Markdown: start a line with `- ` for a bullet point and use `**bold**` and `*italic*`. Colours, fonts and the photo are not part of this format; use JSON for a full backup.

## The Markdown format

```markdown
# Full name

Headline

email@example.com · +1 555 0100 · City, Country · github.com/you

A short summary.

## Experience

### Job title — Company

_City · 2021 – Present_

- What you achieved
```

- The first `#` heading is the name; the first short line is the headline; a line with an email, phone number or link holds the contact details; the rest before the first `##` is the summary.
- Each `##` heading starts a section, and its kind is guessed from the heading.
- Each `###` heading starts an entry: `Title — Company`, `Title at Company` and `Title (2019 – 2020)` are understood. An italic line under it holds the subtitle, location and dates.
- In a section without `###` entries, each list item becomes an entry; `Label: text` gives a title and description (handy for skills).

## Safety

- Files up to 10 MB are accepted. Excel files are checked before unpacking, and files that would unpack to more than 50 MB or contain too many parts are refused.
- Imported data must pass the same schema checks as anything typed in the editor. Rich text from Markdown or from sheet cells goes through the sanitiser, so scripts and unsafe links are removed.
- Exported CSV cells that start with `=`, `+`, `-`, `@` or a tab get a leading apostrophe, so a spreadsheet never runs them as formulas; importing removes it again. Excel exports store every cell as plain text.
- Excel files are written and read by the app itself (they are zipped XML), without a spreadsheet library.

## Code map

| File                                            | Purpose                                                      |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `src/config/export.ts`                          | Formats, resolutions and accepted file types                 |
| `src/components/export/ExportDialog.tsx`        | The export window and the off-screen pages it draws          |
| `src/lib/export/run-export.ts`                  | Runs an export in any format                                 |
| `src/lib/export/page-capture.ts`                | Pictures of pages, link areas and text positions             |
| `src/lib/export/fonts-embed.ts`                 | Inlines the fonts a resume uses into page pictures           |
| `src/lib/export/pdf.ts`                         | PDF with pdf-lib: pages, links, text layer, document details |
| `src/lib/export/dpi-metadata.ts`                | Stores the resolution in PNG and JPEG files                  |
| `src/lib/export/docx.ts`                        | Word documents with the docx library                         |
| `src/lib/export/icml.ts`                        | InDesign (ICML) stories                                      |
| `src/lib/export/data-formats.ts`                | JSON, CSV, Excel and Markdown files                          |
| `src/lib/interchange/csv.ts`                    | CSV reading and writing, formula protection                  |
| `src/lib/interchange/xlsx.ts`                   | Excel reading and writing with jszip                         |
| `src/lib/interchange/table.ts`                  | The table format                                             |
| `src/lib/interchange/markdown.ts`               | Rich text to Markdown and back                               |
| `src/lib/interchange/markdown-resume.ts`        | Markdown resumes                                             |
| `src/lib/interchange/section-kind.ts`           | Guessing section kinds from headings                         |
| `src/lib/interchange/import-file.ts`            | Detecting and importing any supported file                   |
| `src/lib/interchange/template.ts`               | The blank template                                           |
| `src/components/library/ImportAndTemplates.tsx` | Import and Templates on the My resumes screen                |

---

Previous: [Photos and icons](12-photos-and-icons.md) · Next: [Languages, offline use and accessibility](14-languages-and-offline.md) · [Docs home](README.md) · [Main README](../README.md)
