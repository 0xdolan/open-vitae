import { Extension, type AnyExtension, type CommandProps } from '@tiptap/core';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Image } from '@tiptap/extension-image';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, TextSelection, type EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { StarterKit } from '@tiptap/starter-kit';
import { createLowlight } from 'lowlight';

import { findMatches, type FindOptions, type Match, type TextChunk } from '@/lib/find';
import { GRAMMARS } from '@/lib/highlight';
import { isSafeUrl } from '@/lib/url';

export type BlockDirection = 'ltr' | 'rtl';
export type ImageAlign = 'start' | 'center' | 'end';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockDirection: {
      /** Set or clear (null) the direction of the selected paragraphs. */
      setBlockDirection: (direction: BlockDirection | null) => ReturnType;
    };
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
    findReplace: {
      setFindQuery: (query: string, options?: FindOptions) => ReturnType;
      findNext: () => ReturnType;
      findPrevious: () => ReturnType;
      replaceCurrent: (replacement: string) => ReturnType;
      replaceAll: (replacement: string) => ReturnType;
      clearFind: () => ReturnType;
    };
  }
}

// ---------------------------------------------------------------- direction

const DIRECTION_TYPES = ['paragraph', 'heading', 'blockquote', 'listItem', 'tableCell', 'tableHeader'];

/** Per-paragraph direction, for an English line inside a Persian resume or the reverse. */
export const BlockDirectionExtension = Extension.create({
  name: 'blockDirection',
  addGlobalAttributes() {
    return [
      {
        types: DIRECTION_TYPES,
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => {
              const dir = element.getAttribute('dir');
              return dir === 'ltr' || dir === 'rtl' ? dir : null;
            },
            renderHTML: (attributes) => (attributes.dir ? { dir: attributes.dir as string } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setBlockDirection:
        (direction) =>
        ({ commands }) =>
          DIRECTION_TYPES.map((type) => commands.updateAttributes(type, { dir: direction })).some(Boolean),
    };
  },
});

// ---------------------------------------------------------------- indent

const INDENT_TYPES = ['paragraph', 'heading', 'blockquote'];
/** "Unlimited" still needs a ceiling for the stored value; 99 levels is far beyond any page. */
const UNLIMITED_LEVELS = 99;

function listDepth(state: EditorState): number {
  const { $from } = state.selection;
  let depth = 0;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'listItem') depth += 1;
  }
  return depth;
}

export interface IndentOptions {
  /** Deepest level allowed; null means unlimited. */
  maxDepth: number | null;
}

/**
 * Tab and Shift+Tab indent lists (nesting) and paragraphs. Paragraph levels are
 * stored as `--ov-level: n` and drawn as level × the resume's indent size, so
 * changing the indent size later updates every paragraph.
 *
 * Escape, then Tab, moves focus out of the editor (no keyboard trap).
 */
export const IndentExtension = Extension.create<IndentOptions, { tabExits: boolean }>({
  name: 'indent',
  addOptions() {
    return { maxDepth: null };
  },
  addStorage() {
    return { tabExits: false };
  },
  addGlobalAttributes() {
    return [
      {
        types: INDENT_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const match = /--ov-level:\s*(\d{1,2})/.exec(element.getAttribute('style') ?? '');
              return match ? Number(match[1]) : 0;
            },
            renderHTML: (attributes) => {
              const level = Number(attributes.indent);
              return level > 0 ? { style: `--ov-level: ${level}` } : {};
            },
          },
        },
      },
    ];
  },
  addCommands() {
    const limit = () => this.options.maxDepth ?? UNLIMITED_LEVELS;
    const change =
      (delta: 1 | -1) =>
      ({ editor, state, tr, dispatch, commands }: CommandProps): boolean => {
        if (editor.isActive('listItem')) {
          if (delta < 0) return commands.liftListItem('listItem');
          return listDepth(state) < limit() ? commands.sinkListItem('listItem') : false;
        }
        const { from, to } = state.selection;
        let changed = false;
        state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
          if (!INDENT_TYPES.includes(node.type.name)) return true;
          const current = Number(node.attrs.indent ?? 0);
          const next = Math.max(0, Math.min(limit(), current + delta));
          if (next !== current) {
            changed = true;
            if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
          }
          return false;
        });
        return changed;
      };
    return {
      indent: () => change(1),
      outdent: () => change(-1),
    };
  },
  addKeyboardShortcuts() {
    const handle = (outdent: boolean) => () => {
      const { editor } = this;
      if (this.storage.tabExits) {
        this.storage.tabExits = false;
        return false;
      }
      // Tables move between cells and code blocks keep their own Tab handling.
      if (editor.isActive('table') || editor.isActive('codeBlock')) return false;
      if (outdent) editor.commands.outdent();
      else editor.commands.indent();
      return true;
    };
    return {
      Tab: handle(false),
      'Shift-Tab': handle(true),
      Escape: () => {
        this.storage.tabExits = true;
        return false;
      },
    };
  },
  onSelectionUpdate() {
    this.storage.tabExits = false;
  },
});

