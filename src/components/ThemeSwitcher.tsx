import { Segmented } from '@/components/ui/segmented';
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons';
import { useT } from '@/i18n';
import { useUiStore } from '@/stores/ui-store';

/** Light, dark or follow the system. Resume pages always stay white. */
export function ThemeSwitcher({ className }: { readonly className?: string }) {
  const t = useT();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  return (
    <Segmented
      className={className}
      label={t('theme.label')}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: t('theme.light'), icon: <SunIcon /> },
        { value: 'dark', label: t('theme.dark'), icon: <MoonIcon /> },
        { value: 'system', label: t('theme.system'), icon: <MonitorIcon /> },
      ]}
    />
  );
}
