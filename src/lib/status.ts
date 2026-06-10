// src/lib/status.ts
import { daysFromSurgery } from './day';
import { currentPhaseId, type PhaseDef } from './phases';
import type { PhaseId } from './entry-schema';

export interface SiteStatus {
  currentDay: number;
  currentPhase: PhaseId;
  entryCount: number;
}

export function siteStatus(opts: {
  today: Date;
  surgeryDate: Date;
  phases: PhaseDef[];
  entryCount: number;
}): SiteStatus {
  const currentDay = daysFromSurgery(opts.today, opts.surgeryDate);
  return {
    currentDay,
    currentPhase: currentPhaseId(currentDay, opts.phases),
    entryCount: opts.entryCount,
  };
}
