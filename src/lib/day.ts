// src/lib/day.ts

/** Whole calendar days between an entry date and surgery (UTC-normalized). */
export function daysFromSurgery(date: Date, surgeryDate: Date): number {
  const MS_PER_DAY = 86_400_000;
  const at = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return (at(date) - at(surgeryDate)) / MS_PER_DAY;
}

/** Human label used on chips and headers. */
export function dayLabel(date: Date, surgeryDate: Date): string {
  const d = daysFromSurgery(date, surgeryDate);
  if (d < 0) return `Pre-op · ${-d}d to surgery`;
  if (d === 0) return 'Surgery day';
  return `Day ${d}`;
}
