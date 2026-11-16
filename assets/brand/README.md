# Brand files

Generated files: do not edit by hand. The story behind the logo, the colours, every file and the usage rules are in [docs/15-brand-and-story.md](../../docs/15-brand-and-story.md).

- Change the geometry or colours in [`scripts/brand/make-logo.mjs`](../../scripts/brand/make-logo.mjs), then run `npm run brand`.
- Render the PNGs, `favicon.ico`, wordmarks and the social image with `npx -y -p puppeteer node scripts/brand/render-icons.mjs`.
