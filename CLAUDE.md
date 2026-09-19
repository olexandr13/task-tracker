# Task Tracker

A personal task tracker that fights procrastination through gamification. The gamification is
primarily **technical** (XP, levels, rules) and will grow a visual side over time. Built as a daily
routine: a long series of small steps, not one big build.

# General rules
- If user ask to add something, check if this functionality already exists.
- Think about architecture and long-term support, this project is long-term and will evolve over time, thus need to be designed for that.
- Be concise in your output of what was done.
- When implement something, update `wiki` accordingly.

## Wiki

`wiki/` holds the requirements as built, feature by feature, with a stable id on each one. It is
the description of the app; this file stays the description of how to work on it.

**A change to behaviour is not finished until `wiki/` matches it.** New behaviour gets new ids,
changed behaviour is rewritten in place, removed behaviour is deleted. Start at `wiki/README.md`.

## Architecture

Three layers. **Dependencies point inwards only.**

| Layer | Responsibility | May import |
|---|---|---|
| `src/core/` | The rules. What a task is, what completing one means. Pure functions over plain data. | nothing else in `src/` |
| `src/storage/` | Saving and loading, including loading from a service, and signing in. | `src/core` |
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
- Tasks are saved in Firestore, one document per task at `users/{uid}/tasks/{taskId}`, under a
  **versioned envelope** (`{ version, task }`). Changing the saved shape means bumping
  `SCHEMA_VERSION` (`src/storage/taskSchema.ts`) and migrating on load — not breaking saved data.
  Changing who may read or write means editing `firestore.rules` and deploying it.
- The points ledger lives beside the tasks, not on them, so earned stays earned: one document per
  day at `users/{uid}/rewardDays/{day}`, merged field by field per task, and one per redemption at
  `users/{uid}/redemptions/{id}`, with their own `REWARD_SCHEMA_VERSION` (`src/storage/rewardSchema.ts`).
  What a task change earns is derived in core (`rewardChanges`) and written from `useTasks`.
- Every collection under an account is named in `ACCOUNT_COLLECTIONS` (`src/storage/firestoreAccount.ts`)
  and reached through `accountCollection`, so the sync notice watches it along with the rest. A new
  one also goes into the backup (`AccountData` in `src/storage/backupRepository.ts`, `backupFile.ts`,
  `firestoreBackupRepository.ts`), or it is left out of every export.
- The built app is kept for offline by a service worker (`vite-plugin-pwa`, `vite.config.ts`).
  `npm run dev` has none; try offline behaviour with `npm run build && npm run preview`.
- Ids are `crypto.randomUUID()` and timestamps are ISO 8601, so records from two devices merge task
  by task.
- Every call site talks to the `TaskRepository` and `RewardRepository` interfaces, never to
  Firestore directly, and to the `AuthService` interface, never to Firebase directly.
- Service settings (Firebase) come from `VITE_*` variables: `.env.local` locally, the Vercel project's
  environment variables in production. **No key, token or secret goes in source or any committed
  file**, even ones a browser is sent anyway; only `.env.example`, with empty values, is committed.
- Rules are tested in `src/core/*.test.ts` (plain Node). Interaction a person could break — keys,
  focus, where the caret goes — is tested beside its component as `*.test.tsx`, with Testing Library
  and `user-event`; such a file starts with `// @vitest-environment jsdom` so core tests stay DOM-free.
- **Any test that writes to the console fails** (`src/test/consoleGuard.ts`, loaded by `setupFiles`),
  so React's own complaints and an error path firing unasked cannot pass quietly. A test that means
  to cause output declares it with `expectConsole(...)`, and can read what was written back with
  `consoleOutput()`.
