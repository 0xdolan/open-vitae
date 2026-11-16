import { useMemo, type CSSProperties, type ReactNode } from 'react';

import { ResumeIcon } from '@/components/icons/ResumeIcon';
import { SafeHtml } from '@/components/SafeHtml';
import { CONTACT_ICONS } from '@/config/icon-sets';
import { fontStack } from '@/config/fonts';
import { DEFAULT_ICON_COLOR, PHOTO_RADIUS } from '@/config/layout';
import { applyDigits } from '@/lib/digits';
import { isValidEmail } from '@/lib/field-validation';
import { isSafeUrl, telUrl } from '@/lib/url';
import { cn } from '@/lib/utils';
import type {
  IconRef,
  ResumeDocument,
  ResumeItem,
  ResumeSection,
  TextStyle,
} from '@/schema/resume';

/** Values are already constrained by the schema (hex colours, safe font names). */
function toCss(style: TextStyle | undefined): CSSProperties | undefined {
  if (!style) return undefined;
  return {
    color: style.color,
    fontFamily: style.fontFamily ? fontStack(style.fontFamily) : undefined,
    fontSize: style.fontSizePt ? `${style.fontSizePt}pt` : undefined,
  };
}

function SafeLink({ href, children }: { readonly href: string; readonly children: ReactNode }) {
  if (!isSafeUrl(href)) return <>{children}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

/** Strip the scheme so a link reads cleanly on paper. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function ContactLine({
  doc,
  centred = false,
}: {
  readonly doc: ResumeDocument;
  readonly centred?: boolean;
}) {
  const { email, phone, location, website, links } = doc.profile;
  const withIcons = doc.layout.showContactIcons === true;
  const parts: ReactNode[] = [];
  const colors = doc.layout.contactIconColors;
  const icon = (ref: IconRef | undefined, color?: string) =>
    withIcons && ref ? <ResumeIcon icon={ref} color={color} className="me-[0.35em]" /> : null;

  // <bdi> keeps emails, numbers and URLs in their own direction inside RTL text.
  if (email) {
    const content = (
      <>
        {icon(CONTACT_ICONS.email, colors?.email)}
        <bdi>{email}</bdi>
      </>
    );
    parts.push(
      isValidEmail(email) ? (
        <SafeLink key="email" href={`mailto:${email}`}>
          {content}
        </SafeLink>
      ) : (
        <span key="email">{content}</span>
      ),
    );
  }
  if (phone) {
    parts.push(
      <SafeLink key="phone" href={telUrl(phone)}>
        {icon(CONTACT_ICONS.phone, colors?.phone)}
        <bdi dir="ltr">{phone}</bdi>
      </SafeLink>,
    );
  }
  if (location) {
    parts.push(
      <span key="location">
        {icon(CONTACT_ICONS.location, colors?.location)}
        <bdi>{location}</bdi>
      </span>,
    );
  }
  if (website) {
    parts.push(
      <SafeLink key="website" href={website}>
        {icon(CONTACT_ICONS.website, colors?.website)}
        <bdi>{displayUrl(website)}</bdi>
      </SafeLink>,
    );
  }
  for (const link of links.filter((l) => l.url !== '')) {
    // A link's own icon always shows; the generic link icon only with contact icons on.
    const linkIcon = link.icon ? (
      <ResumeIcon icon={link.icon} className="me-[0.35em]" />
    ) : (
      icon(CONTACT_ICONS.link)
    );
    parts.push(
      <SafeLink key={link.id} href={link.url}>
        {linkIcon}
        <bdi>{link.label || displayUrl(link.url)}</bdi>
      </SafeLink>,
    );
  }

  if (parts.length === 0) return null;
  return (
    <p
      className={cn(
        'mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.9em] text-stone-600',
        centred && 'justify-center',
      )}
    >
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-3">
          {i > 0 ? (
            <span aria-hidden="true" className="text-stone-300">
              •
            </span>
          ) : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/**
 * Which blocks to draw. `null` means the whole resume (on-screen flow and
 * measuring); a page passes its own block keys.
 */
interface PageFilter {
  readonly keys: ReadonlySet<string>;
  /** The first block on the page: its top margin is dropped. */
  readonly first: string;
}

const hasPrefix = (filter: PageFilter, prefix: string) => {
  for (const key of filter.keys) if (key.startsWith(prefix)) return true;
  return false;
};

interface ItemProps {
  readonly item: ResumeItem;
  readonly section: ResumeSection;
  readonly filter: PageFilter | null;
}

function Item({ item, section, filter }: ItemProps) {
  const meta = [item.subtitle, item.location].filter(Boolean).join(' · ');
  const titleNode = item.url ? <SafeLink href={item.url}>{item.title}</SafeLink> : item.title;
  const headKey = `head:${item.id}`;
  const hasHead = Boolean(item.title || item.dateRange || meta);
  const showHead = hasHead && (!filter || filter.keys.has(headKey));

  return (
    <div>
      {showHead ? (
        <div data-ov-b={headKey}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            {item.title ? (
              <h3 className="font-semibold" style={toCss(item.titleStyle)}>
                <ResumeIcon icon={item.icon} className="me-[0.4em]" />
                <bdi>{titleNode}</bdi>
              </h3>
            ) : null}
            {item.dateRange ? (
              <span className="shrink-0 text-[0.9em] text-stone-600">
                <bdi>{item.dateRange}</bdi>
              </span>
            ) : null}
          </div>
          {meta ? (
            <p className="text-[0.9em] text-stone-600">
              <bdi>{meta}</bdi>
            </p>
          ) : null}
        </div>
      ) : null}
      <SafeHtml
        html={item.descriptionHtml}
        className={showHead ? 'mt-1' : undefined}
        style={toCss(item.descriptionStyle ?? section.descriptionStyle)}
        blockPrefix={`body:${item.id}`}
        include={filter?.keys}
      />
    </div>
  );
}

interface SectionProps {
  readonly section: ResumeSection;
  readonly titleColor: string;
  /** Colour of the line under the title; null draws no line. */
  readonly ruleColor: string | null;
  readonly selected: boolean;
  readonly onClick?: (id: string) => void;
  readonly filter: PageFilter | null;
}

function Section({ section, titleColor, ruleColor, selected, onClick, filter }: SectionProps) {
  const titleKey = `title:${section.id}`;
  const items = section.items.filter(
    (item) =>
      item.visible &&
      (!filter || filter.keys.has(`head:${item.id}`) || hasPrefix(filter, `body:${item.id}:`)),
  );
  const showTitle = Boolean(section.title) && (!filter || filter.keys.has(titleKey));
  if (filter && !showTitle && items.length === 0) return null;
  const firstOnPage =
    filter !== null &&
    (filter.first === titleKey ||
      section.items.some((item) => filter.first.split(':')[1] === item.id));

  return (
    <section
      className={cn(
        firstOnPage ? 'mt-0' : 'mt-5',
        onClick &&
          '-mx-2 cursor-pointer rounded px-2 outline-offset-2 hover:outline hover:outline-1 hover:outline-stone-300',
        selected && 'outline outline-2 outline-brand/60',
      )}
      aria-label={section.title || section.kind}
      onClick={onClick ? () => onClick(section.id) : undefined}
    >
      {showTitle ? (
        <h2
          data-ov-b={titleKey}
          className={cn(
            'mb-2 text-[1.1em] font-bold tracking-wide uppercase',
            ruleColor && 'border-b pb-1',
          )}
          style={{
            color: titleColor,
            ...(ruleColor ? { borderColor: ruleColor } : {}),
            ...toCss(section.titleStyle),
          }}
        >
          <ResumeIcon icon={section.icon} className="me-[0.4em]" />
          {section.title}
        </h2>
      ) : null}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Item key={item.id} item={item} section={section} filter={filter} />
        ))}
      </div>
    </section>
  );
}

