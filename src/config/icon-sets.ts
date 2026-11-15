/**
 * Icon sets offered for resume content. All come from the react-icons package
 * (MIT), which bundles each project's icons as React components; Lucide is
 * its "lu" pack. Each set is loaded only when it is first needed.
 *
 * Licences are those of the original icon projects, as listed by react-icons.
 */

export const ICON_SET_IDS = [
  'lu',
  'fa6',
  'si',
  'tb',
  'md',
  'bs',
  'pi',
  'ri',
  'hi2',
  'io5',
  'fi',
  'ai',
  'bi',
  'cg',
  'ci',
  'di',
  'fa',
  'fc',
  'gi',
  'go',
  'gr',
  'hi',
  'im',
  'io',
  'lia',
  'rx',
  'sl',
  'tfi',
  'ti',
  'vsc',
  'wi',
] as const;

export type IconSetId = (typeof ICON_SET_IDS)[number];

export interface IconSetInfo {
  readonly id: IconSetId;
  readonly label: string;
  /** Prefix of every component name in the set, e.g. "Lu" for LuMapPin. */
  readonly prefix: string;
  readonly license: string;
  readonly url: string;
  /** Logos of companies and products; trademarks of their owners. */
  readonly brands?: boolean;
}

export const ICON_SETS: Readonly<Record<IconSetId, IconSetInfo>> = {
  lu: { id: 'lu', label: 'Lucide', prefix: 'Lu', license: 'ISC', url: 'https://lucide.dev/' },
  fa6: { id: 'fa6', label: 'Font Awesome 6', prefix: 'Fa', license: 'CC BY 4.0', url: 'https://fontawesome.com/' },
  si: { id: 'si', label: 'Simple Icons (brands)', prefix: 'Si', license: 'CC0 1.0', url: 'https://simpleicons.org/', brands: true },
  tb: { id: 'tb', label: 'Tabler Icons', prefix: 'Tb', license: 'MIT', url: 'https://tabler-icons.io/' },
  md: { id: 'md', label: 'Material Design', prefix: 'Md', license: 'Apache 2.0', url: 'https://fonts.google.com/icons' },
  bs: { id: 'bs', label: 'Bootstrap Icons', prefix: 'Bs', license: 'MIT', url: 'https://icons.getbootstrap.com/' },
  pi: { id: 'pi', label: 'Phosphor', prefix: 'Pi', license: 'MIT', url: 'https://phosphoricons.com/' },
  ri: { id: 'ri', label: 'Remix Icon', prefix: 'Ri', license: 'Apache 2.0', url: 'https://remixicon.com/' },
  hi2: { id: 'hi2', label: 'Heroicons 2', prefix: 'Hi', license: 'MIT', url: 'https://heroicons.com/' },
  io5: { id: 'io5', label: 'Ionicons 5', prefix: 'Io', license: 'MIT', url: 'https://ionic.io/ionicons' },
  fi: { id: 'fi', label: 'Feather', prefix: 'Fi', license: 'MIT', url: 'https://feathericons.com/' },
  ai: { id: 'ai', label: 'Ant Design Icons', prefix: 'Ai', license: 'MIT', url: 'https://github.com/ant-design/ant-design-icons' },
  bi: { id: 'bi', label: 'BoxIcons', prefix: 'Bi', license: 'MIT', url: 'https://boxicons.com/' },
  cg: { id: 'cg', label: 'css.gg', prefix: 'Cg', license: 'MIT', url: 'https://css.gg/' },
  ci: { id: 'ci', label: 'Circum Icons', prefix: 'Ci', license: 'MPL 2.0', url: 'https://circumicons.com/' },
  di: { id: 'di', label: 'Devicons', prefix: 'Di', license: 'MIT', url: 'https://vorillaz.github.io/devicons/', brands: true },
  fa: { id: 'fa', label: 'Font Awesome 5', prefix: 'Fa', license: 'CC BY 4.0', url: 'https://fontawesome.com/' },
  fc: { id: 'fc', label: 'Flat Color Icons', prefix: 'Fc', license: 'MIT', url: 'https://github.com/icons8/flat-color-icons' },
  gi: { id: 'gi', label: 'Game Icons', prefix: 'Gi', license: 'CC BY 3.0', url: 'https://game-icons.net/' },
  go: { id: 'go', label: 'GitHub Octicons', prefix: 'Go', license: 'MIT', url: 'https://primer.style/octicons/' },
  gr: { id: 'gr', label: 'Grommet Icons', prefix: 'Gr', license: 'Apache 2.0', url: 'https://icons.grommet.io/' },
  hi: { id: 'hi', label: 'Heroicons', prefix: 'Hi', license: 'MIT', url: 'https://heroicons.com/' },
  im: { id: 'im', label: 'IcoMoon Free', prefix: 'Im', license: 'CC BY 4.0', url: 'https://icomoon.io/' },
  io: { id: 'io', label: 'Ionicons 4', prefix: 'Io', license: 'MIT', url: 'https://ionic.io/ionicons' },
  lia: { id: 'lia', label: 'Line Awesome', prefix: 'Lia', license: 'MIT', url: 'https://icons8.com/line-awesome' },
  rx: { id: 'rx', label: 'Radix Icons', prefix: 'Rx', license: 'MIT', url: 'https://icons.radix-ui.com/' },
  sl: { id: 'sl', label: 'Simple Line Icons', prefix: 'Sl', license: 'MIT', url: 'https://thesabbir.github.io/simple-line-icons/' },
  tfi: { id: 'tfi', label: 'Themify Icons', prefix: 'Tfi', license: 'MIT', url: 'https://themify.me/themify-icons' },
  ti: { id: 'ti', label: 'Typicons', prefix: 'Ti', license: 'CC BY-SA 3.0', url: 'https://www.s-ings.com/typicons/' },
  vsc: { id: 'vsc', label: 'VS Code Codicons', prefix: 'Vsc', license: 'CC BY 4.0', url: 'https://microsoft.github.io/vscode-codicons/' },
  wi: { id: 'wi', label: 'Weather Icons', prefix: 'Wi', license: 'SIL OFL 1.1', url: 'https://erikflowers.github.io/weather-icons/' },
};

export const DEFAULT_ICON_SET: IconSetId = 'lu';

export function isIconSetId(value: string): value is IconSetId {
  return (ICON_SET_IDS as readonly string[]).includes(value);
}

/** Icons used in the contact line when "Icons in the contact line" is on. */
export const CONTACT_ICONS = {
  email: { set: 'lu', name: 'LuMail' },
  phone: { set: 'lu', name: 'LuPhone' },
  location: { set: 'lu', name: 'LuMapPin' },
  website: { set: 'lu', name: 'LuGlobe' },
  link: { set: 'lu', name: 'LuLink' },
} as const;
