# Protocols Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat bulleted `/protocols` list with a visual, scalable card-grid hub where each category links to its own authored page that can also show an auto-timeline from journal entries.

**Architecture:** A single category registry (`protocol-categories.ts`) is the source of truth for keys, labels, colors, icons, blurbs, and order. The entry schema and the in-entry protocol box derive their categories from it. A new `protocols` content collection holds one markdown file per category for authored depth and per-category flags. The grid (`/protocols`) is generated from the registry; each detail page (`/protocols/[category]`) renders the authored body plus an optional entry-derived timeline.

**Tech Stack:** Astro 6 content collections, Zod (via `astro:content`), TypeScript, Vitest, plain CSS tokens. No new dependencies; icons are inline SVG.

**Repo:** All paths are in `/Users/63172/Sites/recovery-journal`. This session's working directory is the DDT repo, so run every command from the recovery-journal directory (e.g. `cd /Users/63172/Sites/recovery-journal && npm test`).

**Commits:** Per Emily's git rule, do not commit proactively. The commit steps below are real checkpoints, but run them only on Emily's explicit go-ahead (or batch and ask at each review point).

---

## File Structure

**New files**
- `src/lib/protocol-categories.ts` — the category registry: definitions, derived keys, `getCategory` lookup. No imports; the root of the dependency graph.
- `src/content/protocols/{medications,peptides,supplements,nutrition,exercise,bodywork}.md` — one authored page per category. Filename equals the category key.
- `src/components/CategoryVisual.astro` — renders a category's image if set, else its inline SVG line icon (color via `currentColor`).
- `src/pages/protocols/[category].astro` — the detail page (header + authored body + optional timeline).
- `src/lib/protocol-categories.test.ts` — registry unit tests.

**Modified files**
- `src/lib/entry-schema.ts` — build the `protocols` shape from `categoryKeys`; this adds `supplements` and `nutrition` automatically.
- `src/lib/protocols.ts` — re-export `ProtocolCategory` from the registry; add `protocolStat`.
- `src/lib/protocols.test.ts` — add `protocolStat` tests.
- `src/content.config.ts` — register the `protocols` collection.
- `src/pages/protocols.astro` — rewrite from list to grid.
- `src/components/ProtocolGrid.astro` — drive columns from the registry.
- `src/styles/app.css` — add color tokens (green, gold, teal-light) and grid/tile/detail styles; drop the now-unused `.proto .c.m/.p/.e/.b` color rules.

---

## Task 1: Category registry

**Files:**
- Create: `src/lib/protocol-categories.ts`
- Test: `src/lib/protocol-categories.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/protocol-categories.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PROTOCOL_CATEGORIES, categoryKeys, getCategory } from './protocol-categories';

describe('protocol categories registry', () => {
  it('defines six categories with unique keys', () => {
    expect(PROTOCOL_CATEGORIES).toHaveLength(6);
    expect(new Set(categoryKeys).size).toBe(6);
  });

  it('uses unique sequential order values', () => {
    const orders = PROTOCOL_CATEGORIES.map((c) => c.order).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('gives every category the required display fields', () => {
    for (const c of PROTOCOL_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(0);
      expect(c.color).toBeTruthy();
      expect(c.icon).toBeTruthy();
    }
  });

  it('looks categories up by key', () => {
    expect(getCategory('medications')?.label).toBe('Medications');
    expect(getCategory('not-a-category')).toBeUndefined();
  });

  it('includes the two new categories', () => {
    expect(categoryKeys).toContain('supplements');
    expect(categoryKeys).toContain('nutrition');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/63172/Sites/recovery-journal && npx vitest run src/lib/protocol-categories.test.ts`
Expected: FAIL with a module-not-found error for `./protocol-categories`.

- [ ] **Step 3: Write the registry**

Create `src/lib/protocol-categories.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/63172/Sites/recovery-journal && npx vitest run src/lib/protocol-categories.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/lib/protocol-categories.ts src/lib/protocol-categories.test.ts
git commit -m "feat(protocols): add category registry as single source of truth"
```

---

## Task 2: Drive the entry schema and ProtocolCategory type from the registry

