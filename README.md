# PickMe

A personal task tracker that fights procrastination through gamification.

Web app (React + TypeScript + Vite + Tailwind). Runs on desktop and mobile browsers.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill it in, see "Firebase" below
npm run dev
```

Then open http://localhost:5173.

## Firebase

The backend is Firebase project `task-tracker-a6e9e`
([console](https://console.firebase.google.com/project/task-tracker-a6e9e/overview)):

- **Authentication** — Google sign-in, enabled in the console. Sign-in works only from the domains
  listed under **Authentication → Settings → Authorized domains**: `localhost` and the Vercel
  address must both be there. The app can also be used as a guest with data kept only in the
  browser.
- **Firestore** — the `(default)` database, Standard edition, in `eur3`, with delete protection on.
  Tasks live at `users/{uid}/tasks/{taskId}`, readable only by that account. `firebase.json` points
  at `firestore.rules` and `firestore.indexes.json`; deploy the rules after changing them.
- **Web app** "Task Tracker Web". Its settings are the `VITE_FIREBASE_*` variables in `.env.local`,
  which git ignores, so no key is kept in the repository. Print them with
  `npx -y firebase-tools@latest apps:sdkconfig WEB --project task-tracker-a6e9e`, and restart
  `npm run dev` after editing the file. Without them the app stops at start-up, naming what is missing.

Use the Firebase CLI through `npx`, so it is always the latest:

```bash
npx -y firebase-tools@latest login                                          # once per machine
npx -y firebase-tools@latest deploy --only firestore --project task-tracker-a6e9e   # rules + indexes
```

## Other commands

```bash
npm run test    # unit tests for the task rules
npm run lint    # lint, including the layer boundary check
npm run build   # type-check + production build
```

Pull requests into `main` run `npm test` and `npm run build` via GitHub Actions
(`.github/workflows/ci.yml`).

## Hosting

Live at https://task-tracker-pi-virid-63.vercel.app (Vercel project `task-tracker`, team
`olexandr13`). Vercel detects Vite on its own, so there is no config file. To deploy what is in
the working tree:

```bash
npx vercel login   # once per machine
npx vercel deploy --prod --scope olexandr13
```

The `VITE_FIREBASE_*` settings are baked in at build time, so they must also be set in the Vercel
project's environment variables (Production) before deploying.

There is no Git connection, so nothing deploys unless you run this. Saved data is kept per address,
so the hosted app does not see tasks saved on `localhost`.

## How it's organised

- `src/core/` — the rules. Pure TypeScript, no React, no browser APIs.
- `src/storage/` — saving and loading, and signing in. Tasks in Firestore, the quote cache in `localStorage`, and Firebase Auth.
- `src/app/` — the React UI.

Dependencies point inwards only, and `npm run lint` enforces it. See `CLAUDE.md` for the details.

## Status

Step 1: add, list, complete and delete tasks, saved between sessions. Gamification comes next.
