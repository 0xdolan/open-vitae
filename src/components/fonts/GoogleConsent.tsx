import { Button } from '@/components/ui/button';
import { useFontStore } from '@/stores';

/** Asks once before any request goes to Google. The choice is remembered in this browser. */
export function GoogleConsent({ compact = false }: { readonly compact?: boolean }) {
  const setGoogleConsent = useFontStore((s) => s.setGoogleConsent);
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">Use Google Fonts?</p>
      <p className={compact ? 'mt-1 text-xs' : 'mt-1'}>
        Google Fonts are downloaded from Google’s servers, so Google receives your IP address and
        the font names. Nothing from your resume is sent. Bundled, system and your own fonts need no
        connection.
      </p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="primary" onClick={() => setGoogleConsent(true)}>
          Allow Google Fonts
        </Button>
      </div>
    </div>
  );
}
