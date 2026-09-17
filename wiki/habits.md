# Habits

A task that repeats every day is a habit, and the Habits page is its record: whether today is
done, how the streak stands, and every day behind it. A habit is not a separate kind of record.
It is the task itself, read over time from the days it was done on (RPT-27).

## What a habit is

- **HAB-1** A habit is a task whose rule comes round **every day**: a daily rule, or a weekly rule
  with all seven days, which reads "Daily" anyway (RPT-25). A task that skips a day, a monthly
  task and a one-off are not habits.
- **HAB-2** The page lists every habit not in the trash, **in the order of the task list**. Ticking
  one off does not move it.
- **HAB-3** With no habits, the page says a task given a daily repeat is tracked there.

## A habit's card

- **HAB-4** Each habit has a box to tick **today** off, and to take today back. It is the task's
  own box, so it does the same as ticking the task off in a list, checklist and all (CHK), and
  the lists show the change.
- **HAB-5** **Current streak**: the days in a row it was done, counting back from today. While
  today is still to do, the count starts from yesterday instead: today is still in play until it
  is over, so it breaks nothing yet. A day that went by without it ends the streak. The flame
  beside the count is lit while there is a streak.
- **HAB-6** **Best streak**: the longest run of days in a row it was ever done.
- **HAB-8** **Last 7 days**, **last 30 days** and **last year** (the last 365 days): a percentage,
  with the days behind it (`25/30`). The days that count are every day since the task was created,
  and any day it was done on before that (HAB-12). Today counts only once it is done. The percentage is rounded down, so 100% only ever means every day was kept. A
  habit with no record yet shows a dash.
- **HAB-9** Below the numbers is a grid of days: a column per week, Monday to Sunday, with this
  week on the right. Every other row names its weekday, and a month's name sits over the week that
  holds its first Monday. As many weeks show as the card has room for, up to a year. A phone shows
  about four months.
- **HAB-10** A day in the grid is **done** (green), **missed** (a darker gap), **not tracked** (a
  pale square, before the task was created) or **today still to do** (an outlined square). Days after
  today are left empty. A legend at the top of the page names the shades, beside a line saying a day
  can be clicked (on a phone: that a habit is tapped to see its days, HAB-21). Pointing at a day shows its date and what it was: `Wed, Sep 16 · Done`.
- **HAB-11** A screen reader hears the numbers as text, and the grid as a group of day buttons,
  named for how many days of the year shown were done. Each day is heard by its date and what it
  was, and as pressed when it was done.

## The record

- **HAB-12** A day can only be **missed once the task exists**. From the day it was created, a day
  with no tick is a miss. Before that nothing was asked of it, so an unticked day is **not
  tracked**. A day marked done before the task was created still counts as done, and the days
  around it stay not tracked (HAB-16). This is the same reading a repeating task's due days get
  (DUE-11). A task that was a one-off, or repeated another way, before it became daily counts its
  misses from its creation all the same. So does a task saved before history was kept (STORE-6),
  whose history starts at its last completion.
- **HAB-13** A day recorded twice counts once, and a day after today does not count at all, so a
  device whose clock runs ahead cannot put a habit ahead of itself.
- **HAB-14** Nothing is stored for a habit beyond the task's own history, and nothing runs at
  midnight. A page left open picks up the new day on its next render (PRIN-2).
- **HAB-15** The page has no rail. The streaks already are the progress, and the three bars count
  tasks, not habits (UI-2).

## Changing a day

- **HAB-16** Clicking a day in the grid marks it **done**, or takes it back if it was. Any day up to
  today can be changed, so a day that was kept but never ticked can still be recorded, and one ticked
  by mistake taken back. Clicking it again undoes the change.
- **HAB-17** Today in the grid is the same as the box on the card (HAB-4): the task is ticked off or
  reopened, checklist and all.
- **HAB-18** A day after today cannot be marked. It is not a button at all.
- **HAB-19** On the keyboard the grid is **one stop for Tab**, landing on today, or on the day last
  moved to while the grid had focus. Left and right move a week, to the same weekday. Up and down
  move a day within the week. Enter or Space marks the day. Moving stops at the edges: at the
  oldest week the card has room to show, at Monday and Sunday, and at today.
- **HAB-20** Changing an earlier day changes the habit's history, and its completion time only
  where that time has to follow: it stays the **latest** day the habit was done. That way the week
  and month bars (PROG-6) count what the history says. A day marked later than the last completion
  becomes the completion, stamped at the start of that day. Taking back the day of the last
  completion falls back to the latest day before it, or to no completion if none is left.

## On a phone

- **HAB-21** Below `md` (UI-4) a card starts **folded**: the box for today (HAB-4), the title, and
  the current streak as a flame and a number. **Tapping the card's line** — anywhere on it but the
  box — unfolds the numbers (HAB-5 to HAB-8) and the grid (HAB-9) beneath it, and tapping it again
  folds them away. A chevron at the end of the line points down while folded and up while open.
  Open, the line drops its streak, which the numbers below already give. A list of year-long grids
  is a long way to scroll for a box to tick, and ticking is what the page is visited for.
- **HAB-22** Ticking the box never unfolds a card. Each card folds on its own, so opening one never
  moves one being reached for, and a card starts folded again when the page is next opened. A screen
  reader hears the fold as a button named for its habit (`Record of "stretch"`), reporting whether
  it is open. On a wide screen every card is always open, and there is nothing to fold.

---

**Where it lives:** `src/core/habit.ts` (what a habit is, streaks, rates, the weeks, `setDoneOnDay`),
`src/core/task.ts` (`doneDays`, kept in step by `settleHistory`), `src/app/components/HabitList.tsx`
(the page and its cards), `src/app/components/HabitGrid.tsx`, `src/app/components/ChevronIcon.tsx`, `src/app/habitLabels.ts` (wording),
`src/app/habitTones.ts` (the shades), `src/app/components/FlameIcon.tsx`, `src/app/useTasks.ts`
(`setHabitDay`).
**Tested in:** `src/core/habit.test.ts`, `src/core/task.test.ts`,
`src/app/components/HabitList.test.tsx`.
