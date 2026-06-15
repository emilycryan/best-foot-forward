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

export interface ProtocolStat {
  count: number;
  firstDate: Date | null;
}

export function protocolStat(
  entries: { id: string; data: EntryData }[],
  category: ProtocolCategory,
): ProtocolStat {
  const matches = entries.filter((e) => (e.data.protocols?.[category]?.length ?? 0) > 0);
  if (matches.length === 0) return { count: 0, firstDate: null };
  const firstDate = matches.reduce(
    (min, e) => (e.data.date < min ? e.data.date : min),
    matches[0].data.date,
  );
  return { count: matches.length, firstDate };
}
