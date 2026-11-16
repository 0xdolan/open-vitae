#!/usr/bin/env node
// Writes every Open Vitae logo SVG from one geometry definition.
// Usage: node scripts/brand/make-logo.mjs   (then scripts/brand/render-icons.mjs for PNGs)
//
// The mark joins two Kurdish signs, as the Roj and Zimanyar logos do:
// - the chin chevron (V) of deq, drawn on the Deq 24-unit grid (github.com/kanilabs/deq),
// - Roj, the 21-ray sun of the flag of Kurdistan, in the V's opening, where the sign has its dot.
// See docs/15-brand-and-story.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const COLOURS = {
  face: '#F8F8F8', // disc
  rim: '#1E1E1E', // disc outline, symbolic icon
  deq: '#1D4A2E', // the chevron (deep green of deq ink)
  sun: '#FEBD11', // Roj, the gold of the emblem
};

// Roj emblem, Wikimedia Commons "Roj emblem.svg" (public domain), in a 1000-unit box. Used unchanged.
const ROJ =
  'M500 0l36.76 258.27L647.78 22.34 607 280 782.46 87.37 667.73 321.53 892.01 189.3 713.57 379.16l253.17-60.05-226.32 128.67L1000 465.23 745.92 521.3l242.91 93.4-259.27-21.53L934.23 754.2 692.8 657l148.24 214.4-202.12-164.26 78.63 248.7-144.86-216.71 2.04 260.88L500 750.1 425.27 1000l2.04-260.88-144.86 216.7 78.63-248.69L158.96 871.4 307.2 657 65.77 754.21l204.67-161.05-259.27 21.53 242.91-93.4L0 465.23l259.58-17.45L33.26 319.1l253.17 60.05L108 189.3l224.28 132.22L217.55 87.37 393 280 352.2 22.34l111.05 235.93z';

/**
 * The mark on the Deq grid (24 units, origin top left). The sun takes the
 * place of the chevron's dot, as in the Zimanyar logo. The whole mark is
 * centred: the sun's top (4.6) and the stroke edge under the point (19.3)
 * sit evenly about 12.
 */
export const GEOMETRY = {
  apex: [12, 18.6], // point of the V
  armEnds: [
    [5.5, 12.1],
    [18.5, 12.1],
  ], // 45-degree arms, 6.5 across and 6.5 up
  stroke: 1.35,
  sun: { cx: 12, cy: 8.9, r: 4.3 }, // in the opening of the V
};

const round = (n) => +n.toFixed(2);

/** Draw the mark into a box: `unit` px per grid unit, grid (12, 12) at (cx, cy). */
function mark({ unit, cx = 512, cy = 512, stroke = GEOMETRY.stroke, mono = null }) {
  const P = (x, y) => [round(cx + (x - 12) * unit), round(cy + (y - 12) * unit)];
  const [ax, ay] = P(...GEOMETRY.apex);
  const [lx, ly] = P(...GEOMETRY.armEnds[0]);
  const [rx, ry] = P(...GEOMETRY.armEnds[1]);
  const deq = mono ?? COLOURS.deq;
  const s = (2 * GEOMETRY.sun.r * unit) / 1000;
  const [sx, sy] = P(GEOMETRY.sun.cx, GEOMETRY.sun.cy);
  return [
    `<path fill="none" stroke="${deq}" stroke-width="${round(stroke * unit)}" stroke-linecap="round" stroke-linejoin="round" d="M${lx},${ly} L${ax},${ay} L${rx},${ry}"/>`,
    `<path fill="${mono ?? COLOURS.sun}" transform="translate(${round(sx - 500 * s)} ${round(sy - 500 * s)}) scale(${s.toFixed(5)})" d="${ROJ}"/>`,
  ].join('\n  ');
}

const svg = (body, { size = 1024, title = 'Open Vitae', viewBox = `0 0 ${size} ${size}` } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">\n  <title>${title}</title>\n  ${body}\n</svg>\n`;

export const VARIANTS = {
  /** Master: white disc with a thin rim. App and store icons, README, website; 48 px and up. */
  'logo.svg': () =>
    svg(
      `<circle cx="512" cy="512" r="490" fill="${COLOURS.face}" stroke="${COLOURS.rim}" stroke-width="4"/>\n  ${mark({ unit: 48 })}`,
    ),
  /** 16 to 32 px and favicons: paper rounded square, heavier stroke, the mark fills the square. */
  'logo-favicon.svg': () =>
    svg(
      `<rect width="1024" height="1024" rx="200" fill="${COLOURS.face}"/>\n  ${mark({ unit: 56, stroke: 1.7 })}`,
    ),
  /** One colour (currentColor): pinned tabs, monochrome toolbars. */
  'logo-symbolic.svg': () => svg(mark({ unit: 56, stroke: 1.7, mono: 'currentColor' })),
  /** Android and PWA maskable icon: full-bleed paper, the mark inside the 80% safe zone. */
  'logo-maskable.svg': () =>
    svg(`<rect width="1024" height="1024" fill="${COLOURS.face}"/>\n  ${mark({ unit: 42 })}`),
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = join(root, 'assets', 'brand');
  mkdirSync(out, { recursive: true });
  for (const [name, make] of Object.entries(VARIANTS)) writeFileSync(join(out, name), make());
  writeFileSync(join(root, 'public', 'favicon.svg'), VARIANTS['logo-favicon.svg']());
  console.log(
    `Wrote ${Object.keys(VARIANTS).length} logo variants to assets/brand and public/favicon.svg`,
  );
}
