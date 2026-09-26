# Due dates

The day a task is meant to be done on, and the hour of that day where one is wanted. A date is what
puts a task in front of you on the right day instead of in a long list of everything — see
[Views](views.md) — and an hour is what makes the app say something when it comes round, see
[Reminders](reminders.md).

## The day

- **DUE-1** A task can be **due on a day**, and — where one is wanted — at an **hour of that day**
  (DUE-19). Most tasks want only the day, which is what a task has until an hour is picked for it.
  Both are read in the owner's local calendar and clock, and stay the day and the hour they were set
  for wherever they are read.
- **DUE-2** Only a task that happens once carries a date. A repeating task is due on the days its
  rule gives it — the occurrence in play, see [Repeating tasks](repeating-tasks.md) — and the day
  picked for it is the day its rule **starts** on instead (DUE-18). The day goes with the shape it
  was picked for: giving a one-off a rule clears its date, and dropping a rule clears the day it
  started on. Swapping one rule for another keeps it.
- **DUE-3** A new task has no day unless one is chosen for it, except one added in the Today list,
  which starts on today (LIST-6), in Week, which starts on this Sunday (LIST-14), or in
  Month, which starts on the month's last day (LIST-19).

## Setting it

- **DUE-4** The add row has one schedule button (DUE-13), which spells the day out beside its icon
  and stays content-sized next to the title field, so the title keeps its room. The day chosen goes
  with the task on Enter, and the button goes
  back to the list's own day afterwards, so a date picked for one task is never inherited by the
  next unnoticed.
- **DUE-5** On a task row the schedule button (DUE-13) is the first of the controls. On a resting
  row it is there once the task has a day or a rule, and on an undated task it waits for the row to
  be woken (UI-18). It is the icon alone, tinted once a date is set — and always on
  a repeating task, whose rule has set its day (DUE-12) — red when overdue (DUE-10), the date being
  its name and tooltip. The date itself, with the hour where there is one (DUE-19), is spelled out
  **under the button**
  only on the woken row, like the other details (UI-27), so a dated row at rest is no taller than
  any other — or under every row once **Show task details** is on (UI-42). On a phone the schedule
  *button* is in the sheet (UI-48); a resting row still shows its icon as a mark when set (UI-50).
  A change is saved straight away.
- **DUE-6** Choosing a repeat rule in the add row clears the day it held, the list's own included:
  the rule says which days the task will be due, so the list's day is not a start the owner picked.
  A day picked **after** the rule is the day it starts on, as on a task row (DUE-18), and the
  button then reads the rule with the first day it comes round on.
- **DUE-7** Setting, moving or clearing the day changes the day and nothing else. A task keeps its
  completion, so moving the date is never a way to undo a tick.

## The picker

- **DUE-8** The button reads the day in words: "Today", "Tomorrow", "Yesterday", and otherwise a
  short date — "Sep 20" — with the year only when it is not this one. An hour is read with the day
  it falls on — "Today at 9:00 AM" — since an hour on its own says nothing about when. With no day it
  is a plain calendar.
- **DUE-9** It opens a panel whose **Date** group is the row of icons of a task's menu (DUE-14) —
  **Today**, **Tomorrow**, **Next week** (the Sunday that closes next week; weeks run Monday to
  Sunday), **Skip occurrence** on a task row's repeating task (RPT-34) and **Remove date** — on a
  repeating task **Remove start date** (DUE-18) — once there is a day to take away, each named by a
  short tooltip (DUE-14) — less **Select date**, since
  a **month calendar** (DUE-15) is on show under them for any other day. Under the calendar the
  **hour** (DUE-20) and the **repeat rule** (RPT-16) are a line each rather than groups of their
  own (DUE-23). A quick choice, a day in the calendar, the skip and Remove date each close the
  panel: one click says everything. There is no OK, and a click outside or Escape closes it.
- **DUE-13** The date and the repeat rule are **one control**, not two: a rule is what gives a
  repeating task its days, so two buttons would say the same thing twice. Its icon says which the
  task has — the looping arrows once there is a rule, the calendar otherwise — and it opens one
  panel, the date choices over the repeat ones (RPT-16). The same control is in the add row and on
  every task row.

