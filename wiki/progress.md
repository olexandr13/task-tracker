# Progress

Three bars in the rail beside the task list — below it on a phone — showing how much of each period is cleared. They are
the picture of where the day, the week and the month stand. The points a task earns are counted
separately, on the [Rewards](rewards.md) page.

## What is counted

- **PROG-1** Three periods: **today**, **this week** and **this month**.
- **PROG-2** A week runs Monday to Sunday. A month runs from the 1st to the 1st of the next, and a
  week is free to run past the end of a month.
- **PROG-3** The unit is the **task**, not the occurrence. A task stores one completion time, so
  "done at some point this week" is exactly what the saved data can answer — a daily task counts
  once towards the week, not seven times.
- **PROG-4** A task belongs to a period when an occurrence of its rule falls inside that period,
  when its due date does, or when it was completed inside it. A **skipped** occurrence (RPT-34) asks
  nothing of its day, so a daily task skipped today is out of today's count and still in the week's,
  and a weekly task whose only occurrence this week was skipped is out of the week. An occurrence
  passed over by reopening a task after its day (RPT-38) counts the same way.
- **PROG-5** A task that happens once with no due date sits in every period's count until it is
  done. One with a due date belongs to the period its day falls in and, while it is still to do, to
  every later period as well — letting it slip does not take it out of the count. Done, either kind
  counts only in the period it was completed in.
- **PROG-6** A task counts as done for a period when its completion time falls inside that period.
  Yesterday's tick is out of today, and still in this week and this month.
- **PROG-7** A task completed inside a period always counts towards it, even where the occurrence
  it was ticked off for fell just outside, so the completed count can never run past the total.
- **PROG-8** Tasks in the trash belong to no period, however they were counted before — deleting
  takes the completion out of the count along with the task.

## What is shown

- **PROG-9** Each bar shows the period, how many of its tasks are done out of how many there are,
  how many are left to reach 100%, and the percentage.
- **PROG-10** The percentage is rounded **down**, so 100% only ever means everything is done.
- **PROG-11** "all done" replaces the count of what is left once a period is clear.
- **PROG-12** A period with nothing in it reads "Nothing due", with an empty bar and no percentage.
- **PROG-13** The bars appear only once the tasks have loaded, so they never count an empty list.
- **PROG-14** Each bar is announced as a progress bar with its caption as the spoken value.

## Deliberately not counted

- **PROG-15** The bars do not count occurrences — "done on five of this week's seven days". Repeating
  tasks now keep the days they were done on (RPT-27), so this could be counted, but the bars still
  count tasks. How often a habit was kept is on the Habits page instead (HAB-8).

---

**Where it lives:** `src/core/progress.ts` (the counting), `src/app/components/ProgressPanel.tsx`.
**Tested in:** `src/core/progress.test.ts`.
