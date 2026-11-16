import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { useEffect, useId, useRef, useState } from 'react';

import { useT } from '@/i18n';

import { getFindState } from './extensions';

interface FindBarProps {
  readonly editor: Editor;
  readonly onClose: () => void;
}

/** Find and replace inside one editor. Enter finds the next match, Shift+Enter the previous. */
export function FindBar({ editor, onClose }: FindBarProps) {
  const t = useT();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const { total, current } = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const find = getFindState(e.state);
      return { total: find?.matches.length ?? 0, current: find?.current ?? -1 };
    },
  });

  useEffect(() => {
    input.current?.focus();
    return () => {
      editor.commands.clearFind();
    };
  }, [editor]);

  useEffect(() => {
    editor.commands.setFindQuery(query, { caseSensitive, wholeWord });
  }, [editor, query, caseSensitive, wholeWord]);

  const status =
    query === ''
      ? ''
      : total === 0
        ? t('find.none')
        : t('find.position', { current: current + 1, total });

  return (
    <div
      role="search"
      aria-label={t('find.label')}
      className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-amber-50/60 p-2 text-sm"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          editor.commands.focus();
        }
      }}
    >
      <label htmlFor={`${id}-find`} className="sr-only">
        {t('find.find')}
      </label>
      <input
        ref={input}
        id={`${id}-find`}
        type="search"
        dir="auto"
        placeholder={t('find.find')}
        className="h-8 w-40 rounded-md border border-stone-300 bg-card px-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) editor.commands.findPrevious();
            else editor.commands.findNext();
          }
        }}
      />
      <span role="status" aria-live="polite" className="min-w-20 text-xs text-stone-600">
        {status}
      </span>
      <button
        type="button"
        className="ov-tool"
        aria-label={t('find.previous')}
        title={t('find.previousTitle')}
        disabled={total === 0}
        onClick={() => editor.commands.findPrevious()}
      >
        ↑
      </button>
      <button
        type="button"
        className="ov-tool"
        aria-label={t('find.next')}
        title={t('find.nextTitle')}
        disabled={total === 0}
        onClick={() => editor.commands.findNext()}
      >
        ↓
      </button>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          className="accent-brand"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        {t('find.matchCase')}
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input
          type="checkbox"
          className="accent-brand"
          checked={wholeWord}
          onChange={(e) => setWholeWord(e.target.checked)}
        />
        {t('find.wholeWords')}
      </label>
      <label htmlFor={`${id}-replace`} className="sr-only">
        {t('find.replaceWith')}
      </label>
      <input
        id={`${id}-replace`}
        dir="auto"
        placeholder={t('find.replaceWith')}
        className="h-8 w-40 rounded-md border border-stone-300 bg-card px-2"
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
      />
      <button
        type="button"
        className="rounded-md border border-stone-300 bg-card px-2 py-1 text-xs"
        disabled={total === 0}
        onClick={() => editor.commands.replaceCurrent(replacement)}
      >
        {t('find.replace')}
      </button>
      <button
        type="button"
        className="rounded-md border border-stone-300 bg-card px-2 py-1 text-xs"
        disabled={total === 0}
        onClick={() => editor.commands.replaceAll(replacement)}
      >
        {t('find.replaceAll')}
      </button>
      <button
        type="button"
        className="ov-tool ms-auto"
        aria-label={t('find.close')}
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