// ---------------------------------------------------------------- find and replace

export interface FindState {
  readonly query: string;
  readonly options: FindOptions;
  readonly matches: readonly Match[];
  /** Index of the highlighted match, or -1. */
  readonly current: number;
}

export const findPluginKey = new PluginKey<FindState>('openVitaeFind');

function textChunks(doc: ProseMirrorNode): TextChunk[] {
  const chunks: TextChunk[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.text) chunks.push({ text: node.text, from: pos });
  });
  return chunks;
}

export function getFindState(state: EditorState): FindState | undefined {
  return findPluginKey.getState(state);
}

export const FindReplaceExtension = Extension.create({
  name: 'findReplace',
  addProseMirrorPlugins() {
    return [
      new Plugin<FindState>({
        key: findPluginKey,
        state: {
          init: () => ({ query: '', options: {}, matches: [], current: -1 }),
          apply(tr, previous, _oldState, newState) {
            const meta = tr.getMeta(findPluginKey) as Partial<FindState> | undefined;
            if (!meta && !tr.docChanged) return previous;
            const next = { ...previous, ...meta };
            const matches = findMatches(textChunks(newState.doc), next.query, next.options);
            const current = matches.length === 0 ? -1 : Math.max(0, Math.min(next.current, matches.length - 1));
            return { ...next, matches, current };
          },
        },
        props: {
          decorations(state) {
            const find = findPluginKey.getState(state);
            if (!find || find.matches.length === 0) return DecorationSet.empty;
            return DecorationSet.create(
              state.doc,
              find.matches.map((m, i) =>
                Decoration.inline(m.from, m.to, { class: i === find.current ? 'ov-find-current' : 'ov-find-match' }),
              ),
            );
          },
        },
      }),
    ];
  },
  addCommands() {
    const select = (step: 1 | -1) =>
      ({ state, tr, dispatch }: CommandProps): boolean => {
        const find = findPluginKey.getState(state);
        if (!find || find.matches.length === 0) return false;
        const current = (find.current + step + find.matches.length) % find.matches.length;
        const match = find.matches[current];
        if (!match) return false;
        if (dispatch) {
          tr.setMeta(findPluginKey, { current });
          tr.setSelection(TextSelection.create(tr.doc, match.from, match.to));
          tr.scrollIntoView();
        }
        return true;
      };
    return {
      setFindQuery:
        (query, options = {}) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(findPluginKey, { query, options, current: 0 });
          return true;
        },
      findNext: () => select(1),
      findPrevious: () => select(-1),
      replaceCurrent:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const find = findPluginKey.getState(state);
          const match = find?.matches[find.current];
          if (!match) return false;
          if (dispatch) tr.insertText(replacement, match.from, match.to);
          return true;
        },
      replaceAll:
        (replacement) =>
        ({ state, tr, dispatch }) => {
          const find = findPluginKey.getState(state);
          if (!find || find.matches.length === 0) return false;
          if (dispatch) {
            // Work backwards so earlier positions stay valid.
            for (const match of [...find.matches].reverse()) {
              tr.insertText(replacement, match.from, match.to);
            }
          }
          return true;
        },
      clearFind:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(findPluginKey, { query: '', current: -1 });
          return true;
        },
    };
  },
});

// ---------------------------------------------------------------- images and tables

/** Embedded images with a width (e.g. "50%") and alignment within the line. */
export const ResumeImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.style.width || null,
        renderHTML: (attributes) => (attributes.width ? { style: `width: ${attributes.width as string}` } : {}),
      },
      align: {
        default: 'center',
        parseHTML: (element) =>
          (['start', 'center', 'end'] as const).find((a) => element.classList.contains(`ov-img-${a}`)) ?? 'center',
        renderHTML: (attributes) => ({ class: `ov-img-${attributes.align as ImageAlign}` }),
      },
    };
  },
});

/** Tables with an optional borderless look. */
export const ResumeTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderless: {
        default: false,
        parseHTML: (element) => element.classList.contains('ov-table-borderless'),
        renderHTML: (attributes) => (attributes.borderless ? { class: 'ov-table-borderless' } : {}),
      },
    };
  },
});

// ---------------------------------------------------------------- the set

const lowlight = createLowlight();
lowlight.register(GRAMMARS);

export interface ExtensionOptions {
  readonly placeholder: string;
  readonly maxDepth: number | null;
}

/** Everything the Open Vitae rich text editor can do, and nothing it cannot sanitise. */
export function buildExtensions({ placeholder, maxDepth }: ExtensionOptions): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: false,
      undoRedo: { depth: 200 },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['mailto', 'tel'],
        isAllowedUri: (url) => isSafeUrl(url),
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      },
    }),
    TextStyleKit,
    TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
    Subscript,
    Superscript,
    ResumeTable.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    ResumeImage.configure({ allowBase64: true, inline: false }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'plaintext' }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
    BlockDirectionExtension,
    IndentExtension.configure({ maxDepth }),
    FindReplaceExtension,
  ];
}
