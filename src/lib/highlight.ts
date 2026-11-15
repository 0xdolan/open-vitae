import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import kotlin from 'highlight.js/lib/languages/kotlin';
import markdown from 'highlight.js/lib/languages/markdown';
import php from 'highlight.js/lib/languages/php';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

/** Languages offered for code blocks, in menu order. */
export const CODE_LANGUAGES = [
  { id: 'plaintext', label: 'Plain text' },
  { id: 'bash', label: 'Bash / Shell' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'css', label: 'CSS' },
  { id: 'go', label: 'Go' },
  { id: 'xml', label: 'HTML / XML' },
  { id: 'java', label: 'Java' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'json', label: 'JSON' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'php', label: 'PHP' },
  { id: 'python', label: 'Python' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'rust', label: 'Rust' },
  { id: 'sql', label: 'SQL' },
  { id: 'swift', label: 'Swift' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'yaml', label: 'YAML' },
] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number]['id'];

/** highlight.js grammars by name; also registered with lowlight in the editor. */
export const GRAMMARS = {
  bash, c, cpp, csharp, css, go, java, javascript, json, kotlin, markdown,
  php, plaintext, python, ruby, rust, sql, swift, typescript, xml, yaml,
} as const;

let registered = false;

/** The shared highlight.js instance with the supported languages registered. */
export function getHighlighter(): typeof hljs {
  if (!registered) {
    for (const [name, grammar] of Object.entries(GRAMMARS)) {
      hljs.registerLanguage(name, grammar);
    }
    registered = true;
  }
  return hljs;
}

function languageOf(code: Element): string | null {
  for (const name of code.classList) {
    if (name.startsWith('language-')) return name.slice('language-'.length);
  }
  return null;
}

/**
 * Colour code blocks for display. The editor stores plain code with a
 * language-* class; highlighting happens only when rendering, and the result
 * goes through the sanitiser again (which keeps hljs-* classes only).
 */
export function highlightCodeBlocks(html: string): string {
  if (!html.includes('<pre')) return html;
  const highlighter = getHighlighter();
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  let changed = false;

  for (const code of doc.querySelectorAll('pre > code')) {
    const language = languageOf(code);
    if (!language || language === 'plaintext' || !highlighter.getLanguage(language)) continue;
    const result = highlighter.highlight(code.textContent ?? '', { language, ignoreIllegals: true });
    code.innerHTML = result.value;
    code.classList.add('hljs');
    changed = true;
  }
  return changed ? doc.body.innerHTML : html;
}
