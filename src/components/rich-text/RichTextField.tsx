import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { LIMITS } from '@/config/layout';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

import { buildExtensions } from './extensions';
import { FindBar } from './FindBar';
import { Toolbar } from './Toolbar';

interface RichTextFieldProps {
  readonly label: string;
  readonly html: string;
  readonly onChange: (html: string) => void;
  readonly placeholder?: string;
  /** Resume settings the editor follows. */
  readonly language: string;
  readonly accentColor: string;
  readonly indentCh: number;
  readonly maxDepth: number | null;
  /** Soft character limit: the counter shows it and flags text over it. Null or absent: none. */
  readonly charLimit?: number | null;
}

const SPELLCHECK_KEY = 'open-vitae:spellcheck';

function readSpellcheck(): boolean {
  try {
    return localStorage.getItem(SPELLCHECK_KEY) !== 'off';
  } catch {
    return true;
  }
}

/**
 * Full rich text editor for descriptions and the summary. Output is HTML that
 * the sanitiser accepts as-is; anything pasted is reduced to what the editor
 * supports, then sanitised again whenever it is shown.
 */
export function RichTextField({
  label,
  html,
  onChange,
  placeholder,
  language,
  charLimit = null,
  accentColor,
  indentCh,
  maxDepth,
}: RichTextFieldProps) {
  const t = useT();
  const labelId = useId();
  const placeholderText = placeholder ?? t('rt.placeholder');
  const [spellcheck, setSpellcheck] = useState(readSpellcheck);
  const [findOpen, setFindOpen] = useState(false);
  /** The last HTML this editor sent out, to tell our own echoes from outside changes. */
  const lastEmitted = useRef(html);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const extensions = useMemo(
    () => buildExtensions({ placeholder: placeholderText, maxDepth }),
    [placeholderText, maxDepth],
  );

  const editor = useEditor(
    {
      extensions,
      content: html,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: {
          class: 'ov-rich ov-editor-content',
          'aria-labelledby': labelId,
          'aria-multiline': 'true',
          role: 'textbox',
        },
        handleKeyDown: (_view, event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
            event.preventDefault();
            setFindOpen(true);
            return true;
          }
          return false;
        },
      },
      onUpdate: ({ editor: e }) => {
        const out = e.isEmpty ? '' : e.getHTML();
        lastEmitted.current = out;
        onChangeRef.current(out);
      },
    },
    [extensions],
  );

  // Follow outside changes (resume-level undo, restoring a version, another tab).
  useEffect(() => {
    if (!editor || html === lastEmitted.current) return;
    lastEmitted.current = html;
    editor.commands.setContent(html, { emitUpdate: false });
  }, [editor, html]);

  // Spell check, language and direction live on the editable element itself.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    dom.setAttribute('spellcheck', String(spellcheck));
    dom.setAttribute('lang', language);
    dom.setAttribute('dir', 'auto');
    try {
      localStorage.setItem(SPELLCHECK_KEY, spellcheck ? 'on' : 'off');
    } catch {
      // Preference only.
    }
  }, [editor, spellcheck, language]);

  const counts = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            words: e.storage.characterCount.words() as number,
            characters: e.storage.characterCount.characters() as number,
          }
        : { words: 0, characters: 0 },
  });

  const size = html.length;
  const nearLimit = size > LIMITS.htmlLength * 0.8;
  const characters = counts?.characters ?? 0;
  const over = charLimit !== null && characters > charLimit ? characters - charLimit : 0;

  return (
    <div className="flex flex-col gap-1">
      <p id={labelId} className="text-xs font-semibold text-stone-700">
        {label}
      </p>
      <div
        className="ov-editor overflow-visible rounded-lg border border-stone-300 bg-card focus-within:border-brand"
        style={{ ['--ov-indent' as string]: `${indentCh}ch` }}
      >
        {editor ? (
          <>
            <Toolbar
              editor={editor}
              accentColor={accentColor}
              spellcheck={spellcheck}
              onToggleSpellcheck={() => setSpellcheck((v) => !v)}
              findOpen={findOpen}
              onToggleFind={() => setFindOpen((v) => !v)}
            />
            {findOpen ? <FindBar editor={editor} onClose={() => setFindOpen(false)} /> : null}
          </>
        ) : null}
        <EditorContent editor={editor} />
      </div>
      <p
        className={cn(
          'flex flex-wrap justify-between gap-2 text-xs',
          nearLimit || over > 0 ? 'font-medium' : 'text-stone-500',
          nearLimit && 'text-amber-800',
          over > 0 && !nearLimit && 'text-red-700',
        )}
      >
        <span>
          {t('rt.words', { count: counts?.words ?? 0 })} ·{' '}
          {charLimit === null
            ? t('rt.characters', { count: characters })
            : t('rt.charactersOf', { count: characters, limit: charLimit })}
        </span>
        <span aria-live="polite">
          {over > 0 && !nearLimit
            ? t('rt.overLimit', { count: over })
            : nearLimit
              ? t('rt.tooLarge', { size: formatBytes(size), limit: formatBytes(LIMITS.htmlLength) })
              : t('rt.keys')}
        </span>
      </p>
    </div>
  );
}
