import { GlobeIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import { UI_LOCALES, useLocaleStore, useT, type UiLocale } from '@/i18n';
import { cn } from '@/lib/utils';

/**
 * Choose the language of the app itself: a compact globe button showing the
 * current language. Each language is named in its own script and direction.
 */
export function LanguageSwitcher({ className }: { readonly className?: string }) {
  const t = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);
  return (
    <Select
      size="sm"
      aria-label={t('app.interfaceLanguage')}
      title={t('app.interfaceLanguage')}
      className={cn('w-auto gap-1.5', className)}
      contentClassName="min-w-40"
      value={t.locale}
      onValueChange={(value) => setLocale(value as UiLocale)}
      items={UI_LOCALES.map((locale) => ({
        value: locale.tag,
        label: locale.nativeName,
        lang: locale.tag,
        dir: locale.direction,
      }))}
      renderValue={(option) => (
        <span className="inline-flex items-center gap-1.5">
          <GlobeIcon aria-hidden="true" className="size-4 shrink-0 opacity-70" />
          <span lang={option?.lang} dir={option?.dir}>
            {option?.label}
          </span>
        </span>
      )}
    />
  );
}
