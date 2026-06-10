// src/lib/excerpt.ts

/** Plain-text excerpt from markdown body, truncated on a word boundary. */
export function excerpt(markdown: string, max = 160): string {
  const text = markdown
    .replace(/^#+\s+/gm, '')        // headings
    .replace(/[*_`>#]/g, '')        // emphasis/code/quote marks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links -> text
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trim()}…`;
}
