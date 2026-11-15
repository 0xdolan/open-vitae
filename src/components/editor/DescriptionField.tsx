import { useEffect, useId, useState } from 'react';

import { SafeHtml } from '@/components/SafeHtml';
import { Button } from '@/components/ui/button';
import { htmlToPlain, isPlainCompatible, plainToHtml } from '@/lib/plain-text';

interface DescriptionFieldProps {
  readonly label: string;
  readonly html: string;
  readonly onChange: (html: string) => void;
  readonly placeholder?: string;
}

/**
 * Basic description editor: paragraphs, plus lines starting with "- " for
 * bullets. Phase 4 replaces it with the full rich text editor. Content with
 * richer formatting is shown read-only, so nothing is lost by accident.
 */
export function DescriptionField({ label, html, onChange, placeholder }: DescriptionFieldProps) {
  const id = useId();
  const compatible = isPlainCompatible(html);
  const [text, setText] = useState(() => htmlToPlain(html));
  const [forcePlain, setForcePlain] = useState(false);

  // Follow outside changes (undo, restore, another tab) unless they match what we already show.
  useEffect(() => {
    if (plainToHtml(text) !== html) setText(htmlToPlain(html));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to outside changes of html
  }, [html]);

  if (!compatible && !forcePlain) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-stone-700">{label}</p>
        <div className="rounded-md border border-stone-300 bg-stone-50 p-2.5 text-sm">
          <SafeHtml html={html} />
        </div>
        <p className="text-xs text-stone-500">
          This text has formatting the basic editor cannot keep. The full editor arrives in the next
          update.{' '}
          <Button variant="ghost" size="sm" onClick={() => setForcePlain(true)}>
            Edit as plain text (removes formatting)
          </Button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-stone-700">
        {label}
      </label>
      <textarea
        id={id}
        dir="auto"
        rows={Math.min(12, Math.max(3, text.split('\n').length + 1))}
        className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm leading-relaxed text-ink focus-visible:border-brand"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onChange(plainToHtml(e.target.value));
        }}
      />
      <p className="text-xs text-stone-500">Start a line with “- ” for a bullet point. Leave an empty line between paragraphs.</p>
    </div>
  );
}
