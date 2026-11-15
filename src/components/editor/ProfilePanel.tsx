import { Button } from '@/components/ui/button';
import { GripIcon, PlusIcon, TrashIcon } from '@/components/ui/icons';
import { SortableList } from '@/components/ui/sortable';
import { TextField } from '@/components/ui/text-field';
import { LIMITS } from '@/config/layout';
import { addLink, moveLink, removeLink, updateLink, updateProfile } from '@/lib/document-ops';
import { emailError, urlError } from '@/lib/field-validation';
import type { Profile, ResumeDocument } from '@/schema/resume';
import { useResumeStore } from '@/stores';

import { IconPicker } from '@/components/icons/IconPicker';
import { PhotoField } from '@/components/photo/PhotoField';
import { RichTextField } from '@/components/rich-text/RichTextField';
import { PanelHeading } from './PanelHeading';

type ProfileTextField = 'fullName' | 'headline' | 'email' | 'phone' | 'location' | 'website';

const FIELDS: readonly { key: ProfileTextField; label: string; type?: string; autoComplete?: string; wide?: boolean }[] = [
  { key: 'fullName', label: 'Full name', autoComplete: 'name', wide: true },
  { key: 'headline', label: 'Headline', wide: true },
  { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  { key: 'location', label: 'Location', autoComplete: 'address-level2' },
  { key: 'website', label: 'Website', type: 'url', autoComplete: 'url' },
];

export function ProfilePanel({ doc }: { readonly doc: ResumeDocument }) {
  const updateActive = useResumeStore((s) => s.updateActive);
  const { profile } = doc;

  const setField = (key: keyof Omit<Profile, 'links'>, value: string) =>
    updateActive((d) => updateProfile(d, { [key]: value }), { group: `profile.${key}` });

  return (
    <section aria-labelledby="profile-heading" className="flex flex-col gap-5">
      <PanelHeading id="profile-heading" title="Profile" description="Your name, contact details and a short summary." />

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            type={field.type ?? 'text'}
            autoComplete={field.autoComplete}
            className={field.wide ? 'sm:col-span-2' : undefined}
            value={profile[field.key]}
            error={field.key === 'email' ? emailError(profile.email) : field.key === 'website' ? urlError(profile.website) : null}
            placeholder={field.key === 'website' ? 'https://' : undefined}
            onChange={(value) => setField(field.key, value)}
          />
        ))}
      </div>

      <PhotoField doc={doc} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold text-stone-700">Links</legend>
        {profile.links.length === 0 ? (
          <p className="text-sm text-stone-500">Add LinkedIn, GitHub, a portfolio or anything else.</p>
        ) : null}
        <SortableList
          label="Profile links"
          items={profile.links}
          getId={(link) => link.id}
          getLabel={(link) => link.label || link.url || 'link'}
          onMove={(from, to) => updateActive((d) => moveLink(d, from, to))}
          className="flex flex-col gap-2"
          renderItem={(link, { handleProps, isDragging, isDropTarget }) => (
            <div
              className={`flex items-start gap-2 rounded-lg border bg-white p-2 ${isDragging ? 'border-brand shadow-lg' : isDropTarget ? 'border-brand border-dashed' : 'border-stone-200'}`}
            >
              <button type="button" className="mt-6 rounded p-1 text-stone-400 hover:text-ink" {...handleProps}>
                <GripIcon />
              </button>
              <TextField
                label="Label"
                className="w-36 shrink-0"
                value={link.label}
                maxLength={80}
                placeholder="GitHub"
                onChange={(label) => updateActive((d) => updateLink(d, link.id, { label }), { group: `link.${link.id}.label` })}
              />
              <TextField
                label="URL"
                type="url"
                className="flex-1"
                value={link.url}
                placeholder="https://"
                error={urlError(link.url)}
                onChange={(url) => updateActive((d) => updateLink(d, link.id, { url: url.trim() }), { group: `link.${link.id}.url` })}
              />
              <IconPicker
                className="mt-5 shrink-0"
                target={link.label || 'this link'}
                value={link.icon}
                onChange={(icon) => updateActive((d) => updateLink(d, link.id, { icon }))}
              />
              <Button
                variant="danger-ghost"
                size="sm"
                className="mt-5"
                aria-label={`Remove link ${link.label || link.url}`}
                onClick={() => updateActive((d) => removeLink(d, link.id))}
              >
                <TrashIcon />
              </Button>
            </div>
          )}
        />
        <Button
          size="sm"
          className="self-start"
          disabled={profile.links.length >= LIMITS.links}
          onClick={() => updateActive((d) => addLink(d).doc)}
        >
          <PlusIcon /> Add link
        </Button>
      </fieldset>

      <RichTextField
        label="Summary"
        html={profile.summaryHtml}
        placeholder="Two or three sentences about what you do and what you are looking for."
        language={doc.language}
        accentColor={doc.layout.accentColor}
        indentCh={doc.layout.indentCh}
        maxDepth={doc.layout.maxDepth}
        onChange={(summaryHtml) => updateActive((d) => updateProfile(d, { summaryHtml }), { group: 'profile.summary' })}
      />
    </section>
  );
}
