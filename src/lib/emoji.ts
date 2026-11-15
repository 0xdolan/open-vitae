export interface Emoji {
  readonly char: string;
  readonly name: string;
  /** Extra search words. */
  readonly keywords: string;
}

export interface EmojiGroup {
  readonly id: string;
  readonly label: string;
  readonly emojis: readonly Emoji[];
}

const e = (char: string, name: string, keywords = ''): Emoji => ({ char, name, keywords });

/**
 * A curated set that suits resumes: work, study, skills, contact, places and
 * a few friendly faces. The full set is available from the operating system's
 * emoji picker (Win + . on Windows, Ctrl + Cmd + Space on macOS).
 */
export const EMOJI_GROUPS: readonly EmojiGroup[] = [
  {
    id: 'work',
    label: 'Work',
    emojis: [
      e('💼', 'briefcase', 'job work business experience'),
      e('🏢', 'office building', 'company employer'),
      e('📈', 'chart increasing', 'growth results revenue'),
      e('📊', 'bar chart', 'data analytics report'),
      e('🎯', 'target', 'goal objective'),
      e('🚀', 'rocket', 'launch startup ship'),
      e('🤝', 'handshake', 'partnership deal team'),
      e('🧭', 'compass', 'leadership direction'),
      e('🗂️', 'card index dividers', 'organise projects'),
      e('📝', 'memo', 'writing notes'),
      e('📅', 'calendar', 'date schedule'),
      e('⏱️', 'stopwatch', 'time speed'),
      e('🏆', 'trophy', 'award win achievement'),
      e('🥇', 'first place medal', 'award gold'),
      e('⭐', 'star', 'highlight favourite'),
      e('✅', 'check mark', 'done complete yes'),
    ],
  },
  {
    id: 'study',
    label: 'Study',
    emojis: [
      e('🎓', 'graduation cap', 'education degree university'),
      e('📚', 'books', 'study reading library'),
      e('📖', 'open book', 'reading'),
      e('🔬', 'microscope', 'science research'),
      e('🧪', 'test tube', 'lab experiment'),
      e('🧮', 'abacus', 'maths accounting'),
      e('📜', 'scroll', 'certificate diploma'),
      e('🏫', 'school', 'education'),
      e('✏️', 'pencil', 'write'),
      e('🧠', 'brain', 'thinking intelligence'),
    ],
  },
  {
    id: 'tech',
    label: 'Tech',
    emojis: [
      e('💻', 'laptop', 'computer code developer'),
      e('🖥️', 'desktop computer', 'screen'),
      e('⌨️', 'keyboard', 'typing'),
      e('🛠️', 'hammer and wrench', 'tools build skills'),
      e('⚙️', 'gear', 'settings engineering'),
      e('🔧', 'wrench', 'fix maintenance'),
      e('🔒', 'locked', 'security privacy'),
      e('🛡️', 'shield', 'security protection cyber'),
      e('☁️', 'cloud', 'cloud computing aws'),
      e('🌐', 'globe with meridians', 'web internet'),
      e('📱', 'mobile phone', 'app ios android'),
      e('🤖', 'robot', 'automation ai'),
      e('🐛', 'bug', 'debugging'),
      e('🧩', 'puzzle piece', 'problem solving'),
      e('🔗', 'link', 'url chain'),
      e('📦', 'package', 'release delivery'),
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    emojis: [
      e('📧', 'e-mail', 'email mail'),
      e('✉️', 'envelope', 'mail letter'),
      e('📞', 'telephone receiver', 'phone call'),
      e('☎️', 'telephone', 'phone'),
      e('📍', 'round pushpin', 'location address'),
      e('🏠', 'house', 'home address'),
      e('🌍', 'globe Europe Africa', 'world international'),
      e('🌏', 'globe Asia Australia', 'world'),
      e('🌎', 'globe Americas', 'world'),
      e('🗣️', 'speaking head', 'languages speaking'),
      e('💬', 'speech balloon', 'chat communication'),
    ],
  },
  {
    id: 'people',
    label: 'People',
    emojis: [
      e('🙂', 'slightly smiling face', 'smile happy'),
      e('😊', 'smiling face', 'happy'),
      e('👋', 'waving hand', 'hello'),
      e('👍', 'thumbs up', 'good yes'),
      e('👏', 'clapping hands', 'applause'),
      e('🙌', 'raising hands', 'celebrate'),
      e('💡', 'light bulb', 'idea innovation'),
      e('❤️', 'red heart', 'love passion'),
      e('🎨', 'artist palette', 'design creative art'),
      e('🎵', 'musical note', 'music'),
      e('⚽', 'soccer ball', 'football sport'),
      e('📷', 'camera', 'photography'),
      e('✈️', 'airplane', 'travel'),
      e('🌱', 'seedling', 'growth sustainability'),
    ],
  },
  {
    id: 'symbols',
    label: 'Symbols',
    emojis: [
      e('➡️', 'right arrow', 'arrow next'),
      e('⬅️', 'left arrow', 'arrow back'),
      e('▶️', 'play button', 'triangle'),
      e('🔹', 'small blue diamond', 'bullet'),
      e('🔸', 'small orange diamond', 'bullet'),
      e('◾', 'black medium-small square', 'bullet'),
      e('✔️', 'check mark', 'tick'),
      e('❌', 'cross mark', 'no'),
      e('⚠️', 'warning', 'caution'),
      e('ℹ️', 'information', 'info'),
      e('©️', 'copyright', ''),
      e('™️', 'trade mark', ''),
    ],
  },
];

export const ALL_EMOJI: readonly Emoji[] = EMOJI_GROUPS.flatMap((g) => g.emojis);

/** Match every word of the query against the name and keywords. */
export function searchEmoji(query: string): Emoji[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...ALL_EMOJI];
  return ALL_EMOJI.filter((emoji) => {
    const haystack = `${emoji.name} ${emoji.keywords}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
