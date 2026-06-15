// src/lib/entry-schema.ts
import { z } from 'zod';
import { categoryKeys } from './protocol-categories';

export const PHASE_IDS = [
  'pre-op', 'surgery', 'early-recovery', 'boot-transition', 'walking-pt', 'full-recovery',
] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

const protocolsShape = Object.fromEntries(
  categoryKeys.map((k) => [k, z.array(z.string()).optional()]),
);

export const entrySchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  phase: z.enum(PHASE_IDS),
  pain: z.number().min(0).max(10).optional(),
  weightBearing: z.enum(['NWB', 'heel-touch', 'PWB', 'WBAT', 'FWB']).optional(),
  mobility: z.string().optional(),
  mood: z.string().optional(),
  swelling: z.enum(['none', 'mild', 'moderate', 'significant']).optional(),
  photo: z.string().optional(),
  photoAlt: z.string().optional(),
  wins: z.array(z.string()).optional(),
  protocols: z.object(protocolsShape).optional(),
  comparison: z.string().optional(),
  questionsForSurgeon: z.array(z.string()).optional(),
  funStuff: z.object({
    watching: z.string().optional(),
    bought: z.string().optional(),
    ate: z.string().optional(),
    joy: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

export type EntryData = z.infer<typeof entrySchema>;
