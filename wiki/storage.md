# Storage

Where the data lives between visits, and the rule that keeps it from being lost when the app
changes shape.

## What is saved, and where

- **STORE-1** Tasks are saved in the **account** (AUTH-13) when signed in with Google, in the
  Firebase project's Firestore database — or, as guest, in this browser alone (STORE-37). A
  refresh, a closed tab or a closed browser loses nothing.
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
- **STORE-55** Opening the app does **not load every task**. Left behind is **history**: a task that
  happens once, is done, is not in the trash, and was finished — and is due, if at all — before
  last week or this month began, whichever began first. Nothing on screen counts it: every list,
  bar and bonus is today's, this week's or this month's, and Cases counts today, yesterday and last
  week, tasks without points included (CHST-10). So what is downloaded as the app opens is
  the work in play, not everything ever done. History is loaded a stretch of days at a time, as a
  span of done work reaching back to it is opened (TASK-74), and stays loaded until a reload; how
  many tasks a view has is asked of the server without loading them. Deleting or renaming a tag
  loads all of it first (TAG-22, TAG-24). Time logged on a history task, after it was finished,
  counts on the Balance page once that task is loaded (BAL-3). A guest's tasks are all in the
  browser, so all of them are loaded.

## Points

- **STORE-21** What completions earned is saved in the account **apart from the tasks**, so it
  outlives a task deleted and purged (RWD-13). It is kept as **one record per day**, holding what
  each task done that day earned. Reading the ledger costs a record a day, however many tasks were
  done. An entry is a whole number of points, **0 included**: no case pays 0 (CHST-9), but an
  opening of 0 written while Payday could pay nothing still reads, and so does its day.
- **STORE-22** A day is only ever changed **task by task**: earning adds that task's points to the
  day, taking back removes them, and nothing else on the day is touched. Two devices completing
  different tasks on the same day keep both. The same completion recorded twice is recorded once. A
  day whose last earning was taken back is left **holding nothing**, and is read as a day that
  earned nothing rather than as a record that cannot be read (STORE-7).
- **STORE-23** Each redemption is saved as **its own record**, and deleting one removes it.
- **STORE-24** The ledger has **its own version**, apart from the tasks'. A day or a redemption in a
  version the app does not recognise, or not shaped as it should be, is ignored with a warning and
  left as it is (STORE-7).
- **STORE-41** What clearing **Today**, **this week** and **this month** earns (RWD-24, RWD-29) is
  kept in the account too, apart from the days and the redemptions: **one record per period that has
  a bonus**, named by the period rather than by an id of its own, so the devices that set it write
  the one record and the later write wins. No record at all is no bonus. It is kept under the
  ledger's version (STORE-24), and one the app cannot read is ignored with a warning and left as it
  is (STORE-7) — clearing that period then earns nothing until a bonus is set again.
- **STORE-42** What a point is worth (RWD-31) is kept beside the bonuses, as **one record per
  setting**, named by the setting rather than by an id, for the same reason: two devices setting it
  write the one record. No record at all is nothing set, and the points are counted in points alone.
  It is kept under the ledger's version (STORE-24) and ignored, with a warning, when it cannot be
  read.
- **STORE-48** Whether **Cases** counts tasks without points (CHST-32) is kept beside what a
  point is worth, as **one more record of the settings**, named `chest` — the name it was first
  saved under — for the same reason (STORE-42). No record at all is what an account starts with —
  every task done counts — so there is no shape for "not set" to be told from. A record saved
  while the jackpot could be worked out two ways also says which way; there is no choice any more
  (CHST-7), so that is read past rather than refused, and dropped on the next save. So is a record
  saved while a day had to ask for so many tasks before it earned Payday, which says how many
  (CHST-2). A record saved before tasks without points could be left out says
  nothing about them, and reads as counting them, which is what every case did then; the field was
  added without a new version because the version is the whole ledger's, and a device not yet
  updated would refuse every day of it rather than read past one field. A value that is not on or
  off is not trusted, and the record with it. It is
  kept under the ledger's version (STORE-24) and ignored, with a warning, when it cannot be read,
  which leaves Cases counting as it does by default. It is **in the
  backup**, taken only by an account that has none of its own, as the bonuses and the point value
  are (BAK-5). What Cases keeps on **this device** is the other half of it (STORE-49).
