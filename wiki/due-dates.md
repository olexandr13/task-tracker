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
  it falls on — "Today at 09:00" — since an hour on its own says nothing about when. With no day it
  is a plain calendar.
- **DUE-9** It opens a panel whose **Date** group is the row of icons of a task's menu (DUE-14) —
  **Today**, **Tomorrow**, **Next week** (the Sunday that closes next week; weeks run Monday to
  Sunday), **Skip occurrence** on a task row's repeating task (RPT-34) and **Remove date** — on a
  repeating task **Remove start date** (DUE-18) — once there is a day to take away, each named by a
  short tooltip (DUE-14) — less **Select date**, since
  a **month calendar** (DUE-15) is on show under them for any other day, and with an **i** at its
  end that spells the icons out under the row (DUE-25). Under the calendar the
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
  its own and without the panel's **i** (DUE-25), spread across the full width so its ends line up
  with the rest of the panel — though
  **never further apart than one of them is wide**, so a short row (three icons on a task with no
  day yet) sits together at the right, where the panel's other controls are, rather than an icon
  in each corner — each named by a tooltip on hover: **Today** (the sun),
  **Tomorrow** (the sunrise), **Next week** (the Sunday that closes next week, as in DUE-9), **Skip
  occurrence** on a repeating task (RPT-34), **Select date**, and **Remove date** — **Remove start
  date** on a repeating task (DUE-18) — once the task has a day. A tooltip is a few words: the name
  alone, with a short date only where the name does not say the day — "Next week · Sep 27", and the
  skip's "Skip to Sep 20". On a repeating task each day's tooltip ends with "· Starts the repeat"
  (DUE-18) — "Today · Starts the repeat", "Next week · Sep 27 · Starts the repeat".
  **Skip occurrence** and **Select date** do not: skipping moves the task on inside the rule
  (RPT-34), and Select date only opens the panel, whose own days say it. The day the task is
  **due** — its date, or the day its rule gives it (DUE-12) — is tinted and heard as chosen, so the
  mark says the same as the schedule button: a daily task's Today until it is skipped, and Tomorrow
  from then on. Choosing an icon does it and closes the menu. **Select date** opens the date half of the schedule panel (DUE-9),
  quick choices and calendar, in the menu's place, the focus on the calendar's day in reach (DUE-16),
  so the arrow keys and Enter pick a day straight away. The menu has no lines to open (DUE-23): the
  hours are spelled out under the calendar there, the menu being the day's alone.
  The same row is on a **woken wide-screen row's strip** (UI-53), less Select date, the row's own
  schedule control being the calendar there.

- **DUE-23** The panel is **one screenful**, never a column to scroll. The day is what is on show —
  the quick choices and the calendar — and the two things that hang off a day are a **line each**
  under it: **Time** and **Repeat**, with the glyph they carry everywhere, their name, and what
  they are set to now — "09:00", "Daily" — or what there would be if they were: "Any time",
  "Once". A tap opens that line's choices **in the panel's own place**, under a heading that is
  also the way back, and they hand the panel back to the day as soon as there is nothing more to
  choose (DUE-20, RPT-22). Beside a line holding something, a **×** takes it away without opening
  anything. Escape steps back out of a line's choices first and closes the panel from the day.
  A line and the choices it opens are the same wherever the panel is (DUE-13).
- **DUE-25** The Date row ends with a grey **i** — past the choices, since it changes nothing about
  the task, and a shade quieter than they are, so the eye does not count it as one of them. An icon
  says nothing by itself the first time it is met and a tooltip never reaches a thumb (UI-63), so a
  tap on it **spells the row out under itself**, a line an icon: the icon again beside the words
  its tooltip would say — "Today", "Tomorrow", "Next week · Sep 27", "Remove date", the skip's
  "Skip to Sep 20" and, on a repeating task, "· Starts the repeat" after each day (DUE-18) — so the
  two can never disagree. The lines stay for as long as the **i** is left on, which tints it as a
  set control is (UI-26); a second tap puts them away, and the panel opens with them away. The
  **i** is a note, not a choice: it sets nothing and leaves the panel open. The lines are for the
  eye alone; a screen reader hears the same words from each icon already (UI-12). The menu's row
  (DUE-14) and the woken row's strip (UI-53) keep to their tooltips.

## The calendar

