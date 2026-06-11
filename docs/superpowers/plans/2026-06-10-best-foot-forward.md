# Best Foot Forward — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a public, searchable, statically-generated recovery journal where each entry is a markdown file with typed, validated structure (pain, weight-bearing, protocols, wins, fun stuff), authored in chat.

**Architecture:** Astro static site. Entries live in a content collection validated by a Zod schema shared with a pure-TypeScript `lib/` layer (so all derived logic — day labels, phase status, aggregations — is unit-tested without the framework). Pagefind provides zero-backend full-text search. Deploys to Vercel as static output.

**Tech Stack:** Astro, `astro-pagefind`, `@astrojs/rss`, `@astrojs/sitemap`, `@fontsource/public-sans`, `zod`, Vitest. Public Sans + a recolored USWDS-style design system (Legally Blonde palette).

**Working directory:** `/Users/63172/Sites/recovery-journal`

**Conventions:**
- `lib/*.ts` is pure TypeScript: no `astro:*` imports, so Vitest can test it directly. Components/pages map collection entries onto the `lib` interfaces.
- Component and page tasks are verified by `npm run build` (fails loud on schema/type errors) plus a dev-server visual check, not brittle component unit tests.
- Images live in `public/entries/` and are referenced by path (e.g. `photo: "/entries/day14.jpg"`), keeping the schema framework-agnostic.

**Note on commits:** Steps include per-task `git commit` (standard TDD cadence). The repo is git-initialized in Task 1. If you would rather commit manually, skip the commit steps; nothing else depends on them.

**MVP milestone:** Tasks 1–17 produce a live, searchable site with the About/disclaimer page. Task 18 adds the first real pre-op entry; Task 19 deploys. Tasks 20–25 are secondary pages.

---

### Task 1: Project configuration and dependencies

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "best-foot-forward",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@astrojs/rss": "^4.0.12",
    "@astrojs/sitemap": "^3.7.0",
    "@fontsource/public-sans": "^5.2.5",
    "astro": "^6.0.0",
    "astro-pagefind": "^1.8.5",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.5",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

// `site` is used for canonical URLs, sitemap, and RSS.
// Update this to the real domain/Vercel URL after the first deploy.
export default defineConfig({
  site: 'https://best-foot-forward.vercel.app',
  integrations: [sitemap(), pagefind()],
});
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 5: Write `.gitignore`**

```gitignore
node_modules/
dist/
.astro/
.vercel/
.superpowers/
.DS_Store
*.log
.env
.env.*
```

- [ ] **Step 6: Initialize git and install**

Run:
```bash
cd /Users/63172/Sites/recovery-journal && git init && npm install
```
Expected: dependencies install without error; `.git/` created.

- [ ] **Step 7: Verify the dev server boots**

Run: `npm run dev`
Expected: Astro prints a local URL and starts without error (no pages yet is fine; an empty-site 404 is acceptable). Stop the server after confirming.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold Astro project with config and tooling"
```

---

### Task 2: Entry schema and shared types

**Files:**
- Create: `src/lib/entry-schema.ts`
- Test: `src/lib/entry-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/entry-schema.test.ts
import { describe, it, expect } from 'vitest';
import { entrySchema, PHASE_IDS } from './entry-schema';

