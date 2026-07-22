import type { PhaseDef } from './lib/phases';

export const site = {
  name: 'Best Foot Forward',
  tagline: 'The recovery nobody documents.',
  description:
    "An honest, structured log of my second foot reconstruction (osteotomies, FDL transfer, spring ligament repair). The stuff I couldn't find when I searched for it myself.",
  surgeryDate: new Date('2026-06-30'),
  priorSurgery: { label: 'Left foot', year: 2022 },
};

// The recovery spine. Edit `startDay` values to match the real timeline;
// adding a phase here makes the strip, routing, and status pick it up automatically.
export const phases: PhaseDef[] = [
  { id: 'pre-op', label: 'Pre-op', startDay: -Infinity },
  { id: 'surgery', label: 'Surgery', startDay: 0 },
  { id: 'early-recovery', label: 'Early Recovery', startDay: 1 },
  { id: 'boot-transition', label: 'Boot / Transition', startDay: 20 },
  { id: 'walking-pt', label: 'Walking & PT', startDay: 70 },
  { id: 'full-recovery', label: 'Full Recovery', startDay: 168 },
];

/** Medical disclaimer copy, reused in the footer and About page. */
export const disclaimerShort =
  "This is my personal recovery story, not medical advice. I'm a patient sharing my own experience, not a clinician. Always talk to your own surgeon or care team before acting on anything you read here.";
