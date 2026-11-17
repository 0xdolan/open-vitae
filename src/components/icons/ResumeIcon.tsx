import { isIconSetId } from '@/config/icon-sets';
import { useIconSet } from '@/hooks/useIconSet';
import { cn } from '@/lib/utils';
import type { IconRef } from '@/schema/resume';

interface ResumeIconProps {
  readonly icon: IconRef | undefined;
  readonly className?: string;
  /** Colour when the icon has none of its own (e.g. a contact icon's colour). */
  readonly color?: string;
}

/**
 * An icon chosen for resume content, drawn at the size of the text (1em).
 * Its colour is, in order: the icon's own, the `color` prop, the resume's icon
 * colour (the --ov-icon-color variable set by the renderer), the text colour.
 * Until its set has loaded, an empty box of the same size keeps the layout
 * (and the page breaks) from moving. Decorative: the text next to it carries
 * the meaning.
 */
export function ResumeIcon({ icon, className, color }: ResumeIconProps) {
  const setId = icon && isIconSetId(icon.set) ? icon.set : null;
  const set = useIconSet(setId);
  if (!icon || !setId) return null;
  const Icon = set?.get(icon.name);
  const classes = cn('ov-icon inline-block size-[1em] shrink-0 align-[-0.125em]', className);
  if (!Icon) return <span aria-hidden="true" className={classes} />;
  const style = { color: icon.color ?? color ?? 'var(--ov-icon-color, currentColor)' };
  return <Icon aria-hidden="true" focusable="false" size="1em" className={classes} style={style} />;
}
