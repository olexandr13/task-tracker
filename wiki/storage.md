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
  offline are kept in it — through a refresh or a closed app — and sent once there is a connection.
  Every open tab shares that copy. The app itself is kept for offline too (OFF-1); see
  [Offline](offline.md).

## Points

- **STORE-21** What completions earned is saved in the account **apart from the tasks**, so it
  outlives a task deleted and purged (RWD-13). It is kept as **one record per day**, holding what
  each task done that day earned. Reading the ledger costs a record a day, however many tasks were
  done.
- **STORE-22** A day is only ever changed **task by task**: earning adds that task's points to the
  day, taking back removes them, and nothing else on the day is touched. Two devices completing
  different tasks on the same day keep both. The same completion recorded twice is recorded once.
- **STORE-23** Each redemption is saved as **its own record**, and deleting one removes it.
- **STORE-24** The ledger has **its own version**, apart from the tasks'. A day or a redemption in a
  version the app does not recognise, or not shaped as it should be, is ignored with a warning and
  left as it is (STORE-7).
- **STORE-25** What a change earns is recorded by the device that made the change. A change arriving
  from another device is not recorded again. The ledger is readable and writable by the account
  alone (STORE-17), opens offline and waits for a connection like the tasks (STORE-18).

## Lists

- **STORE-26** Each list is saved in the account as **its own record**, beside the tasks rather than
  holding them, inside a versioned envelope like a task's (STORE-4). A task names its list by id, so
  making, renaming or deleting a list writes no task at all.
- **STORE-27** The lists have **their own version**, apart from the tasks' and the ledger's — a list
  and a task have no reason to change shape together. A list in a version the app does not
  recognise, or not shaped as it should be, is ignored with a warning and left as it is (STORE-7).
- **STORE-28** Changes are written **list by list**, as with the tasks (STORE-16): a device writes
  only the lists it changed, the later write wins on the same list, and changes to different lists
  never undo one another. The lists are readable and writable by the account alone (STORE-17), open
  offline and wait for a connection like the tasks (STORE-18).
- **STORE-29** Deleting a list is two changes — its tasks back to the Inbox, then the list itself —
  and the tasks go first. If the second is lost, a task naming a list that is gone reads as being in
  the Inbox anyway (LST-12), so no task is ever stranded.

## Tags

- **STORE-33** Each tag is kept in the account as **its own record**, beside the tasks, inside a
  versioned envelope like a task's (STORE-4). A task still carries its tags **by name**, so making a
  tag writes no task; the record is what lets a tag outlive its tasks (TAG-6). A tag a task carries
  with no record — just given, given on a device running an older app, or given before tags were
  kept — is given one as soon as the tasks and the tags have both loaded. Two devices doing that at
  once leave two records of one name, which read as one tag.
- **STORE-34** The tags have **their own version**, apart from everything else's. A tag in a version
  the app does not recognise, or not shaped as it should be, is ignored with a warning and left as
  it is (STORE-7). Changes are written **tag by tag**, as with the lists (STORE-28); the tags are
  readable and writable by the account alone (STORE-17), open offline and wait for a connection
  like the tasks (STORE-18).
- **STORE-35** Deleting a tag is two changes — off every task, then every record of that name — and
  the tasks go first, so a tag is never left on a task with no record, to be kept all over again.

## Tasks kept in the browser

- **STORE-19** Tasks saved before they belonged to the account were kept in the browser's
  `localStorage`, one set per address. The first time the app is open there, signed in and online,
  they are **moved into the account** — added alongside whatever the account already has, so two
  addresses that each kept their own tasks end up with both sets — and then forgotten by the
  browser.
- **STORE-20** The move never overwrites a task the account already has, and the browser forgets
  its tasks only once the account holds them. A move that fails, offline say, is tried again next
  time. Browser data the app cannot read is left where it is.

## Kept on this device

- **STORE-30** How the task views are shown — the View options (UI-41) — is kept in this browser's
  `localStorage`, **not in the account**: a phone and a desktop have different room, so each is set
  its own way. The options are there the moment the app opens, offline too. They have **their own
  version**, apart from everything else's. Options the app cannot read — an unknown version, or
  anything not shaped as it should be — are ignored and the defaults used until they are set again;
  like a cached quote (STORE-8) there is nothing in them worth carrying forward. A browser that
  refuses storage keeps them for as long as the page is open.
- **STORE-31** How the sidebar is laid out — whether the lists under Lists are folded (LST-26) — is
  kept the same way, and for the same reasons: in this browser's `localStorage`, not in the
  account, under a version of its own, read at once when the app opens, and back to the default —
  unfolded — when it cannot be read.
