import { useId } from 'react';

import { UI_LOCALES, useLocaleStore, useT, type UiLocale } from '@/i18n';
import { cn } from '@/lib/utils';

/** Choose the language of the app itself. Each language is named in its own script. */
export function LanguageSwitcher({ className }: { readonly className?: string }) {
  const t = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const id = useId();
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <label htmlFor={id} className="text-stone-600">
        <span aria-hidden="true">🌐 </span>
        {t('app.interfaceLanguage')}
      </label>
      <select
        id={id}
        className="h-8 rounded-md border border-stone-300 bg-white px-2"
        value={t.locale}
        onChange={(e) => setLocale(e.target.value as UiLocale)}
      >
        {UI_LOCALES.map((locale) => (
          <option key={locale.tag} value={locale.tag} lang={locale.tag} dir={locale.direction}>
            {locale.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
