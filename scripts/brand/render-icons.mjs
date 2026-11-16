#!/usr/bin/env node
// Renders the PNG icons, favicon.ico, wordmarks and the social image from the SVG masters.
// Needs a headless Chrome through Puppeteer, which is not a project dependency:
//   npx -y -p puppeteer node scripts/brand/render-icons.mjs
// (or set PUPPETEER_MODULE to the path of an installed copy).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COLOURS, VARIANTS } from './make-logo.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE ?? 'puppeteer');
const brand = join(root, 'assets', 'brand');
const uri = (svgText) => `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;

const browser = await puppeteer.launch({
  args: ['--no-sandbox'],
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
});
const page = await browser.newPage();

async function png(svgText, size, file) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img style="display:block;width:${size}px;height:${size}px" src="${uri(svgText)}"></body></html>`,
  );
  await page.waitForFunction(() => document.querySelector('img').complete);
  const buffer = await page.screenshot({ omitBackground: true, type: 'png' });
  if (file) writeFileSync(file, buffer);
  return buffer;
}

async function html(markup, width, height, file) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(markup);
  await page.evaluate(() => document.fonts.ready);
  const element = await page.$('body > div');
  await element.screenshot({ path: file, omitBackground: true, type: 'png' });
}

/** An .ico holding PNG images (supported by every current browser and Windows Vista onwards). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

const disc = VARIANTS['logo.svg']();
const small = VARIANTS['logo-favicon.svg']();
const maskable = VARIANTS['logo-maskable.svg']();

mkdirSync(join(brand, 'png'), { recursive: true });
for (const size of [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024]) {
  await png(size <= 32 ? small : disc, size, join(brand, 'png', `logo-${size}.png`));
}

const icons = join(root, 'public', 'icons');
mkdirSync(icons, { recursive: true });
await png(disc, 192, join(icons, 'icon-192.png'));
await png(disc, 512, join(icons, 'icon-512.png'));
await png(maskable, 512, join(icons, 'icon-maskable-512.png'));
await png(maskable, 180, join(icons, 'apple-touch-icon.png'));
const icoImages = [];
for (const size of [16, 32, 48]) icoImages.push({ size, data: await png(small, size) });
writeFileSync(join(root, 'public', 'favicon.ico'), ico(icoImages));

// Wordmarks and the social image use system sans-serif text so they render the same everywhere.
const font = "font-family: Manrope, Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
for (const [name, ink, bg] of [
  ['wordmark-light', '#1C1917', 'transparent'],
  ['wordmark-dark', '#F8F8F8', 'transparent'],
]) {
  await html(
    `<html><body style="margin:0;background:${bg}"><div style="display:flex;align-items:center;gap:36px;padding:24px 40px 24px 24px;width:max-content;${font}">
      <img src="${uri(disc)}" width="200" height="200"><div><div style="font-size:112px;font-weight:800;letter-spacing:-2px;color:${ink};line-height:1">Open Vitae</div>
      <div style="font-size:34px;color:${ink};opacity:.75;margin-top:14px">Your resume, in your browser</div></div></div></body></html>`,
    1180,
    248,
    join(brand, `${name}.png`),
  );
}

const social = `<html><body style="margin:0"><div style="width:1280px;height:640px;box-sizing:border-box;padding:80px 96px;background:${COLOURS.face};${font};display:flex;align-items:center;gap:72px;position:relative">
  <img src="${uri(disc)}" width="340" height="340">
  <div><div style="font-size:104px;font-weight:800;letter-spacing:-2px;color:#1C1917;line-height:1">Open Vitae</div>
  <div style="font-size:38px;color:#44403C;margin-top:22px;line-height:1.3">A private resume builder that runs<br>entirely in your browser.</div>
  <div style="font-size:26px;color:${COLOURS.deq};margin-top:30px;font-weight:600">Free and open source · LTR and RTL · Works offline</div></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:14px;background:${COLOURS.deq}"></div>
  <div style="position:absolute;left:0;bottom:14px;height:6px;width:100%;background:${COLOURS.sun}"></div></div></body></html>`;
await html(social, 1280, 640, join(brand, 'social-preview.png'));
writeFileSync(
  join(root, 'public', 'social-preview.png'),
  readFileSync(join(brand, 'social-preview.png')),
);

await browser.close();
console.log('Rendered PNG icons, favicon.ico, wordmarks and the social image.');
