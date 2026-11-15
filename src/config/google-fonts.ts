export type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting';

export interface GoogleFont {
  readonly family: string;
  readonly category: FontCategory;
  /** Covers Arabic script (Persian, Arabic, Kurdish Sorani, Urdu...). */
  readonly arabic?: boolean;
  readonly hebrew?: boolean;
}

const f = (
  family: string,
  category: FontCategory,
  scripts: { arabic?: boolean; hebrew?: boolean } = {},
): GoogleFont => ({
  family,
  category,
  ...scripts,
});
const AR = { arabic: true };
const HE = { hebrew: true };

/**
 * A curated set of Google Fonts that work well for resumes, including the
 * main Arabic-script and Hebrew families. Any other Google font can be loaded
 * by typing its exact name in the font picker.
 */
export const GOOGLE_FONTS: readonly GoogleFont[] = [
  // Arabic script
  f('Vazirmatn', 'sans-serif', AR),
  f('Noto Sans Arabic', 'sans-serif', AR),
  f('Noto Naskh Arabic', 'serif', AR),
  f('Noto Kufi Arabic', 'sans-serif', AR),
  f('Noto Nastaliq Urdu', 'serif', AR),
  f('IBM Plex Sans Arabic', 'sans-serif', AR),
  f('Readex Pro', 'sans-serif', AR),
  f('Cairo', 'sans-serif', AR),
  f('Tajawal', 'sans-serif', AR),
  f('Almarai', 'sans-serif', AR),
  f('Alexandria', 'sans-serif', AR),
  f('Changa', 'sans-serif', AR),
  f('El Messiri', 'sans-serif', AR),
  f('Mada', 'sans-serif', AR),
  f('Harmattan', 'sans-serif', AR),
  f('Baloo Bhaijaan 2', 'display', AR),
  f('Lemonada', 'display', AR),
  f('Reem Kufi', 'sans-serif', AR),
  f('Kufam', 'display', AR),
  f('Amiri', 'serif', AR),
  f('Scheherazade New', 'serif', AR),
  f('Lateef', 'serif', AR),
  f('Markazi Text', 'serif', AR),
  f('Lalezar', 'display', AR),
  f('Aref Ruqaa', 'serif', AR),
  f('Rakkas', 'display', AR),
  // Hebrew
  f('Heebo', 'sans-serif', HE),
  f('Assistant', 'sans-serif', HE),
  f('Rubik', 'sans-serif', HE),
  f('Noto Sans Hebrew', 'sans-serif', HE),
  f('Frank Ruhl Libre', 'serif', HE),
  f('David Libre', 'serif', HE),
  f('Secular One', 'display', HE),
  f('Alef', 'sans-serif', HE),
  // Sans-serif
  f('Inter', 'sans-serif'),
  f('Inter Tight', 'sans-serif'),
  f('Roboto', 'sans-serif'),
  f('Roboto Condensed', 'sans-serif'),
  f('Open Sans', 'sans-serif'),
  f('Lato', 'sans-serif'),
  f('Montserrat', 'sans-serif'),
  f('Poppins', 'sans-serif'),
  f('Source Sans 3', 'sans-serif'),
  f('Raleway', 'sans-serif'),
  f('Nunito', 'sans-serif'),
  f('Nunito Sans', 'sans-serif'),
  f('Work Sans', 'sans-serif'),
  f('IBM Plex Sans', 'sans-serif'),
  f('PT Sans', 'sans-serif'),
  f('Noto Sans', 'sans-serif'),
  f('Fira Sans', 'sans-serif'),
  f('DM Sans', 'sans-serif'),
  f('Outfit', 'sans-serif'),
  f('Plus Jakarta Sans', 'sans-serif'),
  f('Sora', 'sans-serif'),
  f('Urbanist', 'sans-serif'),
  f('Lexend', 'sans-serif'),
  f('Karla', 'sans-serif'),
  f('Mulish', 'sans-serif'),
  f('Barlow', 'sans-serif'),
  f('Quicksand', 'sans-serif'),
  f('Josefin Sans', 'sans-serif'),
  f('Archivo', 'sans-serif'),
  f('Space Grotesk', 'sans-serif'),
  f('Red Hat Display', 'sans-serif'),
  f('Red Hat Text', 'sans-serif'),
  f('Libre Franklin', 'sans-serif'),
  f('Cabin', 'sans-serif'),
  f('Figtree', 'sans-serif'),
  f('Onest', 'sans-serif'),
  f('Public Sans', 'sans-serif'),
  f('Atkinson Hyperlegible', 'sans-serif'),
  f('Hanken Grotesk', 'sans-serif'),
  f('Schibsted Grotesk', 'sans-serif'),
  f('Instrument Sans', 'sans-serif'),
  f('Bricolage Grotesque', 'sans-serif'),
  f('Ubuntu', 'sans-serif'),
  f('Overpass', 'sans-serif'),
  f('Titillium Web', 'sans-serif'),
  f('Exo 2', 'sans-serif'),
  f('Arimo', 'sans-serif'),
  f('Carlito', 'sans-serif'),
  f('Oswald', 'sans-serif'),
  // Serif
  f('Merriweather', 'serif'),
  f('Playfair Display', 'serif'),
  f('Lora', 'serif'),
  f('PT Serif', 'serif'),
  f('Noto Serif', 'serif'),
  f('IBM Plex Serif', 'serif'),
  f('Source Serif 4', 'serif'),
  f('Libre Baskerville', 'serif'),
  f('EB Garamond', 'serif'),
  f('Cormorant Garamond', 'serif'),
  f('Crimson Pro', 'serif'),
  f('DM Serif Display', 'serif'),
  f('Bitter', 'serif'),
  f('Spectral', 'serif'),
  f('Alegreya', 'serif'),
  f('Literata', 'serif'),
  f('Newsreader', 'serif'),
  f('Fraunces', 'serif'),
  f('Gelasio', 'serif'),
  f('Zilla Slab', 'serif'),
  f('Roboto Slab', 'serif'),
  f('Roboto Serif', 'serif'),
  f('Instrument Serif', 'serif'),
  f('Tinos', 'serif'),
  f('Caladea', 'serif'),
  // Monospace
  f('JetBrains Mono', 'monospace'),
  f('Fira Code', 'monospace'),
  f('IBM Plex Mono', 'monospace'),
  f('Roboto Mono', 'monospace'),
  f('Source Code Pro', 'monospace'),
  f('Space Mono', 'monospace'),
  f('Ubuntu Mono', 'monospace'),
  f('Noto Sans Mono', 'monospace'),
  f('Cousine', 'monospace'),
];

export function findGoogleFont(family: string): GoogleFont | undefined {
  const key = family.toLowerCase();
  return GOOGLE_FONTS.find((font) => font.family.toLowerCase() === key);
}

/** Generic CSS family to fall back to for a category. */
export function genericFamily(category: FontCategory | undefined): string {
  switch (category) {
    case 'serif':
      return 'serif';
    case 'monospace':
      return 'ui-monospace, monospace';
    case 'handwriting':
      return 'cursive';
    default:
      return 'system-ui, sans-serif';
  }
}
