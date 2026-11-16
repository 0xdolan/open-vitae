import { Button } from '@/components/ui/button';
import { useT } from '@/i18n';
import { useFontStore } from '@/stores';

/** Asks once before any request goes to Google. The choice is remembered in this browser. */
export function GoogleConsent({ compact = false }: { readonly compact?: boolean }) {
  const t = useT();
  const setGoogleConsent = useFontStore((s) => s.setGoogleConsent);
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">{t('fonts.consentTitle')}</p>
      <p className={compact ? 'mt-1 text-xs' : 'mt-1'}>{t('fonts.consentBody')}</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="primary" onClick={() => setGoogleConsent(true)}>
          {t('fonts.allowGoogle')}
        </Button>
      </div>
    </div>
  );
}
