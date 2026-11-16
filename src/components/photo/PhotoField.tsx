import { useEffect, useId, useRef, useState, type DragEvent } from 'react';

import { Button } from '@/components/ui/button';
import { CropIcon, TrashIcon, UploadIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import {
  LIMITS,
  PHOTO_RADIUS,
  PHOTO_SHAPES,
  type HorizontalAlign,
  type PhotoShape,
} from '@/config/layout';
import { removePhoto, setPhoto, updatePhoto } from '@/lib/document-ops';
import { ImageError } from '@/lib/image';
import { readPhotoFile, type PhotoSource } from '@/lib/photo-canvas';
import { cn } from '@/lib/utils';
import type { PhotoCrop, ResumeDocument } from '@/schema/resume';
import { useT, type MessageKey } from '@/i18n';
import { toast, useResumeStore } from '@/stores';

import { PhotoCropDialog } from './PhotoCropDialog';
import { PhotoSizeGuide } from './PhotoSizeGuide';

const SHAPE_LABELS: Readonly<Record<PhotoShape, MessageKey>> = {
  square: 'photo.square',
  rounded: 'photo.rounded',
  circle: 'photo.circle',
};

/** Start and end follow the resume's direction, not the interface's. */
function alignLabels(rtl: boolean): Readonly<Record<HorizontalAlign, MessageKey>> {
  return {
    start: rtl ? 'photo.rightOfName' : 'photo.leftOfName',
    center: 'photo.aboveName',
    end: rtl ? 'photo.leftOfName' : 'photo.rightOfName',
  };
}

/** Pixel size of an image data URL; zero if it cannot be decoded. */
function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/**
 * Profile photo: add (button or drag and drop), crop again, replace or remove,
 * and set its shape, width and position. The picture stays in this browser.
 */
export function PhotoField({ doc }: { readonly doc: ResumeDocument }) {
  const t = useT();
  const updateActive = useResumeStore((s) => s.updateActive);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [pending, setPending] = useState<{ source: PhotoSource; initial?: PhotoCrop } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [widthPx, setWidthPx] = useState<number | null>(null);
  const photo = doc.photo;
  const rtl = doc.layout.direction === 'rtl';

  const photoUrl = photo?.dataUrl;
  useEffect(() => {
    setWidthPx(null);
    if (!photoUrl) return;
    let cancelled = false;
    void imageSize(photoUrl).then(({ width }) => {
      if (!cancelled) setWidthPx(width);
    });
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setPending({ source: await readPhotoFile(file) });
    } catch (error) {
      toast.error(
        t('photo.notAdded'),
        error instanceof ImageError ? error.message : t('photo.unreadable'),
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const recrop = async () => {
    if (!photo) return;
    if (photo.source) {
      setPending({ source: photo.source, initial: photo.source.crop });
      return;
    }
    // Photos from older or imported resumes have no source: crop the photo itself.
    const { width, height } = await imageSize(photo.dataUrl);
    if (width > 0) setPending({ source: { dataUrl: photo.dataUrl, width, height } });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    void choose(event.dataTransfer.files[0]);
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => void choose(e.target.files?.[0])}
    />
  );

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-xs font-semibold text-stone-700">{t('photo.legend')}</legend>
      {fileInput}

      {!photo ? (
        <div
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-5 text-center text-sm',
            dragOver ? 'border-brand bg-brand/5' : 'border-stone-300',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <Button disabled={busy} onClick={() => inputRef.current?.click()}>
            <UploadIcon /> {busy ? t('photo.reading') : t('photo.add')}
          </Button>
          <p className="text-xs text-stone-500">{t('photo.dropHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-card p-3">
          <div className="flex flex-wrap items-center gap-3">
            <img
              src={photo.dataUrl}
              alt={t('photo.alt')}
              className="size-20 border border-stone-200 object-cover"
              style={{ borderRadius: PHOTO_RADIUS[photo.shape] }}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void recrop()}>
                <CropIcon /> {t('photo.crop')}
              </Button>
              <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
                <UploadIcon /> {t('photo.replace')}
              </Button>
              <Button
                size="sm"
                variant="danger-ghost"
                onClick={() => updateActive((d) => removePhoto(d))}
              >
                <TrashIcon /> {t('photo.remove')}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-stone-700" id={`${id}-shape`}>
                {t('photo.shape')}
              </span>
              <div role="radiogroup" aria-labelledby={`${id}-shape`} className="flex gap-1">
                {PHOTO_SHAPES.map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    role="radio"
                    aria-checked={photo.shape === shape}
                    className={cn(
                      'flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors',
                      photo.shape === shape
                        ? 'border-brand bg-selected text-selected-foreground font-medium'
                        : 'hover:bg-hover border-stone-300',
                    )}
                    onClick={() => updateActive((d) => updatePhoto(d, { shape }))}
                  >
                    {t(SHAPE_LABELS[shape])}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-width`} className="text-xs font-medium text-stone-700">
                {t('photo.width', { mm: photo.widthMm })}
              </label>
              <input
                id={`${id}-width`}
                type="range"
                className="accent-brand"
                min={LIMITS.photoWidthMm.min}
                max={LIMITS.photoWidthMm.max}
                step={1}
                value={photo.widthMm}
                onChange={(e) =>
                  updateActive((d) => updatePhoto(d, { widthMm: Number(e.target.value) }), {
                    group: 'photo.width',
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-align`} className="text-xs font-medium text-stone-700">
                {t('photo.position')}
              </label>
              <Select
                id={`${id}-align`}
                value={photo.align}
                onValueChange={(value) =>
                  updateActive((d) => updatePhoto(d, { align: value as HorizontalAlign }))
                }
                items={Object.entries(alignLabels(rtl)).map(([value, label]) => ({
                  value,
                  label: t(label),
                }))}
              />
            </div>
          </div>

          {widthPx ? <PhotoSizeGuide photoWidthPx={widthPx} widthMm={photo.widthMm} /> : null}
        </div>
      )}

      <PhotoCropDialog
        open={pending !== null}
        source={pending?.source ?? null}
        initial={pending?.initial}
        shape={photo?.shape ?? 'rounded'}
        widthMm={photo?.widthMm ?? 30}
        onCancel={() => setPending(null)}
        onApply={({ dataUrl, crop }) => {
          const source = pending?.source;
          updateActive((d) =>
            setPhoto(d, source ? { dataUrl, source: { ...source, crop } } : { dataUrl }),
          );
          setPending(null);
          toast.success(t('photo.updated'), t('photo.updatedBody'));
        }}
      />
    </fieldset>
  );
}