- **STORE-58** The reward a new task starts with (RWD-45) is kept beside what a point is worth, as
  **one more record of the settings**, named `newTaskReward`, for the same reason (STORE-42). No
  record at all is none, so taking it away deletes the record. It is kept under the ledger's
  version (STORE-24) and ignored, with a warning, when it cannot be read, which leaves new tasks
  starting without a reward. It is **in the backup**, taken only by an account that has none of its
  own (BAK-14).
- **STORE-43** Each prize and each wish (RWD-33, RWD-40) is saved as **its own record**, in one
  collection of its own beside the ledger — the record says which kind it is, and when a wish was
  bought — inside a versioned envelope like a list's (STORE-26). Changes are written **record by
  record**, as with the lists (STORE-28). It has **its own version**, apart from the ledger's: a
  redemption keeps the name and the price it was made under, so one renamed, repriced or deleted
  never rewrites one. A record saved before the two kinds were told apart is read as a **prize**,
  never bought — the kind it was written as. One the app cannot read is ignored with a warning and
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
  Renaming one (TAG-24) is the same two changes in the same order: the new name on every task
  carrying it, then every record of the old name kept under the new one.

## Balance categories

- **STORE-50** Each Balance category (BAL-1) is kept in the account as **its own record**, in a
  collection of its own, inside a versioned envelope like a list's (STORE-26), with **its own
  version**. A category names its tags, as a task does, rather than pointing at their records, so a
  tag renamed or deleted is written through to the categories bound to it (BAL-11) the way it is
  written through to the tasks. Changes are written **category by category** (STORE-28); they are
  readable and writable by the account alone (STORE-17), open offline and wait for a connection like
  the tasks (STORE-18). One the app cannot read — an unknown version, or a tag in it no tag could be
  called — is ignored with a warning and left as it is (STORE-7). The time the page adds up from tasks
  is not kept here: it is read from the tasks' sessions (TIME-8). Time logged **straight to a
  category** (BAL-14) is kept **on the category**, as a task keeps its sessions, and let go of with
  the same history (BAL-15); a category saved before that could be done (version 1) is read as having
  none logged.

## The activity log

- **STORE-51** The activity log (ACT-1) is kept in the account as **one record per day**, holding a
  field for each record logged under one of its hours, keyed by the record's id — as the points ledger
  keeps its days (STORE-21), so reading the log costs a record a day however many hours were logged.
  A day is only ever changed **record by record**: adding or changing one writes its field, taking
  one out deletes it, and nothing else on the day is touched, so two devices logging on one day keep
  both. A record moved to another day leaves the day it was under and joins the new one. A day whose
  last record was taken out is left **holding nothing**, and read as a day with nothing logged. A
  record holds what, how long and its hour, and — made from a task's session (ACT-21) — the second
  of its hour it began at and the task and session it is from, both empty for one typed. It has
  **its own version** (version 2 added those two; a record saved before reads as one typed, and so
  does one of those in a day written since, a day being written a field at a time); a day the app
  cannot read is ignored with a warning and left as it is (STORE-7). It is readable and writable by the account alone (STORE-17), and opens offline and waits
  for a connection like the tasks (STORE-18).

## The journal

- **STORE-60** The journal (JRN-1) is kept in the account as **one record per day**, holding a field
  for each line written about that day, keyed by the line's id — as the activity log keeps its days
  (STORE-51), so reading the journal costs a record a day. A day is only ever changed **line by
  line**: writing or changing one writes its field, deleting one deletes it, and nothing else on the
  day is touched, so two devices writing about one day keep both. A line holds its section, what was
  written and when; a day whose last line was deleted is read as a day with nothing written. A day
  the journal no longer keeps (JRN-8) is **deleted whole**, so the account never holds more than a
  week or so of them. It has **its own version**; a day the app cannot read is ignored with a warning
  and left as it is (STORE-7), until it too is older than a week. It is readable and writable by the
  account alone (STORE-17), and opens offline and waits for a connection like the tasks (STORE-18).

## The check-in

- **STORE-52** The **check-in's setting** (CHECKIN-9) is kept in the account as **one record**,
  named for itself as the nudge's is (STORE-46): whether it is on, and the hours it keeps to. **No
  record at all is the check-in as the app arrives** — off, 09:00–22:00 — and one turned off with
  hours of its own keeps its record, the hours being the log's too (ACT-17). It has **its own
  version**, and one the app cannot read — an unknown version, hours not on the hour — is ignored with
  a warning and read as off (STORE-7). It is **in the backup** (BAK-19).

## The feature switches

