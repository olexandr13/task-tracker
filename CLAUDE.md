# Task Tracker

A personal task tracker that fights procrastination through gamification. The gamification is
primarily **technical** (XP, levels, rules) and will grow a visual side over time. Built as a daily
routine: a long series of small steps, not one big build.

## Ground rule

**Do not add functionality without the owner's explicit approval.** Not "while I'm here" extras, not
helpful-looking adjacents. If something seems missing, propose it and wait. Ideas go in the backlog
below so nothing is lost.

## Commands

```bash
npm run dev     # dev server on http://localhost:5173
npm run test    # vitest, core rules only
npm run lint    # oxlint, including the layer boundary rule
npm run build   # type-check + production build
```

Node comes from nvm (v24). `~/.zshrc` sources it.

## Architecture

Three layers. **Dependencies point inwards only.**

| Layer | Responsibility | May import |
|---|---|---|
| `src/core/` | The rules. What a task is, what completing one means. Pure functions over plain data. | nothing else in `src/` |
| `src/storage/` | Saving and loading. | `src/core` |
| `src/app/` | React components and screen state. | `src/core`, `src/storage` |

`src/core/` is framework-free on purpose: no React, no browser APIs, no saving. That keeps the game
rules testable in isolation and reusable if a second front end ever appears. **This is enforced** —
`.oxlintrc.json` has a `no-restricted-imports` override for `src/core/**`, so `npm run lint` fails if
the boundary is crossed.

Layout is a single Vite app rather than a monorepo: the boundary is enforced by lint, not by package
ceremony. If a native app ever happens, `src/core/` moves into a workspace package.

### Conventions

- Core functions are pure and never mutate their arguments; they return new objects.
- Anything time-dependent in core takes an injectable `now: Date` so tests stay deterministic and
  future time-based rules (streaks) have a seam.
- Tasks are saved under a **versioned envelope** (`{ version, tasks }`) in `localStorage`. Changing
  the saved shape means bumping `SCHEMA_VERSION` and migrating on load — not breaking saved data.
- Ids are `crypto.randomUUID()` and timestamps are ISO 8601, so records from two devices could merge
  if sync ever lands.
- Every call site talks to the `TaskRepository` interface, never to `localStorage` directly.

## Current state (Step 1)

Add a task, see the list, complete it, delete it. Saved locally, survives a refresh.

Deliberately **not** built yet: XP/points/levels/streaks/achievements, any visual gamification, PWA
manifest and offline support, deployment, un-completing a task, editing titles, due dates,
priorities, categories, notes, device sync, backend, accounts.

## Backlog

Rough order, each one a day-sized step. Nothing here is approved until the owner says so.

1. XP on completion
2. Level curve
3. PWA + deploy, so the Pixel can install it
4. Streaks (needs completion history)
5. Device sync (Mac ↔ Pixel)
6. Quests / achievements
