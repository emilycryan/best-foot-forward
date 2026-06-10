// src/lib/entry-schema.test.ts
import { describe, it, expect } from 'vitest';
import { entrySchema, PHASE_IDS } from './entry-schema';

describe('entrySchema', () => {
  it('accepts a minimal valid entry', () => {
    const parsed = entrySchema.parse({
      title: 'Hello', date: '2026-06-30', phase: 'surgery',
    });
    expect(parsed.title).toBe('Hello');
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.tags).toEqual([]);     // default
    expect(parsed.draft).toBe(false);    // default
  });

  it('rejects pain outside 0–10', () => {
    expect(() => entrySchema.parse({
      title: 'x', date: '2026-06-30', phase: 'surgery', pain: 11,
    })).toThrow();
  });

  it('rejects an unknown phase', () => {
    expect(() => entrySchema.parse({
      title: 'x', date: '2026-06-30', phase: 'made-up',
    })).toThrow();
  });

  it('exposes the six phase ids in spine order', () => {
    expect(PHASE_IDS).toEqual([
      'pre-op', 'surgery', 'early-recovery', 'boot-transition', 'walking-pt', 'full-recovery',
    ]);
  });
  it('accepts pain at the 0 and 10 boundaries', () => {
    expect(entrySchema.parse({ title: 'x', date: '2026-06-30', phase: 'surgery', pain: 0 }).pain).toBe(0);
    expect(entrySchema.parse({ title: 'x', date: '2026-06-30', phase: 'surgery', pain: 10 }).pain).toBe(10);
  });
});