- **STORE-56** The **switches on Settings** (FEAT-1) are kept in the account as **one record**, named
  for itself as the nudge's setting is (STORE-46): the features switched off, by name. **No record at
  all is everything on**, whether nothing was ever switched off or everything was switched back on,
  so a feature added to the app later starts on for everyone. Cases was saved as `chest`, and a
  record that still says that is read as Cases. A name the app does not know — a
  feature of a newer app — is passed over rather than costing the rest. It has **its own version**,
  and one the app cannot read is ignored with a warning and read as everything on (STORE-7): hiding
  part of the app on a guess would look like losing it. It is **in the backup** (BAK-20).

## Warm-up

- **STORE-44** The **warm-up** (WARM-1) is kept in the account as **one record**, named for itself
  rather than by an id, so the devices that start or end it write the one record and the later write
  wins. No record at all is no warm-up, whether there never was one or it was ended (WARM-9). All it
  holds is the **day it began**, how many **days have been paused**, and — while it is paused — the
  **day that pause began** (WARM-11). Which day it is on and how many habits that allows are derived from
  those and from now (WARM-3, WARM-4), so nothing is rewritten as the days go by. A warm-up saved
  before it could be paused is read as not paused. It has **its own
  version**, apart from everything else's, and one the app cannot read — an unknown version, a day
  that is no day — is ignored with a warning and read as **no warm-up** (STORE-7), which asks
  nothing of anyone.

## Tasks kept in the browser

- **STORE-19** Tasks saved before they belonged to the account were kept in the browser's
  `localStorage`, one set per address. The first time the app is open there as a **guest**, they
  join the guest's tasks. The first time it is open signed in with Google and online, any still left
  are **moved into the account** — added alongside whatever the account already has, so two
  addresses that each kept their own tasks end up with both sets — and then forgotten by the
  browser.
- **STORE-20** The move never overwrites a task the account already has, and the browser forgets
  its tasks only once the account holds them. A move that fails, offline say, is tried again next
  time. Browser data the app cannot read is left where it is.

## Procrastination mode

- **STORE-45** **Procrastination mode** (JUST-1) is kept in the account as **one record**, named
  for itself as the warm-up is (STORE-44), so a mode turned on at the laptop is on at the phone and
  both show the **same one task**. It holds the phase (resting, focused, won), the task it is on
  and the **day it was started**; no record at all is the mode off, whether it was never on or was
  ended (JUST-8). It has **its own version**, and one the app cannot read is ignored with a warning
  and read as **off** (STORE-7): a mode is a way through one afternoon, not a record worth guessing
  at. What the mode settles to — off at a new day, a win when the task is finished — is derived and
  then written down once (JUST-7, JUST-10), so the other device hears of it. It is **not in the
  backup** (BAK-2): it is today's state rather than something worth restoring next month.

## The nudge

- **STORE-46** The **nudge's setting** (NUDGE-9) is kept in the account as **one record**, named for
  itself as the warm-up is (STORE-44): whether it is on, the span of quiet it waits for and the
  hours it may speak in, so a nudge set at the laptop is the same nudge at the phone. **No record at
  all is the nudge as the app arrives** — off, at the default span, at any hour — whether it was
  never set or was set back; one turned off with a span or hours still chosen keeps its record, the
  span outliving the switch. It has **its own version**, and one the app cannot read is ignored with
  a warning and read as off (STORE-7). It is **in the backup** (BAK-16), being a standing setting
  rather than today's state.
  What the nudge has already said on **this device** is the other half of it, and stays here
  (STORE-47).

## Guest — this device only

- **STORE-37** As guest (AUTH-15), tasks, lists, tags, the wishlist, the Balance categories, the
  activity log and the journal — a record at a time — and the check-in's setting (STORE-51, STORE-60,
  STORE-52), the points ledger — the
  bonuses, what a point is worth, what Cases asks and the reward new tasks start with, with it
  (STORE-41, STORE-42, STORE-43, STORE-48, STORE-58), the warm-up
  (STORE-44), Procrastination mode (STORE-45), the nudge's setting (STORE-46) and the feature
  switches (STORE-56) are kept in this browser's `localStorage`, under the same versioned shapes as the account's (STORE-4, STORE-24,
  STORE-27, STORE-34). A ledger kept before there were bonuses, or before a point had a value, holds
  none of them, rather than being unreadable for the lack of one. Nothing is sent to the account or any other device. A refresh or another tab
  on the same address sees the same records. There is nothing to sync, so the sync notice stays
  quiet (OFF-7).
