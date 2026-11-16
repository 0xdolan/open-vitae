#!/usr/bin/env node
/**
 * Download the bundled Persian/Arabic fonts (Sahel, Estedad) from their
 * authors' GitHub releases into public/fonts, with their licences and a
 * manifest the app reads at start-up. Both fonts use the SIL Open Font
 * Licence 1.1, which allows bundling them with this GPL application.
 *
 *   npm run fonts:fetch            install if missing
 *   npm run fonts:fetch -- --force reinstall
 *   npm run fonts:fetch -- --check verify files against the manifest's checksums
 *
 * Commit public/fonts afterwards so builds, Docker images and GitHub Pages
 * work offline and reproducibly. Needs Node 22+ and `tar` (built into Linux,
 * macOS and Windows 10+).
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'fonts');
const MANIFEST = join(OUT, 'manifest.json');

/** What to install. Patterns are tried in order; the first matching file wins. */
const FONTS = [
  {
    family: 'Sahel',
    repo: 'rastikerdar/sahel-font',
    files: [
      { weight: '400', patterns: [/(^|\/)Sahel\.woff2$/i] },
      { weight: '700', patterns: [/(^|\/)Sahel-Bold\.woff2$/i] },
    ],
  },
  {
    family: 'Estedad',
    repo: 'aminabedi68/Estedad',
    files: [
      // Prefer the variable font (all weights in one file), else regular and bold.
      {
        weight: '100 900',
        optionalGroup: 'variable',
        patterns: [
          /Estedad[^/]*\[[^/]*wght[^/]*\]\.woff2$/i,
          /Estedad[^/]*-?(VF|Variable)[^/]*\.woff2$/i,
        ],
      },
      {
        weight: '400',
        optionalGroup: 'static',
        patterns: [/(^|\/)Estedad-(Regular|FD-Regular)\.woff2$/i, /(^|\/)Estedad\.woff2$/i],
      },
      {
        weight: '700',
        optionalGroup: 'static',
        patterns: [/(^|\/)Estedad-(Bold|FD-Bold)\.woff2$/i],
      },
    ],
  },
];

const args = new Set(process.argv.slice(2));

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function isWoff2(path) {
  return readFileSync(path).subarray(0, 4).toString('latin1') === 'wOF2';
}

function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

