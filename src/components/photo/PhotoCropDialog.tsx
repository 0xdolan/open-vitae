import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { Button } from '@/components/ui/button';
import { RotateLeftIcon, RotateRightIcon } from '@/components/ui/icons';
import { PHOTO_RADIUS, type PhotoShape } from '@/config/layout';
import {
  clampCrop,
  cropZoom,
  initialCrop,
  maxZoom,
  nextRotation,
  panCrop,
  PHOTO_ASPECTS,
  outputSize,
  resolveRatio,
  zoomCrop,
  type PhotoAspect,
  type Rotation,
} from '@/lib/photo';
import { loadRotatedSource, renderCrop, type PhotoSource } from '@/lib/photo-canvas';
import { cn } from '@/lib/utils';
import type { PhotoCrop } from '@/schema/resume';
import { useT, type MessageKey } from '@/i18n';

import { PhotoSizeGuide } from './PhotoSizeGuide';

interface PhotoCropDialogProps {
  readonly open: boolean;
  readonly source: PhotoSource | null;
  /** The crop to start from when re-cropping. */
  readonly initial?: PhotoCrop;
  readonly shape: PhotoShape;
  readonly widthMm: number;
  readonly onCancel: () => void;
  readonly onApply: (result: { dataUrl: string; crop: PhotoCrop }) => void;
}

const ASPECT_LABELS: Readonly<Record<PhotoAspect['id'], MessageKey>> = {
  square: 'photo.aspectSquare',
  portrait: 'photo.aspectPortrait',
  passport: 'photo.aspectPassport',
  original: 'photo.aspectOriginal',
};

const VIEW_HEIGHT = 320;
const FRAME_PADDING = 28;

function aspectFor(crop: PhotoCrop | undefined, width: number, height: number): PhotoAspect {
  const fallback = PHOTO_ASPECTS[0] as PhotoAspect;
  if (!crop) return fallback;
  const ratio = crop.width / crop.height;
  return (
    PHOTO_ASPECTS.find((a) => Math.abs(resolveRatio(a, width, height) - ratio) < 0.01) ?? fallback
  );
}

/**
 * Crop the photo: drag to move, zoom with the slider, the mouse wheel or the
 * + and − keys, turn it a quarter at a time, and pick a shape. The frame shows
 * the shape it will have on the page. The size guide says how sharp it will print.
 */