**Files:**
- Modify: `src/lib/entry-schema.ts:21-26` (the `protocols` object)
- Modify: `src/lib/protocols.ts:1-4` (the `ProtocolCategory` type)
- Test: `src/lib/entry-schema.test.ts`

- [ ] **Step 1: Add a failing test for the new categories**

Append to `src/lib/entry-schema.test.ts` inside the `describe('entrySchema', ...)` block (before the closing `});`):

```ts
  it('accepts supplements and nutrition protocols', () => {
    const parsed = entrySchema.parse({
      title: 'x', date: '2026-06-30', phase: 'surgery',
      protocols: { supplements: ['Vitamin D'], nutrition: ['Protein, 100g/day'] },
    });
    expect(parsed.protocols?.supplements).toEqual(['Vitamin D']);
    expect(parsed.protocols?.nutrition).toEqual(['Protein, 100g/day']);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/63172/Sites/recovery-journal && npx vitest run src/lib/entry-schema.test.ts`
Expected: FAIL — `supplements`/`nutrition` are stripped by the current schema, so `parsed.protocols?.supplements` is `undefined`.

- [ ] **Step 3: Build the protocols shape from the registry**

In `src/lib/entry-schema.ts`, add the import below the existing `import { z } from 'zod';` line:

```ts
import { categoryKeys } from './protocol-categories';
```

Replace the current `protocols` block (lines 21-26):

```ts
  protocols: z.object({
    medications: z.array(z.string()).optional(),
    peptides: z.array(z.string()).optional(),
    exercise: z.array(z.string()).optional(),
    bodywork: z.array(z.string()).optional(),
  }).optional(),
```

with a registry-driven shape. First, above `export const entrySchema = z.object({`, add:

```ts
const protocolsShape = Object.fromEntries(
  categoryKeys.map((k) => [k, z.array(z.string()).optional()]),
);
```

Then inside `entrySchema`, replace the removed block with:

```ts
  protocols: z.object(protocolsShape).optional(),
```

- [ ] **Step 4: Point ProtocolCategory at the registry**

In `src/lib/protocols.ts`, replace the type declaration on line 4:

```ts
export type ProtocolCategory = 'medications' | 'peptides' | 'exercise' | 'bodywork';
```

with a re-export of the registry type. Change the top of the file from:

```ts
// src/lib/protocols.ts
import type { EntryData } from './entry-schema';

export type ProtocolCategory = 'medications' | 'peptides' | 'exercise' | 'bodywork';
```

to:

```ts
// src/lib/protocols.ts
import type { EntryData } from './entry-schema';
import type { ProtocolCategory } from './protocol-categories';

export type { ProtocolCategory };
```

- [ ] **Step 5: Run the lib tests to verify everything passes**

Run: `cd /Users/63172/Sites/recovery-journal && npx vitest run src/lib/entry-schema.test.ts src/lib/protocols.test.ts`
Expected: PASS. The new categories test passes and the existing `collectProtocols` tests still pass.

