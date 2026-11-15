import type { CSSProperties, ReactNode } from 'react';

import { SafeHtml } from '@/components/SafeHtml';
import { fontStack } from '@/config/fonts';
import { isSafeUrl, telUrl } from '@/lib/url';
import type { ResumeDocument, ResumeItem, ResumeSection, TextStyle } from '@/schema/resume';

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
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

/** Strip the scheme so a link reads cleanly on paper. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function ContactLine({ doc }: { readonly doc: ResumeDocument }) {
  const { email, phone, location, website, links } = doc.profile;
  const parts: ReactNode[] = [];

  // <bdi> keeps emails, numbers and URLs in their own direction inside RTL text.
  if (email) parts.push(<SafeLink key="email" href={`mailto:${email}`}><bdi>{email}</bdi></SafeLink>);
  if (phone) parts.push(<SafeLink key="phone" href={telUrl(phone)}><bdi dir="ltr">{phone}</bdi></SafeLink>);
  if (location) parts.push(<bdi key="location">{location}</bdi>);
  if (website) parts.push(<SafeLink key="website" href={website}><bdi>{displayUrl(website)}</bdi></SafeLink>);
  for (const link of links) {
    parts.push(
      <SafeLink key={link.id} href={link.url}>
        <bdi>{link.label || displayUrl(link.url)}</bdi>
      </SafeLink>,
    );
  }

  if (parts.length === 0) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.9em] text-stone-600">
      {parts.map((part, i) => (
        <span key={i} className="inline-flex items-center gap-3">
          {i > 0 ? <span aria-hidden="true" className="text-stone-300">•</span> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

function Item({ item, section }: { readonly item: ResumeItem; readonly section: ResumeSection }) {
  const meta = [item.subtitle, item.location].filter(Boolean).join(' · ');
  const titleNode = item.url ? <SafeLink href={item.url}>{item.title}</SafeLink> : item.title;

  return (
    <div className="break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        {item.title ? (
          <h3 className="font-semibold" style={toCss(item.titleStyle)}>
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
      <SafeHtml
        html={item.descriptionHtml}
        className="mt-1"
        style={toCss(item.descriptionStyle ?? section.descriptionStyle)}
      />
    </div>
  );
}

function Section({ section, accent }: { readonly section: ResumeSection; readonly accent: string }) {
  const items = section.items.filter((item) => item.visible);
  return (
    <section className="mt-5" aria-label={section.title || section.kind}>
      {section.title ? (
        <h2
          className="mb-2 border-b pb-1 text-[1.1em] font-bold tracking-wide uppercase"
          style={{ color: accent, borderColor: accent, ...toCss(section.titleStyle) }}
        >
          {section.title}
        </h2>
      ) : null}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Item key={item.id} item={item} section={section} />
        ))}
      </div>
    </section>
  );
}

interface ResumeRendererProps {
  readonly doc: ResumeDocument;
}

/**
 * Draws a resume. Used by the on-screen preview now and by the PDF and image
 * exporters later, so it uses only physical units (pt, em) and logical CSS.
 */
export function ResumeRenderer({ doc }: ResumeRendererProps) {
  const { layout, profile } = doc;

  return (
    <article
      dir={layout.direction}
      lang={doc.language}
      className="text-ink"
      style={{
        fontFamily: fontStack(layout.fontFamily),
        fontSize: `${layout.baseFontSizePt}pt`,
        lineHeight: layout.lineHeight,
      }}
    >
      <header>
        {profile.fullName ? (
          <h1 className="text-[2.2em] leading-tight font-bold" style={toCss(profile.nameStyle)}>
            {profile.fullName}
          </h1>
        ) : null}
        {profile.headline ? (
          <p className="mt-1 text-[1.1em]" style={{ color: layout.accentColor, ...toCss(profile.headlineStyle) }}>
            {profile.headline}
          </p>
        ) : null}
        <ContactLine doc={doc} />
      </header>

      <SafeHtml html={profile.summaryHtml} className="mt-4" />

      {doc.sections
        .filter((section) => section.visible)
        .map((section) => (
          <Section key={section.id} section={section} accent={layout.accentColor} />
        ))}
    </article>
  );
}