export function PhotoCropDialog({
  open,
  source,
  initial,
  shape,
  widthMm,
  onCancel,
  onApply,
}: PhotoCropDialogProps) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const zoomId = useId();
  const helpId = useId();
  const [rotation, setRotation] = useState<Rotation>(initial?.rotation ?? 0);
  const [rotated, setRotated] = useState<HTMLCanvasElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspect, setAspect] = useState<PhotoAspect>(PHOTO_ASPECTS[0] as PhotoAspect);
  const [crop, setCrop] = useState<PhotoCrop | null>(null);
  const [viewWidth, setViewWidth] = useState(480);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const urlRef = useRef<string | null>(null);
  const usedInitial = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) {
      usedInitial.current = false;
      setRotation(initial?.rotation ?? 0);
      if (!initial) setAspect(PHOTO_ASPECTS[0] as PhotoAspect);
      setError(null);
    }
  }, [open, initial]);

  // Load the source turned to the current rotation, then set the crop.
  useEffect(() => {
    if (!open || !source) return;
    let cancelled = false;
    void loadRotatedSource(source, rotation)
      .then((canvas) => {
        if (cancelled) return;
        setRotated(canvas);
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return;
          // Swap in the new picture first, then free the old one once it is no longer shown.
          const previous = urlRef.current;
          urlRef.current = URL.createObjectURL(blob);
          setImageUrl(urlRef.current);
          if (previous) setTimeout(() => URL.revokeObjectURL(previous), 1000);
        });
        if (!usedInitial.current && initial && initial.rotation === rotation) {
          usedInitial.current = true;
          setAspect(aspectFor(initial, canvas.width, canvas.height));
          setCrop(clampCrop(initial, canvas.width, canvas.height));
        } else {
          usedInitial.current = true;
          setCrop((current) => {
            const ratio = current
              ? current.width / current.height
              : resolveRatio(aspect, canvas.width, canvas.height);
            return initialCrop(canvas.width, canvas.height, ratio, rotation);
          });
        }
      })
      .catch(() => setError(t('photo.unreadable')));
    return () => {
      cancelled = true;
    };
    // aspect is read once per rotation on purpose; changing it resets the crop below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source, rotation, initial]);

  // Free the picture when the dialog closes.
  useEffect(() => {
    if (open) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setImageUrl(null);
    setCrop(null);
  }, [open]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const update = () => setViewWidth(view.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(view);
    return () => observer.disconnect();
  }, [open]);

  const imageWidth = rotated?.width ?? 1;
  const imageHeight = rotated?.height ?? 1;
  const ratio = crop ? crop.width / crop.height : 1;
  const frameWidth = Math.max(
    40,
    Math.min(viewWidth - FRAME_PADDING * 2, (VIEW_HEIGHT - FRAME_PADDING * 2) * ratio),
  );
  const frameHeight = frameWidth / ratio;
  const scale = crop ? frameWidth / crop.width : 1;
  const frameLeft = (viewWidth - frameWidth) / 2;
  const frameTop = (VIEW_HEIGHT - frameHeight) / 2;

  const zoom = crop ? cropZoom(crop, imageWidth, imageHeight) : 1;
  const zoomLimit = crop ? maxZoom(crop, imageWidth, imageHeight) : 1;
  const setZoom = (value: number) =>
    crop && setCrop(zoomCrop(crop, value, imageWidth, imageHeight));

  // Wheel zoom needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setCrop((current) => {
        if (!current) return current;
        const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
        return zoomCrop(
          current,
          cropZoom(current, imageWidth, imageHeight) * factor,
          imageWidth,
          imageHeight,
        );
      });
    };
    view.addEventListener('wheel', onWheel, { passive: false });
    return () => view.removeEventListener('wheel', onWheel);
  }, [imageWidth, imageHeight, open]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !crop) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    drag.current = { x: event.clientX, y: event.clientY };
    setCrop(panCrop(crop, -dx / scale, -dy / scale, imageWidth, imageHeight));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!crop) return;
    const step = crop.width * (event.shiftKey ? 0.1 : 0.02);
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setCrop(panCrop(crop, move[0], move[1], imageWidth, imageHeight));
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      setZoom(zoom * 1.1);
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      setZoom(zoom / 1.1);
    }
  };

  const chooseAspect = (next: PhotoAspect) => {
    setAspect(next);
    setCrop(
      initialCrop(imageWidth, imageHeight, resolveRatio(next, imageWidth, imageHeight), rotation),
    );
  };

  const apply = () => {
    if (!rotated || !crop) return;
    try {
      onApply({ dataUrl: renderCrop(rotated, crop), crop: { ...crop, rotation } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('photo.saveFailed'));
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(36rem,calc(100vw-1.5rem))] rounded-xl p-0 shadow-xl backdrop:bg-black/50"
    >
      {open ? (
        <div className="flex flex-col gap-4 p-5">
          <h2 id={titleId} className="text-lg font-semibold">
            {t('photo.cropTitle')}
          </h2>

          <div
            ref={viewRef}
            role="group"
            tabIndex={0}
            aria-label={t('photo.positionLabel')}
            aria-describedby={helpId}
            className="relative cursor-grab touch-none overflow-hidden rounded-lg bg-stone-800 outline-offset-2 select-none active:cursor-grabbing"
            style={{ height: VIEW_HEIGHT }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
          >
            {imageUrl && crop ? (
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: imageWidth * scale,
                  height: imageHeight * scale,
                  left: frameLeft - crop.x * scale,
                  top: frameTop - crop.y * scale,
                }}
              />
            ) : null}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute ring-2 ring-white"
              style={{
                left: frameLeft,
                top: frameTop,
                width: frameWidth,
                height: frameHeight,
                borderRadius: PHOTO_RADIUS[shape],
                boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55)',
              }}
            />
          </div>
          <p id={helpId} className="-mt-2 text-xs text-stone-500">
            {t('photo.cropHelp')}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={zoomId} className="text-sm font-medium">
              {t('photo.zoom')}
            </label>
            <input
              id={zoomId}
              type="range"
              className="accent-brand min-w-40 flex-1"
              min={1}
              max={zoomLimit}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
            <Button
              size="sm"
              aria-label={t('photo.turnLeft')}
              title={t('photo.turnLeft')}
              onClick={() => setRotation(nextRotation(rotation, -1))}
            >
              <RotateLeftIcon />
            </Button>
            <Button
              size="sm"
              aria-label={t('photo.turnRight')}
              title={t('photo.turnRight')}
              onClick={() => setRotation(nextRotation(rotation, 1))}
            >
              <RotateRightIcon />
            </Button>
          </div>

          <fieldset className="flex flex-wrap gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">{t('photo.aspect')}</legend>
            {PHOTO_ASPECTS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === aspect.id}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs',
                  option.id === aspect.id
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-stone-300 hover:bg-stone-100',
                )}
                onClick={() => chooseAspect(option)}
              >
                {t(ASPECT_LABELS[option.id])}
              </button>
            ))}
          </fieldset>

          {crop ? <PhotoSizeGuide photoWidthPx={outputSize(crop).width} widthMm={widthMm} /> : null}
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button onClick={onCancel}>{t('photo.cancel')}</Button>
            <Button variant="primary" disabled={!crop || !rotated} onClick={apply}>
              {t('photo.use')}
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
