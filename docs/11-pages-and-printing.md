# Pages and printing

Previous: [Fonts and right-to-left text](10-fonts.md) · Next: [Photos and icons](12-photos-and-icons.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Paper sizes](#paper-sizes)
- [The page preview](#the-page-preview)
- [Smart page breaks](#smart-page-breaks)
- [Manual page breaks](#manual-page-breaks)
- [Print preview and printing](#print-preview-and-printing)
- [When something does not fit](#when-something-does-not-fit)
- [How pagination works](#how-pagination-works)
- [Code map](#code-map)

## Paper sizes

Choose the size in **Page setup → Page size**. The default is A4. Every size works in portrait or landscape.

| Group               | Sizes                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| International (ISO) | A3, A4, A5, A6, B4, B5                                                                  |
| North American      | Letter, Legal, Tabloid (Ledger), Executive, Statement (Half Letter), Folio              |
| Japanese (JIS)      | B5 (JIS)                                                                                |

Margins apply to all four sides. On small paper, margins are reduced automatically so at least 20 mm is left for content.

## The page preview

The preview shows every page at its true size in millimetres, one under another, with the page number underneath.

- **Zoom:** "Fit width" follows the panel (never larger than 100%), or pick a level from 25% to 200%, or use the zoom buttons.
- The toolbar shows the number of pages, the paper size and whether breaks are manual.
- Click any section on a page to edit it.

## Smart page breaks

Smart is the default. The app fills each page and then picks the best place to end it:

- A section heading never ends a page; it moves to the next page with its first entry.
- An entry's title, date and subtitle never end a page without the entry's text.
- Breaking between sections is preferred, then between entries. An entry is split between its paragraphs or bullet points only when keeping it whole would leave a large gap at the bottom of the page.
- A line of text, a table or a code block is never cut in half.
- A numbered list that continues on the next page keeps counting.

Manual breaks you add are honoured in smart mode too.

## Manual page breaks

To start a section on a new page, open the section and tick **Start on a new page**. To start a single entry on a new page, use the page-break button (two half-pages with a dashed line) on the entry's row.

Set **Page setup → Page breaks** to **Manual** to turn the automatic rules off: pages then end only where you put a break. If a page is too full, the rest carries on to a new page at the last block that fits, and a note under that page suggests adding a break.

A break on the first entry of a section is moved before the section heading, so the heading is never left behind.

## Print preview and printing

**Print preview** (in the preview toolbar) opens every page full screen, with zoom. **Print or save as PDF** opens the browser's print dialog, which also offers **Save as PDF**.

- Only the resume pages are printed, never the app.
- The paper size is set for you, so the printout matches the preview exactly. Keep the scale at 100% and margins at Default.
- Colours print as shown without turning on "background graphics".
- **Ctrl+P** (⌘P on a Mac) in the editor prints the same pages.

**Export › PDF** makes the same pages with a PDF library, with clickable links and the resolution you choose; see [Import and export](13-import-and-export.md).

## When something does not fit

If one block is taller than a whole page (a very long paragraph or a large table), it goes on its own page and is cut off at the bottom, exactly as it would print. A note under that page says so. Split the text, or use a smaller text size, line height or margins.

## How pagination works

1. The renderer marks every piece that may not be cut across pages with `data-ov-b`: the header, each section heading, each entry's heading, and each paragraph, heading, table, code block or top-level list item of the summary and descriptions ([`src/lib/rich-blocks.ts`](../src/lib/rich-blocks.ts) splits the rich text after sanitising).
2. An invisible copy of the resume is laid out at the page's content width and every block is measured ([`FlowMeasure`](../src/components/pages/FlowMeasure.tsx)). It measures again when the content changes size, for example when a font finishes loading.
3. [`paginate()`](../src/lib/pagination.ts) decides where each page ends. It is a pure function with unit tests. In smart mode it scores each possible break by the empty space left on the page plus the cost of breaking there (0 between sections, 0.5 between entries, 2 inside an entry; never right after a heading).
4. Each page renders only its own blocks, so the text exists once in the page and once in a printed PDF, which keeps PDFs searchable and readable by applicant tracking systems.

## Code map

| File                                          | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `src/config/page-sizes.ts`                    | Paper sizes, groups, mm to pixel conversion          |
| `src/config/preview.ts`                       | Zoom steps                                           |
| `src/lib/page-geometry.ts`                    | Page and content box sizes, safe margins             |
| `src/lib/pagination.ts`                       | Block kinds, keep and break rules, page splitting    |
| `src/lib/rich-blocks.ts`                      | Split rich text into page blocks and join them again |
| `src/components/pages/FlowMeasure.tsx`        | Invisible layout and measuring                       |
| `src/components/pages/PageSheet.tsx`          | One page at true size                                |
| `src/components/pages/PageStack.tsx`          | The stacked pages with zoom and notes                |
| `src/components/pages/PrintPreview.tsx`       | Full-screen print preview                            |
| `src/components/pages/PrintLayer.tsx`         | What the browser prints, and the @page size          |

---

Previous: [Fonts and right-to-left text](10-fonts.md) · Next: [Photos and icons](12-photos-and-icons.md) · [Docs home](README.md) · [Main README](../README.md)