- **DUE-15** Any day beyond the quick ones is picked from a **month calendar** in the panel, in place
  of the browser's own date field: the month and year at its head, **‹** and **›** to page a month
  back or on, and a dot, **Select today**, which picks today from wherever the calendar has been
  paged to — the quick **Today** again, within reach of the calendar — and closes the panel like
  any other day picked (DUE-9). Weeks run **Monday to Sunday**,
  under their initials, and a month is drawn in **the weeks it spans** — four to six, from the one
  holding its 1st to the one holding its last day, the days either side on those two belonging to
  the months around it, never a whole week of another month's — so the calendar is as tall as the
  month needs, a row taller or shorter as paging moves between months. **Today** is marked in blue, the
  day the task is **due** — its date, or the day its rule gives it (DUE-12) — is **filled**, and days
  gone by and those of the months either side are faded,
  there to pick all the same. It opens on the month of that day, and on today's with none. A click on a day picks it and
  closes the panel (DUE-9). On a repeating task each day's tooltip reads "Starts the repeat"
  (DUE-18), the dot's "Select today · Starts the repeat"; on a one-off there is nothing to say and a
  day has no tooltip, the number being under the pointer already — the dot, which shows no day, is
  named in its own. A screen reader hears each day in full — "Thursday, October 1, 2026" — today as the
  current date, the chosen day as selected, and the month's name again as it changes.
- **DUE-16** The calendar is **one stop** for Tab, on the chosen day, else the day it opened on, else
  today. The **arrow keys** move a day or a week, **Home** and **End** to the ends of the week, **Page
  Up** and **Page Down** a month — a year with Shift — keeping the day inside a shorter month (Jan 31
  a month on is Feb 28), and the month shown follows the focus. **Enter** or Space picks the day.

## The hour

- **DUE-19** A task that is due on a day can also be due **at an hour** on it — "Today at 09:00".
  The hour says when in the day the task is wanted, and is what the app goes by in saying something
  when it comes round ([Reminders](reminders.md)). It reads the same way whichever shape the task
  is: a task that happens once is due at that hour on its date, and a repeating task at that hour on
  whichever day its rule gives it, so a daily task set to nine is due at nine every morning. It is
  spelled out wherever the day is — on the schedule button (DUE-8) and under the row (DUE-5) — and
  never on its own, an hour with no day saying nothing about when. It is written as a **twenty-four
  hour** clock throughout — "09:00", "18:30", midnight "00:00" — so an hour says which hour of the
  day it is without an AM or a PM after it, the face it is picked off included (DUE-24).
- **DUE-20** The hour is set from the schedule panel's **Time** line (DUE-23), which opens over the
  day: three hours at a click — **Morning** (09:00), **Midday** (12:00) and **Evening**
  (18:00) — a **clock face** for any other (DUE-24), and **Remove time**. Unlike a day, choosing
  an hour **does not close the panel**: a quick hour, which leaves nothing more to say, hands it
  back to the day with the hour on its line, since an hour is usually picked in the same breath as
  the day it falls on. The face stays where it is for as long as the hand is being moved round it.
  A change is saved as it is made, the same as a day. Where the hours sit under the day instead of
  behind a line — the menu's **Select date** (DUE-14) — nothing moves at all.
- **DUE-21** An hour needs a **day to fall on**, since an hour on no day is due at no moment at all.
  Until the task has one — a date, or a repeat rule, which gives it days of its own — the Time line
  reads "Pick a day first" and will not open, the day being a click away above it. It follows that the hour
  **leaves with the day**: taking a one-off's date away, or a repeating task's rule, takes the hour
  with it rather than leaving it to be inherited unnoticed by the next date picked. Making a dated
  task repeat keeps the hour, the rule going on to give it days.
- **DUE-22** Setting, moving or clearing the hour changes the hour and nothing else — it never gives
  a task a day it did not have, and never moves the day it has.
- **DUE-24** Any hour beyond the quick ones is picked off a **clock face**, the app's own rather
  than the browser's. It is a **twenty-four hour** clock, as the hours are written everywhere else
  in the app: the whole day is on the face in **two rings** — `00` to `11` on the outer one, `12`
  to `23` on the inner, so a ring in is twelve hours on and the same angle stands for a morning
  hour and an evening one. The hour picked is the hour of the day, with no half of the day left to
  say after it. The minutes follow on the same face once the hour is said, so setting an hour is
  picking the hour, then the minutes. The readout above shows the two halves of the hour —
  `09:45` — each of which puts the face back on its own half, so an hour set a moment ago is
  changed without starting again. The number the hand rests on is filled, as the chosen day is in
  the calendar (DUE-15), and the hand reaches as far as that number's ring.
  - A **click on a number** picks it, and picking the hour hands the face to the minutes. The
    **hand itself can be dragged**, which reads every minute rather than the fives written on the
    face, so 7:07 is a movement away rather than something to type. Dragging the hand in or out
    across the hours crosses between the rings, an hour in the morning to the same hour at night.
  - The face is **one stop** for Tab, on the number the hand rests on. The arrow keys move the
    hand an hour or a minute at a time and come round the **day** rather than round the face, so
    an hour on from `11` is noon, a ring in at the top, and an hour on from `23` is midnight.
    Enter picks the number reached.
  - Until the task has an hour the face stands **empty**: the readout reads `--`, no hand is drawn
    and no number is filled, and the minutes wait for an hour to hang on. The keys start out on
    the **hour coming**, that being the likeliest hour to want; resting there sets nothing.

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
  the day the task is **due** is marked as chosen, among the quick choices and in the calendar — the
  same day the button reads: the occurrence in play, the first day the rule comes round on from a
  day picked for it (DUE-18), or the day a skip moved it on to (RPT-34) — so a Monday task started on
  a Thursday marks the Monday, and a daily task skipped today marks Tomorrow. **Remove start date**
  takes away the day picked, where one was (DUE-18); a rule gives the task its day whether or not
  one was, so the mark does not wait for it. The calendar opens on the month of the day the
  task is due. Every day there is to pick says what it does in its own tooltip — the quick choices
  wherever the Date row is drawn (DUE-14) and the calendar's own days and dot (DUE-15) — which is where it is
  said, the panel carrying no note of its own above the choices.
  Under the button a repeating task spells out its rule, not its date. An hour (DUE-19) is read with
  whichever of the two is said — "Daily · Today at 09:00" on the button, "Daily at 09:00" under
  the row — since the rule gives the days and the hour is the same on each of them.
