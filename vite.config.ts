/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Content Security Policy for production builds.
 *
 * - No third-party scripts, no remote connections except Google Fonts.
 * - `blob:` and `data:` are needed for fonts and images the user loads locally.
 * - `'unsafe-inline'` in style-src is required because resume colours and
 *   sizes are applied as inline style attributes.
 *
 * Keep this in sync with docker/nginx.conf.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: blob: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

/** Injects the CSP as a <meta> tag at build time (GitHub Pages cannot set headers). */
function cspMeta(): Plugin {
  return {
    name: 'open-vitae:csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// GitHub Pages serves the app from /<repo>/; Docker and local dev serve from /.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    cspMeta(),
    VitePWA({
      // Ask before switching to a new version (src/pwa/register.ts saves first).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon.ico', 'icons/apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Open Vitae',
        short_name: 'Open Vitae',
        description: 'Privacy-first resume builder that runs entirely in your browser.',
        lang: 'en',
        categories: ['productivity', 'business'],
        theme_color: '#1d4a2e',
        background_color: '#f8f8f8',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'My resumes',
            url: `${base}#/`,
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png', 'fonts/manifest.json'],
        // Icon sets are large and loaded on demand: cache each one the first
        // time it is used instead of downloading all of them up front.
        // Lucide is not named icons-*, so it is precached for offline use.
        globIgnores: ['**/icons-*.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/assets/icons-'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'open-vitae-icon-sets',
              expiration: { maxEntries: 40 },
            },
          },
        ],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Icon sets are big by nature; they are split per set and loaded on demand.
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        chunkFileNames(chunk) {
          const set = /react-icons[\\/](\w+)[\\/]/.exec(chunk.facadeModuleId ?? '')?.[1];
          if (set === 'lu') return 'assets/lucide-[hash].js';
          return set ? `assets/icons-${set}-[hash].js` : 'assets/[name]-[hash].js';
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/jsdom-blob.ts'],
  },
});