- **DUE-14** A task's menu (UI-31) opens with a **Date** row of icons — the same row, from the same
  place, as the date panel's (DUE-9), with **Select date** added since the menu has no calendar of
  its own, spread across the full width so its ends line up with the
  rest of the panel — each named by a tooltip on hover: **Today** (the sun),
  **Tomorrow** (the sunrise), **Next week** (the Sunday that closes next week, as in DUE-9), **Skip
  occurrence** on a repeating task (RPT-34), **Select date**, and **Remove date** — **Remove start
  date** on a repeating task (DUE-18) — once the task has a day. A tooltip is a few words: the name
  alone, with a short date only where the name does not say the day — "Next week · Sep 27", and the
  skip's "Skip to Sep 20". On a repeating task each day's tooltip ends with "· Starts the repeat"
  (DUE-18) — "Today · Starts the repeat", "Next week · Sep 27 · Starts the repeat".
  **Skip occurrence** and **Select date** do not: skipping moves the task on inside the rule
  (RPT-34), and Select date only opens the panel, whose own days say it. The task's own day — its
  date, or the day its rule starts on — is tinted and heard as chosen. Choosing an
  icon does it and closes the menu. **Select date** opens the date half of the schedule panel (DUE-9),
  quick choices and calendar, in the menu's place, the focus on the calendar's day in reach (DUE-16),
  so the arrow keys and Enter pick a day straight away. The menu has no lines to open (DUE-23): the
  hours are spelled out under the calendar there, the menu being the day's alone.
  The same row is on a **woken wide-screen row's strip** (UI-53), less Select date, the row's own
  schedule control being the calendar there.

- **DUE-23** The panel is **one screenful**, never a column to scroll. The day is what is on show —
  the quick choices and the calendar — and the two things that hang off a day are a **line each**
  under it: **Time** and **Repeat**, with the glyph they carry everywhere, their name, and what
  they are set to now — "9:00 AM", "Daily" — or what there would be if they were: "Any time",
  "Once". A tap opens that line's choices **in the panel's own place**, under a heading that is
  also the way back, and they hand the panel back to the day as soon as there is nothing more to
  choose (DUE-20, RPT-22). Beside a line holding something, a **×** takes it away without opening
  anything. Escape steps back out of a line's choices first and closes the panel from the day.
  A line and the choices it opens are the same wherever the panel is (DUE-13).

## The calendar

- **DUE-15** Any day beyond the quick ones is picked from a **month calendar** in the panel, in place
  of the browser's own date field: the month and year at its head, **‹** and **›** to page a month
  back or on, and a dot, **Go to today**, back to today's month. Weeks run **Monday to Sunday**,
  under their initials, and a month is always drawn in six weeks — the days either side belonging to
  the months around it — so paging never changes the panel's height. **Today** is marked in blue, the
  task's own day — its date, or the day its rule starts on (DUE-18) — is **filled**, and days gone by
  and those of the months either side are faded,
  there to pick all the same. It opens on the month of the day the task is due, a repeating task's
  being the occurrence in play (DUE-12), and on today's with none. A click on a day picks it and
  closes the panel (DUE-9). On a repeating task each day's tooltip reads "Starts the repeat"
  (DUE-18); on a one-off there is nothing to say and a day has no tooltip, the number being under
  the pointer already. A screen reader hears each day in full — "Thursday, October 1, 2026" — today as the
  current date, the chosen day as selected, and the month's name again as it changes.
- **DUE-16** The calendar is **one stop** for Tab, on the chosen day, else the day it opened on, else
  today. The **arrow keys** move a day or a week, **Home** and **End** to the ends of the week, **Page
  Up** and **Page Down** a month — a year with Shift — keeping the day inside a shorter month (Jan 31
  a month on is Feb 28), and the month shown follows the focus. **Enter** or Space picks the day.

## The hour

- **DUE-19** A task that is due on a day can also be due **at an hour** on it — "Today at 9:00 AM".
  The hour says when in the day the task is wanted, and is what the app goes by in saying something
  when it comes round ([Reminders](reminders.md)). It reads the same way whichever shape the task
  is: a task that happens once is due at that hour on its date, and a repeating task at that hour on
  whichever day its rule gives it, so a daily task set to nine is due at nine every morning. It is
  spelled out wherever the day is — on the schedule button (DUE-8) and under the row (DUE-5) — and
  never on its own, an hour with no day saying nothing about when.
- **DUE-20** The hour is set from the schedule panel's **Time** line (DUE-23), which opens over the
  day: three hours at a click — **Morning** (9:00 AM), **Midday** (12:00 PM) and **Evening**
  (6:00 PM) — a clock field for any other, and **Remove time**. Unlike a day, choosing an hour
  **does not close the panel**: it hands it back to the day, with the hour on its line, since an
  hour is usually picked in the same breath as the day it falls on. Typing into the clock field
  stays put until the hour is finished. A change is saved as it is made, the same as a day. Where
  the hours sit under the day instead of behind a line — the menu's **Select date** (DUE-14) —
  nothing moves at all.
- **DUE-21** An hour needs a **day to fall on**, since an hour on no day is due at no moment at all.
  Until the task has one — a date, or a repeat rule, which gives it days of its own — the Time line
  reads "Pick a day first" and will not open, the day being a click away above it. It follows that the hour
  **leaves with the day**: taking a one-off's date away, or a repeating task's rule, takes the hour
  with it rather than leaving it to be inherited unnoticed by the next date picked. Making a dated
  task repeat keeps the hour, the rule going on to give it days.
