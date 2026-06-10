// src/lib/phases.test.ts
import { describe, it, expect } from 'vitest';
import { currentPhaseId, phaseStatus, type PhaseDef } from './phases';

const phases: PhaseDef[] = [
  { id: 'pre-op', label: 'Pre-op', startDay: -Infinity },
  { id: 'surgery', label: 'Surgery', startDay: 0 },
  { id: 'early-recovery', label: 'Early Recovery', startDay: 1 },
  { id: 'boot-transition', label: 'Boot / Transition', startDay: 42 },
  { id: 'walking-pt', label: 'Walking & PT', startDay: 70 },
  { id: 'full-recovery', label: 'Full Recovery', startDay: 168 },
];

describe('currentPhaseId', () => {
  it('is pre-op before surgery', () => {
    expect(currentPhaseId(-5, phases)).toBe('pre-op');
  });
  it('is surgery on day 0', () => {
    expect(currentPhaseId(0, phases)).toBe('surgery');
  });
  it('is early-recovery in the first weeks', () => {
    expect(currentPhaseId(14, phases)).toBe('early-recovery');
  });
  it('advances to boot-transition at 6 weeks', () => {
    expect(currentPhaseId(45, phases)).toBe('boot-transition');
  });
});

describe('phaseStatus', () => {
  it('marks earlier phases done', () => {
    expect(phaseStatus('pre-op', 'early-recovery', phases)).toBe('done');
  });
  it('marks the current phase active', () => {
    expect(phaseStatus('early-recovery', 'early-recovery', phases)).toBe('active');
  });
  it('marks later phases soon', () => {
    expect(phaseStatus('walking-pt', 'early-recovery', phases)).toBe('soon');
  });
});
