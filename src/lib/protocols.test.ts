// src/lib/protocols.test.ts
import { describe, it, expect } from 'vitest';
import { collectProtocols, displayedEntryCount } from './protocols';
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

describe('displayedEntryCount', () => {
  const entries = [
    make('2026-07-10-b', '2026-07-10', { medications: ['Oxy', 'Tylenol'] }),
    make('2026-07-01-a', '2026-07-01', { medications: ['Oxy'] }),
    make('2026-07-05-c', '2026-07-05', { peptides: ['BPC-157'] }),
  ];

  it('counts every tagged entry when the timeline is on', () => {
    const page = { data: { showTimeline: true } };
    expect(displayedEntryCount(entries, 'medications', page)).toBe(2);
  });

  it('defaults to the timeline count when showTimeline is unset', () => {
    const page = { data: {} };
    expect(displayedEntryCount(entries, 'medications', page)).toBe(2);
  });

  it('counts only prose-linked entries when the timeline is off', () => {
    const page = { data: { showTimeline: false }, body: 'see [one](/entries/2026-07-01-a).' };
    expect(displayedEntryCount(entries, 'medications', page)).toBe(1);
  });

  it('ignores image paths and dead links that are not real entry ids', () => {
    const page = {
      data: { showTimeline: false },
      body: '![gear](/entries/iwalker.jpeg) and [real](/entries/2026-07-01-a)',
    };
    expect(displayedEntryCount(entries, 'medications', page)).toBe(1);
  });

  it('unions timeline entries with extra prose links', () => {
    const page = { data: { showTimeline: true }, body: 'aside [peptide](/entries/2026-07-05-c)' };
    expect(displayedEntryCount(entries, 'medications', page)).toBe(3);
  });

  it('returns zero when nothing matches', () => {
    expect(displayedEntryCount([], 'supplements', null)).toBe(0);
  });
});