interface ResumeRendererProps {
  readonly doc: ResumeDocument;
  /** Editor only: outline this section. */
  readonly selectedSectionId?: string;
  /** Editor only: clicking a section opens it for editing. Exporters leave this out. */
  readonly onSectionClick?: (id: string) => void;
  /** Draw only these blocks, in order (one page). Leave out to draw everything. */
  readonly pageBlocks?: readonly string[];
}

/**
 * Draws a resume, or one page of it. Used by the preview, print and (later)
 * the PDF and image exporters, so it uses only physical units (pt, em) and
 * logical CSS. Every block that pagination may move is marked with data-ov-b.
 */
export function ResumeRenderer({
  doc: source,
  selectedSectionId,
  onSectionClick,
  pageBlocks,
}: ResumeRendererProps) {
  // Digits are a drawing choice: the stored resume keeps what was typed.
  const doc = useMemo(() => applyDigits(source), [source]);
  const { layout, profile } = doc;
  const pageKey = pageBlocks?.join('|');
  const filter = useMemo<PageFilter | null>(
    () =>
      pageKey === undefined
        ? null
        : { keys: new Set(pageKey.split('|')), first: pageKey.split('|')[0] ?? '' },
    [pageKey],
  );
  const showHeader = !filter || filter.keys.has('header');

  return (
    <article
      dir={layout.direction}
      lang={doc.language}
      className="text-ink"
      style={{
        fontFamily: fontStack(layout.fontFamily),
        fontSize: `${layout.baseFontSizePt}pt`,
        lineHeight: layout.lineHeight,
        ['--ov-indent' as string]: `${layout.indentCh}ch`,
        ['--ov-icon-color' as string]: layout.iconColor ?? DEFAULT_ICON_COLOR,
      }}
    >
      {showHeader ? (
        <header
          data-ov-b="header"
          className={cn(
            doc.photo && 'flex gap-5',
            doc.photo?.align === 'center' && 'flex-col items-center text-center',
            doc.photo?.align === 'end' && 'flex-row-reverse justify-between',
          )}
        >
          {doc.photo ? (
            <img
              src={doc.photo.dataUrl}
              alt={profile.fullName ? `Photo of ${profile.fullName}` : 'Photo'}
              className="shrink-0 object-cover"
              style={{
                width: `${doc.photo.widthMm}mm`,
                borderRadius: PHOTO_RADIUS[doc.photo.shape],
              }}
            />
          ) : null}
          <div className={cn('min-w-0', doc.photo?.align !== 'center' && doc.photo && 'flex-1')}>
            {profile.fullName ? (
              <h1 className="text-[2.2em] leading-tight font-bold" style={toCss(profile.nameStyle)}>
                {profile.fullName}
              </h1>
            ) : null}
            {profile.headline ? (
              <p
                className="mt-1 text-[1.1em]"
                style={{ color: layout.accentColor, ...toCss(profile.headlineStyle) }}
              >
                {profile.headline}
              </p>
            ) : null}
            <ContactLine doc={doc} centred={doc.photo?.align === 'center'} />
          </div>
        </header>
      ) : null}

      <SafeHtml
        html={profile.summaryHtml}
        className={filter?.first.startsWith('summary:') ? undefined : 'mt-4'}
        blockPrefix="summary"
        include={filter?.keys}
      />

      {doc.sections
        .filter((section) => section.visible)
        .map((section) => (
          <Section
            key={section.id}
            section={section}
            titleColor={layout.sectionTitleColor ?? layout.accentColor}
            ruleColor={
              layout.sectionRule === false ? null : (layout.sectionRuleColor ?? layout.accentColor)
            }
            selected={section.id === selectedSectionId}
            onClick={onSectionClick}
            filter={filter}
          />
        ))}
    </article>
  );
}
