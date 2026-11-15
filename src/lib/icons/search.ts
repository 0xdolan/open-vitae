/**
 * Icon search by name. Component names like "LuMapPin" or "FaSquareGithub"
 * are turned into words ("map pin", "square github") and matched against
 * what the person types. Pure functions, no icon data.
 */

/** Words people type for things icons are usually named differently. */
const SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  email: ['mail', 'envelope', 'at'],
  'e-mail': ['mail', 'envelope'],
  telephone: ['phone', 'call'],
  mobile: ['phone', 'smartphone', 'mobile'],
  location: ['map', 'pin', 'marker', 'location'],
  address: ['map', 'pin', 'home', 'location'],
  website: ['globe', 'link', 'world', 'web'],
  web: ['globe', 'web', 'world'],
  job: ['briefcase', 'work', 'job'],
  work: ['briefcase', 'work'],
  education: ['graduation', 'school', 'book', 'education'],
  school: ['graduation', 'school'],
  skills: ['star', 'wrench', 'tool', 'skill'],
  language: ['language', 'languages', 'globe', 'translate'],
  award: ['award', 'trophy', 'medal'],
  certificate: ['certificate', 'badge', 'award'],
  person: ['user', 'person', 'profile'],
  code: ['code', 'terminal', 'brackets'],
};

/** Split a component name into lower-case words, without the set prefix. */
export function iconWords(name: string, prefix: string): string {
  const bare = name.startsWith(prefix) ? name.slice(prefix.length) : name;
  return bare
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .toLowerCase();
}

/** A readable label for an icon, e.g. "Map pin". */
export function iconLabel(name: string, prefix: string): string {
  const words = iconWords(name, prefix);
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function tokenMatches(token: string, words: readonly string[]): number {
  const options = [token, ...(SYNONYMS[token] ?? [])];
  let best = 0;
  for (const option of options) {
    for (const word of words) {
      if (word === option) best = Math.max(best, 3);
      else if (word.startsWith(option)) best = Math.max(best, 2);
      else if (option.length > 2 && word.includes(option)) best = Math.max(best, 1);
    }
  }
  return best;
}

export interface IconSearchResult {
  /** Matching component names, best first, at most `limit`. */
  readonly names: readonly string[];
  /** How many icons matched in total. */
  readonly total: number;
}

/**
 * Find icons whose words contain every typed word (or a synonym of it).
 * Whole-word matches rank first, then word starts, then shorter names.
 * An empty query returns the set in order.
 */
export function searchIcons(
  names: readonly string[],
  query: string,
  prefix: string,
  limit = 120,
): IconSearchResult {
  const tokens = query
    .toLowerCase()
    .split(/[\s,_-]+/)
    .filter(Boolean);
  if (tokens.length === 0) return { names: names.slice(0, limit), total: names.length };

  const scored: { name: string; score: number; length: number }[] = [];
  for (const name of names) {
    const words = iconWords(name, prefix).split(' ');
    let score = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const s = tokenMatches(token, words);
      if (s === 0) {
        matchedAll = false;
        break;
      }
      score += s;
    }
    if (matchedAll) scored.push({ name, score, length: words.length });
  }
  scored.sort((a, b) => b.score - a.score || a.length - b.length || a.name.localeCompare(b.name));
  return { names: scored.slice(0, limit).map((entry) => entry.name), total: scored.length };
}
