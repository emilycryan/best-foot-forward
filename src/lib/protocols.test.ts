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

  it('counts `##` sections when the timeline is off', () => {
    const page = { data: { showTimeline: false }, body: '## BPC-157\ntext\n## TB-500\n## GHK-Cu\n' };
    expect(displayedEntryCount(entries, 'peptides', page)).toBe(3);
  });

  it('ignores deeper headings and mid-line hashes when counting sections', () => {
    const page = { data: { showTimeline: false }, body: '## Real\n### Sub\ntext ## not a heading\n#### Deep' };
    expect(displayedEntryCount(entries, 'peptides', page)).toBe(1);
  });

  it('returns zero for a curated page with no sections', () => {
    const page = { data: { showTimeline: false }, body: 'Just an intro, no headings.' };
    expect(displayedEntryCount(entries, 'nutrition', page)).toBe(0);
  });

  it('returns zero when nothing matches', () => {
    expect(displayedEntryCount([], 'supplements', null)).toBe(0);
  });
});
