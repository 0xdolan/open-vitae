import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { useRef, useState, type ReactNode } from 'react';

import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BrushIcon,
  ClipboardIcon,
  CodeBlockIcon,
  CodeIcon,
  CopyIcon,
  EraserIcon,
  ImageIcon,
  IndentIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  OutdentIcon,
  QuoteIcon,
  RedoIcon,
  ScissorsIcon,
  SearchIcon,
  SmileIcon,
  SpellcheckIcon,
  TableIcon,
  UndoIcon,
} from '@/components/ui/icons';
import {
  BLOCK_STYLES,
  COLOR_SWATCHES,
  FONT_SIZES_PT,
  HIGHLIGHT_SWATCHES,
  LINE_HEIGHTS,
  TEXT_PRESETS,
  type BlockStyleId,
  type TextPresetId,
} from '@/config/editor';
import { KNOWN_FONTS } from '@/config/fonts';
import { searchEmoji, EMOJI_GROUPS } from '@/lib/emoji';
import { urlError } from '@/lib/field-validation';
import { CODE_LANGUAGES } from '@/lib/highlight';
import { imageFileToDataUrl, ImageError } from '@/lib/image';
import { plainToHtml } from '@/lib/plain-text';
import { cn } from '@/lib/utils';
import { toast, useFontStore } from '@/stores';

import type { ImageAlign } from './extensions';
import { Popover } from './Popover';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

interface ToolButtonProps {
  readonly label: string;
  readonly shortcut?: string;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}

