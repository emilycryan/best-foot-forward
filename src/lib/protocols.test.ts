// src/lib/protocols.test.ts
import { describe, it, expect } from 'vitest';
import { collectProtocols } from './protocols';
import type { EntryData } from './entry-schema';

const make = (id: string, date: string, protocols?: EntryData['protocols']): { id: string; data: EntryData } => ({
  id,
  data: { title: id, date: new Date(date), phase: 'early-recovery', tags: [], draft: false, protocols } as EntryData,
});

describe('collectProtocols', () => {
  it('returns chronological snapshots for one category', () => {
    const entries = [
      make('b', '2026-07-10', { peptides: ['BPC-157'] }),
      make('a', '2026-07-01', { medications: ['Oxy'], peptides: ['TB-500'] }),
      make('c', '2026-07-05', { medications: ['Tylenol'] }),
    ];
    const peptides = collectProtocols(entries, 'peptides');
    expect(peptides.map((p) => p.slug)).toEqual(['a', 'b']); // oldest first, only entries with peptides
    expect(peptides[0].items).toEqual(['TB-500']);
  });
  it('returns empty for no entries', () => {
    expect(collectProtocols([], 'medications')).toEqual([]);
  });
});
