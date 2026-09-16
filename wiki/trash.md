# Trash

Deleting is reversible twice over: a few seconds in which it can be taken straight back, and a day
in which it can be fetched out of the trash.

## Deleting

- **TRASH-1** Deleting never removes a task on the spot. It is **stamped** with when it was deleted
  and moved to the trash, which is what makes every step after this possible.
- **TRASH-2** A deleted task leaves the task list at once, and belongs to no period's count from
  that moment — the bars drop it immediately.
- **TRASH-3** For a few seconds afterwards a toast names the task and offers to undo the deletion
  outright. It can also be dismissed.
- **TRASH-4** Letting the offer lapse loses nothing: the task is in the trash either way. The toast
  only saves the trip there for the mis-click noticed at once.
- **TRASH-5** Deleting a second task replaces the toast rather than stacking another on top, so the
  offer always points at the task just deleted.

## The trash

- **TRASH-6** The trash is its own view, reached from the navigation, listing what has been deleted
  and not yet cleared out — most recently deleted first.
- **TRASH-7** Each row shows the title and how long the task has left before it goes for good.
- **TRASH-8** **Restore** takes the task back out, exactly as it was — same id, same completion
  record, and a repeating task comes back on the same occurrence it left on.
- **TRASH-9** A single task can be deleted for good from its row, with nothing left to restore.
- **TRASH-10** **Empty trash** clears everything at once, and asks first: it is the one action that
  cannot be undone from the screen it happens on.
- **TRASH-11** An empty trash says so, and says how long deleted tasks are kept.

## Retention

- **TRASH-12** A deleted task is kept for **a day** — 24 hours from the moment it was deleted.
- **TRASH-13** Nothing sweeps the trash on a schedule. Expiry is derived from when the task was
  deleted and the moment being asked about, the same trick the repeat rules use.
- **TRASH-14** An expired task stops appearing the moment it is out of date, even where storage
  still holds it, and leaves storage the next time the list is loaded or written.
- **TRASH-15** Time left reads in whole hours while there is more than one to go and in minutes
  below that — never "0 minutes" while there is time left, and "Going now" once there is not. An
  exact countdown would be noise on something that lasts a day.

---

**Where it lives:** `src/core/trash.ts` (retention and expiry), `src/core/task.ts` (`deleteTask`,
`restoreTask`), `src/app/trashLabels.ts` (wording), `src/app/components/TrashList.tsx`,
`UndoToast.tsx`, `src/app/useUndoToast.ts`, `src/app/useTasks.ts` (purging on load and on write).
**Tested in:** `src/core/trash.test.ts`, `src/core/task.test.ts`.
