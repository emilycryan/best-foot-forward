# Best Foot Forward — Recovery Journal Design Spec

**Date:** 2026-06-10
**Status:** Draft for review
**Author:** Emily Ryan (with Claude)

## Overview

A free-standing, publicly discoverable blog charting a foot reconstruction recovery,
from the days before surgery (June 30, 2026) all the way through recovery. It is
"old-school blogging with a modern, AI-structured twist": each post is a human
narrative, wrapped in machine-extracted structure (pain scale, weight-bearing,
protocols, wins, tags) that makes the journey searchable and scannable.

The motivating problem: when searching for real information about this procedure,
nothing helpful existed. This site fills that gap for the next person.

### Goals

- Capture the full arc: pre-op → surgery → non-weight-bearing → boot → walking/PT → full recovery.
- Make entries fast to author: paste rough notes (typed or phone-dictated voice memos)
  into a Claude Code chat; Claude turns them into a structured entry file for review.
- Be genuinely useful to a stranger searching for this surgery: good titles, clean
  URLs, full-text search, SEO-friendly static pages.
- Grow gracefully: adding entries, tags, or whole phases must never require a redesign.
- Keep a thread of levity ("The Fun Stuff") so it does not read like a medical chart.

### Non-goals (YAGNI)

- No runtime backend, database, login, or live "add entry" form. Authoring happens in chat.
- No comments, accounts, analytics dashboards, or newsletter in v1.
- No automatic voice transcription service. Voice notes are transcribed on the phone
  (dictation) and pasted as text.

## Audience & Privacy

Public and discoverable. Indexed by search engines. No login. The author controls
exactly what each entry contains. A clear medical disclaimer appears in the footer and
About page: this is one person's experience, not medical advice (relevant especially to
medication and peptide content).

## Authoring Workflow

1. Emily records a voice memo (phone dictation produces a transcript) or jots notes.
2. She pastes the raw text into a Claude Code session.
3. Claude drafts a structured entry: narrative body + extracted frontmatter fields
   (pain, weight-bearing, protocols, wins, comparison, fun stuff, tags, suggested title).
4. Emily reviews/edits, then the entry is saved as a markdown file and committed.
5. `astro build` regenerates the static site (new entry, updated phase counts, search
   index) and deploys.

No runtime AI. The "AI twist" is this authoring pipeline plus the structured presentation.

## Tech Stack

- **Astro** — content-driven static site generator. Entries live in a typed **content
  collection**; a Zod schema validates frontmatter at build time (a bad entry fails the
  build loudly rather than rendering broken).
- **Pagefind** — static full-text search. Indexes the built site; no backend, no API key.
- **Public Sans** — typeface (USWDS default), already installed locally.
- **Vercel** — static hosting and deploys (consistent with the author's other projects:
  push to GitHub, Vercel auto-builds).

Dependency footprint is deliberately small: Astro, the Pagefind integration, and an
RSS/sitemap helper. No UI framework, no CSS framework runtime.

## Visual Design System

USWDS structure (flat, accessible, grid-based, Public Sans) recolored away from federal
blue to a "Legally Blonde" palette. Tokens defined once in a global stylesheet:

| Token | Value | Role |
|---|---|---|
| `--pink` | `#c01865` | Primary (phase chips, accents, links) |
| `--pink-dark` | `#8e1249` | Primary text on light, headings |
| `--pink-light` | `#fbe4ef` | Tints, "wins" callout |
| `--purple` | `#6a1b9a` | Secondary (day chips, weight-bearing, "Fun Stuff") |
| `--orange` | `#c0560a` | Accent (vs.-other-foot comparison) |
| `--ink` / `--base` / `--line` / `--lightest` | `#1b1b1b` / `#565c65` / `#dfe1e2` / `#f7f8f9` | Neutrals |

Components (from approved mockups): header bar with pink rule, hero with live status
bar, phase strip, entry cards, vitals strip, summary-box callouts, protocol grid, the
purple "Fun Stuff" module, USWDS-style tag pills. Accessibility: color is never the only
signal; text labels accompany every colored element; target AA contrast.

## Information Architecture

Pages / routes:

- `/` — Home: hero + live status bar, phase strip, latest-entries feed, right rail
  (Start Here, popular tags, Fun Stuff teaser).
