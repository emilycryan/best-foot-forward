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

// Counts `## ` (h2) section headings in a protocol page's markdown body.
// `###` and deeper don't match, since the char after `##` must be whitespace.
const SECTION_HEADING = /^##\s/gm;

/**
 * How many things a protocol's detail page presents on the tile.
 * When the auto timeline is on, that's every journal entry logging the
 * category (the list the page renders). When it's off, the page is a
 * curated writeup and the count is the number of items it documents,
 * one per `##` section (e.g. one heading per peptide).
 */
export function displayedEntryCount(
  entries: { id: string; data: EntryData }[],
  category: ProtocolCategory,
  page: { body?: string; data: { showTimeline?: boolean } } | null,
): number {
  if (page?.data.showTimeline ?? true) {
    return collectProtocols(entries, category).length;
  }
  return ((page?.body ?? '').match(SECTION_HEADING) ?? []).length;
}