async function github(path) {
  const response = await fetch(`https://api.github.com/repos/${path}`, {
    headers: { 'User-Agent': 'open-vitae-fetch-fonts', Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}`);
  return response.json();
}

async function download(url, to) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'open-vitae-fetch-fonts' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  writeFileSync(to, Buffer.from(await response.arrayBuffer()));
}

function check() {
  if (!existsSync(MANIFEST)) {
    console.error('No public/fonts/manifest.json. Run: npm run fonts:fetch');
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  let ok = true;
  for (const font of manifest.fonts) {
    for (const file of font.files) {
      const path = join(OUT, file.file);
      const good = existsSync(path) && sha256(path) === file.sha256 && isWoff2(path);
      console.log(`${good ? '✓' : '✗'} ${font.family} ${file.weight}  ${file.file}`);
      ok &&= good;
    }
  }
  process.exit(ok ? 0 : 1);
}

async function installFont(font, work) {
  const release = await github(`${font.repo}/releases/latest`).catch(() => null);
  const tag = release?.tag_name ?? (await github(font.repo)).default_branch;
  const archive = join(work, `${font.family}.tar.gz`);
  console.log(`• ${font.family}: downloading ${font.repo} @ ${tag}`);
  await download(
    `https://codeload.github.com/${font.repo}/tar.gz/${release ? 'refs/tags/' : 'refs/heads/'}${tag}`,
    archive,
  );

  const extractDir = join(work, font.family);
  mkdirSync(extractDir);
  const tar = spawnSync('tar', ['-xzf', archive, '-C', extractDir], { stdio: 'inherit' });
  if (tar.status !== 0) throw new Error('Could not extract the archive. Is `tar` installed?');

  const all = walk(extractDir).map((p) => p.slice(extractDir.length + 1).replaceAll('\\', '/'));
  const pick = (patterns) => {
    for (const pattern of patterns) {
      const hit = all.find((p) => pattern.test(p));
      if (hit) return hit;
    }
    return null;
  };

  const chosen = [];
  const variable = font.files
    .filter((f) => f.optionalGroup === 'variable')
    .map((f) => ({ ...f, path: pick(f.patterns) }));
  const rest = font.files
    .filter((f) => !f.optionalGroup)
    .map((f) => ({ ...f, path: pick(f.patterns) }));
  const statics = font.files
    .filter((f) => f.optionalGroup === 'static')
    .map((f) => ({ ...f, path: pick(f.patterns) }));
  chosen.push(...rest);
  if (variable.length && variable.every((f) => f.path)) chosen.push(...variable);
  else chosen.push(...statics);

  const missing = chosen.filter((f) => !f.path);
  if (chosen.length === 0 || missing.length > 0) {
    const woff2 = all.filter((p) => p.toLowerCase().endsWith('.woff2'));
    console.error(
      `  ✗ Could not find the expected ${font.family} files. WOFF2 files in the release:`,
    );
    for (const p of woff2.slice(0, 40)) console.error(`    ${p}`);
    console.error(
      '  Copy the regular and bold files into public/fonts/' +
        font.family.toLowerCase() +
        '/ and add them to',
    );
    console.error('  public/fonts/manifest.json by hand (see public/fonts/README.md).');
    return null;
  }

  const dest = join(OUT, font.family.toLowerCase());
  mkdirSync(dest, { recursive: true });
  const files = [];
  for (const f of chosen) {
    const source = join(extractDir, f.path);
    if (!isWoff2(source)) throw new Error(`${f.path} is not a WOFF2 font.`);
    // Plain names only (the app's manifest check and CSS url() both rely on it):
    // "Estedad[KSHD,wght].woff2" becomes "Estedad-KSHD-wght.woff2".
    const name = basename(f.path)
      .replace(/\.woff2$/i, '')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+$/, '')
      .concat('.woff2');
    copyFileSync(source, join(dest, name));
    files.push({
      file: `${font.family.toLowerCase()}/${name}`,
      weight: f.weight,
      sha256: sha256(join(dest, name)),
    });
    console.log(`  ✓ ${name} (${f.weight})`);
  }

  const license = all.find(
    (p) => /(^|\/)(OFL|LICENSE)(\.txt|\.md)?$/i.test(p) && p.split('/').length <= 3,
  );
  if (license) copyFileSync(join(extractDir, license), join(dest, 'LICENSE.txt'));
  else console.warn(`  ! No licence file found for ${font.family}; add it before distributing.`);

  return {
    family: font.family,
    license: 'OFL-1.1',
    source: `https://github.com/${font.repo} (${tag})`,
    files,
  };
}

async function main() {
  if (args.has('--check')) return check();
  if (existsSync(MANIFEST) && !args.has('--force')) {
    console.log(
      'Fonts are already installed (public/fonts/manifest.json). Use --force to reinstall, --check to verify.',
    );
    return;
  }
  mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), 'open-vitae-fonts-'));
  const fonts = [];
  try {
    for (const font of FONTS) {
      try {
        const installed = await installFont(font, work);
        if (installed) fonts.push(installed);
      } catch (error) {
        console.error(`  ✗ ${font.family}: ${error.message}`);
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  if (fonts.length === 0) {
    console.error('\nNo fonts were installed. The app still works with fallback fonts.');
    process.exit(1);
  }
  writeFileSync(MANIFEST, `${JSON.stringify({ fonts }, null, 2)}\n`);
  console.log(
    `\nWrote public/fonts/manifest.json (${fonts.map((f) => f.family).join(', ')}). Commit public/fonts.`,
  );
}

await main();
