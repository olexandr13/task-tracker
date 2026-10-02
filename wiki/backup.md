# Backup

Everything the account keeps, as one file to keep somewhere else — and a file like it brought back
in. Both are on **Settings**, under the account (UI-35).

## Exporting

- **BAK-1** **Export** saves a file of the whole account, named for the local day it was made:
  `task-tracker-backup-2026-09-19.json`. Nothing is asked first, and the page then says what went into
  it — `Exported 12 tasks, 2 lists, 3 tags, 4 prizes, 3 categories, 40 activity records, 30 completions and 1 redemption.` — or that the account had nothing
  in it yet. Offline it still works, from the copy of the account this device keeps (STORE-18).
- **BAK-2** The file holds **everything the account keeps**: every task, those in the trash too, the
  lists, the kept tags — those no task carries any more too (TAG-6) — the wishlist (RWD-33), the
  Balance categories (BAL-12), the activity log (ACT-15), what
  completions earned (a *completion* in the counts is one task's points on one day), the
  redemptions, what clearing each period is worth (RWD-24, RWD-29), what a point is worth
  (RWD-31), the warm-up under way (WARM-1), how the owner asked to be nudged (NUDGE-9) and the
  check-in's setting (CHECKIN-9). What is kept on this device alone — the View options (STORE-30),
  the sidebar (STORE-31), the cached quote, what the nudge has already said here (STORE-46) and what
  the check-in keeps here (STORE-54) — is not the account's, and is not in it. Nor are the devices
  check-ins are pushed to (STORE-53): a registration belongs to a browser that may be gone by the
  time the file is read. Neither is
  **Procrastination mode** (STORE-45), which the account does keep: it is the state of one
  afternoon, and a mode restored from a file made last month would be off by the time it was read. A record the app cannot
  read (STORE-7) is left out.
- **BAK-3** The file is JSON, indented so a person can read it. It says what it is, the version of
  its own shape and when it was made, and holds each record **under the version it is saved with**
  in the account — the points a day at a time, as the account keeps them (STORE-21). The file's
  version only has to change when its own shape does; the records' versions carry the rest.

## Importing

- **BAK-4** **Import** opens the browser's own file picker. It opens from the keyboard as well as
  with a click, and the same file can be picked again straight after. While an export or an import
  is under way neither can be started, and the one running reads **Exporting…** or **Importing…**.
- **BAK-5** An import **adds to the account what it does not have yet**: tasks, lists, tags,
  prizes, Balance categories, activity records, what completions earned and redemptions. They appear on their own, the way a change made on another
  device does, and are not recorded as earning anything again — the points they bring are the ones
  in the file (STORE-25). A file exported from another account works the same, so this is also how
  to copy one account into another.
- **BAK-6** An import **never changes anything already here**. A task, list, prize, category or
  redemption the account has is left as it is, however the one in the file differs; a tag is the account's already
  when it keeps a tag of that name, whatever the case, so no tag is ever kept twice; what a completion earned is
  added to its day only when that day holds nothing for that task, and a day the app cannot read is
  left alone (STORE-24). So an import is not a return to the moment the file was made — what changed
  since stays changed — and importing the same file twice adds nothing the second time.
- **BAK-7** A task in the file's trash comes back into the trash, with the time it has left there.
  One whose time in the trash has run out since the file was made is not brought back: it would
  only be purged again (STORE-10).
- **BAK-8** A file made by an older version of the app is upgraded record by record, the same way
  saved data is (STORE-6). A record in the file the app cannot read is left out and counted; the
  rest are still imported.
- **BAK-9** A file that is not a backup — not JSON, not marked as a backup of this app, or missing a
  kind of record — is turned away with **That file isn’t a PickMe backup.**, and nothing is
  changed. A backup made by a **newer** version of the app is turned away too, saying to reload the
  page to update and try again.
- **BAK-10** Afterwards the page says what came of it: what was imported, how many records were
  already here and left as they are, and how many in the file could not be read. When nothing in the
  file was new it says **Nothing new to import.**
- **BAK-11** An import asks the account itself what it already holds, not the copy on this device —
  on a device new to the account that copy may be empty, and an old file would be let in over
  newer work. So it **needs a connection**: offline it says so and changes nothing. An import that
  fails part way says so too; trying again is safe, since whatever arrived is already here (BAK-6).
- **BAK-12** A file made before the kept tags were backed up holds no tags, and is read as keeping
  none rather than turned away. The tags its tasks carry are kept again as they arrive (STORE-33);
  only a tag no task carried is missing from such a file.
- **BAK-13** A file made before there was a bonus for clearing Today holds none, and is read as
  setting none rather than turned away, the same way. A file made before the wishlist and the point
  value (RWD-31, RWD-33) holds neither, and is read as having no prizes and setting no value.
- **BAK-14** The bonuses and what a point is worth are the things in the file that are **no
  records**: they are counted neither among what was imported nor among what was already here. An
  import takes the file's bonus for a period, and its point value, only where the account has **none
  of its own**, and never changes one it has (BAK-6). Each period is its own: a file's week bonus
  can be taken while the account keeps its own for Today.
- **BAK-15** A file holds the **warm-up** under way (WARM-1), as its one record: the day it began
  on. A file made before there was a warm-up holds none, and is read as having none under way rather
  than turned away (BAK-13). Like the bonuses it is **no record** (BAK-14): it is counted among
  neither what was imported nor what was already here, and an import takes the file's warm-up only
  where the account has **none of its own** — so restoring a backup cannot start a month that has
  already been served, nor put back one that was ended.
- **BAK-16** A file holds the **nudge's setting** (NUDGE-9), as its one record: whether it is on,
  the span it waits for and the hours it may speak in. A nudge exactly as the app arrives — off, at
  the default span, at any hour — is no record at all, here as in the account (STORE-46), and a file
  made before the setting was the account's holds none either; both are read as asking for none
  rather than turned away (BAK-13). It is **no record** the same way (BAK-14), and an import takes
  the file's setting only where the account has **none of its own** — so restoring a backup cannot
  turn a nudge back on that was turned off since.
- **BAK-17** A file made before there were Balance categories (BAL-12) holds none, and is read as
  holding none rather than turned away (BAK-13). A category is a **record**, like a prize: it is
  counted among what was imported or already here, and one the account has is left as it is (BAK-6).
- **BAK-18** A file holds the **activity log** a day at a time, as the account keeps it (STORE-51),
  each record with its own id. A record is a **record**: counted among what was imported or already
  here, and one the account holds is left as it is (BAK-6) — added to its day, never replacing the
  day. A day of the account's log the app cannot read is left alone, and nothing is added to it. A
  file made before there was an activity log holds none, and is read as holding none (BAK-13).
- **BAK-19** A file holds the **check-in's setting** (CHECKIN-9), as its one record: whether it is
  on and the hours it keeps to. A check-in exactly as the app arrives — off, 09:00–22:00 — is no
  record at all, here as in the account (STORE-52), and a file made before there was a check-in holds
  none either; both are read as asking for none (BAK-13). It is **no record** the same way (BAK-14),
  and an import takes the file's setting only where the account has **none of its own**.

---

**Where it lives:** `src/storage/backupRepository.ts` (the interface, and what an import adds),
`firestoreBackupRepository.ts` (reading and adding to the account in Firestore), `localBackupRepository.ts`
(the guest's), `backupFile.ts` (the file and its version), `taskSchema.ts`, `listSchema.ts`, `tagSchema.ts`,
`prizeSchema.ts`, `categorySchema.ts`, `activitySchema.ts`, `rewardSchema.ts`, `warmUpSchema.ts`,
`nudgeSchema.ts`, `checkInSchema.ts` (each record's own shape),
`src/app/useBackup.ts` (running them), `src/app/backupLabels.ts` (what is said),
`src/app/downloadFile.ts`, `src/app/components/BackupCard.tsx`, `SettingsList.tsx`.
**Tested in:** `src/storage/backupFile.test.ts` (the file, and reading one back),
`src/storage/backupRepository.test.ts` (what an import adds), `src/app/backupLabels.test.ts`,
`src/app/useBackup.test.ts`, `src/app/components/BackupCard.test.tsx`.
