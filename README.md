# Task Tracker

A personal task tracker that fights procrastination through gamification.

Web app (React + TypeScript + Vite + Tailwind). Runs on desktop and mobile browsers.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Other commands

```bash
npm run test    # unit tests for the task rules
npm run lint    # lint, including the layer boundary check
npm run build   # type-check + production build
```

## How it's organised

- `src/core/` — the rules. Pure TypeScript, no React, no browser APIs.
- `src/storage/` — saving and loading. Currently `localStorage`.
- `src/app/` — the React UI.

Dependencies point inwards only, and `npm run lint` enforces it. See `CLAUDE.md` for the details.

## Status

Step 1: add, list, complete and delete tasks, saved between sessions. Gamification comes next.
