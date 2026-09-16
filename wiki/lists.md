# Lists

Ways of looking at the tasks. A list is not somewhere a task is kept — every task is still one
record — but a question asked of all of them, answered fresh on every render. The first is
**Today**.

- **LIST-1** The navigation carries **Today** above **Tasks**. Tasks is every live task; Today is
  the part of it that is due today. The app opens on **Today**, including after a reload.

## Today

- **LIST-2** A task still to do is in Today when it is **due today or overdue**. A day missed does
  not let a task drop out of sight — it stays until it is done or moved.
- **LIST-3** Repeating tasks are in on their days: a daily task every day, a weekly or monthly one
  on its day and, if it went undone, every day after until it is done (DUE-11).
- **LIST-4** A done task stays for the day it was due, and an overdue one finished today stays for
  today, so ticking something off does not make it vanish. A task finished ahead of its day stays on
  its own day.
- **LIST-5** A task with no day is never in Today, however recently it was touched.
- **LIST-6** A task added in Today is **due today**, unless another day or a repeat rule is chosen
  for it before Enter.
- **LIST-7** Otherwise Today is the same list as Tasks: the same rows, done tasks sinking to the
  bottom, dragging to reorder — which moves the task in the full list too — and the same rail, whose
  bars count every task rather than only today's.
- **LIST-8** An empty Today says there is nothing due and that a task added above will be due
  today.
- **LIST-9** Nothing moves at midnight. What is in Today follows from the day it is, so a page left
  open picks up the new day on its next render (PRIN-2).

---

**Where it lives:** `src/core/due.ts` (`isInToday`), `src/app/view.ts` (the views, their names and
empty lists), `src/app/TasksScreen.tsx` (which tasks a list shows, and the day it gives new ones),
`src/app/components/SideNav.tsx`.
**Tested in:** `src/core/due.test.ts`, `src/app/components/AddTaskForm.test.tsx`.
