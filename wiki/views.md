# Views

Ways of looking at the tasks. A view is not somewhere a task is kept — every task is still one
record — but a question asked of all of them, answered fresh on every render. There are
**Today**, **Week** and **Month**.

Somewhere a task *is* kept is a **list** — see [Lists](lists.md). The two are different things:
Today and Week are views, Work and Home are lists. This page kept the `LIST-` prefix its
requirements were written with, so older references to them still mean what they said.

- **LIST-1** The navigation carries **Today**, **Week** and **Month**, in that order, above
  **Tasks**. Tasks is every live task; Today, Week and Month are the parts of it due today, this
  week and this month. Each tag has a view of its own as well — see [Tags](tags.md) — and so does
  each list and the Inbox, see [Lists](lists.md). The app opens on **Today**, unless the address names another view (UI-36). On a phone Today, Week
  and Month share one tab of the bottom bar (UI-33).

## Today

- **LIST-2** A task still to do is in Today when it is **due today or overdue**. A day missed does
  not let a task drop out of sight — it stays until it is done or moved, under the **Overdue**
  heading (TASK-68) rather than mixed in with today's.
- **LIST-3** Repeating tasks are in on their days: a daily task every day, a weekly or monthly one
  on its day and, if it went undone, every day after until it is done (DUE-11) — or until it is
  passed over, by skipping (RPT-34) or by taking back a tick made after the day (RPT-38), which
  moves it to its next day.
- **LIST-4** A done task stays for the day it was due, and an overdue one finished today stays for
  today, so ticking something off does not make it vanish. A task finished ahead of its day stays on
  its own day.
- **LIST-5** A task with **no day** is in Today once it is **done today**, and only then: the day it
  was finished is the only day it has, and work done is work to show. Still to do it is in none of
  the views — nothing asks for it on any particular day — and taking the tick back takes it out of
  Today again. Finished on an earlier day, it is that day's, not today's.
- **LIST-6** A task added in Today is **due today**, unless another day or a repeat rule is chosen
  for it before Enter.
- **LIST-7** Otherwise Today shows what Tasks shows: the same rows, overdue floating to the top
  under their **Overdue** heading (TASK-68), urgent next, and done sinking to the bottom (TASK-17),
  latest finished first (TASK-70) — in one run under **Done** (TASK-69), where Tasks divides them by
  when they were finished (TASK-56) — dragging the ones still to do to reorder (TASK-71) — which
  moves the task everywhere else too — and the same rail, whose bars count every task rather than
  only today's.
- **LIST-8** An empty Today greets a fresh day and says to add a task above. Once everything in it
  is done, it praises the day's work instead (TASK-50).
- **LIST-9** Nothing moves at midnight. What is in Today follows from the day it is, so a page left
  open picks up the new day on its next render (PRIN-2).
- **LIST-21** Today can enter **Procrastination mode** — one open task in focus, the rest faded —
  see [Just one](just-one.md).

## Week

- **LIST-10** Week is Today stretched over this week, **Monday to Sunday** — the week the progress
  bars count (PROG-2). A task still to do is in it when it is **due by Sunday**, overdue included, so
  everything in Today is in Week too.
- **LIST-11** Repeating tasks are in on their occurrence in play, as in Today (LIST-3): a daily task
  every day, a Friday task from Friday. Ahead of its day the only occurrence there is to show is last
  week's, so a repeat does not appear early.
- **LIST-12** A done task stays when it was due this week, whenever it was finished, and an overdue
  one stays when it was finished this week. A task finished ahead of a later week stays in that week.
- **LIST-13** A task with no day is in Week once it was **done this week**, as in Today (LIST-5), so
  what Today shows Week shows too. Still to do it is never in Week.
- **LIST-14** A task added in Week is **due this Sunday**, the day the week closes, unless another
  day or a repeat rule is chosen for it before Enter.
- **LIST-15** Otherwise Week is the same list as Today (LIST-7): the same rows, order and rail. An
  empty Week says nothing is due this week yet; once everything in it is done, it praises the week.
- **LIST-16** Nothing moves at the turn of the week either: on Monday the list is the new week's on
  its next render.

## Month

- **LIST-17** Month is the same rule again over this calendar month, the one the progress bars count
  (PROG-2). A task still to do is in it when it is **due by the month's last day**, overdue included,
  so everything in Week is in Month too — bar the days of a week that run into next month.
- **LIST-18** Repeating tasks, done tasks and tasks with no day go as in Week (LIST-11 – LIST-13),
  over the month: a monthly task joins it on its day, a done task stays when it was due this month
  or was overdue and finished this month, and one with no day stays when it was done this month.
- **LIST-19** A task added in Month is **due on the month's last day**, unless another day or a
  repeat rule is chosen for it before Enter.
- **LIST-20** Otherwise Month is the same list as Today (LIST-7), says nothing is due this month yet
  when empty and praises the month once everything in it is done. On the 1st the list is the new
  month's on its next render.

---

**Where it lives:** `src/core/due.ts` (`isInPeriod`, `lastDayOf`), `src/app/view.ts` (the
views, their names, what each says when empty, which tasks it shows and the day it gives new ones),
`src/app/TasksScreen.tsx`, `src/app/components/SideNav.tsx`, `src/app/components/BottomNav.tsx`.
Procrastination mode on Today is [Just one](just-one.md).
**Tested in:** `src/core/due.test.ts`, `src/app/components/AddTaskForm.test.tsx`.