describe('entrySchema', () => {
  it('accepts a minimal valid entry', () => {
    const parsed = entrySchema.parse({
      title: 'Hello', date: '2026-06-30', phase: 'surgery',
    });
    expect(parsed.title).toBe('Hello');
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.tags).toEqual([]);     // default
    expect(parsed.draft).toBe(false);    // default
  });

  it('rejects pain outside 0–10', () => {
    expect(() => entrySchema.parse({
      title: 'x', date: '2026-06-30', phase: 'surgery', pain: 11,
    })).toThrow();
  });

  it('rejects an unknown phase', () => {
    expect(() => entrySchema.parse({
      title: 'x', date: '2026-06-30', phase: 'made-up',
    })).toThrow();
  });

  it('exposes the six phase ids in spine order', () => {
    expect(PHASE_IDS).toEqual([
      'pre-op', 'surgery', 'early-recovery', 'boot-transition', 'walking-pt', 'full-recovery',
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- entry-schema`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/entry-schema.ts
import { z } from 'zod';

export const PHASE_IDS = [
  'pre-op', 'surgery', 'early-recovery', 'boot-transition', 'walking-pt', 'full-recovery',
] as const;
export type PhaseId = (typeof PHASE_IDS)[number];

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
  protocols: z.object({
    medications: z.array(z.string()).optional(),
    peptides: z.array(z.string()).optional(),
    exercise: z.array(z.string()).optional(),
  }).optional(),
  comparison: z.string().optional(),
  questionsForSurgeon: z.array(z.string()).optional(),
  funStuff: z.object({
    watching: z.string().optional(),
    bought: z.string().optional(),
    ate: z.string().optional(),
    joy: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

export type EntryData = z.infer<typeof entrySchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- entry-schema`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add validated entry schema and shared types"
```

---

### Task 3: Wire the content collection

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/entries/_example.md` (underscore prefix = ignored by the glob, serves as a template)

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { entrySchema } from './lib/entry-schema';

const entries = defineCollection({
  // `[^_]` skips files beginning with `_` (templates/drafts-in-waiting).
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/entries' }),
  schema: entrySchema,
});

export const collections = { entries };
```

- [ ] **Step 2: Write the example/template entry**

```markdown
---
title: "Example entry (template — not published)"
date: 2026-06-30
phase: surgery
pain: 5
weightBearing: NWB
mobility: "Knee scooter"
mood: "Steady"
swelling: moderate
photo: "/entries/example.jpg"
photoAlt: "Describe the photo here"
wins:
  - "A first or small win"
protocols:
  medications: ["Tylenol 1g 3x/day"]
  peptides: ["BPC-157 250mcg 2x/day"]
  exercise: ["Toe wiggles 3x/day"]
comparison: "How this compares to the left foot in 2023."
questionsForSurgeon:
  - "A question to raise at the next visit."
funStuff:
  watching: "Whatever show"
  bought: "Whatever arrived"
  ate: "Whatever sounded good"
  joy: "A small good moment"
tags: [template]
draft: true
---

This file starts with `_` so it is never published. Copy it to author a new entry.
```

- [ ] **Step 3: Verify the schema syncs**

Run: `npm run check`
Expected: Astro generates `.astro/` types and reports 0 errors. (If `astro:content` types complain, run `npm run dev` once to trigger sync, then re-run check.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: register entries content collection with glob loader"
```

---

### Task 4: Day-label logic

**Files:**
- Create: `src/lib/day.ts`
- Test: `src/lib/day.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/day.test.ts
import { describe, it, expect } from 'vitest';
import { daysFromSurgery, dayLabel } from './day';

const surgery = new Date('2026-06-30');

describe('daysFromSurgery', () => {
  it('is negative before surgery', () => {
    expect(daysFromSurgery(new Date('2026-06-27'), surgery)).toBe(-3);
  });
  it('is zero on surgery day', () => {
    expect(daysFromSurgery(new Date('2026-06-30'), surgery)).toBe(0);
  });
  it('is positive after surgery', () => {
    expect(daysFromSurgery(new Date('2026-07-14'), surgery)).toBe(14);
  });
});

describe('dayLabel', () => {
  it('counts down before surgery', () => {
    expect(dayLabel(new Date('2026-06-27'), surgery)).toBe('Pre-op · 3d to surgery');
  });
  it('labels surgery day', () => {
    expect(dayLabel(new Date('2026-06-30'), surgery)).toBe('Surgery day');
  });
  it('counts up after surgery', () => {
    expect(dayLabel(new Date('2026-07-14'), surgery)).toBe('Day 14');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- day`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/day.ts

/** Whole calendar days between an entry date and surgery (UTC-normalized). */
export function daysFromSurgery(date: Date, surgeryDate: Date): number {
  const MS_PER_DAY = 86_400_000;
  const at = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((at(date) - at(surgeryDate)) / MS_PER_DAY);
}

/** Human label used on chips and headers. */
export function dayLabel(date: Date, surgeryDate: Date): string {
  const d = daysFromSurgery(date, surgeryDate);
  if (d < 0) return `Pre-op · ${-d}d to surgery`;
  if (d === 0) return 'Surgery day';
  return `Day ${d}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- day`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add surgery-relative day labels"
```

---

### Task 5: Phase logic

**Files:**
- Create: `src/lib/phases.ts`
- Test: `src/lib/phases.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- phases`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- phases`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add recovery phase logic"
```

---

### Task 6: Site configuration

**Files:**
- Create: `src/site.config.ts`

- [ ] **Step 1: Write `src/site.config.ts`**

```ts
import type { PhaseDef } from './lib/phases';

export const site = {
  name: 'Best Foot Forward',
  tagline: 'The recovery nobody documents.',
  description:
    "An honest, structured log of my second foot reconstruction (osteotomies, FDL transfer, spring ligament repair). The stuff I couldn't find when I searched for it myself.",
  surgeryDate: new Date('2026-06-30'),
  priorSurgery: { label: 'Left foot', year: 2023 },
};

// The recovery spine. Edit `startDay` values to match the real timeline;
// adding a phase here makes the strip, routing, and status pick it up automatically.
export const phases: PhaseDef[] = [
  { id: 'pre-op', label: 'Pre-op', startDay: -Infinity },
  { id: 'surgery', label: 'Surgery', startDay: 0 },
  { id: 'early-recovery', label: 'Early Recovery', startDay: 1 },
  { id: 'boot-transition', label: 'Boot / Transition', startDay: 42 },
  { id: 'walking-pt', label: 'Walking & PT', startDay: 70 },
  { id: 'full-recovery', label: 'Full Recovery', startDay: 168 },
];

/** Medical disclaimer copy, reused in the footer and About page. */
export const disclaimerShort =
  "This is my personal recovery story, not medical advice. I'm a patient sharing my own experience, not a clinician. Always talk to your own surgeon or care team before acting on anything you read here.";
```

- [ ] **Step 2: Verify it type-checks**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add site configuration and phase timeline"
```

---

### Task 7: Status aggregation

**Files:**
- Create: `src/lib/status.ts`
- Test: `src/lib/status.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- status`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- status`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add site status aggregation"
```

---

### Task 8: Fun-feed aggregation

**Files:**
- Create: `src/lib/funFeed.ts`
- Test: `src/lib/funFeed.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/funFeed.test.ts
import { describe, it, expect } from 'vitest';
import { collectFun } from './funFeed';
import type { EntryData } from './entry-schema';

const make = (id: string, date: string, funStuff?: EntryData['funStuff']): { id: string; data: EntryData } => ({
  id,
  data: { title: id, date: new Date(date), phase: 'early-recovery', tags: [], draft: false, funStuff } as EntryData,
});

describe('collectFun', () => {
  it('keeps only entries with at least one fun field, newest first', () => {
    const entries = [
      make('a', '2026-07-01', { watching: 'The Bear' }),
      make('b', '2026-07-05'),                                   // no fun
      make('c', '2026-07-10', { ate: 'ramen', joy: 'sunlight' }),
    ];
    const fun = collectFun(entries);
    expect(fun.map((f) => f.slug)).toEqual(['c', 'a']);
    expect(fun[0].ate).toBe('ramen');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- funFeed`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

```ts
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
}

export function collectFun(entries: { id: string; data: EntryData }[]): FunItem[] {
  return entries
    .filter((e) => e.data.funStuff && Object.values(e.data.funStuff).some(Boolean))
    .map((e) => ({ slug: e.id, title: e.data.title, date: e.data.date, ...e.data.funStuff }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- funFeed`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: aggregate the fun-stuff feed across entries"
```

---

### Task 9: Protocol aggregation

**Files:**
- Create: `src/lib/protocols.ts`
- Test: `src/lib/protocols.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/protocols.test.ts
import { describe, it, expect } from 'vitest';
import { collectProtocols } from './protocols';
import type { EntryData } from './entry-schema';

const make = (id: string, date: string, protocols?: EntryData['protocols']): { id: string; data: EntryData } => ({
  id,
  data: { title: id, date: new Date(date), phase: 'early-recovery', tags: [], draft: false, protocols } as EntryData,
});

describe('collectProtocols', () => {
  it('returns chronological snapshots for one category', () => {
    const entries = [
      make('b', '2026-07-10', { peptides: ['BPC-157'] }),
      make('a', '2026-07-01', { medications: ['Oxy'], peptides: ['TB-500'] }),
      make('c', '2026-07-05', { medications: ['Tylenol'] }),
    ];
    const peptides = collectProtocols(entries, 'peptides');
    expect(peptides.map((p) => p.slug)).toEqual(['a', 'b']); // oldest first, only entries with peptides
    expect(peptides[0].items).toEqual(['TB-500']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- protocols`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/protocols.ts
import type { EntryData } from './entry-schema';

export type ProtocolCategory = 'medications' | 'peptides' | 'exercise';

export interface ProtocolSnapshot {
  slug: string;
  title: string;
  date: Date;
  items: string[];
}

export function collectProtocols(
  entries: { id: string; data: EntryData }[],
  category: ProtocolCategory,
): ProtocolSnapshot[] {
  return entries
    .filter((e) => (e.data.protocols?.[category]?.length ?? 0) > 0)
    .map((e) => ({ slug: e.id, title: e.data.title, date: e.data.date, items: e.data.protocols![category]! }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- protocols`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: aggregate protocols by category over time"
```

---

### Task 10: Design system stylesheet

**Files:**
- Create: `src/styles/app.css`

This is the approved design ported to real CSS: palette tokens, Public Sans, and every component class used by later tasks (header, hero, status bar, phase strip, entry cards, vitals, callouts, protocol grid, fun module, tags), plus responsive stacking.

- [ ] **Step 1: Write `src/styles/app.css`**

```css
/* ---- tokens ---- */
:root {
  --pink: #c01865;
  --pink-dark: #8e1249;
  --pink-light: #fbe4ef;
  --purple: #6a1b9a;
  --purple-light: #f3e8f9;
  --orange: #c0560a;
  --orange-light: #fbe5d6;
  --ink: #1b1b1b;
  --base: #565c65;
  --line: #dfe1e2;
  --lightest: #f7f8f9;
  --maxw: 940px;
  --font: 'Public Sans', -apple-system, system-ui, sans-serif;
}
* { box-sizing: border-box; }
html { font-family: var(--font); color: var(--ink); }
body { margin: 0; background: #fff; }
a { color: var(--pink-dark); }
.wrap { max-width: var(--maxw); margin: 0 auto; }

/* ---- site header / footer ---- */
.site-bar { display: flex; align-items: center; gap: 16px; padding: 14px 22px; border-bottom: 3px solid var(--pink); }
.site-brand { font-weight: 900; font-size: 20px; letter-spacing: -.02em; text-decoration: none; color: var(--ink); }
.site-brand .dot { color: var(--pink); }
.site-nav { margin-left: auto; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
.site-nav a { font-size: 14px; font-weight: 600; color: var(--base); text-decoration: none; }
.site-nav a.on, .site-nav a:hover { color: var(--pink-dark); }
.site-foot { padding: 18px 22px; border-top: 1px solid var(--line); background: var(--lightest); color: var(--base); font-size: 12px; line-height: 1.5; }
.site-foot .links { margin-bottom: 6px; }
.site-foot .links a { margin-right: 14px; }

/* ---- hero / status ---- */
.hero { padding: 30px 22px 22px; background: var(--lightest); border-bottom: 1px solid var(--line); }
.hero h1 { font-size: 34px; font-weight: 900; letter-spacing: -.025em; margin: 0 0 8px; line-height: 1.1; }
.hero .sub { font-size: 16px; color: var(--base); max-width: 620px; margin: 0 0 18px; line-height: 1.5; }
.statusbar { display: flex; border: 1px solid var(--line); background: #fff; border-radius: 5px; overflow: hidden; max-width: 600px; }
.statusbar .s { padding: 11px 18px; border-right: 1px solid var(--line); flex: 1; }
.statusbar .s:last-child { border-right: none; }
.statusbar .l { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--base); }
.statusbar .v { font-size: 17px; font-weight: 800; margin-top: 2px; }

/* ---- phase strip ---- */
.phases { display: flex; border-bottom: 1px solid var(--line); }
.phase { flex: 1; padding: 12px 8px; text-align: center; border-right: 1px solid var(--line); background: #fff; text-decoration: none; }
.phase:last-child { border-right: none; }
.phase .pn { font-size: 12px; font-weight: 700; color: var(--ink); }
.phase .pc { font-size: 11px; color: var(--base); margin-top: 2px; }
.phase.done { background: var(--pink-light); }
.phase.done .pn { color: var(--pink-dark); }
.phase.active { background: var(--pink); }
.phase.active .pn, .phase.active .pc { color: #fff; }
.phase.soon { opacity: .55; }

/* ---- home layout ---- */
.home-main { display: grid; grid-template-columns: 1fr 250px; }
.feed { padding: 20px 22px; border-right: 1px solid var(--line); }
.feed-hd { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--base); margin: 0 0 14px; }

/* ---- entry card (feed) ---- */
.ecard { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--line); }
.ecard:first-of-type { padding-top: 0; }
.ecard a.t { color: var(--ink); text-decoration: none; }
.ecard a.t:hover { color: var(--pink-dark); }
.ethumb { flex: 0 0 96px; height: 78px; border: 1px solid var(--line); border-radius: 4px; background: var(--pink-light); display: flex; align-items: center; justify-content: center; color: #d18ab0; font-size: 18px; overflow: hidden; }
.ethumb img { width: 100%; height: 100%; object-fit: cover; }
.ecard .b { flex: 1; min-width: 0; }
.ecard .tags { display: flex; gap: 7px; align-items: center; margin-bottom: 5px; flex-wrap: wrap; }
.daychip { font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #fff; background: var(--purple); padding: 2px 7px; border-radius: 3px; }
.phaselbl { font-size: 11px; font-weight: 700; color: var(--pink-dark); text-transform: uppercase; letter-spacing: .04em; }
.ecard h3 { font-size: 18px; font-weight: 800; margin: 0 0 4px; line-height: 1.25; }
.ecard .ex { font-size: 14px; color: var(--base); margin: 0 0 8px; line-height: 1.45; }
.ecard .meta { display: flex; gap: 14px; align-items: center; font-size: 12px; color: var(--base); flex-wrap: wrap; }
.ecard .meta b { color: var(--pink); font-weight: 800; }

/* ---- sidebar ---- */
.side { padding: 20px 18px; }
.sbox { border: 1px solid var(--line); border-radius: 5px; margin-bottom: 16px; overflow: hidden; }
.sbox .sh { padding: 9px 14px; font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: #fff; }
.sbox.start .sh { background: var(--pink); }
.sbox.fun .sh { background: var(--purple); }
.sbox.neutral .sh { background: var(--lightest); color: var(--base); }
.sbox .sb { padding: 13px 14px; font-size: 13.5px; color: #333; line-height: 1.5; }
.sbox .sb a { font-weight: 700; text-decoration: none; }
.tagcloud { display: flex; flex-wrap: wrap; gap: 6px; }
.tagcloud a { font-size: 12px; background: var(--lightest); border: 1px solid var(--line); color: var(--base); padding: 3px 8px; border-radius: 3px; font-weight: 600; text-decoration: none; }

/* ---- single entry ---- */
.entry { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid var(--line); border-top: 5px solid var(--pink); }
.entry-head { padding: 20px 24px 16px; border-bottom: 1px solid var(--line); display: flex; gap: 20px; align-items: flex-start; }
.entry-headtext { flex: 1; min-width: 0; }
.entry-tags { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.tag-phase { font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 4px 9px; border-radius: 3px; background: var(--pink); color: #fff; }
.tag-day { font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 4px 9px; border-radius: 3px; background: #fff; color: var(--purple); border: 1.5px solid var(--purple); }
.entry-date { color: var(--base); font-size: 13px; font-weight: 600; margin-top: 10px; }
.entry-title { margin: 0; font-size: 25px; font-weight: 800; line-height: 1.2; letter-spacing: -.01em; }
.entry-photo { flex: 0 0 168px; }
.entry-photo img { width: 168px; height: 122px; object-fit: cover; border: 1px solid var(--line); border-radius: 5px; }
.vitals { display: grid; grid-template-columns: repeat(4, 1fr); }
.vital { padding: 14px 12px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.vital:last-child { border-right: none; }
.vital .l { font-size: 10px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--base); }
.vital .v { font-size: 19px; font-weight: 800; margin-top: 3px; }
.entry-body { padding: 22px 24px; }
.entry-body p { margin: 0 0 16px; line-height: 1.65; font-size: 16px; color: #2c2c2c; }
.entry-body h2, .entry-body h3 { line-height: 1.25; }
.callout { padding: 14px 18px; margin: 18px 0; border-left: 5px solid; background: var(--lightest); }
.callout .l { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 7px; }
.callout ul { margin: 0; padding-left: 18px; line-height: 1.6; }
.callout.win { border-color: var(--pink); background: var(--pink-light); }
.callout.win .l { color: var(--pink-dark); }
.callout.cmp { border-color: var(--orange); background: var(--orange-light); }
.callout.cmp .l { color: var(--orange); }
.callout.ask { border-color: var(--purple); background: var(--purple-light); }
.callout.ask .l { color: var(--purple); }
.proto { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid var(--line); margin: 18px 0; }
.proto .c { padding: 14px; border-right: 1px solid var(--line); }
.proto .c:last-child { border-right: none; }
.proto .cl { font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 2px solid; }
.proto .c.m .cl { color: var(--pink-dark); border-color: var(--pink); }
.proto .c.p .cl { color: var(--purple); border-color: var(--purple); }
.proto .c.e .cl { color: var(--orange); border-color: var(--orange); }
.proto .c .txt { font-size: 13.5px; color: #333; line-height: 1.55; }
.fun { margin: 18px 0; border: 1px solid var(--purple); border-radius: 5px; overflow: hidden; }
.fun-head { background: var(--purple); color: #fff; padding: 8px 16px; font-size: 12px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
.fun-head .sub { font-weight: 600; text-transform: none; letter-spacing: 0; opacity: .85; font-size: 12px; }
.fun-grid { display: grid; grid-template-columns: 1fr 1fr; background: var(--purple-light); }
.fun-item { padding: 11px 16px; border-right: 1px solid #e3d2ee; border-bottom: 1px solid #e3d2ee; }
.fun-item:nth-child(2n) { border-right: none; }
.fun-item .l { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--purple); }
.fun-item .v { font-size: 14px; color: #33233f; margin-top: 2px; font-weight: 600; }
.entry-foot { padding: 14px 24px 20px; border-top: 1px solid var(--line); display: flex; gap: 7px; flex-wrap: wrap; align-items: center; }
.ftag { background: var(--lightest); border: 1px solid var(--line); color: var(--base); font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 3px; text-decoration: none; }

/* ---- generic content pages ---- */
.page { padding: 26px 22px; max-width: 760px; }
.page h1 { font-size: 30px; font-weight: 900; letter-spacing: -.02em; margin: 0 0 14px; }
.page h2 { font-size: 20px; margin: 26px 0 8px; }
.page p, .page li { line-height: 1.65; color: #2c2c2c; }

/* ---- search ---- */
.pagefind-ui { --pagefind-ui-primary: var(--pink); --pagefind-ui-font: var(--font); }

/* ---- responsive ---- */
@media (max-width: 720px) {
  .home-main { grid-template-columns: 1fr; }
  .feed { border-right: none; }
  .vitals { grid-template-columns: 1fr 1fr; }
  .proto, .fun-grid { grid-template-columns: 1fr; }
  .entry-head { flex-direction: column-reverse; }
  .entry-photo, .entry-photo img { width: 100%; }
  .phases { flex-wrap: wrap; }
  .phase { flex: 1 0 33%; }
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add design system stylesheet"
```

---

### Task 11: Base layout

**Files:**
- Create: `src/layouts/Base.astro`

- [ ] **Step 1: Write `src/layouts/Base.astro`**

```astro
---
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import '@fontsource/public-sans/800.css';
import '@fontsource/public-sans/900.css';
import '../styles/app.css';
import { site, disclaimerShort } from '../site.config';

interface Props {
  title?: string;
  description?: string;
  current?: string; // nav highlight key
}
const { title, description = site.description, current } = Astro.props;
const pageTitle = title ? `${title} — ${site.name}` : `${site.name} — ${site.tagline}`;
const nav = [
  { key: 'story', href: '/story', label: 'The Story' },
  { key: 'protocols', href: '/protocols', label: 'Protocols' },
  { key: 'fun', href: '/fun', label: 'Fun Stuff' },
  { key: 'about', href: '/about', label: 'About' },
  { key: 'search', href: '/search', label: 'Search' },
];
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" />
    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <link rel="alternate" type="application/rss+xml" title={site.name} href="/rss.xml" />
  </head>
  <body>
    <header class="site-bar wrap">
      <a class="site-brand" href="/">{site.name}<span class="dot">.</span></a>
      <nav class="site-nav">
        <a href="/" class={current === 'home' ? 'on' : ''}>Home</a>
        {nav.map((n) => <a href={n.href} class={current === n.key ? 'on' : ''}>{n.label}</a>)}
      </nav>
    </header>

    <main class="wrap">
      <slot />
    </main>

    <footer class="site-foot wrap">
      <div class="links">
        <a href="/story">The Story</a><a href="/search">Search</a><a href="/rss.xml">RSS</a><a href="/about">About</a>
      </div>
      <div>{disclaimerShort}</div>
    </footer>
  </body>
</html>
```

- [ ] **Step 2: Add a minimal favicon**

Create `public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#c01865"/><text x="16" y="22" font-family="sans-serif" font-size="18" font-weight="800" fill="#fff" text-anchor="middle">B</text></svg>
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add base layout with nav, footer, and disclaimer"
```

---

### Task 12: Entry-detail components

**Files:**
- Create: `src/components/VitalsStrip.astro`
- Create: `src/components/Callout.astro`
- Create: `src/components/ProtocolGrid.astro`
- Create: `src/components/FunStuff.astro`

- [ ] **Step 1: Write `src/components/VitalsStrip.astro`**

```astro
---
import type { EntryData } from '../lib/entry-schema';
interface Props { data: EntryData; }
const { data } = Astro.props;
const cells = [
  data.pain != null ? { l: 'Pain', v: `${data.pain} /10`, color: 'var(--pink)' } : null,
  data.weightBearing ? { l: 'Weight-bearing', v: data.weightBearing, color: 'var(--purple)' } : null,
  data.mobility ? { l: 'Mobility', v: data.mobility, color: 'var(--ink)' } : null,
  data.mood ? { l: 'Mood', v: data.mood, color: 'var(--ink)' } : null,
  data.swelling ? { l: 'Swelling', v: data.swelling, color: 'var(--ink)' } : null,
].filter(Boolean) as { l: string; v: string; color: string }[];
---
{cells.length > 0 && (
  <div class="vitals" style={`grid-template-columns: repeat(${cells.length}, 1fr)`}>
    {cells.map((c) => (
      <div class="vital"><div class="l">{c.l}</div><div class="v" style={`color:${c.color}`}>{c.v}</div></div>
    ))}
  </div>
)}
```

- [ ] **Step 2: Write `src/components/Callout.astro`**

```astro
---
interface Props { variant: 'win' | 'cmp' | 'ask'; label: string; items?: string[]; text?: string; }
const { variant, label, items, text } = Astro.props;
---
<div class={`callout ${variant}`}>
  <div class="l">{label}</div>
  {items && <ul>{items.map((i) => <li>{i}</li>)}</ul>}
  {text && <div>{text}</div>}
</div>
```

- [ ] **Step 3: Write `src/components/ProtocolGrid.astro`**

```astro
---
import type { EntryData } from '../lib/entry-schema';
interface Props { protocols: NonNullable<EntryData['protocols']>; }
const { protocols } = Astro.props;
const cols = [
  { cls: 'm', label: 'Medications', items: protocols.medications },
  { cls: 'p', label: 'Peptides', items: protocols.peptides },
  { cls: 'e', label: 'PT / Exercise', items: protocols.exercise },
].filter((c) => c.items && c.items.length);
---
{cols.length > 0 && (
  <div class="proto" style={`grid-template-columns: repeat(${cols.length}, 1fr)`}>
    {cols.map((c) => (
      <div class={`c ${c.cls}`}>
        <div class="cl">{c.label}</div>
        <div class="txt">{c.items!.map((i, idx) => (<>{idx > 0 && <br />}{i}</>))}</div>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 4: Write `src/components/FunStuff.astro`**

```astro
---
import type { EntryData } from '../lib/entry-schema';
interface Props { funStuff: NonNullable<EntryData['funStuff']>; }
const { funStuff } = Astro.props;
const items = [
  { l: 'Binged', v: funStuff.watching },
  { l: 'Add-to-cart casualty', v: funStuff.bought },
  { l: 'Ate', v: funStuff.ate },
  { l: 'Small joy', v: funStuff.joy },
].filter((i) => i.v);
---
{items.length > 0 && (
  <div class="fun">
    <div class="fun-head"><span>The Fun Stuff</span><span class="sub">nothing to do with my foot</span></div>
    <div class="fun-grid">
      {items.map((i) => (<div class="fun-item"><div class="l">{i.l}</div><div class="v">{i.v}</div></div>))}
    </div>
  </div>
)}
```

- [ ] **Step 5: Verify type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add entry-detail components"
```

---

### Task 13: Entry detail page

**Files:**
- Create: `src/pages/entries/[...slug].astro`
- Create: `src/content/entries/_draft-day14.md` (temporary render fixture; prefixed `_` so it never publishes; delete in Step 5)

- [ ] **Step 1: Write a temporary fixture entry** at `src/content/entries/_draft-day14.md`

> NOTE: the `_` prefix keeps this out of the published glob. We temporarily rename it to verify rendering, then remove it. (The collection only loads non-underscore files, so to actually render it in Step 4 we copy it without the underscore.)

```markdown
---
title: "Stitches out, first real look at the foot"
date: 2026-07-14
phase: early-recovery
pain: 4
weightBearing: NWB
mobility: "Knee scooter"
mood: "Hopeful"
swelling: moderate
wins:
  - "First shower without the leg cast bag, used a chair"
  - "Swelling down enough to see my ankle bone again"
protocols:
  medications: ["Tylenol 1g 3x/day", "Aspirin 81mg (DVT)"]
  peptides: ["BPC-157 250mcg 2x/day", "TB-500 weekly"]
  exercise: ["Toe wiggles 3x/day", "Ankle pumps, seated"]
comparison: "Pain about a point lower than the left foot in 2023."
funStuff:
  watching: "The Bear, S3"
  bought: "Heated foot-rest blanket"
  ate: "Real ramen a friend dropped off"
  joy: "Sun hit the couch at 4pm exactly"
tags: [suture-removal, swelling, elevation, BPC-157, NWB]
draft: false
---

Two weeks down. Dr. M took the stitches out today and the incision looks cleaner than I expected.
```

- [ ] **Step 2: Write `src/pages/entries/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import VitalsStrip from '../../components/VitalsStrip.astro';
import Callout from '../../components/Callout.astro';
import ProtocolGrid from '../../components/ProtocolGrid.astro';
import FunStuff from '../../components/FunStuff.astro';
import { site, phases } from '../../site.config';
import { dayLabel } from '../../lib/day';
import { currentPhaseId } from '../../lib/phases';

export async function getStaticPaths() {
  const all = await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true);
  return all.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

const { entry } = Astro.props;
const { data } = entry;
const { Content } = await render(entry);
const phaseLabel = phases.find((p) => p.id === data.phase)?.label ?? data.phase;
const day = dayLabel(data.date, site.surgeryDate);
const dateStr = data.date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
---
<Base title={data.title} description={data.comparison ?? data.title}>
  <article class="entry" data-pagefind-body>
    <div class="entry-head">
      <div class="entry-headtext">
        <div class="entry-tags">
          <span class="tag-phase">{phaseLabel}</span>
          <span class="tag-day">{day}</span>
        </div>
        <h1 class="entry-title">{data.title}</h1>
        <div class="entry-date">{dateStr}</div>
      </div>
      {data.photo && (
        <div class="entry-photo"><img src={data.photo} alt={data.photoAlt ?? ''} /></div>
      )}
    </div>

    <VitalsStrip data={data} />

    <div class="entry-body">
      <Content />
      {data.wins?.length && <Callout variant="win" label="Firsts & Wins" items={data.wins} />}
      {data.protocols && <ProtocolGrid protocols={data.protocols} />}
      {data.comparison && (
        <Callout variant="cmp" label={`vs. ${site.priorSurgery.label} (${site.priorSurgery.year})`} text={data.comparison} />
      )}
      {data.questionsForSurgeon?.length && <Callout variant="ask" label="Questions for my surgeon" items={data.questionsForSurgeon} />}
      {data.funStuff && <FunStuff funStuff={data.funStuff} />}
    </div>

    {data.tags.length > 0 && (
      <div class="entry-foot">
        <span style="font-size:12px;color:var(--base);font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-right:3px">Tags</span>
        {data.tags.map((t) => <a class="ftag" href={`/tags/${t}`}>{t}</a>)}
      </div>
    )}
  </article>
</Base>
```

- [ ] **Step 3: Make the fixture renderable**

Run: `cp src/content/entries/_draft-day14.md src/content/entries/draft-day14.md`
(Removing the underscore lets the glob load it temporarily.)

- [ ] **Step 4: Verify rendering**

Run: `npm run dev`
Visit `/entries/draft-day14`. Confirm: phase + day chips, vitals strip (Pain 4/10, NWB, Knee scooter, Hopeful, moderate), narrative, Wins callout (pink), protocol grid (3 columns), comparison callout (orange), Fun Stuff module (purple), tag pills linking to `/tags/...`. Stop the server.

- [ ] **Step 5: Remove the temporary published fixture**

Run: `rm src/content/entries/draft-day14.md`
(The underscore-prefixed `_draft-day14.md` stays as a reference and does not publish.)

- [ ] **Step 6: Verify build still succeeds with no published entries**

Run: `npm run build`
Expected: build completes (entries routes simply produce nothing). 0 errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add entry detail page"
```

---

### Task 14: Home components (EntryCard, PhaseStrip, StatusBar)

**Files:**
- Create: `src/components/EntryCard.astro`
- Create: `src/components/PhaseStrip.astro`
- Create: `src/components/StatusBar.astro`

- [ ] **Step 1: Write `src/components/EntryCard.astro`**

```astro
---
import type { EntryData } from '../lib/entry-schema';
import { site, phases } from '../site.config';
import { dayLabel } from '../lib/day';
interface Props { id: string; data: EntryData; excerpt?: string; }
const { id, data, excerpt } = Astro.props;
const phaseLabel = phases.find((p) => p.id === data.phase)?.label ?? data.phase;
const day = dayLabel(data.date, site.surgeryDate);
---
<div class="ecard">
  <a class="ethumb" href={`/entries/${id}`}>
    {data.photo ? <img src={data.photo} alt={data.photoAlt ?? ''} /> : '▣'}
  </a>
  <div class="b">
    <div class="tags"><span class="daychip">{day}</span><span class="phaselbl">{phaseLabel}</span></div>
    <h3><a class="t" href={`/entries/${id}`}>{data.title}</a></h3>
    {excerpt && <p class="ex">{excerpt}</p>}
    <div class="meta">
      {data.pain != null && <span>Pain <b>{data.pain}/10</b></span>}
      {data.weightBearing && <span>{data.weightBearing}</span>}
      {data.tags.length > 0 && <span>{data.tags.slice(0, 3).join(' · ')}</span>}
    </div>
  </div>
</div>
```

- [ ] **Step 2: Write `src/components/PhaseStrip.astro`**

```astro
---
import { phases } from '../site.config';
import { phaseStatus, type PhaseDef } from '../lib/phases';
import type { PhaseId } from '../lib/entry-schema';
interface Props { currentPhase: PhaseId; counts: Record<string, number>; }
const { currentPhase, counts } = Astro.props;
const labelFor = (n: number, status: string) =>
  status === 'soon' && n === 0 ? 'upcoming' : `${n} ${n === 1 ? 'entry' : 'entries'}`;
---
<nav class="phases" aria-label="Recovery phases">
  {phases.map((p: PhaseDef) => {
    const status = phaseStatus(p.id, currentPhase, phases);
    const n = counts[p.id] ?? 0;
    return (
      <a class={`phase ${status}`} href={`/phase/${p.id}`}>
        <div class="pn">{p.label}</div>
        <div class="pc">{labelFor(n, status)}</div>
      </a>
    );
  })}
</nav>
```

- [ ] **Step 3: Write `src/components/StatusBar.astro`**

```astro
---
import type { SiteStatus } from '../lib/status';
import { site, phases } from '../site.config';
import { dayLabel } from '../lib/day';
interface Props { status: SiteStatus; }
const { status } = Astro.props;
const phaseLabel = phases.find((p) => p.id === status.currentPhase)?.label ?? status.currentPhase;
const today = new Date();
const dayText = dayLabel(today, site.surgeryDate);
const surgeryStr = site.surgeryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
---
<div class="statusbar">
  <div class="s"><div class="l">Surgery</div><div class="v">{surgeryStr}</div></div>
  <div class="s"><div class="l">Currently</div><div class="v" style="color:var(--pink)">{dayText}</div></div>
  <div class="s"><div class="l">Phase</div><div class="v" style="font-size:15px">{phaseLabel}</div></div>
  <div class="s"><div class="l">Entries</div><div class="v">{status.entryCount}</div></div>
</div>
```

- [ ] **Step 4: Verify type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add home page components"
```

---

### Task 15: Home page

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/lib/excerpt.ts`
- Test: `src/lib/excerpt.test.ts`

- [ ] **Step 1: Write the failing test for the excerpt helper**

```ts
// src/lib/excerpt.test.ts
import { describe, it, expect } from 'vitest';
import { excerpt } from './excerpt';

describe('excerpt', () => {
  it('returns short text unchanged', () => {
    expect(excerpt('Short body.', 50)).toBe('Short body.');
  });
  it('truncates on a word boundary with an ellipsis', () => {
    expect(excerpt('one two three four five six', 12)).toBe('one two…');
  });
  it('strips markdown emphasis and headings', () => {
    expect(excerpt('# Title\n\n**bold** and _em_ text', 100)).toBe('Title bold and em text');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- excerpt`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/lib/excerpt.ts`**

```ts
// src/lib/excerpt.ts

/** Plain-text excerpt from markdown body, truncated on a word boundary. */
export function excerpt(markdown: string, max = 160): string {
  const text = markdown
    .replace(/^#+\s+/gm, '')        // headings
    .replace(/[*_`>#]/g, '')        // emphasis/code/quote marks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links -> text
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trim()}…`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- excerpt`
Expected: PASS (3 tests).

- [ ] **Step 5: Write `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import StatusBar from '../components/StatusBar.astro';
import PhaseStrip from '../components/PhaseStrip.astro';
import EntryCard from '../components/EntryCard.astro';
import { site, phases } from '../site.config';
import { siteStatus } from '../lib/status';
import { collectFun } from '../lib/funFeed';
import { excerpt } from '../lib/excerpt';

const all = (await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

const status = siteStatus({
  today: new Date(),
  surgeryDate: site.surgeryDate,
  phases,
  entryCount: all.length,
});

const counts: Record<string, number> = {};
for (const e of all) counts[e.data.phase] = (counts[e.data.phase] ?? 0) + 1;

const latest = all.slice(0, 8);
const tagSet = new Map<string, number>();
for (const e of all) for (const t of e.data.tags) tagSet.set(t, (tagSet.get(t) ?? 0) + 1);
const popularTags = [...tagSet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);

const fun = collectFun(all)[0];
---
<Base current="home">
  <section class="hero">
    <h1>{site.tagline}</h1>
    <p class="sub">{site.description}</p>
    <StatusBar status={status} />
  </section>

  <PhaseStrip currentPhase={status.currentPhase} counts={counts} />

  <div class="home-main">
    <div class="feed">
      <p class="feed-hd">Latest entries</p>
      {latest.length === 0 && <p style="color:var(--base)">The first entry is coming soon.</p>}
      {latest.map((e) => {
        const bodySource = (e as any).body ?? '';
        return <EntryCard id={e.id} data={e.data} excerpt={excerpt(bodySource)} />;
      })}
    </div>

    <aside class="side">
      <div class="sbox start">
        <div class="sh">New here?</div>
        <div class="sb">Start at <a href="/story">Day 1 →</a> and read the journey in order, pre-op through recovery.</div>
      </div>
      {popularTags.length > 0 && (
        <div class="sbox neutral">
          <div class="sh">Popular tags</div>
          <div class="sb"><div class="tagcloud">{popularTags.map((t) => <a href={`/tags/${t}`}>{t}</a>)}</div></div>
        </div>
      )}
      {fun && (
        <div class="sbox fun">
          <div class="sh">The Fun Stuff</div>
          <div class="sb">{fun.watching && <>Currently bingeing <b>{fun.watching}</b>. </>}<a href="/fun">See all →</a></div>
        </div>
      )}
    </aside>
  </div>
</Base>
```

- [ ] **Step 6: Verify rendering (empty state)**

Run: `npm run dev` and visit `/`.
Expected: hero with tagline + status bar (shows "Pre-op · Nd to surgery", phase "Pre-op", 0 entries), phase strip (Pre-op active, rest upcoming), feed shows "The first entry is coming soon." No crash. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add home page with status, phases, and feed"
```

---

### Task 16: Search

**Files:**
- Create: `src/pages/search.astro`

Pagefind (already added in Task 1) indexes elements marked `data-pagefind-body` at build time. The entry page added that marker in Task 13.

- [ ] **Step 1: Write `src/pages/search.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Search from 'astro-pagefind/components/Search';
---
<Base title="Search" current="search">
  <div class="page">
    <h1>Search the journal</h1>
    <p style="color:var(--base)">Search by symptom, milestone, medication, or anything else — "swelling", "BPC-157", "first shower", "driving".</p>
    <Search id="search" className="pagefind-ui" uiOptions={{ showImages: false, excerptLength: 20 }} />
  </div>
</Base>
```

- [ ] **Step 2: Build to generate the Pagefind index**

Run: `npm run build`
Expected: build succeeds; Pagefind runs as a postbuild step and prints an indexing summary (0 pages indexed is acceptable while there are no published entries).

- [ ] **Step 3: Verify the search page loads**

Run: `npm run preview` and visit `/search`.
Expected: the search input renders without console errors. (Results appear once real entries exist.) Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Pagefind search page"
```

---

### Task 17: About page with disclaimer

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Write `src/pages/about.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../site.config';
---
<Base title="About" current="about">
  <div class="page">
    <h1>About this journal</h1>
    <p>I'm charting my recovery from a foot reconstruction (osteotomies, FDL tendon transfer, spring ligament repair, plus a hammertoe correction). I've had the same surgery on the other foot, so I know the road. When I went looking for an honest, day-by-day account of what it's actually like, I couldn't find one. So I'm writing it.</p>
    <p>Each entry pairs the real story with structured details — pain, weight-bearing status, what I did for it, the wins, the setbacks — so you can scan for exactly what you're looking for or read the whole thing in order.</p>

    <h2>A note on the medical stuff</h2>
    <p>Everything on this site is my personal experience recovering from one specific surgery, in one specific body: mine. It is not medical advice, and I am not a doctor. What worked or didn't work for me may not apply to you.</p>
    <p>That goes double for anything I mention about medications, peptides, supplements, or exercises. I share my protocols because that's exactly the kind of detail I wished I could find, but listing them here is not a recommendation or endorsement. Some of them (peptides in particular) are not FDA-approved for this use. Please do not start, stop, or change anything based on my journal. Talk to your own surgeon, physician, or pharmacist first.</p>
    <p>Recovery timelines vary enormously. If something feels wrong with your own recovery, call your care team. In an emergency, call your local emergency number.</p>
  </div>
</Base>
```

- [ ] **Step 2: Verify**

Run: `npm run dev`, visit `/about`. Confirm both disclaimer sections render and the footer disclaimer shows on every page. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add about page with medical disclaimer"
```

---

> **=== MVP MILESTONE: the site is live-able after Task 19. ===**

### Task 18: First real pre-op entry

**Files:**
- Create: `src/content/entries/2026-06-10-here-we-go-again.md`

- [ ] **Step 1: Draft the entry from Emily's notes**

This is authored with Emily in chat (paste notes / voice transcript; Claude structures it). Use `_example.md` as the field template. Minimum viable starter (to be replaced with her real words):

```markdown
---
title: "Here we go again — 20 days out"
date: 2026-06-10
phase: pre-op
mood: "Ready, a little nervous"
comparison: "Going in with eyes open this time. The left foot taught me what the first two weeks really demand."
funStuff:
  watching: "TBD"
tags: [pre-op, prep, mindset]
draft: false
---

Surgery is June 30. Second verse, same as the first — this time the right foot…
```

- [ ] **Step 2: Verify it renders and validates**

Run: `npm run dev`, visit `/` and `/entries/2026-06-10-here-we-go-again`.
Expected: entry appears in the feed and renders; the build-time schema accepts it. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "content: add first pre-op entry"
```

---

### Task 19: Deploy to Vercel

> **Gate:** Deploying is outward-facing. Only run after Emily confirms, and after she is authenticated to Vercel (`vercel login`).

**Files:**
- Create: `vercel.json` (optional pin; Vercel auto-detects Astro otherwise)

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

- [ ] **Step 2: Production build locally**

Run: `npm run build`
Expected: 0 errors; `dist/` produced; Pagefind index generated.

- [ ] **Step 3: Deploy**

Run: `vercel --prod`
Expected: Vercel returns a live URL.

- [ ] **Step 4: Update the canonical site URL**

Edit `astro.config.mjs` — set `site` to the deployed URL. Rebuild/redeploy so sitemap, RSS, and canonical tags are correct.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: add Vercel config and set canonical site URL"
```

---

> **=== Secondary pages (post-MVP) ===**

### Task 20: The Story (chronological archive)

**Files:**
- Create: `src/pages/story.astro`

- [ ] **Step 1: Write `src/pages/story.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import EntryCard from '../components/EntryCard.astro';
import { excerpt } from '../lib/excerpt';

const all = (await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true))
  .sort((a, b) => a.data.date.getTime() - b.data.date.getTime()); // oldest first
---
<Base title="The Story" current="story" description="The whole recovery in order, from Day 1.">
  <div class="feed" style="max-width:760px;border-right:none">
    <h1 style="font-size:30px;font-weight:900;letter-spacing:-.02em;margin:0 0 6px">The whole story, in order</h1>
    <p style="color:var(--base);margin:0 0 20px">Start at the top and read straight through.</p>
    {all.length === 0 && <p style="color:var(--base)">Coming soon.</p>}
    {all.map((e) => <EntryCard id={e.id} data={e.data} excerpt={excerpt((e as any).body ?? '')} />)}
  </div>
</Base>
```

- [ ] **Step 2: Verify** — `npm run dev`, visit `/story`. Oldest-first order. Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add chronological story archive"
```

---

### Task 21: Phase pages

**Files:**
- Create: `src/pages/phase/[phase].astro`

- [ ] **Step 1: Write `src/pages/phase/[phase].astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import EntryCard from '../../components/EntryCard.astro';
import { excerpt } from '../../lib/excerpt';
import { phases } from '../../site.config';
import type { PhaseId } from '../../lib/entry-schema';

export async function getStaticPaths() {
  const all = await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true);
  return phases.map((p) => ({
    params: { phase: p.id },
    props: {
      label: p.label,
      entries: all
        .filter((e) => e.data.phase === (p.id as PhaseId))
        .sort((a, b) => a.data.date.getTime() - b.data.date.getTime()),
    },
  }));
}
const { label, entries } = Astro.props;
---
<Base title={label} description={`Entries from the ${label} phase.`}>
  <div class="feed" style="max-width:760px;border-right:none">
    <h1 style="font-size:30px;font-weight:900;letter-spacing:-.02em;margin:0 0 20px">{label}</h1>
    {entries.length === 0 && <p style="color:var(--base)">No entries in this phase yet.</p>}
    {entries.map((e) => <EntryCard id={e.id} data={e.data} excerpt={excerpt((e as any).body ?? '')} />)}
  </div>
</Base>
```

- [ ] **Step 2: Verify** — `npm run build` then `npm run preview`, visit `/phase/pre-op`. Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add per-phase pages"
```

---

### Task 22: Tag pages

**Files:**
- Create: `src/pages/tags/[tag].astro`

- [ ] **Step 1: Write `src/pages/tags/[tag].astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import EntryCard from '../../components/EntryCard.astro';
import { excerpt } from '../../lib/excerpt';

export async function getStaticPaths() {
  const all = await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true);
  const tags = new Set<string>();
  for (const e of all) for (const t of e.data.tags) tags.add(t);
  return [...tags].map((tag) => ({
    params: { tag },
    props: {
      tag,
      entries: all
        .filter((e) => e.data.tags.includes(tag))
        .sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
    },
  }));
}
const { tag, entries } = Astro.props;
---
<Base title={`#${tag}`} description={`Entries tagged ${tag}.`}>
  <div class="feed" style="max-width:760px;border-right:none">
    <h1 style="font-size:30px;font-weight:900;letter-spacing:-.02em;margin:0 0 20px">Tagged: {tag}</h1>
    {entries.map((e) => <EntryCard id={e.id} data={e.data} excerpt={excerpt((e as any).body ?? '')} />)}
  </div>
</Base>
```

- [ ] **Step 2: Verify** — build + preview a tag URL present in the first entry (e.g. `/tags/pre-op`). Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add per-tag pages"
```

---

### Task 23: Protocols page

**Files:**
- Create: `src/pages/protocols.astro`

- [ ] **Step 1: Write `src/pages/protocols.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import { collectProtocols, type ProtocolCategory } from '../lib/protocols';
import { site } from '../site.config';
import { dayLabel } from '../lib/day';

const all = await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true);
const cats: { key: ProtocolCategory; label: string }[] = [
  { key: 'medications', label: 'Medications' },
  { key: 'peptides', label: 'Peptides' },
  { key: 'exercise', label: 'PT / Exercise' },
];
const sections = cats.map((c) => ({ ...c, snapshots: collectProtocols(all, c.key) }));
---
<Base title="Protocols" current="protocols" description="How my medications, peptides, and PT evolved over recovery.">
  <div class="page">
    <h1>Protocols over time</h1>
    <p style="color:var(--base)">What I actually took and did, by date. Not advice — see the <a href="/about">disclaimer</a>.</p>
    {sections.map((s) => (
      <section>
        <h2>{s.label}</h2>
        {s.snapshots.length === 0 ? <p style="color:var(--base)">Nothing logged yet.</p> : (
          <ul>
            {s.snapshots.map((snap) => (
              <li>
                <a href={`/entries/${snap.slug}`}>{dayLabel(snap.date, site.surgeryDate)}</a>: {snap.items.join(', ')}
              </li>
            ))}
          </ul>
        )}
      </section>
    ))}
  </div>
</Base>
```

- [ ] **Step 2: Verify** — build + preview `/protocols`. Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add protocols-over-time page"
```

---

### Task 24: Fun Stuff feed page

**Files:**
- Create: `src/pages/fun.astro`

- [ ] **Step 1: Write `src/pages/fun.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import { collectFun } from '../lib/funFeed';
import { site } from '../site.config';
import { dayLabel } from '../lib/day';

const all = await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true);
const fun = collectFun(all);
---
<Base title="The Fun Stuff" current="fun" description="Everything that had nothing to do with my foot.">
  <div class="page">
    <h1>The Fun Stuff</h1>
    <p style="color:var(--base)">Shows, snacks, impulse buys, and small joys. The lighter side of being stuck on the couch.</p>
    {fun.length === 0 && <p style="color:var(--base)">Coming soon.</p>}
    <ul>
      {fun.map((f) => (
        <li style="margin-bottom:10px">
          <a href={`/entries/${f.slug}`}>{dayLabel(f.date, site.surgeryDate)}</a>:
          {f.watching && <> 📺 {f.watching}</>}
          {f.ate && <> · 🍜 {f.ate}</>}
          {f.bought && <> · 🛒 {f.bought}</>}
          {f.joy && <> · ✨ {f.joy}</>}
        </li>
      ))}
    </ul>
  </div>
</Base>
```

- [ ] **Step 2: Verify** — build + preview `/fun`. Stop server.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add fun-stuff feed page"
```

---

### Task 25: RSS feed

**Files:**
- Create: `src/pages/rss.xml.ts`

- [ ] **Step 1: Write `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../site.config';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const all = (await getCollection('entries', (e) => !e.data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: site.name,
    description: site.description,
    site: context.site!,
    items: all.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.comparison ?? e.data.title,
      link: `/entries/${e.id}/`,
    })),
  });
}
```

- [ ] **Step 2: Verify** — `npm run build` then `npm run preview`, visit `/rss.xml`. Valid XML. Stop server.

- [ ] **Step 3: Final full check**

Run: `npm test && npm run build`
Expected: all unit tests pass; build succeeds with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add RSS feed"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Public/discoverable, SEO → Task 1 (`site`), 11 (meta/OG), 25 (RSS), sitemap integration ✓
- Chat-based authoring, file-based → Tasks 3, 18 ✓
- Astro + Pagefind → Tasks 1, 16 ✓
- Entry data model (all fields) → Task 2 schema; rendered in Tasks 12–13 ✓
- Recovery phases / day labels / status → Tasks 4–7 (TDD), 14 ✓
- Visual design system (Legally Blonde) → Task 10 ✓
- Pages: home, entry, story, phase, tag, protocols, fun, about, search → Tasks 13, 15–17, 20–24 ✓
- Photo top-right + Fun Stuff module → Tasks 12–13 ✓
- Comparison-to-other-foot, questions-for-surgeon → Tasks 2, 13 ✓
- Medical disclaimer (footer + about) → Tasks 6, 11, 17 ✓
- Extensibility (drop a file / add a phase) → glob loader (3), config-driven phases (6), auto tag/phase pages (21–22) ✓
- Deploy to Vercel → Task 19 ✓

**Placeholder scan:** No TBD/TODO in code steps. The only intentional "TBD" is sample content inside the draft first-entry, which is real authored content to be replaced with Emily's words, not a plan gap.

**Type consistency:** `PhaseId`, `EntryData`, `PhaseDef`, `SiteStatus`, `FunItem`, `ProtocolSnapshot` defined once and imported consistently. `collectFun`/`collectProtocols`/`siteStatus`/`dayLabel`/`currentPhaseId`/`phaseStatus`/`excerpt` signatures match between definition and use.

**Note on `(e as any).body`:** Astro's content-collection entries expose the raw markdown via `.body`; it is cast because the generated types do not always surface it. If `.body` is empty in a future Astro version, the excerpt simply falls back to empty (cards still render title + meta) — no crash.