- **STORE-36** How the habits view is shown — whether cards start open (HAB-23) — is kept the same
  way again, under a version of its own, apart from the task View options (STORE-30). A phone and a
  desktop have different room, so each is set its own way. Options the app cannot read fall back to
  the default: folded.

## A copy outside the account

- **STORE-32** Everything the account keeps can be **exported to a file and imported back**; see
  [Backup](backup.md). The file is not another place the data lives: nothing reads it but an import,
  and an import only ever adds to the account. A new kind of record kept in the account is added to
  the file too, or it is left out of every backup.

## Migration

- **STORE-5** Changing the saved shape means bumping the version and migrating on load — never
  breaking what is already saved.
- **STORE-6** Older saved tasks, in the account or still in the browser, are upgraded in a chain, each step adding only the one thing its
  version did not know about. Today that covers data saved before repeats existed, before the trash
  existed, before a task could carry a description, before it could carry a checklist, before it
  had an order of its own, before it could be due on a day, before a repeating task kept the days
  it was done on, before a task could carry tags, before it could carry a reward, before there
  were lists to file it under, before a task could ask for time, before a repeating task's occurrence
  could be skipped, before a task could carry a priority, and before priority became a single urgent
  mark. The order step keeps each task where it was: the saved list was already in
  order. Tasks saved before due dates have no day. A repeating task saved before history was kept
  starts its history with the day of its last completion, the one day anything remembers. Tasks
  saved before tags have none, tasks saved before rewards have no reward, so none of what they
  did before earns anything, tasks saved before lists are in none — the Inbox, where a task
  starts anyway (LST-2) — tasks saved before time goals have no goal and no time logged,
  tasks saved before priority have no urgent mark, and a high priority from the ranked shape
  becomes urgent; low and medium do not.
- **STORE-7** Data in a version the app does not recognise, or that cannot be parsed at all, is
  **ignored with a warning** rather than crashing, and left as it is: a task the app cannot read is
  not shown, and never overwritten or deleted by it.
- **STORE-8** A cached quote is not migrated. It is a day old at most and the service can simply be
  asked again, so anything unexpected — including a shape from before Ukrainian days went — is
  dropped and refetched. A cached quote is also checked field by field before it is trusted.

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
copy, including how a phone reads that copy), `taskSchema.ts` (versions and upgrades), `localTaskImport.ts` (tasks kept in the browser),
`firestoreBatches.ts` (writing in batches), `firestoreAccount.ts` (every collection an account keeps), `rewardRepository.ts`, `firestoreRewardRepository.ts` and
`rewardSchema.ts` (the points ledger), `listRepository.ts`, `firestoreListRepository.ts` and
`listSchema.ts` (the lists), `tagRepository.ts`, `firestoreTagRepository.ts` and `tagSchema.ts`
(the kept tags), `src/storage/quoteRepository.ts` and `localStorageQuoteRepository.ts`,
`src/storage/quoteSource.ts` and `quotableQuoteSource.ts`, `src/storage/viewOptionsRepository.ts`,
`viewOptionsSchema.ts` and `localStorageViewOptionsRepository.ts` (the View options),
`src/storage/habitViewOptionsRepository.ts`, `habitViewOptionsSchema.ts` and
`localStorageHabitViewOptionsRepository.ts` (Habits'), `src/storage/sideNavRepository.ts`,
`sideNavSchema.ts` and `localStorageSideNavRepository.ts` (the sidebar's layout), `src/app/useTasks.ts`, `src/app/useLists.ts`,
`src/app/useTags.ts` (keeping the tags tasks carry),
`src/app/TasksScreen.tsx` (the repository and the move). Who may read what: `firestore.rules`.
**Tested in:** `src/storage/taskRepository.test.ts` (what a change writes),
`src/storage/localTaskImport.test.ts` (the move, and upgrading older data), `src/storage/rewardSchema.test.ts`
(reading the ledger back), `src/storage/listRepository.test.ts` and `src/storage/listSchema.test.ts`
(what a change to the lists writes, and reading one back), `src/storage/tagRepository.test.ts`,
`src/storage/tagSchema.test.ts` and `src/app/useTags.test.ts` (the same for the tags, and keeping the
ones tasks carry), `src/storage/viewOptionsSchema.test.ts` (reading the
View options back), `src/storage/habitViewOptionsSchema.test.ts` (reading Habits' back),
`src/storage/sideNavSchema.test.ts` (reading the sidebar's layout back).
