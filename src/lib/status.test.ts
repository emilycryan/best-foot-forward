// src/lib/status.test.ts
import { describe, it, expect } from 'vitest';
import { siteStatus } from './status';
import type { PhaseDef } from './phases';

const phases: PhaseDef[] = [
  { id: 'pre-op', label: 'Pre-op', startDay: -Infinity },
  { id: 'surgery', label: 'Surgery', startDay: 0 },
  { id: 'early-recovery', label: 'Early Recovery', startDay: 1 },
  { id: 'boot-transition', label: 'Boot / Transition', startDay: 42 },
  { id: 'walking-pt', label: 'Walking & PT', startDay: 70 },
  { id: 'full-recovery', label: 'Full Recovery', startDay: 168 },
];

describe('siteStatus', () => {
  it('reports current day, phase, and entry count', () => {
    const status = siteStatus({
      today: new Date('2026-07-14'),
      surgeryDate: new Date('2026-06-30'),
      phases,
      entryCount: 9,
    });
    expect(status.currentDay).toBe(14);
    expect(status.currentPhase).toBe('early-recovery');
    expect(status.entryCount).toBe(9);
  });

  it('handles the pre-op window', () => {
    const status = siteStatus({
      today: new Date('2026-06-10'),
      surgeryDate: new Date('2026-06-30'),
      phases,
      entryCount: 0,
    });
    expect(status.currentDay).toBe(-20);
    expect(status.currentPhase).toBe('pre-op');
  });
});
