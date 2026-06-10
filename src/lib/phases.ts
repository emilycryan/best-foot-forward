// src/lib/phases.ts
import type { PhaseId } from './entry-schema';

export interface PhaseDef {
  id: PhaseId;
  label: string;
  /** Days from surgery this phase begins. Use -Infinity for pre-op. */
  startDay: number;
}

/** The phase the journey is in on a given surgery-relative day. */
export function currentPhaseId(currentDay: number, phases: PhaseDef[]): PhaseId {
  let current = phases[0].id;
  for (const p of phases) {
    if (currentDay >= p.startDay) current = p.id;
  }
  return current;
}

export type PhaseStatus = 'done' | 'active' | 'soon';

/** Position of a phase relative to the current phase, for strip styling. */
export function phaseStatus(phaseId: PhaseId, currentId: PhaseId, phases: PhaseDef[]): PhaseStatus {
  const order = (id: PhaseId) => phases.findIndex((p) => p.id === id);
  const a = order(phaseId);
  const b = order(currentId);
  if (a < b) return 'done';
  if (a === b) return 'active';
  return 'soon';
}
