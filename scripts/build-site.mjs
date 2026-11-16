#!/usr/bin/env node
// Assembles the GitHub Pages site in dist-site/: the landing page at the root, brand files
// beside it, and (when dist/ exists) the app under app/.
//   npm run build -- --base=/open-vitae/app/ && node scripts/build-site.mjs
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist-site');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'site'), out, { recursive: true });
for (const [from, to] of [
  ['assets/brand/logo.svg', 'logo.svg'],
  ['public/favicon.svg', 'favicon.svg'],
  ['public/favicon.ico', 'favicon.ico'],
  ['public/icons/apple-touch-icon.png', 'apple-touch-icon.png'],
  ['public/social-preview.png', 'social-preview.png'],
]) {
  cpSync(join(root, from), join(out, to));
}
if (existsSync(join(root, 'dist', 'index.html'))) {
  cpSync(join(root, 'dist'), join(out, 'app'), { recursive: true });
  console.log('Landing page and app assembled in dist-site/ (app under app/).');
} else {
  console.log(
    'Landing page assembled in dist-site/. Build the app first to include it under app/.',
  );
}
