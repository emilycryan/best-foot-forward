# Fun Stuff redesign — design

**Date:** 2026-06-17
**Status:** Approved (design); pending implementation

## Goal

Rebuild the `/fun` page to mirror the `/protocols` structure: a grid of icon
tiles, each linking to an in-depth category page the author edits directly. The
one deliberate difference from Protocols: Fun Stuff does **not** link to or pull
from blog entries. Where a protocol page shows a "Timeline from the journal,"
a fun page shows a self-contained list of picks, each with an optional
"where to buy/find" link.

## Categories (tiles)

Five categories, in this order. Each gets a color (existing CSS theme var) and a
new icon.

| Order | Key               | Label             | Color  | Icon    |
|-------|-------------------|-------------------|--------|---------|
| 1     | `watching`        | Watching          | purple | tv      |
| 2     | `reading-listening` | Reading/Listening | teal   | book    |
| 3     | `eating`          | Eating            | gold   | cookie  |
| 4     | `random-buys`     | Random Buys       | pink   | bag     |
| 5     | `simple-joys`     | Simple Joys       | orange | sparkle |

Blurbs (one line each, editable):
- Watching: shows, movies, the binge list.
- Reading/Listening: books, podcasts, music.
- Eating: snacks, treats, comfort food.
- Random Buys: impulse buys and gear that showed up at the door.
- Simple Joys: the small intangible good moments.

## Architecture (parallels Protocols)

- **`src/lib/fun-categories.ts`** — mirrors `protocol-categories.ts`. Exports
  `FUN_CATEGORIES` (the table above), `funCategoryKeys`, and `getFunCategory()`.
- **`fun` content collection** (`src/content/fun/*.md`), one file per category,
  filename = key. Registered in `src/content.config.ts`.
- **`CategoryVisual.astro`** — add the five new icon paths (tv, book, cookie,
  bag, sparkle) to the existing `paths` map. The component already accepts any
  `icon` string, so it is reused as-is for both sections.
- **CSS** — reuse the existing `.proto-grid`, `.proto-tile`, `.proto-detail`,
  `.proto-back`, `.pv` styles. No new styles needed; the two sections render
  identically.

### Fun content schema

```ts
z.object({
  image: z.string().optional(),       // header/tile image (overrides the icon)
  imageAlt: z.string().optional(),
  picks: z.array(z.object({
    name: z.string(),
    note: z.string().optional(),      // one-line description
    url: z.string().optional(),       // "Find it →" link (Amazon, etc.)
    image: z.string().optional(),     // optional thumbnail
    imageAlt: z.string().optional(),
  })).optional(),
})
```

The markdown body is the author's freeform intro for the category.

## Pages

- **`src/pages/fun.astro`** (rewrite) — grid of tiles, same markup/classes as
  `protocols.astro`. Each tile's stat line shows a **pick count** derived from
  the category file's `picks` length: `"7 picks →"`, or `"New"` when empty.
- **`src/pages/fun/[category].astro`** (new) — `getStaticPaths` over
  `FUN_CATEGORIES`. Renders: back link → header (icon/image + label + blurb) →
  markdown body (if present) → picks cards. Each card shows name, optional note,
  optional thumbnail, and a "Find it →" link **only** when `url` is set. Empty
  state when there is no body and no picks.
- **No** "Timeline from the journal" section. **No** links to blog entries.

## Out of scope (intentionally unchanged)

- **Per-entry fun block** (`FunStuff.astro` on `entries/[...slug].astro`) stays.
  That is an entry showing its own day's fun, not the `/fun` page linking out.
- **Homepage teaser** ("Currently bingeing… See all →") stays and still points
  at `/fun`. It continues to read from entry `funStuff` via `funFeed.ts`.
- `entry-schema.ts` `funStuff` field, `funFeed.ts`, and `collectFun` are
  untouched.

## Seed content

Create all five category files with a starter blurb body. Migrate the existing
brown sugar Oreos into `eating.md` as the first real pick, reusing its photo at
`/entries/brownsugar-oreos.png`, so the page ships non-empty.

## Verification

- `npm run build` passes (schema validates, all `/fun/*` routes generate).
- Preview `/fun` (grid of 5 tiles) and at least `/fun/eating` (write-up + the
  Oreos pick with a working "Find it →" link) and one empty category.
```
