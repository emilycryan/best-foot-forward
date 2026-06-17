// src/lib/fun-categories.ts

export interface FunCategoryDef {
  key: string;
  label: string;
  color: 'pink' | 'purple' | 'green' | 'gold' | 'orange' | 'teal';
  icon: 'tv' | 'book' | 'cookie' | 'bag' | 'sparkle';
  blurb: string;
  order: number;
}

export const FUN_CATEGORIES = [
  { key: 'watching',          label: 'Watching',          color: 'purple', icon: 'tv',      blurb: 'Shows, movies, the binge list.',                    order: 1 },
  { key: 'reading-listening', label: 'Reading/Listening', color: 'teal',   icon: 'book',    blurb: 'Books, podcasts, and music.',                       order: 2 },
  { key: 'eating',            label: 'Eating',            color: 'gold',   icon: 'cookie',  blurb: 'Snacks, treats, and comfort food.',                 order: 3 },
  { key: 'random-buys',       label: 'Random Buys',       color: 'pink',   icon: 'bag',     blurb: 'Impulse buys and gear that showed up at the door.', order: 4 },
  { key: 'simple-joys',       label: 'Simple Joys',       color: 'orange', icon: 'sparkle', blurb: 'The small intangible good moments.',                order: 5 },
] as const satisfies readonly FunCategoryDef[];

export type FunCategory = (typeof FUN_CATEGORIES)[number]['key'];

export const funCategoryKeys = FUN_CATEGORIES.map((c) => c.key) as FunCategory[];

export function getFunCategory(key: string): FunCategoryDef | undefined {
  return FUN_CATEGORIES.find((c) => c.key === key);
}
