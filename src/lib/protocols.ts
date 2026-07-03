// src/lib/protocols.ts
import type { EntryData } from './entry-schema';
import type { ProtocolCategory } from './protocol-categories';

export type { ProtocolCategory };

export interface ProtocolSnapshot {
  slug: string;
  title: string;
  date: Date;
  items: string[];
}

export function collectProtocols(
  entries: { id: string; data: EntryData }[],
  category: ProtocolCategory,
): ProtocolSnapshot[] {
  return entries
    .filter((e) => (e.data.protocols?.[category]?.length ?? 0) > 0)
    // the filter above guarantees protocols and this category are non-empty
    .map((e) => ({ slug: e.id, title: e.data.title, date: e.data.date, items: e.data.protocols![category]! }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Matches `/entries/<slug>` references in a protocol page's markdown body.
// The capture stops at the first non-slug char, so image paths like
// `/entries/iwalker.jpeg` yield `iwalker`, which won't match a real entry id.
const ENTRY_REF = /\/entries\/([a-z0-9-]+)/gi;

/**
 * How many journal entries a protocol's detail page actually surfaces.
 * When the auto timeline is on, that's every entry logging the category;
 * when it's off, it's only the entries hand-linked in the prose. Prose
 * links count only if they resolve to a real entry id, so image references
 * under /entries/ don't inflate the number.
 */
export function displayedEntryCount(
  entries: { id: string; data: EntryData }[],
  category: ProtocolCategory,
  page: { body?: string; data: { showTimeline?: boolean } } | null,
): number {
  const validIds = new Set(entries.map((e) => e.id));
  const shown = new Set<string>();

  if (page?.data.showTimeline ?? true) {
    for (const snap of collectProtocols(entries, category)) shown.add(snap.slug);
  }

  for (const [, slug] of (page?.body ?? '').matchAll(ENTRY_REF)) {
    if (validIds.has(slug)) shown.add(slug);
  }

  return shown.size;
}
