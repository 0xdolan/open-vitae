# Bundled fonts

This folder holds the fonts that ship with Open Vitae and work offline:

| Family  | Use                                   | Licence  | Source                                      |
| ------- | ------------------------------------- | -------- | ------------------------------------------- |
| Sahel   | Default for right-to-left resumes and fallback for Arabic-script letters | SIL OFL 1.1 | https://github.com/rastikerdar/sahel-font |
| Estedad | Alternative Persian and Arabic font   | SIL OFL 1.1 | https://github.com/aminabedi68/Estedad   |

Manrope, the default left-to-right font, comes from the `@fontsource-variable/manrope` npm package and is not stored here.

## Installing

```bash
npm run fonts:fetch          # download, verify and install
npm run fonts:fetch -- --check   # verify against the recorded checksums
```

The script writes `manifest.json`, which the app reads at start-up, and copies each font's licence next to its files. **Commit this folder** so builds are reproducible and work offline.

If the folder has no `manifest.json`, the app still works and uses similar system fonts instead.

## Adding files by hand

If the script cannot find the files in a release, copy the WOFF2 files here and write `manifest.json` yourself:

```json
{
  "fonts": [
    {
      "family": "Sahel",
      "license": "OFL-1.1",
      "files": [
        { "file": "sahel/Sahel.woff2", "weight": "400" },
        { "file": "sahel/Sahel-Bold.woff2", "weight": "700" }
      ]
    }
  ]
}
```

File paths are relative to this folder and must end in `.woff2`. A variable font covering all weights uses `"weight": "100 900"`.
