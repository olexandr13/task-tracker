# Backup

Everything the account keeps, as one file to keep somewhere else — and a file like it brought back
in. Both are on **Settings**, under the account (UI-35).

## Exporting

- **BAK-1** **Export** saves a file of the whole account, named for the local day it was made:
  `task-tracker-backup-2026-09-19.json`. Nothing is asked first, and the page then says what went into
  it — `Exported 12 tasks, 2 lists, 30 completions and 1 redemption.` — or that the account had nothing
  in it yet. Offline it still works, from the copy of the account this device keeps (STORE-18).
- **BAK-2** The file holds **everything the account keeps**: every task, those in the trash too, the
  lists, what completions earned (a *completion* in the counts is one task's points on one day) and
  the redemptions. What is kept on this device alone — the View options (STORE-30), the sidebar
  (STORE-31), the cached quote — is not the account's, and is not in it. A record the app cannot
  read (STORE-7) is left out.
- **BAK-3** The file is JSON, indented so a person can read it. It says what it is, the version of
  its own shape and when it was made, and holds each record **under the version it is saved with**
  in the account — the points a day at a time, as the account keeps them (STORE-21). The file's
  version only has to change when its own shape does; the records' versions carry the rest.

## Importing

- **BAK-4** **Import** opens the browser's own file picker. It opens from the keyboard as well as
  with a click, and the same file can be picked again straight after. While an export or an import
  is under way neither can be started, and the one running reads **Exporting…** or **Importing…**.
- **BAK-5** An import **adds to the account what it does not have yet**: tasks, lists, what
  completions earned and redemptions. They appear on their own, the way a change made on another
  device does, and are not recorded as earning anything again — the points they bring are the ones
  in the file (STORE-25). A file exported from another account works the same, so this is also how
  to copy one account into another.
- **BAK-6** An import **never changes anything already here**. A task, list or redemption the
  account has is left as it is, however the one in the file differs; what a completion earned is
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
  kind of record — is turned away with **That file isn’t a Task Tracker backup.**, and nothing is
  changed. A backup made by a **newer** version of the app is turned away too, saying to reload the
  page to update and try again.
- **BAK-10** Afterwards the page says what came of it: what was imported, how many records were
  already here and left as they are, and how many in the file could not be read. When nothing in the
  file was new it says **Nothing new to import.**
- **BAK-11** An import asks the account itself what it already holds, not the copy on this device —
  on a device new to the account that copy may be empty, and an old file would be let in over
  newer work. So it **needs a connection**: offline it says so and changes nothing. An import that
  fails part way says so too; trying again is safe, since whatever arrived is already here (BAK-6).

---

**Where it lives:** `src/storage/backupRepository.ts` (the interface, and what an import adds),
`firestoreBackupRepository.ts` (reading and adding to the account in Firestore), `backupFile.ts` (the
file and its version), `taskSchema.ts`, `listSchema.ts`, `rewardSchema.ts` (each record's own shape),
`src/app/useBackup.ts` (running them), `src/app/backupLabels.ts` (what is said),
`src/app/downloadFile.ts`, `src/app/components/BackupCard.tsx`, `SettingsList.tsx`.
**Tested in:** `src/storage/backupFile.test.ts` (the file, and reading one back),
`src/storage/backupRepository.test.ts` (what an import adds), `src/app/backupLabels.test.ts`,
`src/app/useBackup.test.ts`, `src/app/components/BackupCard.test.tsx`.