- **STORE-38** The first time a Google account is open here online after guest data was kept, that
  data is **moved into the account** — tasks, lists, tags, prizes, Balance categories, the activity
  log, the journal, points earned, redemptions, the bonuses, what a point is worth, the reward new tasks start
  with, the warm-up, the nudge's setting, the check-in's and the feature switches — added alongside
  what the account already has, without overwriting tasks it already holds (STORE-20), or a bonus,
  point value, reward for new tasks, warm-up, nudge, check-in or switches it has already set, then forgotten by the browser. A warm-up begun as guest keeps the day it began on, so
  signing in does not start its month again (WARM-10). A move that fails, offline say, is tried again next time.

## Kept on this device

- **STORE-30** How the task views are shown — the View options (UI-41) — is kept in this browser's
  `localStorage`, **not in the account**: a phone and a desktop have different room, so each is set
  its own way. The options are there the moment the app opens, offline too. They have **their own
  version**, apart from everything else's. Options the app cannot read — an unknown version, or
  anything not shaped as it should be — are ignored and the defaults used until they are set again;
  like a cached quote (STORE-8) there is nothing in them worth carrying forward. A browser that
  refuses storage keeps them for as long as the page is open.
- **STORE-31** How the sidebar is laid out — whether the lists under Lists (LST-26), the pages
  under Rewards (RWD-19) and the modes under Modes (MODE-7) are folded — is kept the same way, and
  for the same reasons: in this
  browser's `localStorage`, not in the account, under a version of its own, read at once when the
  app opens, and back to the default — unfolded — when it cannot be read. A layout saved before
  there were pages under Rewards, or before the modes were listed, is read as leaving those open.
- **STORE-57** What is **folded on Settings** — its sections, and a feature's own settings under
  its switch (UI-35, FEAT-10) — is kept the same way as the sidebar's layout (STORE-31): in this
  browser's `localStorage`, under a version of its own, read at once when the app opens. Only what
  has been folded or unfolded is kept, so a part of Settings added later starts as it should — a
  section open, a feature's settings folded — without a new version; a part Settings no longer has
  is read past. A layout that cannot be read is no layout: everything as it starts.
- **STORE-59** The **pinned tabs** (UI-75) are kept the same way as the sidebar's layout
  (STORE-31): in this browser's `localStorage`, not in the account, under a version of their own,
  read at once when the app opens. A phone has no tabs, and how many a screen has room for is that
  screen's business. Each tab is kept as **its page's address** (UI-36), in order, so a tab is
  named the way a bookmark is. An address that no longer names a page is read past. Tabs that
  cannot be read at all are no tabs: nothing pinned. A tab whose page is gone for now — switched
  off, or a list or tag not loaded yet — stays kept, so it is not lost while the lists arrive.
- **STORE-36** How the habits view is shown — whether cards start open, set on Settings (HAB-23) — is
  kept the same way again, under a version of its own, apart from the task View options (STORE-30). A phone and a
  desktop have different room, so each is set its own way. Options the app cannot read fall back to
  the default: folded.
- **STORE-47** What the nudge has **already said here** — the moment it last spoke on this device,
  and the notice it left standing (NUDGE-6, NUDGE-8) — is kept the same way again, under a version
  of its own, apart from the setting itself (STORE-46). It is the half only the device can answer,
  so a nudge on the laptop is not repeated on the phone, and a refresh does not nudge all over
  again. A record saved before the setting travelled holds both: its setting is **moved into the
  account** the first time the app is open, where the account has none of its own, and then dropped
  from the browser, as the tasks from before there were accounts are (STORE-19) — so a nudge turned
  on here stays on.
- **STORE-49** What **Cases** keeps here — whether it makes a noise on this device, which
  opening it is still glowing from (by which quarter of the jackpot it came to), and whether it has
  already said here that a key is waiting, and whether it has already said here that Weekly is
  here (CHST-19, CHST-23, CHST-24, CHST-30) — is kept the same way again,
  under a version of its own, apart from
  what Cases counts, which is the account's (STORE-48). These are what only the
  device can answer: the room you are in is not the account you are in; a notice given on the laptop
  is no reason to withhold it on the phone; and the ledger says what today's case gave without
  saying which colour it gave it in. A case standing exactly as it arrives — a noise, nothing
  opened, nothing said — keeps **no record at all**, and one the app cannot read is read as a case
  arriving, the worst of it being one noise and one notice more than was wanted. A record from before
  the quarters, which named a tier instead, keeps its noise and its notice and forgets the opening.
  A record from before Weekly has not said that Monday's case is here.
