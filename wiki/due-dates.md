# Due dates

The day a task is meant to be done on. A date is what puts a task in front of you on the right day
instead of in a long list of everything — see [Views](views.md).

## The day

- **DUE-1** A task can be **due on a day**. A day, not a time: there is no hour to it. It is a day
  in the owner's local calendar, and stays that day wherever it is read.
- **DUE-2** Only a task that happens once carries a date. A repeating task is due on the days its
  rule gives it — the occurrence in play, see [Repeating tasks](repeating-tasks.md) — so giving a
  task a rule clears its date, and picking a date for a task that has one ends the rule (DUE-12).
- **DUE-3** A new task has no day unless one is chosen for it, except one added in the Today list,
  which starts on today (LIST-6), in Week, which starts on this Sunday (LIST-14), or in
  Month, which starts on the month's last day (LIST-19).

## Setting it

- **DUE-4** The add row has one schedule button (DUE-13), which spells the day out beside its icon.
  The day chosen goes with the task on Enter, and the button goes back to the list's own day afterwards, so a date picked for one task
  is never inherited by the next unnoticed.
- **DUE-5** On a task row the schedule button (DUE-13) is the first of the controls, on show at
  rest on **every** task, set or not (UI-18). It is the icon alone, tinted once a date is set — and always on
  a repeating task, whose rule has set its day (DUE-12) — red when overdue (DUE-10), the date being
  its name and tooltip. The date itself is spelled out **under the button**
  only on the woken row, like the other details (UI-27), so a dated row at rest is no taller than
  any other — or under every row once **Show task details** is on (UI-42). A change is saved straight away.
- **DUE-6** While a repeat rule is chosen in the add row its schedule button reads the rule, not
  the day: the rule says which days the task will be due, so the task goes without the list's day.
  A day picked there ends the rule, as it does on a task row (DUE-12).
- **DUE-7** Setting, moving or clearing the day changes the day and nothing else. A task keeps its
  completion, so moving the date is never a way to undo a tick.

## The picker

- **DUE-8** The button reads the day in words: "Today", "Tomorrow", "Yesterday", and otherwise a
  short date — "Sep 20" — with the year only when it is not this one. With no day it is a plain
  calendar.
- **DUE-9** It opens a panel whose **Date** group is the same row of icons as a task's menu (DUE-14) —
  **Today**, **Tomorrow**, **Next week** (the Sunday that closes next week; weeks run Monday to
  Sunday), **Skip occurrence** on a task row's repeating task (RPT-34), **Select date** and **Remove
  date** once there is a day to take away — each named by a short tooltip (DUE-14); then
  a date field for any other day. The repeat choices are under them (RPT-16). A day choice, the skip
  and Remove date close the panel. The date field is on show only while a one-off has a day, which
  it shows; with no day, or on a repeating task (DUE-12), it is left out, a date there saying nothing.
  **Select date** brings it up — empty when there was none — puts the caret in it and opens its
  calendar where the browser allows; the field leaves the panel open, since a date is typed a part
  at a time. Like the repeat choices there is no OK, and a click outside or Escape closes it.
- **DUE-13** The date and the repeat rule are **one control**, not two: a rule is what gives a
  repeating task its days, so two buttons would say the same thing twice. Its icon says which the
  task has — the looping arrows once there is a rule, the calendar otherwise — and it opens one
  panel, the date choices over the repeat ones (RPT-16). The same control is in the add row and on
  every task row.

- **DUE-14** A task's menu (UI-31) opens with a **Date** row of icons — the same row, from the same
  place, as the date panel's (DUE-9), spread across the full width so its ends line up with the
  rest of the panel — each named by a tooltip on hover: **Today** (the sun),
  **Tomorrow** (the sunrise), **Next week** (the Sunday that closes next week, as in DUE-9), **Skip
  occurrence** on a repeating task (RPT-34), **Select date**, and **Remove date** once a one-off has
  a day. A tooltip is a few words: the name alone, with a short date only where the name does not
  say the day — "Next week · Sep 27", and the skip's "Skip to Sep 20". That picking a day ends a
  rule is said once, by the panel's note (DUE-12), not in every tooltip. The one-off's own day is
  tinted and heard as chosen. Choosing an
  icon does it and closes the menu. **Select date** opens the date half of the schedule panel (DUE-9)
  in the menu's place, its date field focused and its calendar opened where the browser allows.

## Overdue

- **DUE-10** A task is **overdue** when its day has gone by and it is still to do. Its date reads in
  red, and a screen reader hears that it is overdue. Done, however late, it is not overdue.
- **DUE-11** A repeating task is overdue when the occurrence in play went by undone — a Monday task
  on the Tuesday. An occurrence from before the task was written does not count: a Monday task
  written on a Tuesday is next due on Monday, not overdue from the day before it existed.

## On a repeating task

- **DUE-12** A repeating task's schedule button shows the looping arrows and reads its rule with
  the **occurrence in play** — "Daily · Today" on a daily task — and is tinted, since the rule has
  set the day; with no occurrence in play yet (DUE-11) it reads the rule alone. Its panel says first that a day picked there makes the task a one-off, marks no
  quick choice as chosen, has no **Remove date** and no date field until **Select date** (DUE-9), the day being the rule's rather than the task's own.
  Picking a day — a quick choice or the date field — **ends the rule** exactly as choosing Once would
  (RPT-12, RPT-14, RPT-30) and gives the task that day, so the button goes back to the calendar at the same time.
  Under the button a repeating task spells out its rule, not its date.

---

**Where it lives:** `src/core/day.ts` (local days), `src/core/task.ts` (`setDueDate`, `setRepeat`
clearing it, and `scheduleOnce`, a day that ends a rule), `src/app/useTasks.ts` (`changeDueDate`), `src/core/due.ts` (which day a task is due, overdue, and the day Next week sets), `src/app/dueLabels.ts`
(wording), `src/app/components/SchedulePicker.tsx` (the one control) and `DueChoices.tsx` (its
date half), `src/app/dateChoices.tsx` (the Date row, shared by the panel and the menu), `AddTaskForm.tsx`,
`TaskItem.tsx`, `ContextMenu.tsx` (a row of icons).
**Tested in:** `src/core/day.test.ts`, `src/core/due.test.ts`, `src/core/task.test.ts`,
`src/app/dueLabels.test.ts`, `src/app/components/SchedulePicker.test.tsx`, `AddTaskForm.test.tsx`,
`TaskItem.test.tsx` (the Date row).
