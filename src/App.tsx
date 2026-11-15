import { useId, useState } from 'react';

import { PagePreview } from '@/components/PagePreview';
import type { TextDirection } from '@/config/fonts';
import {
  DEFAULT_DPI,
  DEFAULT_PAGE_SIZE,
  getPageDimensionsMm,
  mmToPx,
  PAGE_SIZES,
  type Orientation,
  type PageSizeId,
} from '@/config/page-sizes';

function isPageSizeId(value: string): value is PageSizeId {
  return PAGE_SIZES.some((size) => size.id === value);
}

/**
 * Phase 1 shell: proves the toolchain, page sizes and direction switching.
 * The real editor replaces this from phase 3 onwards.
 */
export function App() {
  const [pageSize, setPageSize] = useState<PageSizeId>(DEFAULT_PAGE_SIZE);
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [direction, setDirection] = useState<TextDirection>('ltr');

  const sizeId = useId();
  const orientationId = useId();
  const directionId = useId();

  const { widthMm, heightMm } = getPageDimensionsMm(pageSize, orientation);
  const fieldClass = 'rounded-md border border-stone-300 bg-white px-3 py-2 text-sm';

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <header>
        <h1 className="text-brand text-3xl font-bold tracking-tight">Open Vitae</h1>
        <p className="mt-1 text-stone-600">
          A resume builder that runs entirely in your browser. Nothing you type leaves this device.
        </p>
      </header>

      <form
        className="flex flex-wrap items-end gap-4"
        onSubmit={(event) => event.preventDefault()}
        aria-label="Page settings"
      >
        <label htmlFor={sizeId} className="flex flex-col gap-1 text-sm font-medium">
          Page size
          <select
            id={sizeId}
            className={fieldClass}
            value={pageSize}
            onChange={(event) => {
              if (isPageSizeId(event.target.value)) setPageSize(event.target.value);
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size.id} value={size.id}>
                {size.label}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor={orientationId} className="flex flex-col gap-1 text-sm font-medium">
          Orientation
          <select
            id={orientationId}
            className={fieldClass}
            value={orientation}
            onChange={(event) =>
              setOrientation(event.target.value === 'landscape' ? 'landscape' : 'portrait')
            }
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>

        <label htmlFor={directionId} className="flex flex-col gap-1 text-sm font-medium">
          Direction
          <select
            id={directionId}
            className={fieldClass}
            value={direction}
            onChange={(event) => setDirection(event.target.value === 'rtl' ? 'rtl' : 'ltr')}
          >
            <option value="ltr">Left to right</option>
            <option value="rtl">Right to left</option>
          </select>
        </label>

        <p className="text-sm text-stone-600" aria-live="polite">
          {widthMm} × {heightMm} mm · {mmToPx(widthMm)} × {mmToPx(heightMm)} px at {DEFAULT_DPI}{' '}
          DPI
        </p>
      </form>

      <main className="rounded-xl bg-stone-200/60 p-4 sm:p-8">
        <PagePreview pageSize={pageSize} orientation={orientation} direction={direction}>
          <h2 className="text-brand text-xl font-bold">
            {direction === 'rtl' ? 'نام و نام خانوادگی' : 'Your Name'}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {direction === 'rtl'
              ? 'مهندس نرم‌افزار · React و TypeScript'
              : 'Software Engineer · React and TypeScript'}
          </p>
          <hr className="my-4 border-stone-200" />
          <p className="text-sm leading-relaxed">
            {direction === 'rtl'
              ? 'این پیش‌نمایش نشان می‌دهد که متن راست‌به‌چپ و واژه‌های لاتین مانند GitHub در یک خط درست چیده می‌شوند.'
              : 'This preview shows mixed-direction text: Latin words and Persian ones such as رزومه share a line and stay in the right order.'}
          </p>
        </PagePreview>
      </main>

      <footer className="text-sm text-stone-500">
        Free software under GPL-3.0. Phase 1 scaffold.
      </footer>
    </div>
  );
}