- **DUE-22** Setting, moving or clearing the hour changes the hour and nothing else — it never gives
  a task a day it did not have, and never moves the day it has.

## Overdue

- **DUE-10** A task is **overdue** when the moment it was wanted has gone by and it is still to do:
  its day, or — where it is due at an hour (DUE-19) — that hour. A task due today at nine reads as
  late at ten rather than waiting for midnight, which is the point of having named the hour; one due
  at six this evening is not late all morning for sharing its day. Its date reads in
  red, a screen reader hears that it is overdue, and its row is drawn in a run of its own at the top
  of the list, under **Overdue** (TASK-68). Done, however late, it is not overdue.
- **DUE-11** A repeating task is overdue when the occurrence in play went by undone — a Monday task
  on the Tuesday. An occurrence from before the rule started does not count: a Monday task
  written on a Tuesday is next due on Monday, not overdue from the day before it existed, and one
  told to start on a later day is first due from there (DUE-18). Ticking
  such a task off clears the red, and taking that tick back does not bring it back: the missed
  occurrence is passed over and the task moves to its next day (RPT-38).

## On a repeating task

- **DUE-12** A repeating task's schedule button shows the looping arrows and reads its rule with
  the **occurrence in play** — "Daily · Today" on a daily task — and is tinted, since the rule has
  set the day; with no occurrence in play yet (DUE-11, DUE-18) it reads the rule alone. In its panel
  the day the rule starts on is marked as chosen, among the quick choices and in the calendar, and
  **Remove start date** takes that day away (DUE-18). The calendar opens on the month of the day the
  task is due. Every day there is to pick says what it does in its own tooltip — the quick choices
  wherever the Date row is drawn (DUE-14) and the calendar's own days (DUE-15) — which is where it is
  said, the panel carrying no note of its own above the choices.
  Under the button a repeating task spells out its rule, not its date. An hour (DUE-19) is read with
  whichever of the two is said — "Daily · Today at 9:00 AM" on the button, "Daily at 9:00 AM" under
  the row — since the rule gives the days and the hour is the same on each of them.
- **DUE-18** A day picked for a repeating task is the day its rule **starts** on. The rule is
  untouched — a Monday task started on a Thursday is still a Monday task — so the task is due on the
  first day the rule comes round on from that day: the Monday after. Ahead of that day the task is
  not overdue and is in no period before it (PROG-4), and on the Habits page its days begin there
  rather than at the day it was written (HAB-12). A rule with no day chosen starts where the task
  was written, which is what **Remove start date** goes back to; nothing is lost either way, so
  there is nothing to undo. The days done and skipped are kept throughout (RPT-30).

---

**Where it lives:** `src/core/repeat.ts` (`sameRepeat`, `occurrenceFrom`), `src/core/day.ts` (local days and the hours that hang on them — `LocalTime`, `atLocalTime`), `src/core/task.ts` (`setDueDate`,
`setStartDay`, `scheduleOn` — the one day picked, read by whichever shape the task is — `scheduledDay`,
`startedOn`, `setDueTime` and `hasDueDay` — the hour and the day it needs — and `setRepeat`, which lets the day go with the shape it belonged to), `src/app/useTasks.ts` (`changeDay`, `changeTime`),
`src/core/due.ts` (which day a task is due — `firstDueDay` for a rule that has not come round yet — the moment it is due at — `dueMoment` — overdue, the two runs a list draws — `splitOverdue` — and the day Next week sets), `src/app/dueLabels.ts`
(wording, the hour with its day — `describeDueAt` — and the **Overdue** heading), `src/app/components/TaskList.tsx` (the run it heads), `src/app/components/SchedulePicker.tsx` (the one control), `DueChoices.tsx` (the day: quick
choices and calendar), `DueTimeChoices.tsx` (the hours), `PanelRow.tsx` and `PanelBack.tsx` (a line
and the way back out of what it opens), `PickerPanel.tsx` (the aside or the sheet it all sits in),
`DateCalendar.tsx` and `src/app/calendarMonth.ts` (the month calendar and the days it
lays out), `src/app/dateChoices.tsx` (the Date row, shared by the panel, the menu and the woken row's strip), `AddTaskForm.tsx`,
`TaskItem.tsx`, `ContextMenu.tsx` (a row of icons).
**Tested in:** `src/core/day.test.ts`, `src/core/due.test.ts`, `src/core/task.test.ts`,
`src/app/dueLabels.test.ts`, `src/app/calendarMonth.test.ts`, `src/app/useTasks.test.ts` (the day
picked), `src/app/components/SchedulePicker.test.tsx` (the day, the hour and the rule),
`DateCalendar.test.tsx`, `AddTaskForm.test.tsx`, `TaskItem.test.tsx` (the Date row),
`TaskList.test.tsx` (the Overdue run).