- `/entries/[slug]` — Individual entry (the full structured layout).
- `/story` — Full archive in chronological order ("read from Day 1").
- `/phase/[phase]` — Entries filtered to one recovery phase.
- `/tags/[tag]` — Entries for a tag.
- `/protocols` — Aggregated view of medications / peptides / exercises across entries
  (how the protocol evolved over time).
- `/fun` — "The Fun Stuff" running feed (shows / purchases / food / small joys), pulled
  from each entry's fun fields.
- `/about` — What this is, who, why, and the medical disclaimer.
- Search — Pagefind UI, reachable from the header on every page.
- `rss.xml` + `sitemap` for discoverability.

## Entry Data Model

Each entry is one markdown file in `src/content/entries/`, with frontmatter validated by
a Zod schema. All structured fields are optional except `title`, `date`, `phase`; an
entry can be pure narrative.

```yaml
---
title: "Stitches out, first real look at the foot"
date: 2026-07-14
phase: early-recovery   # pre-op | surgery | early-recovery | boot-transition | walking-pt | full-recovery
pain: 4                 # 0–10
weightBearing: NWB      # NWB | heel-touch | PWB | WBAT | FWB
mobility: "Knee scooter"
mood: "Hopeful"
swelling: moderate      # none | mild | moderate | significant
photo: "./day14.jpg"    # optional top-right image
photoAlt: "Incision along the inner arch"
wins:
  - "First shower without the cast bag"
protocols:
  medications: ["Tylenol 1g 3x/day", "Aspirin 81mg"]
  peptides: ["BPC-157 250mcg 2x/day"]
  exercise: ["Toe wiggles 3x/day", "Ankle pumps"]
comparison: "Pain about a point lower than the left foot in 2023."
questionsForSurgeon:
  - "Is the numbness along the arch normal?"
funStuff:
  watching: "The Bear, S3"
  bought: "Heated foot-rest blanket"
  ate: "Real ramen a friend dropped off"
  joy: "Sun hit the couch at 4pm"
tags: [suture-removal, swelling, BPC-157, NWB]
draft: false
---

Narrative markdown body goes here.
```

### Site configuration (one file)

```
surgeryDate: 2026-06-30
priorSurgery: { label: "Left foot", year: 2023 }
siteName: "Best Foot Forward"
phases: [ {id, label, order}, ... ]   # the recovery spine
```

The **Day label** is computed from `date − surgeryDate`: negative → "Pre-op Day N",
zero → "Surgery Day", positive → "Day N". The home status bar (current day, current
phase, entry count) derives from this config plus the entry set.

## Extensibility

- **New entry:** drop a markdown file in `src/content/entries/`. It auto-appears in the
  feed, phase page, tag pages, search index, and status counts on next build.
- **New tag:** just use it in frontmatter; its tag page generates automatically.
- **New phase:** add one entry to the `phases` config; the phase strip and routing pick
  it up. No template surgery.
- **Search:** Pagefind re-indexes the built output every build; nothing to maintain.

## Error Handling & Quality

- Invalid frontmatter (e.g. pain out of 0–10, unknown phase) fails the build with a
  clear message — fail loud, no broken pages.
- Missing optional fields simply omit their UI block; no empty shells.
- Images are optional; entries without a photo render cleanly without the placeholder.

## Deployment

- Repo at `~/Sites/recovery-journal`, pushed to GitHub, auto-deployed by Vercel as a
  static build (`astro build` → `dist/`).
- Custom domain optional and deferred; the Vercel URL works day one.

## Build Order (given <3 weeks to surgery)

1. **Core site up and deployed today:** Astro project, design-system stylesheet, content
   schema, home, entry page, About (with disclaimer), Pagefind search, Vercel deploy.
2. **First real entry:** a pre-op entry written from today's notes.
3. **Secondary pages as time allows:** `/story`, `/phase`, `/tags`, `/protocols`, `/fun`,
   RSS/sitemap.

Phase 1 delivers a live, searchable site with one real entry well before June 30.

## Open Defaults (chosen unless you object)

- Day labels use "Pre-op Day N" / "Surgery Day" / "Day N" (no "Post-op" prefix on the chip).
- "The Fun Stuff" appears both inline in entries and as its own `/fun` feed.
- Comparison-to-other-foot is an optional per-entry field, used when relevant.
- A short medical disclaimer ships in the footer and About page from day one.
