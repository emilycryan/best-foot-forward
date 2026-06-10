// src/lib/funFeed.test.ts
import { describe, it, expect } from 'vitest';
import { collectFun } from './funFeed';
import type { EntryData } from './entry-schema';

const make = (id: string, date: string, funStuff?: EntryData['funStuff']): { id: string; data: EntryData } => ({
  id,
  data: { title: id, date: new Date(date), phase: 'early-recovery', tags: [], draft: false, funStuff } as EntryData,
});

describe('collectFun', () => {
  it('keeps only entries with at least one fun field, newest first', () => {
    const entries = [
      make('a', '2026-07-01', { watching: 'The Bear' }),
      make('b', '2026-07-05'),                                   // no fun
      make('c', '2026-07-10', { ate: 'ramen', joy: 'sunlight' }),
    ];
    const fun = collectFun(entries);
    expect(fun.map((f) => f.slug)).toEqual(['c', 'a']);
    expect(fun[0].ate).toBe('ramen');
  });
  it('returns empty for no entries', () => {
    expect(collectFun([])).toEqual([]);
  });
});
