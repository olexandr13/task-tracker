# PickMe

Personal task tracker that fights procrastination through gamification (XP, levels, rules; visuals
later). Built in small daily steps. What the app does is in `wiki/`; this file is how to work on it.

## Rules

- Before adding something, check whether it already exists (code and `wiki/`).
- Design for the long term; the project keeps evolving.
- Report what was done briefly.
- **Debug in Chrome only.** For anything in a browser, use Claude in Chrome (`mcp__claude-in-chrome__*`),
  **never** the built-in browser (`mcp__Claude_Browser__*`). The app needs Google sign-in, and Chrome
  is already signed in. Start the server from `.claude/launch.json`, then open it in Chrome:
  dev `localhost:5173`, preview `localhost:4173`.

A change is done when:

1. `wiki/` matches it: new behaviour gets new ids, changed is rewritten in place, removed is deleted.
2. `package.json` version is bumped: **patch** for a fix, **minor** for a feature, **major** when it
   breaks something for the user.
3. `npm run lint`, `npm test` and `npm run build` pass (as in CI).

## Architecture

Dependencies point inwards only.

| Layer | Responsibility | May import |
|---|---|---|
| `src/core/` | The rules. Pure functions over plain data. | nothing else in `src/` |
| `src/storage/` | Saving, loading, signing in. | `src/core` |
| `src/app/` | React components and screen state. | `src/core`, `src/storage` |

`src/core/` has no React, browser APIs or saving; `npm run lint` enforces the boundary (`.oxlintrc.json`).

## Conventions

### Core

- Functions are pure and never mutate arguments.
- Anything time-dependent takes an injectable `now: Date`.
- State that follows from other state (a new day ending Procrastination mode) is derived, not stored.

### Storage

- Call sites use the repository interfaces and `AuthService`, never Firestore or Firebase directly.
  Screens get them from `createAccountStorage` (Firestore, or `localStorage` as guest) or
  `deviceStorage`, never build their own.
- Records are saved in versioned envelopes (`*_SCHEMA_VERSION` in `src/storage/*Schema.ts`).
  Changing a saved shape means bumping the version and migrating on load.
- Ids are `crypto.randomUUID()`, timestamps ISO 8601, so devices merge record by record.
- Points live beside tasks, not on them (`rewardDays/{day}`, `redemptions/{id}`), so earned stays
  earned. What a change earns is derived in core (`rewardChanges`) and written from `useTasks`.
- A new account collection goes into `ACCOUNT_COLLECTIONS` (`firestoreAccount.ts`), is reached via
  `accountCollection`, and is added to the backup (`AccountData`, `backupFile.ts`,
  `firestoreBackupRepository.ts`, `localBackupRepository.ts`).
- Access rules are in `firestore.rules`; changing them means deploying it.

### App

- Nothing is written to storage during render; persist from handlers or effects.
- Everything a row, habit card or sheet can do to a task is one `TaskActions` object
  (`src/app/taskActions.ts`). Add a member there, don't thread props.
- Record-set hooks (`useTasks`, `useLists`, `useTags`) build each change on the latest set via a ref
  (STORE-39).
- Hooks holding account data report refused loads and saves through `ReportProblem` (STORE-13), not
  just logs.

### Config

- Firebase settings come from `VITE_*` variables (`.env.local`, Vercel env). **No keys or secrets in
  committed files**; only `.env.example`, with empty values.
- The service worker exists only in the built app: test offline with `npm run build && npm run preview`.

### Testing

- Rules: `src/core/*.test.ts` (Node). Interaction a person could break (keys, focus, caret):
  `*.test.tsx` beside the component, Testing Library + `user-event`, starting with
  `// @vitest-environment jsdom`.
- Any console output fails a test (`src/test/consoleGuard.ts`). Declare intended output with
  `expectConsole(...)`; read it with `consoleOutput()`.