- **DUE-18** A day picked for a repeating task is the day its rule **starts** on. The rule is
  untouched — a Monday task started on a Thursday is still a Monday task — so the task is due on the
  first day the rule comes round on from that day: the Monday after. Ahead of that day the task is
  not overdue and is in no period before it (PROG-4), and on the Habits page its days begin there
  rather than at the day it was written (HAB-12). A rule with no day chosen starts where the task
  was written, which is what **Remove start date** goes back to; nothing is lost either way, so
  there is nothing to undo. The days done and skipped are kept throughout (RPT-30), save the
  skipped days the day picked puts back in play (DUE-26).
- **DUE-26** A day picked for a repeating task is a day the owner wants the task **due from**, so an
  occurrence passed over from that day on — skipped (RPT-34), or missed and reopened (RPT-38) — is
  back in play: a daily task skipped today and then given Today again is due today again, marked
  and in Today (LIST-2), with a skip on offer once more. Occurrences passed over before the day
  picked stay passed over, a day picked after them changes nothing about them, and **Remove start
  date** takes away the start alone, leaving every skip standing.

---

**Where it lives:** `src/core/repeat.ts` (`sameRepeat`, `occurrenceFrom`), `src/core/day.ts` (local days and the hours that hang on them — `LocalTime`, `atLocalTime`), `src/core/task.ts` (`setDueDate`,
`setStartDay`, `scheduleOn` — the one day picked, read by whichever shape the task is — `scheduledDay`,
`startedOn`, `setDueTime` and `hasDueDay` — the hour and the day it needs — and `setRepeat`, which lets the day go with the shape it belonged to), `src/app/useTasks.ts` (`changeDay`, `changeTime`),
`src/core/due.ts` (which day a task is due — `firstDueDay` for a rule that has not come round yet — the moment it is due at — `dueMoment` — overdue, the two runs a list draws — `splitOverdue` — and the day Next week sets), `src/app/dueLabels.ts`
(wording, the hour with its day — `describeDueAt` — and the **Overdue** heading), `src/app/components/TaskList.tsx` (the run it heads), `src/app/components/SchedulePicker.tsx` (the one control), `DueChoices.tsx` (the day: quick
choices, the **i** that spells them out, and calendar), `InfoIcon.tsx` (the i), `PanelIconRow.tsx` and `src/app/panelControls.ts` (the row of icons, spread by how
many it holds, and the tones an icon, a chosen one and the quiet i wear), `DueTimeChoices.tsx` (the hours), `PanelRow.tsx` and `PanelBack.tsx` (a line
and the way back out of what it opens), `PickerPanel.tsx` (the aside or the sheet it all sits in),
`DateCalendar.tsx` and `src/app/calendarMonth.ts` (the month calendar and the days it
lays out), `ClockDial.tsx` and `src/app/clockDial.ts` (the clock face, which ring and
angle each hour sits at on it, and the hour picked off it), `src/app/dateChoices.tsx` (the Date row, shared by the panel, the menu and the woken row's strip), `AddTaskForm.tsx`,
`TaskItem.tsx`, `ContextMenu.tsx` (a row of icons).
**Tested in:** `src/core/day.test.ts`, `src/core/due.test.ts`, `src/core/task.test.ts`,
`src/app/dueLabels.test.ts`, `src/app/calendarMonth.test.ts`, `src/app/useTasks.test.ts` (the day
picked), `src/app/components/SchedulePicker.test.tsx` (the day, the hour, the rule and the **i**),
`PanelIconRow.test.tsx` (the row's count), `DateCalendar.test.tsx`, `src/app/clockDial.test.ts` and `ClockDial.test.tsx` (the face and the
hour picked off it), `AddTaskForm.test.tsx`, `TaskItem.test.tsx` (the Date row),
`TaskList.test.tsx` (the Overdue run).
