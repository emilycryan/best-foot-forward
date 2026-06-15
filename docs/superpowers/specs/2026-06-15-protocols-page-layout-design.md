# Protocols page redesign — design spec

- **Date:** 2026-06-15
- **Project:** Best Foot Forward (recovery-journal)
- **Status:** Approved for planning
- **Author:** Emily Ryan (with Claude)

## Problem

The current `/protocols` page derives its content from each entry's
`protocols:` frontmatter and renders it as a flat bulleted list
("Day X: item, item") grouped by category. It does not scale: as entries
accumulate, every category becomes a long, unscannable list. It is also
not visual, and it cannot hold information that lives only in the protocol
rather than in a journal entry.

## Goals

1. A visual, tile-based landing page that scales as categories grow.
2. Categories that lead to their own pages with authored, standalone depth,
   not just links back to entries.
3. Flexibility that varies per category and over time: some pages are rich
   prose, some are thin, some lean on an auto-built timeline of entry
   mentions.

## Decisions

Settled during brainstorming:

- **Content model:** Protocols become first-class authored content. Each
  category is its own page you write, with an optional auto-timeline pulled
  from entries.
- **Visual style:** Clean line icons now, with each tile designed so a
  custom illustration or photo can drop in per category later, with no code
  change ("icon now, art later").
- **Layout:** Option A, a flat responsive card-grid hub. Every category is
  an equal tile. Chosen over a featured/magazine layout (Option B) and
  grouped shelves (Option C) for simplicity and zero-decision scaling.

## Categories

Six to start, with room to grow. Keys are the single source of truth and
must match across the registry, the entry schema, and the collection files.

| Key | Label | Color token | Icon |
|-----|-------|-------------|------|
| `medications` | Medications | pink | pill |
| `peptides` | Peptides | purple | dna |
| `supplements` | Supplements | green (new) | leaf |
| `nutrition` | Food / Nutrition | gold (new) | apple |
| `exercise` | PT / Exercise | orange | run |
| `bodywork` | Bodywork / Massage | teal | massage |

Adding a future category is one entry in the registry plus one markdown
file. No layout or routing changes.

## Architecture

### 1. Category registry (single source of truth)

New `src/lib/protocol-categories.ts` exports an ordered array:

```ts
export const PROTOCOL_CATEGORIES = [
  { key: 'medications', label: 'Medications', color: 'pink',
    icon: 'pill', blurb: 'Pain control, then tapering off.', order: 1 },
  // ...five more
] as const;
```

Plus a derived `categoryKeys` tuple. The index grid, the entry schema, and
the in-entry protocol box all derive from this list so they never drift.

### 2. `protocols` content collection

New collection in `content.config.ts`, files at
`src/content/protocols/<key>.md`. Frontmatter:

- `key` — must match the registry.
- `showTimeline` — boolean; whether to render the entry-derived timeline.
- `image`, `imageAlt` — optional; the "art later" slot. When present the
  tile and header show the image instead of the icon.

The markdown **body** is the authored content. This is where depth lives.

### 3. Entry schema stays the tagging layer

`protocols` in entry frontmatter keeps its current shape and existing
entries validate unchanged. The allowed keys are generated from the
registry, and `supplements` and `nutrition` are added. Entries tag which
categories they touch; category pages decide how to present that.

### 4. Routing

- `/protocols` — the grid hub.
- `/protocols/[category]` — the detail page, generated from the collection
  via `getStaticPaths`.

## The grid hub (`/protocols`)

- Responsive grid: `repeat(auto-fit, minmax(180px, 1fr))`. Reflows from
  three columns to one on mobile and absorbs new categories with no layout
  change.
- Each tile, built from the registry plus a live lookup into entries:
  - **Visual slot** — the category's line icon tinted its color, or the
    `image` from the collection file if set.
  - **Label** — e.g. "PT / Exercise".
  - **Blurb** — the one-line description from the registry.
  - **Auto-stat** — computed from entries, e.g. "9 entries · since day 0".
    A category with no entries reads "New" rather than showing an empty
    stat.
  - The whole tile is one link to `/protocols/<key>`.
- Keeps the existing page intro and the disclaimer link.

## The detail page (`/protocols/[category]`)

Renders top to bottom:

1. Header: icon (or image) plus label plus blurb.
2. **Authored content** — the markdown body. Dosing, what worked, the
   rebound, however deep you want.
3. **Optional auto-timeline** — the date-by-date "Day X: items" pulled from
   entries that tagged this category, reusing the existing
   `collectProtocols` helper. Toggled per category by `showTimeline`. Each
   row links to its entry.

This gives the per-category, over-time flexibility:

- Pain meds: rich body plus timeline on.
- A thin category now: short body, timeline on so it is not empty.
- Later: flesh out the body and turn the timeline off if the prose stands
  alone.

## Visuals

### Icons (no new dependency)

A small `CategoryVisual.astro` component renders the registry `image` if
present, otherwise an inline SVG icon selected by key. Six SVG paths to
start (pill, dna, leaf, apple, run, massage), each inheriting its category
color through `currentColor`. "Art later" is dropping an `image:` line into
a category file, with no code change.

### Colors

- Reuse existing tokens: medications/pink, peptides/purple,
  exercise/orange, bodywork/teal.
- Add two token pairs in `app.css`: supplements green (`--green`,
  `--green-light`) and nutrition gold (`--gold`, `--gold-light`).
- Add the missing `--teal-light` for tile-tint consistency.

### In-entry protocol box

`ProtocolGrid.astro` currently hard-codes the same four categories. It will
read the registry instead, so it picks up Supplements and Nutrition
automatically and never drifts from the grid. Small, in-scope cleanup since
the category list is being centralized anyway.

## Files

- **New:** `src/lib/protocol-categories.ts`,
  `src/content/protocols/*.md` (six seed files),
  `src/pages/protocols/[category].astro`,
  `src/components/CategoryVisual.astro`, and a `protocols` collection entry
  in `content.config.ts`.
- **Rewritten:** `src/pages/protocols.astro` (list to grid).
- **Edited:** `src/lib/entry-schema.ts` (registry-driven keys plus the two
  new categories), `src/components/ProtocolGrid.astro` (registry-driven),
  `src/styles/app.css` (tokens plus grid and tile styles),
  `src/lib/protocols.ts` (reused; minor type alignment to the registry).
- **Tests:** extend `src/lib/protocols.test.ts` to cover the registry and
  the two new categories.

## Seeding and migration

- The six seed `protocols/*.md` files ship with the blurb, a short starter
  body, and `showTimeline: true`, so the page is fully populated on day one
  and never empty.
- No content loss. Existing entries and their `protocols:` frontmatter are
  untouched. The old bulleted page is replaced by the grid.

## Out of scope (YAGNI)

- **Featured spotlight** (Option B). Can return later as an optional flag on
  a single category if one deserves it.
- **Per-tile redirect escape hatch** that sends a tile straight to an entry.
  The detail-page model already covers "more than a link to an entry."

## Future possibilities

- Custom illustrations or photos per category through the `image` slot.
- A new category band or grouping (Option C) if the count grows past a
  comfortable single grid.
