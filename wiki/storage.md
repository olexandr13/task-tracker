# Storage

Where the data lives between visits, and the rule that keeps it from being lost when the app
changes shape.

## What is saved, and where

- **STORE-1** Tasks are saved in the **account** (AUTH-13), in the Firebase project's Firestore
  database. A refresh, a closed tab or a closed browser loses nothing.
- **STORE-2** Every device and every address signed into the same account shows the same tasks. A
  change made on one appears on the others by itself, without a refresh, while they are open.
- **STORE-14** The app always runs at the same address: `http://localhost:5173` in development,
  `http://localhost:4173` for `npm run preview`. The browser keeps the signed-in session and the
  offline copy per address, port included, so if that port is taken the app **refuses to start**
  rather than opening on another port, signed out and with nothing cached.
- **STORE-15** The app is also hosted at `https://task-tracker-pi-virid-63.vercel.app`, and in
  development `localhost` signs in to the same Firebase project, so both show the same tasks.
- **STORE-3** Tasks and the cached quote are kept apart, with **separate versions** — a task list
  and a quote have no reason to change shape together. The quote stays in the browser's
  `localStorage` (see [Daily quote](daily-quote.md)).
- **STORE-4** Each task is saved as its own record, inside a versioned envelope: the version, and
  the task. The version is what makes a change of shape survivable.
- **STORE-16** Changes are saved **task by task**: a change writes only the tasks it touched. When
  two devices change the same task, the later write wins; changes to different tasks never undo
  one another.
- **STORE-17** The account's tasks are readable and writable by that account alone. Another
  account signed in on the same browser sees its own tasks, not these.
- **STORE-18** Offline, the tasks still open from a copy the browser keeps, and changes made
  offline are sent once there is a connection. Every open tab shares that copy.

## Tasks kept in the browser

- **STORE-19** Tasks saved before they belonged to the account were kept in the browser's
  `localStorage`, one set per address. The first time the app is open there, signed in and online,
  they are **moved into the account** — added alongside whatever the account already has, so two
  addresses that each kept their own tasks end up with both sets — and then forgotten by the
  browser.
- **STORE-20** The move never overwrites a task the account already has, and the browser forgets
  its tasks only once the account holds them. A move that fails, offline say, is tried again next
  time. Browser data the app cannot read is left where it is.

## Migration

- **STORE-5** Changing the saved shape means bumping the version and migrating on load — never
  breaking what is already saved.
- **STORE-6** Older saved tasks, in the account or still in the browser, are upgraded in a chain, each step adding only the one thing its
  version did not know about. Today that covers data saved before repeats existed, before the trash
  existed, before a task could carry a description, before it could carry a checklist, before it
  had an order of its own, before it could be due on a day, and before a repeating task kept the
  days it was done on. The order step keeps each task where it was: the saved list was already in
  order. Tasks saved before due dates have no day. A repeating task saved before history was kept
  starts its history with the day of its last completion, the one day anything remembers.
- **STORE-7** Data in a version the app does not recognise, or that cannot be parsed at all, is
  **ignored with a warning** rather than crashing, and left as it is: a task the app cannot read is
  not shown, and never overwritten or deleted by it.
- **STORE-8** A cached quote is not migrated. It is a day old at most and the service can simply be
  asked again, so anything unexpected is dropped and refetched. A cached quote is also checked
  field by field before it is trusted.

## When writing happens

- **STORE-9** Every change to the list is saved as it happens. There is no save button and nothing
  to lose by closing the tab.
- **STORE-10** Expired tasks are dropped from storage whenever the list arrives — on load, or
  changed from elsewhere — and whenever it is written, so nothing carries them around longer than
  the trash keeps them.

## The seam

- **STORE-11** Every call site talks to a repository **interface**, never to Firestore directly.
  Moving the tasks to another service is a new file behind the interface rather than a change
  everywhere else.
- **STORE-12** Where a fresh quote comes from is behind an interface for the same reason — the
  service this one uses is already a mirror of one that went off the air.

## Known gap

- **STORE-13** A failed save or load is written to the console and the app carries on. Nothing
  tells the owner on screen — so a load the database refuses looks like an empty list, and a save
  it refuses looks fine until the next refresh. Not yet addressed.

---

**Where it lives:** `src/storage/taskRepository.ts` (the interface, and what a change comes to),
`firestoreTaskRepository.ts` (the account's tasks), `firebaseApp.ts` (the database and its offline
copy), `taskSchema.ts` (versions and upgrades), `localTaskImport.ts` (tasks kept in the browser),
`src/storage/quoteRepository.ts` and `localStorageQuoteRepository.ts`,
`src/storage/quoteSource.ts` and `quotableQuoteSource.ts`, `src/app/useTasks.ts`,
`src/app/TasksScreen.tsx` (the repository and the move). Who may read what: `firestore.rules`.
**Tested in:** `src/storage/taskRepository.test.ts` (what a change writes),
`src/storage/localTaskImport.test.ts` (the move, and upgrading older data).
