# Time goals

Some tasks are an amount of time rather than a thing done — "1 hour of sport" — and the hour is
often gathered in pieces through the day. A task can ask for a length of time, each piece is logged
as a **session**, and once the sessions add up to the goal the row says the task is ready to be
ticked off. The tick itself stays the owner's.

## The goal

- **TIME-1** A task asks for **no time until it is given a goal**, and no task has one to begin
  with. A goal is a whole number of minutes, from 1 minute to 100 hours. It is typed in the clock's
  panel (TIME-11) and kept on Enter or on leaving the panel. An empty box is no goal. Escape drops
  what was half-typed, and anything that is not a length of time leaves the goal as it was.
- **TIME-2** Changing or taking away the goal leaves the sessions logged as they are: the goal is
  what they are measured against, not what they are.

## Logging

- **TIME-3** Time is logged in **sessions**, from the clock's panel: **+15m**, **+30m** and **+1h**
  log at a click, and any other length is typed and logged with Enter. A session is a whole number
  of minutes from 1 minute to 24 hours. The panel stays open after logging, so the new total is in
  view. Time can be logged on a task without a goal too; it is then just time spent.
- **TIME-4** The panel lists the sessions that count (TIME-7), each with when it was logged — its
  time today, its date and time before that — and its length. The **×** beside one takes it back
  (UI-38), for a session logged by mistake.

## Ready to tick off

- **TIME-5** Once the time that counts **reaches the goal**, a task not yet done **invites a tick**:
  its box turns a green outline with a faint tick in it, saying "Time goal reached: ready to tick
  off" on hover and to a screen reader. The time under the clock (TIME-12) and in the panel turns
  green, and the panel says the goal is reached. A done task's box is simply done.
- **TIME-6** **Time never finishes or reopens a task.** Logging, taking a session back and changing
  the goal leave whether it is done alone, and ticking the task off or back leaves the time alone.
  A task can be ticked off before its goal is reached; the goal is a hint, not a gate.

## Under a repeating task

- **TIME-7** A session counts for the **occurrence it was logged in**, the same way a checklist tick
  does (CHK-16). A daily task starts from nothing again at local midnight; a weekly one on its next
  chosen day, so a weekly rule on one day gathers a week's time and one on Mon and Wed starts again
  on Wednesday; a monthly one on its day of the month. A task that happens once counts every session.
  Nothing runs at midnight: a page left open picks the new occurrence up on its next render (PRIN-2).
- **TIME-8** No history of time is kept. Sessions from an occurrence gone by are let go the next
  time one is logged, and dropping the rule keeps only the sessions that still count, as it does
  with checklist ticks (CHK-18), so a stale session cannot harden into a one-off's time.
- **TIME-9** A duplicated task carries its goal and **none of its time** (TASK-53). Time travels
  with its task into the trash and back out.

## On screen

- **TIME-10** The **clock** sits in a slot of its own after the checklist button (UI-27). It is
  tinted while the task has a goal or time counting (UI-26), and a screen reader hears how the time
  stands: `Time for "sport": 20m of 1h`. On a phone the line has no room for the *control*, so the
  sheet a tap opens (UI-48) has it, spelling the time out — `20m of 1h` — or offering **Log time**;
  a resting row still shows the clock as a mark when time is set (UI-50).
- **TIME-11** A length is typed the ways it is written: a bare number is minutes (`45`), and `25m`,
  `1h`, `1.5h`, `1h30`, `1h 30m` and `1:30` all read as expected. A session that cannot be read is
  not logged, and its box is marked until it is changed.
- **TIME-12** A woken row spells the time out under the clock, closed up to fit: `20m/1h`, `1h05/1h30`,
  or just `20m` without a goal. Nothing is spelled out while there is neither.
- **TIME-13** On the **Habits** page a habit with a goal has its clock on the card's line, spelling
  the time out, so time is logged where the habit is ticked off; its box invites a tick as on a
  row (TIME-5). A habit without a goal has no clock there: the goal is given from the task's row.
- **TIME-14** Time earns nothing and counts for nothing in any period's bar. Points come from
  completing (RWD-9) and the bars count tasks (PROG-3); a goal only says when completing is due.

---

**Where it lives:** `src/core/timeLog.ts` (the goal, sessions, which of them count, and whether the
goal is reached), `src/core/task.ts` (the fields, and letting go of stale sessions when a rule is
dropped), `src/app/components/TimePicker.tsx` (the clock and its panel), `src/app/components/TaskItem.tsx`
(the slot, the detail and the box's hint), `src/app/components/HabitList.tsx` (the habit card),
`src/app/components/ClockIcon.tsx`, `src/app/durationLabels.ts` (wording, and reading typed lengths),
`src/app/rowControls.ts` (the ready box), `src/app/useTasks.ts`.
**Tested in:** `src/core/timeLog.test.ts`, `src/app/durationLabels.test.ts`,
`src/app/components/TaskItem.test.tsx`, `src/app/components/HabitList.test.tsx`,
`src/storage/localTaskImport.test.ts` (tasks saved before time goals).
