import { Button } from '@/components/ui/button';
import { navigate } from '@/hooks/useHashRoute';
import { SAMPLES, type SampleId } from '@/samples';
import { useResumeStore } from '@/stores';
import { useT } from '@/i18n';
import { useUiStore } from '@/stores/ui-store';

/** The built-in samples. Using one creates an editable copy; the sample itself never changes. */
export function SampleGallery() {
  const t = useT();
  const createFromSample = useResumeStore((s) => s.createFromSample);
  const hidden = useUiStore((s) => s.hideSamples);
  const setHidden = useUiStore((s) => s.setHideSamples);

  const applySample = async (id: SampleId) => {
    const doc = await createFromSample(id);
    if (doc) navigate({ name: 'editor', id: doc.id });
  };

  return (
    <section aria-labelledby="samples-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="samples-heading" className="text-lg font-bold">
            {t('samples.title')}
          </h2>
          {hidden ? null : <p className="text-sm text-stone-600">{t('samples.intro')}</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={!hidden}
          aria-controls="samples-list"
          onClick={() => setHidden(!hidden)}
        >
          {hidden ? t('samples.show') : t('samples.hide')}
        </Button>
      </div>
      {hidden ? null : (
        <ul id="samples-list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLES.map((sample) => (
            <li
              key={sample.id}
              className="hover:border-stone-300 relative flex flex-col rounded-xl border border-stone-200 bg-card p-4 transition-colors"
            >
              <p className="font-semibold">{t(`samples.${sample.id}.label`)}</p>
              <p className="text-sm text-stone-600" dir="auto">
                {sample.role}
              </p>
              <p className="mt-1 flex-1 text-xs text-stone-500">
                {t(`samples.${sample.id}.description`)}
              </p>
              <Button
                size="sm"
                className="mt-3 self-start after:absolute after:inset-0 after:rounded-xl after:content-['']"
                onClick={() => void applySample(sample.id)}
                aria-label={t('samples.useNamed', { name: t(`samples.${sample.id}.label`) })}
              >
                {t('samples.use')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