- [ ] **Step 6: Type-check**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 7: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/lib/entry-schema.ts src/lib/entry-schema.test.ts src/lib/protocols.ts
git commit -m "feat(protocols): derive entry protocol keys from the registry"
```

---

## Task 3: protocolStat helper

**Files:**
- Modify: `src/lib/protocols.ts` (append helper)
- Test: `src/lib/protocols.test.ts`

- [ ] **Step 1: Write the failing test**

In `src/lib/protocols.test.ts`, update the import on line 3 to include the new helper:

```ts
import { collectProtocols, protocolStat } from './protocols';
```

Then append a new describe block at the end of the file (after the existing `describe('collectProtocols', ...)` block):

```ts
describe('protocolStat', () => {
  it('counts matching entries and finds the earliest date', () => {
    const entries = [
      make('b', '2026-07-10', { medications: ['Oxy'] }),
      make('a', '2026-07-01', { medications: ['Oxy'] }),
      make('c', '2026-07-05', { peptides: ['BPC-157'] }),
    ];
    const stat = protocolStat(entries, 'medications');
    expect(stat.count).toBe(2);
    expect(stat.firstDate).toEqual(new Date('2026-07-01'));
  });

  it('returns zero and null when nothing matches', () => {
    expect(protocolStat([], 'supplements')).toEqual({ count: 0, firstDate: null });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/63172/Sites/recovery-journal && npx vitest run src/lib/protocols.test.ts`
Expected: FAIL — `protocolStat` is not exported.

- [ ] **Step 3: Implement the helper**

Append to `src/lib/protocols.ts`:

```ts
export interface ProtocolStat {
  count: number;
  firstDate: Date | null;
}

export function protocolStat(
  entries: { id: string; data: EntryData }[],
  category: ProtocolCategory,
): ProtocolStat {
  const matches = entries.filter((e) => (e.data.protocols?.[category]?.length ?? 0) > 0);
  if (matches.length === 0) return { count: 0, firstDate: null };
  const firstDate = matches.reduce(
    (min, e) => (e.data.date < min ? e.data.date : min),
    matches[0].data.date,
  );
  return { count: matches.length, firstDate };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/63172/Sites/recovery-journal && npx vitest run src/lib/protocols.test.ts`
Expected: PASS (4 tests total).

- [ ] **Step 5: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/lib/protocols.ts src/lib/protocols.test.ts
git commit -m "feat(protocols): add protocolStat for tile counts and first-seen date"
```

---

## Task 4: protocols content collection and seed files

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/protocols/medications.md`, `peptides.md`, `supplements.md`, `nutrition.md`, `exercise.md`, `bodywork.md`

- [ ] **Step 1: Register the collection**

Replace the entire contents of `src/content.config.ts` with:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { entrySchema } from './lib/entry-schema';

const entries = defineCollection({
  // `[^_]` skips files beginning with `_` (templates/drafts-in-waiting).
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/entries' }),
  schema: entrySchema,
});

const protocols = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/protocols' }),
  schema: z.object({
    showTimeline: z.boolean().default(true),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = { entries, protocols };
```

- [ ] **Step 2: Create the six seed files**

Create `src/content/protocols/medications.md`:

```md
---
showTimeline: true
---

Pain management was the first protocol that actually mattered. This page tracks what I took, in what order, and how I stepped down off it.

_More detail coming as I write it up._
```

Create `src/content/protocols/peptides.md`:

```md
---
showTimeline: true
---

What I used for tissue healing, why I chose it, and how I worked it in alongside everything else.

_More detail coming as I write it up._
```

Create `src/content/protocols/supplements.md`:

```md
---
showTimeline: true
---

The daily supplements I leaned on for bone and soft-tissue recovery.

_More detail coming as I write it up._
```

Create `src/content/protocols/nutrition.md`:

```md
---
showTimeline: true
---

How I ate to support healing: protein targets, anti-inflammatory choices, and the things that actually helped.

_More detail coming as I write it up._
```

Create `src/content/protocols/exercise.md`:

```md
---
showTimeline: true
---

The PT and movement progression, from early range-of-motion work through weight-bearing.

_More detail coming as I write it up._
```

Create `src/content/protocols/bodywork.md`:

```md
---
showTimeline: true
---

Scar mobilization, lymphatic work, and the bodywork that kept the rest of me from seizing up while my foot healed.

_More detail coming as I write it up._
```

- [ ] **Step 3: Verify the collection builds**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check`
Expected: 0 errors. Astro generates types for the `protocols` collection.

- [ ] **Step 4: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/content.config.ts src/content/protocols
git commit -m "feat(protocols): add protocols content collection and seed pages"
```

---

## Task 5: Category color tokens

**Files:**
- Modify: `src/styles/app.css:11` (after the `--teal` line)

- [ ] **Step 1: Add the new tokens**

In `src/styles/app.css`, find the line:

```css
  --teal: #1a7d8c;
```

Add immediately after it:

```css
  --teal-light: #ddf1f3;
  --green: #2e7d32;
  --green-light: #e7f2e3;
  --gold: #9a7b0a;
  --gold-light: #f7eec9;
```

- [ ] **Step 2: Verify the build still compiles CSS**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check`
Expected: 0 errors.

- [ ] **Step 3: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/styles/app.css
git commit -m "feat(protocols): add green, gold, and teal-light color tokens"
```

---

## Task 6: CategoryVisual component

**Files:**
- Create: `src/components/CategoryVisual.astro`

- [ ] **Step 1: Create the component**

Create `src/components/CategoryVisual.astro`:

```astro
---
interface Props { icon: string; image?: string; imageAlt?: string; }
const { icon, image, imageAlt } = Astro.props;

const paths: Record<string, string> = {
  pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5"/><line x1="12" y1="8.5" x2="12" y2="15.5"/>',
  flask: '<path d="M9 3h6"/><path d="M10 3v5.5L5.6 16.5A1.6 1.6 0 0 0 7 19h10a1.6 1.6 0 0 0 1.4-2.5L14 8.5V3"/><line x1="8.5" y1="14" x2="15.5" y2="14"/>',
  leaf: '<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5 19c3.5-3.5 7.5-5.5 11-6.5"/>',
  apple: '<path d="M12 8C10 5.5 5.5 6.5 5 10.5 4.5 15 8 19.5 11 20c.7.1 1.3.1 2 0 3-.5 6.5-5 6-9.5-.5-4-5-5-7-2.5z"/><path d="M12 8c0-2 1.2-3.2 3.2-3.4"/>',
  dumbbell: '<path d="M3 9.5v5M6.5 7.5v9M17.5 7.5v9M21 9.5v5"/><line x1="6.5" y1="12" x2="17.5" y2="12"/>',
  hand: '<path d="M8.5 12V6.2a1.5 1.5 0 0 1 3 0V11m0-5.3a1.5 1.5 0 0 1 3 0V11m0-3.3a1.5 1.5 0 0 1 3 0V15c0 3.3-2.2 5.5-5.5 5.5h-1.4c-1.9 0-3-.8-4-2.4l-2-3.2a1.5 1.5 0 0 1 2.3-1.9l1.2 1.3"/>',
};
const inner = paths[icon] ?? paths.pill;
---
{image ? (
  <img src={image} alt={imageAlt ?? ''} />
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" set:html={inner}></svg>
)}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check`
Expected: 0 errors. (The component is not imported yet; this just confirms it parses.)

- [ ] **Step 3: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/components/CategoryVisual.astro
git commit -m "feat(protocols): add CategoryVisual icon/image component"
```

---

## Task 7: Rewrite the /protocols grid hub

**Files:**
- Modify: `src/pages/protocols.astro` (full rewrite)
- Modify: `src/styles/app.css` (append grid/tile styles before the `/* ---- responsive ---- */` block, around line 159)

- [ ] **Step 1: Add the grid and tile styles**

In `src/styles/app.css`, immediately before the line `/* ---- responsive ---- */`, insert:

```css
/* ---- protocols grid hub ---- */
.proto-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin: 22px 0 8px; }
.proto-tile { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: 8px; padding: 16px 16px 14px; text-decoration: none; background: #fff; transition: border-color .15s, box-shadow .15s, transform .15s; }
.proto-tile:hover { border-color: currentColor; transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
.proto-tile .pv { width: 44px; height: 44px; border-radius: 9px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.proto-tile .pv svg { width: 26px; height: 26px; }
.proto-tile .pv img { width: 100%; height: 100%; object-fit: cover; border-radius: 9px; }
.proto-tile h2 { font-size: 17px; font-weight: 800; margin: 0 0 3px; letter-spacing: -.01em; color: var(--ink); }
.proto-tile .blurb { font-size: 13.5px; color: var(--base); line-height: 1.45; margin: 0 0 12px; flex: 1; }
.proto-tile .stat { font-size: 12px; color: var(--base); font-weight: 600; }
.proto-tile .stat .arr { display: inline-block; transition: transform .15s; }
.proto-tile:hover .stat .arr { transform: translateX(3px); }
```

- [ ] **Step 2: Rewrite the page**

Replace the entire contents of `src/pages/protocols.astro` with:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import CategoryVisual from '../components/CategoryVisual.astro';
import { PROTOCOL_CATEGORIES } from '../lib/protocol-categories';
import { protocolStat } from '../lib/protocols';
import { site } from '../site.config';
import { dayLabel } from '../lib/day';

const all = await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true);
const pages = await getCollection('protocols');

const cats = [...PROTOCOL_CATEGORIES]
  .sort((a, b) => a.order - b.order)
  .map((c) => {
    const page = pages.find((p) => p.id === c.key);
    return { ...c, image: page?.data.image, imageAlt: page?.data.imageAlt, stat: protocolStat(all, c.key) };
  });

const statLabel = (count: number, firstDate: Date | null) => {
  if (count === 0 || !firstDate) return 'New';
  const noun = count === 1 ? 'entry' : 'entries';
  return `${count} ${noun} · since ${dayLabel(firstDate, site.surgeryDate)}`;
};
---
<Base title="Protocols" current="protocols" description="What I actually took and did over recovery, organized by category.">
  <div class="page">
    <h1>Protocols</h1>
    <p style="color:var(--base)">What I actually took and did, organized by category. Not advice — see the <a href="/about">disclaimer</a>.</p>
    <div class="proto-grid">
      {cats.map((c) => (
        <a class="proto-tile" href={`/protocols/${c.key}`} style={`color: var(--${c.color})`}>
          <span class="pv" style={`background: var(--${c.color}-light)`}>
            <CategoryVisual icon={c.icon} image={c.image} imageAlt={c.imageAlt} />
          </span>
          <h2>{c.label}</h2>
          <p class="blurb">{c.blurb}</p>
          <span class="stat">{statLabel(c.stat.count, c.stat.firstDate)} <span class="arr">→</span></span>
        </a>
      ))}
    </div>
  </div>
</Base>
```

- [ ] **Step 3: Type-check and build**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check && npm run build`
Expected: 0 errors; build completes and emits `/protocols/index.html`.

- [ ] **Step 4: Visually verify the grid**

Start the dev server (`cd /Users/63172/Sites/recovery-journal && npm run dev`) and load `/protocols` in the preview. Confirm:
- Six tiles in a reflowing grid, each with a colored icon, label, blurb, and a stat line.
- Medications/Peptides/PT/Bodywork show real counts; Supplements/Nutrition read "New" (no entries tag them yet).
- Hover lifts the tile and the border picks up the category color.

- [ ] **Step 5: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/pages/protocols.astro src/styles/app.css
git commit -m "feat(protocols): replace list with visual category grid"
```

---

## Task 8: Category detail page

**Files:**
- Create: `src/pages/protocols/[category].astro`
- Modify: `src/styles/app.css` (append detail styles before the `/* ---- responsive ---- */` block, after the grid styles from Task 7)

- [ ] **Step 1: Add the detail styles**

In `src/styles/app.css`, immediately after the `.proto-tile:hover .stat .arr` rule added in Task 7 (still before `/* ---- responsive ---- */`), insert:

```css
/* ---- protocols detail ---- */
.proto-back { display: inline-block; font-size: 13px; font-weight: 700; color: var(--pink-dark); text-decoration: none; margin-bottom: 14px; }
.proto-detail-head { display: flex; align-items: center; gap: 14px; padding-bottom: 16px; border-bottom: 2px solid; margin-bottom: 20px; }
.proto-detail-head .pv { flex: 0 0 52px; height: 52px; border-radius: 11px; display: flex; align-items: center; justify-content: center; }
.proto-detail-head .pv svg { width: 30px; height: 30px; }
.proto-detail-head .pv img { width: 100%; height: 100%; object-fit: cover; border-radius: 11px; }
.proto-detail-head h1 { margin: 0; color: var(--ink); }
.proto-detail-head .blurb { margin: 4px 0 0; color: var(--base); font-size: 15px; }
.proto-body { line-height: 1.65; }
.proto-body p { margin: 0 0 16px; color: #2c2c2c; }
.proto-timeline { margin-top: 26px; padding-top: 18px; border-top: 1px solid var(--line); }
.proto-timeline h2 { font-size: 16px; margin: 0 0 10px; }
.proto-timeline ul { margin: 0; padding-left: 18px; line-height: 1.7; color: #2c2c2c; }
.proto-timeline li { margin-bottom: 4px; }
```

- [ ] **Step 2: Create the page**

Create `src/pages/protocols/[category].astro`:

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '../../layouts/Base.astro';
import CategoryVisual from '../../components/CategoryVisual.astro';
import { PROTOCOL_CATEGORIES, getCategory } from '../../lib/protocol-categories';
import { collectProtocols } from '../../lib/protocols';
import { site } from '../../site.config';
import { dayLabel } from '../../lib/day';

export async function getStaticPaths() {
  const pages = await getCollection('protocols');
  return PROTOCOL_CATEGORIES.map((cat) => ({
    params: { category: cat.key },
    props: { page: pages.find((p) => p.id === cat.key) ?? null },
  }));
}

const { category } = Astro.params;
const { page } = Astro.props;
const cat = getCategory(category!)!;

const all = await getCollection('entries', (e) => import.meta.env.PROD ? !e.data.draft : true);
const showTimeline = page?.data.showTimeline ?? true;
const timeline = showTimeline ? collectProtocols(all, cat.key) : [];
const Content = page ? (await render(page)).Content : null;
---
<Base title={cat.label} current="protocols" description={cat.blurb}>
  <div class="page proto-detail">
    <a class="proto-back" href="/protocols">← All protocols</a>
    <div class="proto-detail-head" style={`color: var(--${cat.color})`}>
      <span class="pv" style={`background: var(--${cat.color}-light)`}>
        <CategoryVisual icon={cat.icon} image={page?.data.image} imageAlt={page?.data.imageAlt} />
      </span>
      <div>
        <h1>{cat.label}</h1>
        <p class="blurb">{cat.blurb}</p>
      </div>
    </div>

    {Content && <div class="proto-body"><Content /></div>}

    {timeline.length > 0 && (
      <section class="proto-timeline">
        <h2>Timeline from the journal</h2>
        <ul>
          {timeline.map((snap) => (
            <li>
              <a href={`/entries/${snap.slug}`}>{dayLabel(snap.date, site.surgeryDate)}</a>: {snap.items.join(', ')}
            </li>
          ))}
        </ul>
      </section>
    )}

    {!Content && timeline.length === 0 && (
      <p style="color:var(--base)">Nothing logged here yet.</p>
    )}
  </div>
</Base>
```

- [ ] **Step 3: Type-check and build**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check && npm run build`
Expected: 0 errors; build emits `/protocols/medications/index.html` and the other five category pages.

- [ ] **Step 4: Visually verify a detail page**

In the preview, click the Medications tile (or load `/protocols/medications`). Confirm:
- Header shows the colored icon, "Medications", the blurb, and a category-colored underline.
- The seed body paragraph renders.
- A "Timeline from the journal" section lists dated entries linking back to entries.
- Load `/protocols/supplements`: body renders, timeline section is absent (no entries), and no "Nothing logged" line appears because the body is present.

- [ ] **Step 5: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add 'src/pages/protocols/[category].astro' src/styles/app.css
git commit -m "feat(protocols): add per-category detail page with optional timeline"
```

---

## Task 9: Drive the in-entry ProtocolGrid from the registry

**Files:**
- Modify: `src/components/ProtocolGrid.astro` (full rewrite)
- Modify: `src/styles/app.css:119-127` (the `.proto` block: drop the `.c.m/.p/.e/.b` color rules, keep base styles)

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `src/components/ProtocolGrid.astro` with:

```astro
---
import type { EntryData } from '../lib/entry-schema';
import { PROTOCOL_CATEGORIES } from '../lib/protocol-categories';
interface Props { protocols: NonNullable<EntryData['protocols']>; }
const { protocols } = Astro.props;
const cols = PROTOCOL_CATEGORIES
  .map((c) => ({ label: c.label, color: c.color, items: protocols[c.key] }))
  .filter((c) => c.items && c.items.length);
---
{cols.length > 0 && (
  <div class="proto" style={`grid-template-columns: repeat(${cols.length}, 1fr)`}>
    {cols.map((c) => (
      <div class="c">
        <div class="cl" style={`color: var(--${c.color}); border-color: var(--${c.color})`}>{c.label}</div>
        <div class="txt">{c.items!.map((i, idx) => (<>{idx > 0 && <br />}{i}</>))}</div>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 2: Simplify the .proto CSS**

In `src/styles/app.css`, replace the `.proto` block (currently lines 119-127):

```css
.proto { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid var(--line); margin: 18px 0; }
.proto .c { padding: 14px; border-right: 1px solid var(--line); }
.proto .c:last-child { border-right: none; }
.proto .cl { font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 2px solid; }
.proto .c.m .cl { color: var(--pink-dark); border-color: var(--pink); }
.proto .c.p .cl { color: var(--purple); border-color: var(--purple); }
.proto .c.e .cl { color: var(--orange); border-color: var(--orange); }
.proto .c.b .cl { color: var(--teal); border-color: var(--teal); }
.proto .c .txt { font-size: 13.5px; color: #333; line-height: 1.55; }
```

with:

```css
.proto { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid var(--line); margin: 18px 0; }
.proto .c { padding: 14px; border-right: 1px solid var(--line); }
.proto .c:last-child { border-right: none; }
.proto .cl { font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 7px; padding-bottom: 6px; border-bottom: 2px solid; }
.proto .c .txt { font-size: 13.5px; color: #333; line-height: 1.55; }
```

- [ ] **Step 3: Type-check and build**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check && npm run build`
Expected: 0 errors.

- [ ] **Step 4: Visually verify inside an entry**

In the preview, open `/entries/2026-06-14-knots-landing` (it tags `bodywork`). Confirm the in-entry protocol box still renders the Bodywork / Massage column with its teal heading. The colors now come from the registry, and Supplements/Nutrition columns will appear automatically on any entry that tags them.

- [ ] **Step 5: Commit** (on go-ahead)

```bash
cd /Users/63172/Sites/recovery-journal
git add src/components/ProtocolGrid.astro src/styles/app.css
git commit -m "refactor(protocols): drive in-entry protocol box from the registry"
```

---

## Task 10: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd /Users/63172/Sites/recovery-journal && npm test`
Expected: all suites pass (day, entry-schema, excerpt, funFeed, phases, protocols, protocol-categories, status).

- [ ] **Step 2: Type-check**

Run: `cd /Users/63172/Sites/recovery-journal && npm run check`
Expected: 0 errors, 0 warnings, 0 hints.

- [ ] **Step 3: Production build**

Run: `cd /Users/63172/Sites/recovery-journal && npm run build`
Expected: clean build. Confirm the output includes `protocols/index.html` plus a folder for each of the six categories.

- [ ] **Step 4: Final preview pass**

Build and preview (`npm run build && npm run preview`, or the `recovery-journal-dist` preview profile on port 8793). Walk the full flow: home → Protocols (grid) → each category page → an entry link from a timeline → back. Check the grid reflows to one column on a narrow viewport.

- [ ] **Step 5: Commit any verification fixes** (on go-ahead)

Only if Steps 1-4 surfaced fixes:

```bash
cd /Users/63172/Sites/recovery-journal
git add -A
git commit -m "fix(protocols): address verification findings"
```

---

## Self-Review Notes

- **Spec coverage:** Card-grid hub (Task 7), per-category authored pages with optional timeline (Tasks 4, 8), six categories + registry growth path (Task 1), entry schema gains supplements/nutrition (Task 2), icon-now-art-later via `image` slot (Tasks 6, 8), color tokens (Task 5), in-entry box synced to registry (Task 9). Out-of-scope items (featured spotlight, redirect escape hatch) are intentionally absent.
- **Type consistency:** `ProtocolCategory` is defined once (Task 1) and re-exported (Task 2); `protocolStat`/`ProtocolStat` (Task 3) and `collectProtocols` are used with matching signatures in Tasks 7 and 8; `CategoryVisual` props (`icon`, `image`, `imageAlt`) match every call site.
- **No placeholders:** every code step shows complete code; commands include expected output.