- **STORE-54** What the **check-in** keeps here — the notice put away on this device (CHECKIN-4) —
  is kept the same way again, under a version of its own, apart from the setting, which is the
  account's (STORE-52). A notice put away on the laptop is still worth showing on the phone. A device
  as it arrives keeps no record; one the app cannot read is read as a device arriving. A record from
  when it also kept whether this device was pushed check-ins keeps its notice, and the rest is let go.
- **STORE-40** The theme (UI-63) is kept the same way again, under a version of its own: a phone
  kept dark and a desktop kept light are each set their own way, and it is the same whoever is
  signed in — or nobody, on the sign-in screen. Following the system, the default, keeps nothing.
  It is read **before the page is first drawn**, so the app never opens in the other theme first. A
  theme the app cannot read is ignored, and the system followed until one is picked again.

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
- **STORE-39** Changes made in one go all stick. Two changes to the same task at once — its title and
  its description kept together as its sheet closes, say — are saved and shown one on top of the
  other; the second never puts back what the first changed. The same holds for the lists and the
  kept tags.

## The seam

- **STORE-11** Every call site talks to a repository **interface**, never to Firestore directly.
  Moving the tasks to another service is a new file behind the interface rather than a change
  everywhere else. Which service keeps an account's data — Firestore, or this browser as guest —
  is chosen in one place for the whole account, and what is kept on the device alone in another.
- **STORE-12** Where a fresh quote comes from is behind an interface for the same reason — the
  service this one uses is already a mirror of one that went off the air.

## When the service refuses

- **STORE-13** A load or a save the database refuses — or, as guest, the browser, when it is out of
  room — is said on screen as well as written to the console: **Couldn’t load everything from your
  account. Reload to try again.**, or **Couldn’t save a change. Reload to see what was kept.** The
  notice sits at the foot of the screen with the sync notice (OFF-8), and stays until it is
  dismissed; a failed load outranks a failed save. A task list that could not be loaded says
  **Couldn’t load your tasks. Reload to try again.** rather than looking empty. Being offline is
  not a refusal: changes wait for a connection (STORE-18), and the sync notice says so (OFF-4). A
  move of browser data into the account that fails is not said either: it is tried again next time
  (STORE-20).

---

