---
name: open-vitae
description: Write, convert or improve a resume as a file that Open Vitae (the private, browser-only resume builder) imports. Use when someone wants their CV turned into Open Vitae JSON, Markdown or CSV, wants an existing Open Vitae export edited, or asks for a right-to-left (Persian, Arabic, Kurdish) resume for Open Vitae.
license: GPL-3.0-or-later
---

# Open Vitae resumes

Open Vitae is a free resume builder that runs entirely in the browser (https://0xdolan.github.io/open-vitae/). It imports JSON, Markdown, CSV and Excel files. This skill produces those files. The person opens Open Vitae, chooses **Import** on **My resumes**, and picks the file; the resume opens ready to edit, lay out and export (PDF, Word, InDesign, images).

## Choose the format

| The person wants…                                              | Write                                               |
| -------------------------------------------------------------- | --------------------------------------------------- |
| Everything exact: layout, page size, direction, colours, links | **JSON** (preferred)                                |
| Something quick to read and edit by hand                       | **Markdown**                                        |
| A spreadsheet to fill in                                       | **CSV** (or point them to **Templates** in the app) |

When the person gives an Open Vitae export (`"format": "open-vitae"`), edit the `resume` object inside it and keep everything else.

## JSON

The format is published as JSON Schema: `public/schema/resume.schema.json` in the repository, also served by the app at `schema/resume.schema.json`. Two complete examples are in [`examples/`](examples/): `minimal-en.json` (left to right) and `minimal-ckb.json` (Kurdish Sorani, right to left).

Rules the import enforces:

- `schemaVersion` is `2`.
- Every `id` (resume, links, sections, entries) is unique, 1 to 64 characters of `A–Z a–z 0–9 _ -`. Readable ids such as `sec-experience` and `item-exp-1` are fine; the import gives the resume new ids anyway.
- `createdAt` and `updatedAt` are ISO 8601 date-times, e.g. `2026-11-15T09:00:00.000Z`.
- `language` is a BCP 47 tag: `en`, `en-GB`, `fa`, `ar`, `ckb`, `kmr`, `de`…
- Every text field is present, even when empty (`""`). Every entry has `id`, `visible`, `title`, `subtitle`, `dateRange`, `location`, `url` and `descriptionHtml`.
- Colours are hex (`#1d4a2e`). Font names use letters, digits, spaces, `.`, `_` and `-` only.

Layout values:

| Field            | Values                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pageSize`       | `a4` (default), `letter`, `legal`, `a3`, `a5`, `a6`, `b4`, `b5`, `jis-b5`, `tabloid`, `executive`, `statement`, `folio`                          |
| `orientation`    | `portrait` or `landscape`                                                                                                                        |
| `marginMm`       | 0 to 50; 16 is the default                                                                                                                       |
| `pageBreaks`     | `smart` or `manual`                                                                                                                              |
| `direction`      | `ltr` or `rtl`                                                                                                                                   |
| `fontFamily`     | `Manrope` for left-to-right, `Sahel` (Persian, Arabic) or `Estedad` (Kurdish) for right-to-left; `Arial` and `Times New Roman` also work offline |
| `baseFontSizePt` | 6 to 24; 10 is the default                                                                                                                       |
| `lineHeight`     | 1 to 3; 1.4 for Latin script, 1.6 for Arabic script                                                                                              |
| `indentCh`       | 1 to 12; 4 is the default                                                                                                                        |
| `maxDepth`       | `null` (unlimited) or 1 to 20                                                                                                                    |
| `digits`         | optional: `latn`, `arab` (٠١٢٣) or `arabext` (۰۱۲۳); leave it out to keep digits as typed                                                        |

Section `kind` is one of `experience`, `education`, `skills`, `projects`, `certifications`, `languages`, `awards`, `publications`, `volunteering`, `references`, `interests` or `custom`. Array order is page order. What the entry fields mean depends on the kind:

| Kind                   | `title`      | `subtitle`              | `dateRange` | `descriptionHtml` |
| ---------------------- | ------------ | ----------------------- | ----------- | ----------------- |
| experience             | Job title    | Company or organisation | Dates       | Achievements      |
| education              | Degree       | School or university    | Dates       | Details           |
| skills                 | Skill group  | (empty)                 | (empty)     | The skills        |
| projects               | Project name | Short summary           | Dates       | Details           |
| certifications, awards | Name         | Issued or awarded by    | Date        | Details           |
| publications           | Title        | Publisher or journal    | Date        | Details           |
| languages              | Language     | (empty)                 | (empty)     | Level             |
| volunteering           | Role         | Organisation            | Dates       | Details           |
| references             | Name         | Role and company        | (empty)     | Contact details   |
| interests              | Interest     | (empty)                 | (empty)     | Details           |

Rich text (`summaryHtml`, `descriptionHtml`) is HTML. Use `<p>`, `<ul>`/`<ol>` with `<li><p>…</p></li>`, `<strong>`, `<em>`, `<u>`, `<s>`, `<a href="https://…">`, `<br>`, `<blockquote>`, `<code>` and simple `<table>`s. Everything else, scripts, event attributes and non-http links, is removed on display. Links in profile and entry `url` fields must be `https://`, `http://`, `mailto:` or `tel:` to become clickable.

Optional extras: `icon` on sections, entries and links (`{ "set": "lu", "name": "LuMail" }`, Lucide names), `titleStyle` and `descriptionStyle` (`color`, `fontFamily`, `fontSizePt`), `breakBefore: true` on an entry to start it on a new page. Leave out `photo`: photos are added in the app, where they are cropped and stay on the person's device.

## Markdown

```markdown
# Full name

Headline

email@example.com · +1 555 0100 · City, Country · github.com/you

A short summary.

## Experience

### Job title — Company

_City · 2021 – Present_

- What you achieved, with a number where possible
```

- The first `#` heading is the name, the next short line the headline, a line with an email, phone or link the contact details, and the rest before the first `##` the summary.
- Each `##` starts a section; its kind is guessed from the heading, in English, Persian, Arabic or Kurdish.
- Each `###` starts an entry: `Title — Company`, `Title at Company` or `Title (2019 – 2020)`. An italic line under it holds subtitle, location and dates.
- In a section without `###`, each list item is an entry; `Label: text` gives a title and description, which suits skills.

## CSV

Columns `Type, Section, Kind, Title, Subtitle, Dates, Location, URL, Details, Hidden`, one row per setting, profile field, link, section or entry. Details hold Markdown. The full description is in the repository's `docs/13-import-and-export.md`; the app's **Templates** button downloads a ready file.

## Right-to-left resumes

- Set `language` (`fa`, `ar`, `ckb`), `"direction": "rtl"`, an Arabic-script font (`Sahel` or `Estedad`) and `lineHeight` 1.6.
- Write section titles in the resume's language (`ئەزموونی کار`, `سوابق کاری`, `الخبرة العملية`). English product names and terms can stay in Latin script; Open Vitae handles mixed text.
- For Sorani use the Kurdish letters ڕ ڵ ێ ۆ ە and the Kurdish ک and ی, not the Arabic ك and ي.
- Write the word for an ongoing job in the resume's language: `ئێستا` (Sorani), `اکنون` (Persian), `حتى الآن` (Arabic).
- To show Arabic-Indic or Persian digits on the page, set `layout.digits` rather than rewriting numbers; phone numbers and links are never changed.

## Writing well

- One page for most people with under ten years of experience; two at most otherwise.
- Start bullets with a verb and include a result: “Cut build time from 12 to 4 minutes”.
- Keep the person's facts. Do not invent employers, dates, numbers or qualifications; ask when something is missing.
- Use `example.com` addresses and fictional names only for examples, never for a real person's resume.

## Check before handing over

1. The JSON parses and follows the schema; every id is unique.
2. All required text fields exist, empty when unknown.
3. Links start with `https://`, `mailto:` or `tel:`.
4. Right-to-left resumes have `direction`, `language` and font set together.
5. Tell the person to open Open Vitae, choose **Import**, and pick the file. If the import reports a problem, it names it.
