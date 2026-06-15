// src/lib/protocol-categories.ts

export interface ProtocolCategoryDef {
  key: string;
  label: string;
  color: 'pink' | 'purple' | 'green' | 'gold' | 'orange' | 'teal';
  icon: 'pill' | 'flask' | 'leaf' | 'apple' | 'dumbbell' | 'hand';
  blurb: string;
  order: number;
}

export const PROTOCOL_CATEGORIES = [
  { key: 'medications', label: 'Medications',        color: 'pink',   icon: 'pill',     blurb: 'Pain control, then tapering off.',      order: 1 },
  { key: 'peptides',    label: 'Peptides',           color: 'purple', icon: 'flask',    blurb: 'Healing support like BPC-157.',         order: 2 },
  { key: 'supplements', label: 'Supplements',        color: 'green',  icon: 'leaf',     blurb: 'Vitamin D, collagen, magnesium.',       order: 3 },
  { key: 'nutrition',   label: 'Food / Nutrition',   color: 'gold',   icon: 'apple',    blurb: 'Protein and anti-inflammatory eating.', order: 4 },
  { key: 'exercise',    label: 'PT / Exercise',      color: 'orange', icon: 'dumbbell', blurb: 'Range of motion to weight-bearing.',    order: 5 },
  { key: 'bodywork',    label: 'Bodywork / Massage', color: 'teal',   icon: 'hand',     blurb: 'Scar mobilization and lymphatic work.', order: 6 },
] as const satisfies readonly ProtocolCategoryDef[];

export type ProtocolCategory = (typeof PROTOCOL_CATEGORIES)[number]['key'];

export const categoryKeys = PROTOCOL_CATEGORIES.map((c) => c.key) as ProtocolCategory[];

export function getCategory(key: string): ProtocolCategoryDef | undefined {
  return PROTOCOL_CATEGORIES.find((c) => c.key === key);
}