**Where it lives:** `src/storage/accountStorage.ts` (which service keeps an account's data, and
moving what the browser kept into it), `deviceStorage.ts` and `localStorageSetting.ts` (what is kept
on the device alone), `src/storage/taskRepository.ts` (the interface), `recordChanges.ts` (what a
change comes to, record by record), `firestoreRecords.ts` (one document per record), `taskQueries.ts` and `heldTasks.ts` (what is
loaded of the tasks, asked in parts and put together),
`firestoreTaskRepository.ts` (the account's tasks), `localTaskRepository.ts` (the guest's),
`firebaseApp.ts` (the database and its offline
copy, including how a phone reads that copy), `taskSchema.ts` (versions and upgrades), `localTaskImport.ts` (tasks kept in the browser before accounts),
`guestImport.ts` (moving guest data into an account), `localCollection.ts` (records in `localStorage`),
`firestoreBatches.ts` (writing in batches), `firestoreAccount.ts` (every collection an account keeps), `rewardRepository.ts`, `firestoreRewardRepository.ts`, `localRewardRepository.ts` and
`rewardSchema.ts` (the points ledger, the period bonuses, what a point is worth and the reward new
tasks start with),
`categoryRepository.ts`, `firestoreCategoryRepository.ts`, `localCategoryRepository.ts` and
`categorySchema.ts` (the Balance categories), `src/app/useCategories.ts`,
`prizeRepository.ts`, `firestorePrizeRepository.ts`, `localPrizeRepository.ts` and `prizeSchema.ts`
(the prizes and the wishlist), `listRepository.ts`, `firestoreListRepository.ts`, `localListRepository.ts` and
`listSchema.ts` (the lists), `tagRepository.ts`, `firestoreTagRepository.ts`, `localTagRepository.ts` and `tagSchema.ts`
(the kept tags), `warmUpRepository.ts`, `firestoreWarmUpRepository.ts`, `localWarmUpRepository.ts`
and `warmUpSchema.ts` (the warm-up), `nudgeRepository.ts`, `firestoreNudgeRepository.ts`,
`localNudgeRepository.ts` and `nudgeSchema.ts` (the nudge's setting), `nudgeDeviceRepository.ts`,
`nudgeDeviceSchema.ts` and `localStorageNudgeRepository.ts` (what it has said on this device),
`activityRepository.ts`, `firestoreActivityRepository.ts`, `localActivityRepository.ts` and
`activitySchema.ts` (the activity log), `journalRepository.ts`, `firestoreJournalRepository.ts`,
`localJournalRepository.ts` and `journalSchema.ts` (the journal), `checkInRepository.ts`, `firestoreCheckInRepository.ts`,
`localCheckInRepository.ts` and `checkInSchema.ts` (the check-in's setting), `checkInDeviceRepository.ts`,
`checkInDeviceSchema.ts` and `localStorageCheckInDeviceRepository.ts` (what it keeps on this device),
`src/app/useActivities.ts`,
`localBackupRepository.ts` and `localSyncMonitor.ts` (guest export and the quiet sync notice),
`src/storage/quoteRepository.ts` and `localStorageQuoteRepository.ts`,
`src/storage/quoteSource.ts` and `quotableQuoteSource.ts`, `src/storage/viewOptionsRepository.ts`,
`viewOptionsSchema.ts` and `localStorageViewOptionsRepository.ts` (the View options),
`src/storage/habitViewOptionsRepository.ts`, `habitViewOptionsSchema.ts` and
`localStorageHabitViewOptionsRepository.ts` (Habits'), `src/storage/sideNavRepository.ts`,
`sideNavSchema.ts` and `localStorageSideNavRepository.ts` (the sidebar's layout),
`src/storage/themeRepository.ts`, `themeSchema.ts` and `localStorageThemeRepository.ts` (the theme; `index.html`
reads it too, before the page is drawn), `src/app/useTasks.ts`, `src/app/useLists.ts`,
`src/app/useTags.ts` (keeping the tags tasks carry; all three build each change on the one before,
STORE-39), `src/app/storageProblem.ts`, `useStorageProblem.ts` and `components/StorageProblemNotice.tsx`
(saying what was refused). Who may read what: `firestore.rules`.
**Tested in:** `src/storage/taskRepository.test.ts` (what a change writes),
`src/storage/taskQueries.test.ts` and `src/storage/heldTasks.test.ts` (what is loaded of the tasks),
`src/app/useTasks.test.ts` and `src/app/useLists.test.ts` (changes made in one go, and refusals),
`src/app/useRewards.test.ts`, `src/app/storageProblem.test.ts` and
`src/app/components/StorageProblemNotice.test.tsx` (what is said when the service refuses),
`src/storage/localTaskImport.test.ts` (the move, and upgrading older data),
`src/storage/localTaskRepository.test.ts` (the guest's tasks),
`src/storage/rewardSchema.test.ts`
(reading the ledger back), `src/storage/activitySchema.test.ts` and `localActivityRepository.test.ts`
(the activity log, and what a change writes), `src/storage/journalSchema.test.ts` (the journal, what a
change writes and the guest's), `src/storage/checkInSchema.test.ts` (the check-in's
setting, and what it keeps on this device), `src/storage/warmUpSchema.test.ts` (reading the warm-up back),
`src/storage/nudgeSchema.test.ts` and `src/storage/nudgeDeviceSchema.test.ts` (reading the nudge's
setting back, and what a record from before it synced still answers), `src/storage/prizeSchema.test.ts` and `src/app/usePrizes.test.ts`
(reading a prize or a wish back, and keeping them), `src/storage/listRepository.test.ts` and `src/storage/listSchema.test.ts`
(what a change to the lists writes, and reading one back), `src/storage/tagRepository.test.ts`,
`src/storage/tagSchema.test.ts` and `src/app/useTags.test.ts` (the same for the tags, and keeping the
ones tasks carry), `src/storage/categorySchema.test.ts`, `src/storage/localCategoryRepository.test.ts`
and `src/app/useCategories.test.ts` (the Balance categories), `src/storage/viewOptionsSchema.test.ts` (reading the
View options back), `src/storage/habitViewOptionsSchema.test.ts` (reading Habits' back),
`src/storage/sideNavSchema.test.ts` (reading the sidebar's layout back), `src/storage/themeSchema.test.ts`
(reading the theme back) and `src/app/theme.test.ts` (`index.html` reading it back as saved).
