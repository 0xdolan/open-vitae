# Fonts and right-to-left text

Previous: [Rich text editor](09-rich-text-editor.md) · Next: [Pages and printing](11-pages-and-printing.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Where fonts come from](#where-fonts-come-from)
- [Choosing a font](#choosing-a-font)
- [Bundled fonts: Sahel and Estedad](#bundled-fonts-sahel-and-estedad)
- [Your own fonts](#your-own-fonts)
- [Google Fonts](#google-fonts)
- [Missing fonts](#missing-fonts)
- [Right-to-left resumes](#right-to-left-resumes)
- [How the font stack is built](#how-the-font-stack-is-built)
- [Security](#security)
- [Code map](#code-map)

## Where fonts come from

| Source  | Fonts                                         | Network                         | Kept where                       |
| ------- | --------------------------------------------- | ------------------------------- | -------------------------------- |
| Bundled | Manrope (Latin, from the `@fontsource-variable/manrope` package); Sahel and Estedad (Persian and Arabic) | None, shipped with the app | The app's own files |
| System  | Arial, Times New Roman                        | None                            | The visitor's computer; Arimo and Tinos are used where they are missing |
| Yours   | Any TTF, OTF, WOFF or WOFF2 file you load     | None, never uploaded            | This browser (IndexedDB)         |
| Google  | A curated catalogue of Google Fonts, or any family by name | Google, after you agree | Your choice is remembered; files are cached by the browser |

Manrope is the default for left-to-right resumes and Sahel for right-to-left ones.

## Choosing a font

Open **Page setup** and use the **Font** picker. Type to search; fonts are grouped as bundled, system, your fonts and Google Fonts. When the resume is right to left, fonts that cover Arabic script are listed first.

The same fonts, including yours and any Google fonts you have loaded, appear in the font menu of the rich text toolbar.

## Bundled fonts: Sahel and Estedad

Manrope comes from an npm package and needs no extra step. [Sahel](https://github.com/rastikerdar/sahel-font) and [Estedad](https://github.com/aminabedi68/Estedad) are open-licence fonts covering the full Arabic script range. Their files are not stored in this repository's history by default. Whoever builds the app downloads them once:

```bash
npm run fonts:fetch          # download the latest releases into public/fonts
npm run fonts:fetch -- --check   # only check what is installed
npm run fonts:fetch -- --force   # download again
```

The script downloads each project's latest release from GitHub, checks every file really is WOFF2, records its SHA-256 checksum, copies the licence and writes `public/fonts/manifest.json`. Commit `public/fonts` afterwards so CI, Docker and GitHub Pages builds include the fonts. The manifest format is described in [`public/fonts/README.md`](../public/fonts/README.md).

Without the files the app still works: a similar system font is used and a notice says so.

## Your own fonts

In **Page setup → Fonts → Your fonts**, choose **Load a font file**.

- Accepted: TTF, OTF, WOFF and WOFF2, up to 25 MB. The file is checked by its contents, not its name.
- The family name comes from the file name; rename it any time.
- Fonts stay in this browser and are never uploaded. **If you clear this site's data or your browser cache, load them again.** The app shows this warning next to the list.
- Only load fonts you are licensed to use.

## Google Fonts

Google Fonts are off until you agree. The consent box explains that Google receives your IP address and the font names, and that nothing from your resume is sent. You can turn it off again at any time.

After you agree, pick a font from the Google group, or type any family name and choose **Load '…' from Google Fonts**. Your loaded families are remembered and loaded again on your next visit.

## Missing fonts

When a resume uses a font this browser does not have (a bundled font that is not installed, a user font from another browser, or a Google font without consent), a notice above the editor names each font and the reason. A similar font is shown until it is available. **Open font settings** jumps to the Fonts panel.

## Right-to-left resumes

- Set **Direction** in Page setup to right to left. The page, headings, dates and lists mirror.
- Every rich text paragraph finds its own direction, so English words, numbers and punctuation inside Persian or Arabic text sit correctly, and the reverse.
- Names, links and short fields are wrapped so a mixed-direction value does not reorder the text around it.
- The **Persian**, **Arabic** and **Kurdish – Sorani** samples show complete right-to-left resumes. Persian uses Sahel and Persian digits; Arabic uses Sahel, Arabic-Indic digits and the Arabic comma; Kurdish uses Estedad and the Sorani letters ڕ ڵ ێ ۆ ە.
- **Page setup → Language** sets the resume's language (English, Arabic, Kurdish (Sorani) or Persian). Section titles still at their default are renamed into the new language, titles you typed are kept, and choosing a language written the other way also flips the direction.

## How the font stack is built

For every font the app builds a CSS stack: the chosen family, then Sahel when the chosen font does not cover Arabic script, then a fallback of the right kind (serif, sans-serif or monospace). So a Latin font chosen for a Persian resume still shows Persian letters in Sahel rather than a random system font.

## Security

- Google Fonts are fetched only after consent. The stylesheet is downloaded first and checked: it may contain only `@font-face` rules with known descriptors and font files from `https://fonts.gstatic.com/`. Anything else is refused.
- The Content Security Policy allows only `fonts.googleapis.com` and `fonts.gstatic.com` as outside hosts.
- User font files are checked by their signature bytes and size before they are stored, and are loaded with the browser's `FontFace` API.
- The bundled manifest is validated: family names, file names (WOFF2 only, no parent folders) and weights must match strict patterns.

## Code map

| File                                     | Purpose                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| `src/config/fonts.ts`                    | Bundled and system fonts, defaults, the font stack         |
| `src/config/google-fonts.ts`             | The Google Fonts catalogue and script coverage             |
| `src/lib/fonts/font-file.ts`             | File checks: size, format by signature, family names       |
| `src/lib/fonts/google.ts`                | Google Fonts URLs, stylesheet download and validation      |
| `src/lib/fonts/registrar.ts`             | Registering font faces and stylesheets with the browser    |
| `src/lib/fonts/bundled.ts`               | Loading and validating `public/fonts/manifest.json`        |
| `src/lib/fonts/usage.ts`                 | Which fonts a resume uses                                  |
| `src/stores/font-store.ts`               | Font state: bundled, yours, Google, consent, status        |
| `src/components/fonts/`                  | Font picker, fonts panel, consent box, missing-font notice |
| `scripts/fetch-fonts.mjs`                | Downloads Sahel and Estedad and writes the manifest        |
| `src/samples/persian.ts`, `arabic.ts`, `kurdish.ts` | The right-to-left sample resumes                |
| `src/config/languages.ts`                | Resume languages and their direction                       |

---

Previous: [Rich text editor](09-rich-text-editor.md) · Next: [Pages and printing](11-pages-and-printing.md) · [Docs home](README.md) · [Main README](../README.md)
