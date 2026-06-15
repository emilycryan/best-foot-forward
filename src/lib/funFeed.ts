// src/lib/funFeed.ts
import type { EntryData } from './entry-schema';

export interface FunItem {
  slug: string;
  title: string;
  date: Date;
  watching?: string;
  bought?: string;
  ate?: string;
  joy?: string;
  image?: string;
  imageAlt?: string;
}

export function collectFun(entries: { id: string; data: EntryData }[]): FunItem[] {
  return entries
    .filter((e) => e.data.funStuff && Object.values(e.data.funStuff).some(Boolean))
    .map((e) => ({ slug: e.id, title: e.data.title, date: e.data.date, ...e.data.funStuff }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
