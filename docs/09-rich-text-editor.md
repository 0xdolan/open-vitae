# Rich text editor

Previous: [The editor](08-editor.md) · Next: [Fonts and right-to-left text](10-fonts.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Where it is used](#where-it-is-used)
- [Toolbar](#toolbar)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Lists and indentation](#lists-and-indentation)
- [Mixed-direction text](#mixed-direction-text)
- [Images](#images)
- [Tables](#tables)
- [Code blocks](#code-blocks)
- [Find and replace](#find-and-replace)
- [Format painter and presets](#format-painter-and-presets)
- [Spelling and grammar](#spelling-and-grammar)
- [How the output stays safe](#how-the-output-stays-safe)
- [Not in the editor](#not-in-the-editor)
- [Code map](#code-map)

## Where it is used

Every entry description and the profile summary. It is built on [TipTap 3](https://tiptap.dev) (MIT licence, on top of ProseMirror), with Open Vitae's own extensions for indentation, paragraph direction, find and replace, images and tables.

## Toolbar

Controls are grouped and wrap on narrow screens. Every control has a label and tooltip, and shows its keyboard shortcut where it has one.

| Group            | Controls                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| History          | Undo, redo (the editor's own history, separate from the resume-level undo)                                                             |
| Text style       | Paragraph style (normal, headings 1–4, quote, code block), font, size in points, line spacing                                          |
| Character        | Bold, italic, underline, strikethrough, subscript (H₂O), superscript (x²), inline code                                                 |
| Colour           | Text colour and highlight (swatches, the resume's accent colour, any custom colour, remove), presets, format painter, clear formatting |
| Paragraph        | Align left, centre, right, justify; left-to-right or right-to-left paragraph                                                           |
| Lists and indent | Bulleted and numbered lists, decrease and increase indent, quote, horizontal line                                                      |
| Insert           | Link, table, image, emoji, code block with language                                                                                    |
| Clipboard        | Cut, copy, paste as plain text                                                                                                         |
| Tools            | Find and replace, spell check on or off                                                                                                |

Word and character counts appear under each editor, with a warning when the text gets close to the size limit (2 MB, mostly relevant for images).

## Keyboard shortcuts

| Shortcut (Ctrl on Windows and Linux, ⌘ on macOS) | Action                        |
| ------------------------------------------------ | ----------------------------- |
| Ctrl + B / I / U                                 | Bold / italic / underline     |
| Ctrl + Shift + S                                 | Strikethrough                 |
| Ctrl + , / Ctrl + .                              | Subscript / superscript       |
| Ctrl + E                                         | Inline code                   |
| Ctrl + Alt + C                                   | Code block                    |
| Ctrl + Shift + 8 / 7                             | Bulleted / numbered list      |
| Tab / Shift + Tab                                | Indent / outdent (lists nest) |
| Esc, then Tab                                    | Leave the editor              |
| Ctrl + Z / Ctrl + Shift + Z                      | Undo / redo inside the editor |
| Ctrl + F                                         | Find and replace              |
| Ctrl + Shift + V                                 | Paste as plain text           |

Typing shortcuts also work: `- ` or `* ` starts a bulleted list, `1. ` a numbered list, `> ` a quote, `## ` a heading and ` ``` ` a code block.

## Lists and indentation

Two settings in **Page setup** control indentation for the whole resume:

- **Indent size (spaces):** how far each level moves in, in character widths. The default is **4**, as in "four spaces".
- **Nesting levels:** **Unlimited** by default, or a limit from 1 to 9. With a limit, Tab stops at that depth.

Lists can nest as deep as the limit allows, with bullet styles changing per level (disc, circle, square; 1, a, i). Paragraphs, headings and quotes can be indented too. They store only their level, so changing the indent size later moves every indented paragraph to match.

Tab indents, which would normally trap keyboard users inside the editor. Pressing **Esc** first makes the next Tab leave the editor as usual.

## Mixed-direction text

- Each paragraph takes its direction from its own first letter by default, so an English line in a Persian resume, or the reverse, displays correctly with punctuation on the right side.
- The **LTR** and **RTL** buttons set a paragraph's direction explicitly when the automatic choice is wrong, for example a Persian paragraph that starts with an English product name.
- Code always reads left to right.
- Spell check uses the resume's language.

## Images

- **Insert** from a file: PNG, JPEG, WebP or GIF.
- **Kept local:** images are shrunk to at most 1600 px on the longer side, compressed, and stored inside the resume as data. Nothing is uploaded.
- **Metadata removed:** re-encoding drops hidden information such as a photo's GPS location.
- **Layout:** for a selected image, choose alignment (start, centre, end) and width (25%, 50%, 75%, 100%).
- **Remote images are not allowed.** An image loaded from another site would tell that site whenever someone opens the resume. Pasted remote images are removed.

## Tables

- **Insert** a table with up to 20 rows and 10 columns; the first row is a header row.
- **Edit** inside a table: add or delete rows and columns, merge or split cells, toggle the header row, hide or show borders, or delete the table.
- **Move** between cells with Tab and Shift + Tab.

## Code blocks

Choose the language from the menu that appears inside a code block: plain text, Bash, C, C++, C#, CSS, Go, HTML/XML, Java, JavaScript, JSON, Kotlin, Markdown, PHP, Python, Ruby, Rust, SQL, Swift, TypeScript or YAML. Code uses a monospaced font and is coloured in the editor and on the page with a light theme that stays readable when printed.

## Find and replace

**Ctrl + F** (or the search button) opens a bar above the text:

- **Navigate:** Enter goes to the next match, Shift + Enter to the previous one. The bar shows "3 of 12".
- **Options:** match case, and whole words only. Whole words work for every script, including Persian and Arabic.
- **Replace:** replaces the current match; **Replace all** replaces every match. Both can be undone.
- **Close:** Escape closes the bar.

## Format painter and presets

- **Format painter (brush):** place the cursor in text whose formatting you like and press the brush, then select the target text. Its formatting and alignment are copied over. Escape cancels.
- **Presets** apply a combination in one step: accent colour (the resume's current accent), muted, highlighted, small print, large, and keyword (bold).

## Spelling and grammar

- **Spelling** uses the browser's built-in spell checker, in the resume's language, entirely on your device. The toolbar button turns it on or off and the choice is remembered.
- **Grammar checking** needs a grammar engine. Cloud grammar services would send your text away, which Open Vitae does not do. An optional self-hosted grammar server (LanguageTool) that runs in your own Docker setup is planned for phase 9.

## How the output stays safe

The editor stores HTML. Pasted content is first reduced to what the editor supports. Whenever text is shown, it goes through the sanitiser, which keeps:

| Kept          | Rule                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tags          | Paragraphs, headings, lists, links, quotes, code, tables, images, emphasis                                                                        |
| Inline styles | Only colour, background colour, font size, font family, line height, text alignment, width and the indent level, each with a strict value pattern |
| Classes       | Only code highlighting (`hljs-*`), code language (`language-*`) and Open Vitae's own image and table classes                                      |
| Images        | Only embedded PNG, JPEG, WebP and GIF data                                                                                                        |
| Links         | Only `http`, `https`, `mailto` and `tel`; they open in a new tab with no access back to the app                                                   |

Everything else is removed, including scripts, event handlers, iframes, forms, SVG, positioning, `url(...)` and remote images. Code is highlighted between two sanitiser passes. The rules live in [`src/lib/css-filter.ts`](../src/lib/css-filter.ts) and [`src/lib/sanitize.ts`](../src/lib/sanitize.ts), with tests for each.

## Not in the editor

- **Print preview** is in the page preview (see [Pages and printing](11-pages-and-printing.md)); PDF, Word and the other formats are in **Export** (see [Import and export](13-import-and-export.md)).
- **Google Fonts and fonts you load yourself** join the font menu in phase 5.
- **Icons from Lucide and react-icons** come in phase 7.

## Code map

| File                                         | Responsibility                                     |
| -------------------------------------------- | -------------------------------------------------- |
| `src/components/rich-text/RichTextField.tsx` | The editor field: label, toolbar, find bar, counts |
| `src/components/rich-text/Toolbar.tsx`       | All toolbar controls and popovers                  |
| `src/components/rich-text/FindBar.tsx`       | Find and replace bar                               |
| `src/components/rich-text/extensions.ts`     | TipTap set-up and the custom extensions            |
| `src/config/editor.ts`                       | Sizes, spacing, styles, presets and swatches       |
| `src/lib/css-filter.ts`                      | Style, class and image allowlists                  |
| `src/lib/highlight.ts`                       | Code highlighting with highlight.js                |
| `src/lib/find.ts`                            | Match finding (Unicode-aware whole words)          |
| `src/lib/image.ts`                           | Image shrinking and compression                    |
| `src/lib/emoji.ts`                           | Curated emoji with search                          |

---

Previous: [The editor](08-editor.md) · Next: [Fonts and right-to-left text](10-fonts.md) · [Docs home](README.md) · [Main README](../README.md)
