# Due dates

The day a task is meant to be done on. A date is what puts a task in front of you on the right day
instead of in a long list of everything — see [Lists](lists.md).

## The day

- **DUE-1** A task can be **due on a day**. A day, not a time: there is no hour to it. It is a day
  in the owner's local calendar, and stays that day wherever it is read.
- **DUE-2** Only a task that happens once carries a date. A repeating task is due on the days its
  rule gives it — the occurrence in play, see [Repeating tasks](repeating-tasks.md) — so giving a
  task a rule clears its date, and a date cannot be set on a task that has one.
- **DUE-3** A new task has no day unless one is chosen for it, except one added in the Today list,
  which starts on today (LIST-6).

## Setting it

- **DUE-4** The add row has a date button beside the repeat one. The day chosen goes with the task
  on Enter, and the button goes back to the list's own day afterwards, so a date picked for one task
  is never inherited by the next unnoticed.
- **DUE-5** On a task row the date sits before the repeat button, on show at rest whether set or
  not (UI-18). On a narrow screen it is the icon alone, still tinted, the date being its name and
  tooltip. A change is saved straight away.
- **DUE-6** While a repeat rule is chosen there is no date button, in the add row or on the task:
  the rule says which days the task is due.
- **DUE-7** Setting, moving or clearing the day changes the day and nothing else. A task keeps its
  completion, so moving the date is never a way to undo a tick.

## The picker

- **DUE-8** The button reads the day in words: "Today", "Tomorrow", "Yesterday", and otherwise a
  short date — "Sep 20" — with the year only when it is not this one. With no day it is a plain
  calendar.
- **DUE-9** It opens a panel with three quick choices — **Today**, **Tomorrow** and **Next week**,
  the same weekday seven days on — each with its date spelled out beside it; a date field for any
  other day; and **No date** once there is one to take away. A quick choice closes the panel. The
  date field leaves it open, since a date is typed a part at a time. Like the repeat picker there is
  no OK, and a click outside or Escape closes it.

## Overdue

- **DUE-10** A task is **overdue** when its day has gone by and it is still to do. Its date reads in
  red, and a screen reader hears that it is overdue. Done, however late, it is not overdue.
- **DUE-11** A repeating task is overdue when the occurrence in play went by undone — a Monday task
  on the Tuesday. An occurrence from before the task was written does not count: a Monday task
  written on a Tuesday is next due on Monday, not overdue from the day before it existed.

---

**Where it lives:** `src/core/day.ts` (local days), `src/core/task.ts` (`setDueDate`, and `setRepeat`
clearing it), `src/core/due.ts` (which day a task is due, and overdue), `src/app/dueLabels.ts`
(wording), `src/app/components/DuePicker.tsx`, `AddTaskForm.tsx`, `TaskItem.tsx`.
**Tested in:** `src/core/day.test.ts`, `src/core/due.test.ts`, `src/core/task.test.ts`,
`src/app/dueLabels.test.ts`, `src/app/components/DuePicker.test.tsx`, `AddTaskForm.test.tsx`.