/** A toolbar button. mousedown is cancelled so the editor keeps its selection. */
function ToolButton({ label, shortcut, active, disabled, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={cn('ov-tool', active && 'ov-tool-active')}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Group({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5 border-e border-stone-200 pe-1 last:border-e-0">
      {children}
    </div>
  );
}

const selectClass = 'h-8 rounded-md border border-stone-200 bg-white px-1.5 text-xs';

function currentBlock(editor: Editor): BlockStyleId {
  if (editor.isActive('codeBlock')) return 'codeBlock';
  if (editor.isActive('blockquote')) return 'blockquote';
  for (const level of [1, 2, 3, 4] as const) {
    if (editor.isActive('heading', { level })) return `heading-${level}`;
  }
  return 'paragraph';
}

function applyBlock(editor: Editor, id: BlockStyleId): void {
  const chain = editor.chain().focus();
  if (id === 'paragraph') chain.setParagraph().run();
  else if (id === 'blockquote') chain.toggleBlockquote().run();
  else if (id === 'codeBlock') chain.toggleCodeBlock().run();
  else chain.setHeading({ level: Number(id.slice(-1)) as 1 | 2 | 3 | 4 }).run();
}

/** Formatting captured by the format painter. */
interface PaintedFormat {
  readonly marks: readonly { readonly type: string; readonly attrs: Record<string, unknown> }[];
  readonly textAlign: string | null;
}

interface ToolbarProps {
  readonly editor: Editor;
  readonly accentColor: string;
  readonly spellcheck: boolean;
  readonly onToggleSpellcheck: () => void;
  readonly findOpen: boolean;
  readonly onToggleFind: () => void;
}

/**
 * The rich text toolbar. Groups wrap on narrow screens. Every control has a
 * label (and shortcut where one exists) for screen readers and tooltips.
 */
export function Toolbar({ editor, accentColor, spellcheck, onToggleSpellcheck, findOpen, onToggleFind }: ToolbarProps) {
  const [popover, setPopover] = useState<null | 'color' | 'highlight' | 'link' | 'table' | 'emoji' | 'image'>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [emojiQuery, setEmojiQuery] = useState('');
  const [painter, setPainter] = useState<PaintedFormat | null>(null);
  const [tableSize, setTableSize] = useState({ rows: 3, cols: 3 });
  const fileInput = useRef<HTMLInputElement>(null);
  const userFonts = useFontStore((s) => s.userFonts);
  const googleFamilies = useFontStore((s) => s.googleFamilies);
  const googleState = useFontStore((s) => s.googleState);
  // Bundled and system fonts, your own fonts, and Google fonts already loaded here.
  const fontChoices = [
    ...new Set([
      ...KNOWN_FONTS.map((f) => f.family),
      ...userFonts.map((f) => f.family),
      ...googleFamilies.filter((f) => googleState[f]?.state === 'ready'),
    ]),
  ];

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: currentBlock(e),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      sub: e.isActive('subscript'),
      sup: e.isActive('superscript'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      linkHref: (e.getAttributes('link').href as string | undefined) ?? '',
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      table: e.isActive('table'),
      tableBorderless: Boolean(e.getAttributes('table').borderless),
      image: e.isActive('image'),
      imageAlign: (e.getAttributes('image').align as ImageAlign | undefined) ?? 'center',
      imageWidth: (e.getAttributes('image').width as string | undefined) ?? '',
      codeBlock: e.isActive('codeBlock'),
      codeLanguage: (e.getAttributes('codeBlock').language as string | undefined) ?? 'plaintext',
      align: (['left', 'center', 'right', 'justify'] as const).find((a) => e.isActive({ textAlign: a })) ?? null,
      dir: (e.getAttributes('paragraph').dir as string | undefined) ?? (e.getAttributes('heading').dir as string | undefined) ?? null,
      fontFamily: (e.getAttributes('textStyle').fontFamily as string | undefined) ?? '',
      fontSize: (e.getAttributes('textStyle').fontSize as string | undefined) ?? '',
      lineHeight: (e.getAttributes('textStyle').lineHeight as string | undefined) ?? '',
      color: (e.getAttributes('textStyle').color as string | undefined) ?? '',
      background: (e.getAttributes('textStyle').backgroundColor as string | undefined) ?? '',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();
  const close = () => setPopover(null);

  const applyPreset = (id: TextPresetId) => {
    const preset = TEXT_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    let c = chain();
    if (id === 'accent') c = c.setColor(accentColor);
    if ('color' in preset && preset.color) c = c.setColor(preset.color);
    if ('background' in preset && preset.background) c = c.setBackgroundColor(preset.background);
    if ('fontSize' in preset && preset.fontSize) c = c.setFontSize(preset.fontSize);
    if ('bold' in preset && preset.bold) c = c.setBold();
    c.run();
  };

  const togglePainter = () => {
    if (painter) {
      setPainter(null);
      return;
    }
    const marks = editor.state.selection.$from.marks().map((m) => ({ type: m.type.name, attrs: { ...m.attrs } }));
    const textAlign = (editor.getAttributes('paragraph').textAlign as string | undefined) ?? null;
    const captured: PaintedFormat = { marks, textAlign };
    setPainter(captured);
    toast.info('Formatting copied', 'Select the text to apply it to.');
    // Apply once, on the next selection made with the mouse or keyboard.
    const dom = editor.view.dom;
    const apply = () => {
      if (editor.state.selection.empty) return;
      let c = chain().unsetAllMarks();
      for (const mark of captured.marks) c = c.setMark(mark.type, mark.attrs);
      if (captured.textAlign) c = c.setTextAlign(captured.textAlign);
      c.run();
      setPainter(null);
      dom.removeEventListener('mouseup', apply);
      dom.removeEventListener('keyup', onKey);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPainter(null);
        dom.removeEventListener('mouseup', apply);
        dom.removeEventListener('keyup', onKey);
      } else if (event.key === 'Shift') {
        apply();
      }
    };
    dom.addEventListener('mouseup', apply);
    dom.addEventListener('keyup', onKey);
  };

  const applyLink = () => {
    const href = linkUrl.trim();
    if (href === '') {
      chain().extendMarkRange('link').unsetLink().run();
    } else if (!urlError(href)) {
      if (editor.state.selection.empty && !state.link) {
        chain().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
      } else {
        chain().extendMarkRange('link').setLink({ href }).run();
      }
    } else {
      return;
    }
    close();
  };

  const insertImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      const src = await imageFileToDataUrl(file);
      chain().setImage({ src, alt: file.name.replace(/\.[^.]+$/, '') }).run();
    } catch (error) {
      toast.error('Image not added', error instanceof ImageError ? error.message : 'The image could not be read.');
    }
  };

  const clipboard = async (action: 'cut' | 'copy' | 'paste') => {
    editor.commands.focus();
    if (action !== 'paste') {
      // Still the only way to copy rich text from a selection in every browser.
      document.execCommand(action);
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      chain().insertContent(plainToHtml(text)).run();
    } catch {
      toast.info('Use the keyboard to paste', `The browser did not allow reading the clipboard. Press ${MOD}+V instead.`);
    }
  };

  const emojis = emojiQuery ? searchEmoji(emojiQuery) : null;

  return (
    <div role="group" aria-label="Formatting" className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50 p-1.5">
      <Group label="History">
        <ToolButton label="Undo" shortcut={`${MOD}+Z`} disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <UndoIcon />
        </ToolButton>
        <ToolButton label="Redo" shortcut={`${MOD}+Shift+Z`} disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <RedoIcon />
        </ToolButton>
      </Group>

      <Group label="Text style">
        <select aria-label="Paragraph style" className={selectClass} value={state.block} onChange={(e) => applyBlock(editor, e.target.value as BlockStyleId)}>
          {BLOCK_STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Font"
          className={cn(selectClass, 'max-w-32')}
          value={state.fontFamily}
          onChange={(e) => (e.target.value ? chain().setFontFamily(e.target.value).run() : chain().unsetFontFamily().run())}
        >
          <option value="">Default font</option>
          {fontChoices.map((family) => (
            <option key={family} value={family}>
              {family}
            </option>
          ))}
        </select>
        <select
          aria-label="Font size"
          className={selectClass}
          value={state.fontSize}
          onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}
        >
          <option value="">Size</option>
          {FONT_SIZES_PT.map((size) => (
            <option key={size} value={`${size}pt`}>
              {size} pt
            </option>
          ))}
        </select>
        <select
          aria-label="Line height"
          className={selectClass}
          value={state.lineHeight}
          onChange={(e) => (e.target.value ? chain().setLineHeight(e.target.value).run() : chain().unsetLineHeight().run())}
        >
          <option value="">Spacing</option>
          {LINE_HEIGHTS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </Group>

      <Group label="Character formatting">
        <ToolButton label="Bold" shortcut={`${MOD}+B`} active={state.bold} onClick={() => chain().toggleBold().run()}>
          <strong>B</strong>
        </ToolButton>
        <ToolButton label="Italic" shortcut={`${MOD}+I`} active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <em className="font-serif">I</em>
        </ToolButton>
        <ToolButton label="Underline" shortcut={`${MOD}+U`} active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolButton>
        <ToolButton label="Strikethrough" shortcut={`${MOD}+Shift+S`} active={state.strike} onClick={() => chain().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolButton>
        <ToolButton label="Subscript" shortcut={`${MOD}+,`} active={state.sub} onClick={() => chain().toggleSubscript().run()}>
          <span>
            x<sub>2</sub>
          </span>
        </ToolButton>
        <ToolButton label="Superscript" shortcut={`${MOD}+.`} active={state.sup} onClick={() => chain().toggleSuperscript().run()}>
          <span>
            x<sup>2</sup>
          </span>
        </ToolButton>
        <ToolButton label="Inline code" shortcut={`${MOD}+E`} active={state.code} onClick={() => chain().toggleCode().run()}>
          <CodeIcon />
        </ToolButton>
      </Group>

      <Group label="Colour">
        <Popover
          label="Text colour"
          open={popover === 'color'}
          onOpenChange={(o) => setPopover(o ? 'color' : null)}
          trigger={
            <span className="flex flex-col items-center leading-none">
              <span className="text-sm font-bold">A</span>
              <span className="h-1 w-4 rounded" style={{ background: state.color || '#1c1917' }} />
            </span>
          }
        >
          <ColorChoices
            swatches={[accentColor, ...COLOR_SWATCHES]}
            value={state.color}
            onPick={(c) => {
              chain().setColor(c).run();
              close();
            }}
            onClear={() => {
              chain().unsetColor().run();
              close();
            }}
          />
        </Popover>
        <Popover
          label="Highlight colour"
          open={popover === 'highlight'}
          onOpenChange={(o) => setPopover(o ? 'highlight' : null)}
          trigger={<span className="rounded px-1 text-sm font-bold" style={{ background: state.background || '#fef08a' }}>H</span>}
        >
          <ColorChoices
            swatches={HIGHLIGHT_SWATCHES}
            value={state.background}
            onPick={(c) => {
              chain().setBackgroundColor(c).run();
              close();
            }}
            onClear={() => {
              chain().unsetBackgroundColor().run();
              close();
            }}
          />
        </Popover>
        <select aria-label="Text presets" className={selectClass} value="" onChange={(e) => applyPreset(e.target.value as TextPresetId)}>
          <option value="">Presets</option>
          {TEXT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <ToolButton label="Copy formatting (format painter)" active={painter !== null} onClick={togglePainter}>
          <BrushIcon />
        </ToolButton>
        <ToolButton label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          <EraserIcon />
        </ToolButton>
      </Group>

      <Group label="Paragraph">
        <ToolButton label="Align left" active={state.align === 'left'} onClick={() => chain().setTextAlign('left').run()}>
          <AlignLeftIcon />
        </ToolButton>
        <ToolButton label="Centre" active={state.align === 'center'} onClick={() => chain().setTextAlign('center').run()}>
          <AlignCenterIcon />
        </ToolButton>
        <ToolButton label="Align right" active={state.align === 'right'} onClick={() => chain().setTextAlign('right').run()}>
          <AlignRightIcon />
        </ToolButton>
        <ToolButton label="Justify" active={state.align === 'justify'} onClick={() => chain().setTextAlign('justify').run()}>
          <AlignJustifyIcon />
        </ToolButton>
        <ToolButton label="Left-to-right paragraph" active={state.dir === 'ltr'} onClick={() => chain().setBlockDirection(state.dir === 'ltr' ? null : 'ltr').run()}>
          <span className="text-[10px] font-bold">LTR</span>
        </ToolButton>
        <ToolButton label="Right-to-left paragraph" active={state.dir === 'rtl'} onClick={() => chain().setBlockDirection(state.dir === 'rtl' ? null : 'rtl').run()}>
          <span className="text-[10px] font-bold">RTL</span>
        </ToolButton>
      </Group>

      <Group label="Lists and indent">
        <ToolButton label="Bulleted list" shortcut={`${MOD}+Shift+8`} active={state.bullet} onClick={() => chain().toggleBulletList().run()}>
          <ListIcon />
        </ToolButton>
        <ToolButton label="Numbered list" shortcut={`${MOD}+Shift+7`} active={state.ordered} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrderedIcon />
        </ToolButton>
        <ToolButton label="Decrease indent" shortcut="Shift+Tab" onClick={() => chain().outdent().run()}>
          <OutdentIcon className="rtl:-scale-x-100" />
        </ToolButton>
        <ToolButton label="Increase indent" shortcut="Tab" onClick={() => chain().indent().run()}>
          <IndentIcon className="rtl:-scale-x-100" />
        </ToolButton>
        <ToolButton label="Quote" active={state.block === 'blockquote'} onClick={() => chain().toggleBlockquote().run()}>
          <QuoteIcon />
        </ToolButton>
        <ToolButton label="Horizontal line" onClick={() => chain().setHorizontalRule().run()}>
          <MinusIcon />
        </ToolButton>
      </Group>

      <Group label="Insert">
        <Popover
          label={state.link ? 'Edit link' : 'Add link'}
          active={state.link}
          open={popover === 'link'}
          onOpenChange={(o) => {
            setLinkUrl(state.linkHref);
            setPopover(o ? 'link' : null);
          }}
          trigger={<LinkIcon />}
        >
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <label className="text-xs font-semibold" htmlFor="ov-link-url">
              Link address
            </label>
            <input
              id="ov-link-url"
              type="url"
              dir="ltr"
              autoFocus
              className="h-8 rounded-md border border-stone-300 px-2"
              placeholder="https://"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            {linkUrl && urlError(linkUrl.trim()) ? <p className="text-xs text-red-700">{urlError(linkUrl.trim())}</p> : null}
            <div className="flex justify-end gap-2">
              {state.link ? (
                <button type="button" className="rounded-md px-2 py-1 text-red-700 hover:bg-red-50" onClick={() => {
                  chain().extendMarkRange('link').unsetLink().run();
                  close();
                }}>
                  Remove link
                </button>
              ) : null}
              <button type="submit" className="bg-brand rounded-md px-3 py-1 font-medium text-white">
                Apply
              </button>
            </div>
          </form>
        </Popover>

        <Popover label="Table" active={state.table} open={popover === 'table'} onOpenChange={(o) => setPopover(o ? 'table' : null)} trigger={<TableIcon />}>
          {state.table ? (
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ['Row above', () => chain().addRowBefore().run()],
                  ['Row below', () => chain().addRowAfter().run()],
                  ['Column before', () => chain().addColumnBefore().run()],
                  ['Column after', () => chain().addColumnAfter().run()],
                  ['Delete row', () => chain().deleteRow().run()],
                  ['Delete column', () => chain().deleteColumn().run()],
                  ['Merge cells', () => chain().mergeCells().run()],
                  ['Split cell', () => chain().splitCell().run()],
                  ['Header row', () => chain().toggleHeaderRow().run()],
                  [state.tableBorderless ? 'Show borders' : 'Hide borders', () => chain().updateAttributes('table', { borderless: !state.tableBorderless }).run()],
                ] as const
              ).map(([label, action]) => (
                <button key={label} type="button" className="rounded px-2 py-1.5 text-start hover:bg-stone-100" onClick={action}>
                  {label}
                </button>
              ))}
              <button type="button" className="col-span-2 rounded px-2 py-1.5 text-start text-red-700 hover:bg-red-50" onClick={() => {
                chain().deleteTable().run();
                close();
              }}>
                Delete table
              </button>
            </div>
          ) : (
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                chain().insertTable({ rows: tableSize.rows, cols: tableSize.cols, withHeaderRow: true }).run();
                close();
              }}
            >
              <div className="flex gap-2">
                <label className="flex flex-1 flex-col text-xs font-semibold">
                  Rows
                  <input type="number" min={1} max={20} className="h-8 rounded-md border border-stone-300 px-2" value={tableSize.rows} onChange={(e) => setTableSize((s) => ({ ...s, rows: Math.max(1, Math.min(20, Number(e.target.value) || 1)) }))} />
                </label>
                <label className="flex flex-1 flex-col text-xs font-semibold">
                  Columns
                  <input type="number" min={1} max={10} className="h-8 rounded-md border border-stone-300 px-2" value={tableSize.cols} onChange={(e) => setTableSize((s) => ({ ...s, cols: Math.max(1, Math.min(10, Number(e.target.value) || 1)) }))} />
                </label>
              </div>
              <button type="submit" className="bg-brand rounded-md px-3 py-1.5 font-medium text-white">
                Insert table
              </button>
            </form>
          )}
        </Popover>

        <Popover label="Image" active={state.image} open={popover === 'image'} onOpenChange={(o) => setPopover(o ? 'image' : null)} trigger={<ImageIcon />}>
          <div className="flex flex-col gap-2">
            <button type="button" className="bg-brand rounded-md px-3 py-1.5 font-medium text-white" onClick={() => fileInput.current?.click()}>
              Choose an image…
            </button>
            <p className="text-xs text-stone-500">PNG, JPEG, WebP or GIF. Large images are shrunk; the file stays on this device.</p>
            {state.image ? (
              <>
                <p className="text-xs font-semibold">Selected image</p>
                <div className="flex gap-1">
                  {(['start', 'center', 'end'] as const).map((align) => (
                    <button key={align} type="button" className={cn('flex-1 rounded border px-2 py-1 text-xs', state.imageAlign === align ? 'border-brand bg-brand-soft' : 'border-stone-200')} onClick={() => chain().updateAttributes('image', { align }).run()}>
                      {align === 'start' ? 'Start' : align === 'center' ? 'Centre' : 'End'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {['25%', '50%', '75%', '100%'].map((width) => (
                    <button key={width} type="button" className={cn('flex-1 rounded border px-2 py-1 text-xs', state.imageWidth === width ? 'border-brand bg-brand-soft' : 'border-stone-200')} onClick={() => chain().updateAttributes('image', { width }).run()}>
                      {width}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </Popover>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void insertImage(e.target.files?.[0]);
            e.target.value = '';
            close();
          }}
        />

        <Popover label="Emoji" open={popover === 'emoji'} onOpenChange={(o) => setPopover(o ? 'emoji' : null)} trigger={<SmileIcon />} className="w-80">
          <input
            type="search"
            aria-label="Search emoji"
            placeholder="Search, e.g. award, cloud, phone"
            autoFocus
            className="mb-2 h-8 w-full rounded-md border border-stone-300 px-2"
            value={emojiQuery}
            onChange={(e) => setEmojiQuery(e.target.value)}
          />
          <div className="max-h-60 overflow-auto">
            {(emojis ? [{ id: 'results', label: `${emojis.length} found`, emojis }] : EMOJI_GROUPS).map((group) => (
              <div key={group.id} className="mb-2">
                <p className="mb-1 text-xs font-semibold text-stone-500">{group.label}</p>
                <div className="grid grid-cols-8 gap-0.5">
                  {group.emojis.map((emoji) => (
                    <button key={emoji.char} type="button" className="rounded p-1 text-lg hover:bg-stone-100" aria-label={emoji.name} title={emoji.name} onClick={() => chain().insertContent(emoji.char).run()}>
                      {emoji.char}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-500">More emoji: {isMac ? 'Ctrl+⌘+Space' : 'Win+.'}</p>
        </Popover>

        <ToolButton label="Code block" shortcut={`${MOD}+Alt+C`} active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
          <CodeBlockIcon />
        </ToolButton>
        {state.codeBlock ? (
          <select
            aria-label="Code language"
            className={selectClass}
            value={state.codeLanguage}
            onChange={(e) => chain().updateAttributes('codeBlock', { language: e.target.value }).run()}
          >
            {CODE_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        ) : null}
      </Group>

      <Group label="Clipboard">
        <ToolButton label="Cut" shortcut={`${MOD}+X`} onClick={() => void clipboard('cut')}>
          <ScissorsIcon />
        </ToolButton>
        <ToolButton label="Copy" shortcut={`${MOD}+C`} onClick={() => void clipboard('copy')}>
          <CopyIcon />
        </ToolButton>
        <ToolButton label="Paste as plain text" shortcut={`${MOD}+Shift+V`} onClick={() => void clipboard('paste')}>
          <ClipboardIcon />
        </ToolButton>
      </Group>

      <Group label="Tools">
        <ToolButton label="Find and replace" shortcut={`${MOD}+F`} active={findOpen} onClick={onToggleFind}>
          <SearchIcon />
        </ToolButton>
        <ToolButton label="Spell check" active={spellcheck} onClick={onToggleSpellcheck}>
          <SpellcheckIcon />
        </ToolButton>
      </Group>
    </div>
  );
}

function ColorChoices({
  swatches,
  value,
  onPick,
  onClear,
}: {
  readonly swatches: readonly string[];
  readonly value: string;
  readonly onPick: (color: string) => void;
  readonly onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1">
        {swatches.map((color, i) => (
          <button
            key={`${color}-${i}`}
            type="button"
            aria-label={`Colour ${color}`}
            title={color}
            className={cn('size-7 rounded border', value === color ? 'ring-brand ring-2' : 'border-stone-300')}
            style={{ background: color }}
            onClick={() => onPick(color)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold">
          Custom
          <input type="color" className="h-8 w-12 cursor-pointer rounded border border-stone-300" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onPick(e.target.value)} />
        </label>
        <button type="button" className="ms-auto rounded px-2 py-1 text-xs hover:bg-stone-100" onClick={onClear}>
          Remove colour
        </button>
      </div>
    </div>
  );
}
