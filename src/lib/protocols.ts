// src/lib/protocols.ts
import type { EntryData } from './entry-schema';

export type ProtocolCategory = 'medications' | 'peptides' | 'exercise';

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
    .map((e) => ({ slug: e.id, title: e.data.title, date: e.data.date, items: e.data.protocols![category]! }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
