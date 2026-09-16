# Storage

Where the data lives between visits, and the rule that keeps it from being lost when the app
changes shape.

## What is saved, and where

- **STORE-1** Everything is saved in the browser's `localStorage`, on the device. A refresh, a
  closed tab or a closed browser loses nothing.
- **STORE-2** Tasks are kept by the browser, not by the account: a second device signed into the
  same account knows nothing about the first (AUTH-13).
- **STORE-14** The browser keeps saved data per address, port included, so the app always runs at
  the same one: `http://localhost:5173` in development, `http://localhost:4173` for `npm run
  preview`. If that port is taken the app **refuses to start** rather than opening on another port,
  where the list would look empty and the saved tasks would seem gone.
- **STORE-15** The app is also hosted at `https://task-tracker-pi-virid-63.vercel.app`. By the same
  rule that address keeps its own data: tasks saved on `localhost` do not appear there, nor the
  other way round.
- **STORE-3** Tasks and the cached quote are kept under **separate keys with separate versions** —
  a task list and a quote have no reason to change shape together.
- **STORE-4** Saved tasks sit inside a versioned envelope: the version, and the tasks. The version
  is what makes a change of shape survivable.

## Migration

- **STORE-5** Changing the saved shape means bumping the version and migrating on load — never
  breaking what is already saved.
- **STORE-6** Older saved tasks are upgraded in a chain, each step adding only the one thing its
  version did not know about. Today that covers data saved before repeats existed, before the trash
  existed, before a task could carry a description, before it could carry a checklist, before it
  had an order of its own, and before it could be due on a day. The order step keeps each task where
  it was: the saved list was already in order. Tasks saved before due dates have no day.
- **STORE-7** Data in a version the app does not recognise, or that cannot be parsed at all, is
  **ignored with a warning** rather than crashing: the app starts empty instead of dying on load.
- **STORE-8** A cached quote is not migrated. It is a day old at most and the service can simply be
  asked again, so anything unexpected is dropped and refetched. A cached quote is also checked
  field by field before it is trusted.

## When writing happens

- **STORE-9** Every change to the list is saved as it happens. There is no save button and nothing
  to lose by closing the tab.
- **STORE-10** Expired tasks are dropped from storage when the list is loaded and whenever it is
  written, so nothing carries them around longer than the trash keeps them.

## The seam

- **STORE-11** Every call site talks to a repository **interface**, never to `localStorage`
  directly, and the interface is asynchronous even though today's implementation is not. Swapping
  in IndexedDB or a sync server is a new file behind the interface rather than a change everywhere
  else.
- **STORE-12** Where a fresh quote comes from is behind an interface for the same reason — the
  service this one uses is already a mirror of one that went off the air.

## Known gap

- **STORE-13** A failed save or load is written to the console and the app carries on. Nothing
  tells the owner on screen — so a browser that refuses to store anything (private mode, a full
  quota) looks like an app that quietly forgets. Not yet addressed.

---

**Where it lives:** `src/storage/taskRepository.ts` and `localStorageTaskRepository.ts`,
`src/storage/quoteRepository.ts` and `localStorageQuoteRepository.ts`,
`src/storage/quoteSource.ts` and `quotableQuoteSource.ts`, `src/app/useTasks.ts`.
**Tested in:** `src/storage/localStorageTaskRepository.test.ts` (saving, and upgrading older data).
