# Languages, offline use and accessibility

Previous: [Import and export](13-import-and-export.md) · Next: [The name, the logo and the brand](15-brand-and-story.md) · [Docs home](README.md) · [Main README](../README.md)

## Contents

- [Interface languages](#interface-languages)
- [Digits and calendars](#digits-and-calendars)
- [Install and offline use](#install-and-offline-use)
- [Grammar and spelling](#grammar-and-spelling)
- [Accessibility](#accessibility)
- [Adding or improving a translation](#adding-or-improving-a-translation)
- [What is still in English](#what-is-still-in-english)
- [Code map](#code-map)

## Interface languages

The interface is available in English, Persian (فارسی), Arabic (العربية) and Central Kurdish, Sorani (کوردی سۆرانی). Choose one with **Interface language** at the top of **My resumes**. The first time, Open Vitae picks the best match from your browser's languages; plain `ku` is not matched, because it can mean Kurmanji as well as Sorani. The choice is kept in this browser.

The interface language and the resume language are separate. You can write an English resume with a Kurdish interface, or the other way round. The page direction follows the interface language; each resume keeps its own direction, and form fields follow what you type.

Plurals follow each language's own rules (Arabic has six forms), and numbers in the interface use the language's digits: Persian digits for Persian, Arabic-Indic digits for Sorani. Dates and times use the browser's formats. Chrome has no Sorani date data, so Open Vitae writes Sorani dates itself, with Kurdish month and weekday names: `یەکشەممە، ١٥ی تشرینی دووەمی ٢٠٢٦، ٩:٠٣:٠١`.

## Digits and calendars

**Page setup › Digits** draws the resume with Western (0123), Arabic-Indic (٠١٢٣) or Persian (۰۱۲۳) digits, or leaves them as typed (the default). It changes names, titles, dates and descriptions on the page and in Word and InDesign exports. The stored resume keeps what you typed, so switching back is lossless. Email addresses, phone numbers, web addresses, links and code are never changed, so they keep working.

The calendar button next to an entry's **Dates** field writes a date range for you:

| Calendar  | Months                                   | Years                       |
| --------- | ---------------------------------------- | --------------------------- |
| Gregorian | From the browser, in the chosen language | 2026                        |
| Persian   | Farvardin to Esfand (Solar Hijri)        | 1405                        |
| Islamic   | Muharram to Dhu al-Hijjah (Umm al-Qura)  | 1448                        |
| Kurdish   | خاکەلێوە to ڕەشەمە                       | Solar Hijri + 1321, so 2726 |

Pick the start and end (or **Present**), the language for month names, and check the preview. The result is ordinary text in the Dates field; you can still edit it, and nothing about the calendar is stored. Month names in Sorani are built in for every calendar; other languages come from the browser.

## Install and offline use

Open Vitae is a progressive web app. When the browser offers it, **Install app** appears at the top of **My resumes**; the installed app opens in its own window and from the start menu, dock or home screen. On iPhone and iPad, use Share › Add to Home Screen.

After the first visit everything the app needs is stored on the device, and a message says when it is ready to work offline. Offline, a small notice says so; everything keeps working and saving, and only Google Fonts wait for a connection. Icon sets other than Lucide are stored the first time you open them.

When a new version is published, a message asks before switching. **Update now** saves your pending changes first, then reloads into the new version. Nothing updates by surprise.

## Grammar and spelling

The browser's spell checker works in every text field. For grammar and style, Open Vitae can use a LanguageTool server that you run yourself. It is off by default.

With Docker Compose:

```bash
docker compose --profile grammar up --build
```

This starts the app and a LanguageTool container. The container has no published port; the app's nginx forwards `/languagetool/` to it, so the browser only ever talks to the app's own address. LanguageTool needs about 1 to 1.5 GB of memory.

In the editor, open **Grammar**, tick **Use the LanguageTool server**, and choose **Check this resume**. The headline, summary, section titles, entry titles and descriptions are sent in one request; names, contact details, places and dates are not. Each finding shows where it is, the words around it and suggestions to apply with one click. Suggestions that would cross formatting (part bold, part not) are left for you to fix by hand.

Rules that keep text private:

- The server address must be a path on the same site (for example `/languagetool/v2/check`). Addresses on other sites are refused by the app and blocked by the Content Security Policy.
- Requests carry no cookies and no referrer.
- Sorani is not supported by LanguageTool, so the panel says so instead of sending text.

Hosting without Docker: proxy a path on your site to a LanguageTool server (`proxy_pass http://127.0.0.1:8010/;`), and do not expose the LanguageTool port itself.

## Accessibility

The target is WCAG 2.2 AA. Phase 9 added and checked:

- A **Skip to content** link, landmarks (`main`, `nav`, headings) and a heading at the top of every view; after moving between views, focus moves to the new view's heading.
- Names for every control, checked with an audit of the browser's accessibility tree on the library, editor, page setup, version history, grammar, export, date and icon windows, in English and Sorani, on desktop and phone sizes.
- Text contrast of at least 4.5:1 (3:1 for large text) everywhere in the app interface; counts and labels that were too light were darkened.
- Visible focus, keyboard drag and drop with spoken instructions, dialogs built on the native `<dialog>` element (focus trap, Escape), and reduced motion respected.
- `lang` and `dir` on the page, on each resume and on text in other languages.

The audit is a script in the development harness that walks the accessibility tree and measures contrast; automated checks with axe in CI are on the roadmap.

## Adding or improving a translation

Messages live in `src/i18n/messages/`: `en.ts` is the source, and each language file has the same keys.

1. Copy an existing language file, translate every message and keep each `{placeholder}`.
2. Messages with counts are objects of plural forms (`zero`, `one`, `two`, `few`, `many`, `other`); give the forms your language uses, at least `other`.
3. Add the language to `UI_LOCALES` in `src/i18n/locales.ts` with its direction, and to `TRANSLATIONS` in `src/i18n/index.ts`.
4. Run `npm run test`. The tests fail if a key is missing, a placeholder is lost, a plural is not an object, or a message is left in English.

The Persian, Arabic and Sorani translations were written for this release and would benefit from review by native speakers. Corrections are welcome as pull requests.

## What is still in English

- Detailed reasons from file reading, image processing and storage (for example why an import failed), and the notes an export adds about what a format cannot hold, appear in English inside a translated message.
- Icon and emoji names are searched in English; the search box says so.
- LanguageTool's own messages come from the server.
- Sample resume content is in its own language (the English samples stay English).

## Code map

| File                                          | What it does                                                  |
| --------------------------------------------- | ------------------------------------------------------------- |
| `src/i18n/translate.ts`                       | Translator, plural rules, placeholders, interface digits      |
| `src/i18n/locales.ts`                         | Interface languages, directions and browser detection         |
| `src/i18n/index.ts`                           | Language store, `useT()`, `t()` and the page `lang` and `dir` |
| `src/i18n/messages/*.ts`                      | English, Persian, Arabic and Sorani messages                  |
| `src/components/LanguageSwitcher.tsx`         | The Interface language menu                                   |
| `src/lib/digits.ts`                           | Digit sets and drawing a resume with chosen digits            |
| `src/lib/calendars.ts`                        | Calendars, month names, Kurdish years, date ranges            |
| `src/lib/datetime.ts`                         | Dates and times, with the Sorani fallback                     |
| `src/components/editor/DateRangeDialog.tsx`   | The date range helper                                         |
| `src/pwa/pwa-store.ts`, `src/pwa/register.ts` | Install offer, online state and the update prompt             |
| `src/components/AppStatus.tsx`                | Install button and offline notice                             |
| `src/lib/grammar/languagetool.ts`             | LanguageTool client, same-site check, language codes          |
| `src/lib/grammar/fields.ts`                   | Which text is checked, and writing fixes back                 |
| `src/components/workspace/GrammarPanel.tsx`   | The Grammar panel                                             |

---

Previous: [Import and export](13-import-and-export.md) · Next: [The name, the logo and the brand](15-brand-and-story.md) · [Docs home](README.md) · [Main README](../README.md)
