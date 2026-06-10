// src/lib/day.test.ts
import { describe, it, expect } from 'vitest';
import { daysFromSurgery, dayLabel } from './day';

const surgery = new Date('2026-06-30');

describe('daysFromSurgery', () => {
  it('is negative before surgery', () => {
    expect(daysFromSurgery(new Date('2026-06-27'), surgery)).toBe(-3);
  });
  it('is zero on surgery day', () => {
    expect(daysFromSurgery(new Date('2026-06-30'), surgery)).toBe(0);
  });
  it('is positive after surgery', () => {
    expect(daysFromSurgery(new Date('2026-07-14'), surgery)).toBe(14);
  });
});

describe('dayLabel', () => {
  it('counts down before surgery', () => {
    expect(dayLabel(new Date('2026-06-27'), surgery)).toBe('Pre-op · 3d to surgery');
  });
  it('labels surgery day', () => {
    expect(dayLabel(new Date('2026-06-30'), surgery)).toBe('Surgery day');
  });
  it('counts up after surgery', () => {
    expect(dayLabel(new Date('2026-07-14'), surgery)).toBe('Day 14');
  });
  it('shows 1d to surgery the day before', () => {
    expect(dayLabel(new Date('2026-06-29'), surgery)).toBe('Pre-op · 1d to surgery');
  });
  it('labels day 1 the day after surgery', () => {
    expect(dayLabel(new Date('2026-07-01'), surgery)).toBe('Day 1');
  });
});
