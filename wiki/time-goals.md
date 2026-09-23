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

- **TIME-3** Time is logged in **sessions**, from the clock's panel: **+5m**, **+15m**, **+30m** and
  **+1h** log at a click — filled, so a phone, where nothing hovers, still shows them as buttons —
  and any other length is typed into the box under them and logged with Enter or **Log** beside it.
  A session logged by hand is a whole number of minutes from 1 minute to 24 hours; one the timer
  logs keeps its seconds (TIME-22). The panel stays open after logging, so the new total is in view.
  Time can be logged on a task without a goal too; it is then just time spent.
- **TIME-4** The panel lists the sessions that count (TIME-7) under **Sessions**, each with when it
  was logged — its time today, its date and time before that — and its length in whole minutes,
  `<1m` for a timer's run under a minute. The **×** beside one
  takes it back (UI-38), for a session logged by mistake. A long list scrolls inside the panel.

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
  tinted while the task has a goal or time counting (UI-26), and with neither it waits for the row
  to be woken (UI-18). A screen reader hears how the time
  stands: `Time for "sport": 20m of 1h`. On a phone the line has no room for the *control*, so the
  sheet a tap opens (UI-48) has it, spelling the time out — `20m of 1h` — or offering **Log time**;
  a resting row still shows the clock as a mark when time is set (UI-50).
- **TIME-21** The clock's panel opens with **how the time stands**: the time spent, large, against
  the goal (`20m of 1h`, or `20m spent` without one), beside it what is **left** (`40m left`) or
  that the goal is reached (TIME-5), and under it a bar toward the goal. A running timer counts in
  it, added to the time logged to the second (TIME-22). Opened near the foot of a sheet or the window, the panel scrolls into view
  whole, so its goal is not left cut off.
- **TIME-11** A length is typed the ways it is written: a bare number is minutes (`45`), and `25m`,
  `1h`, `1.5h`, `1h30`, `1h 30m` and `1:30` all read as expected. A session that cannot be read is
  not logged: its box is marked, and a line under it says what would do, until it is changed.
- **TIME-12** A woken row spells the time out under the clock, closed up to fit: `20m/1h`, `1h05/1h30`,
  or just `20m` without a goal. Nothing is spelled out while there is neither.
- **TIME-13** On the **Habits** page a habit's card has **no clock**, so its title has the room: the
  time is logged, and the goal given, in the sheet its ⋮ opens (HAB-25), as on a phone's row
  (TIME-10). Its box still invites a tick once the goal is reached, as on a row (TIME-5).
- **TIME-14** Time earns nothing and counts for nothing in any period's bar. Points come from
  completing (RWD-9) and the bars count tasks (PROG-3); a goal only says when completing is due.

## Timer

- **TIME-15** The clock's panel has a clear **Start timer** button across its width, above logging
  by hand. While the timer runs the button gives way to the live clock, with a pulsing dot, and
  **Stop** beside it. Start begins a timer for that task; Stop ends it and logs the time that passed,
  to the second, as one session (TIME-3, TIME-22). Under a second logs nothing. The panel can stay
  closed while the timer runs.
- **TIME-16** Only **one timer runs on this device** at a time. Starting on another task stops the
  one that was running and logs it first, then starts the new one.
- **TIME-17** The timer is kept **on this device** (not in the account): a refresh or closing the
  panel leaves it running. Elapsed time is read from when it was started; nothing rewrites the
  task until Stop.
- **TIME-18** While a timer is running it cannot be missed: the task's clock is marked as running
  (and pulses), its detail names the live run, and a chip at the foot of the screen names the
  task, shows the live clock and offers **Stop** — on a wide window and on a phone alike.
- **TIME-19** When logged time plus the live run **reaches the goal**, to the second, the app notices once for
  that run — an on-screen toast, and a browser notification when permission was given — and **does
  not stop the timer**. Starting on a task whose logged time already meets the goal notices at
  once. A task with no goal never notices this way.
- **TIME-20** A tap on the chip's title and clock **goes to the task**. The page open stays when it
  shows the task (Habits does for a habit); otherwise the app goes to Today when the task is due
  today, or else to Tasks, which shows every task. There the task is scrolled into view and opened
  as a tap on it would: its sheet on a phone, its woken row on a wide window, and a habit's sheet on
  Habits. **Stop** beside it only stops the timer.

## Seconds

- **TIME-22** Time is **counted to the second and shown in whole minutes**. A timer's session keeps
  its seconds, and the time spent is every session that counts added up to the second, then read
  down to whole minutes: three runs of 20 seconds make `1m`, and 59 minutes 59 seconds is still
  `59m` of an hour. A goal is reached once the seconds add up to it. Only the running timer's live
  clock (TIME-15, TIME-18) shows seconds; the time under the clock, the panel's total and its bar
  (TIME-12, TIME-21) move a minute at a time. A task with only seconds logged still has time set:
  its clock is tinted and reads `0m` until they make a minute.

---

**Where it lives:** `src/core/timeLog.ts` (the goal, sessions, which of them count, and whether the
goal is reached), `src/core/taskTimer.ts` (elapsed time and whether a run has reached the goal),
`src/core/task.ts` (the fields, and letting go of stale sessions when a rule is
dropped), `src/app/components/TimePicker.tsx` (the clock and its panel), `src/app/components/TaskItem.tsx`
(the slot, the detail and the box's hint), `src/app/components/HabitList.tsx` (the habit card's box),
`src/app/components/RunningTimerChip.tsx`, `src/app/components/GoalNoticeToast.tsx`,
`src/app/components/ClockIcon.tsx`, `src/app/components/PlayIcon.tsx`,
`src/app/components/StopIcon.tsx`, `src/app/durationLabels.ts` (wording, and reading typed lengths),
`src/app/rowControls.ts` (the ready box), `src/app/useTasks.ts`, `src/app/useTaskTimer.ts`,
`src/app/view.ts` (which page goes to the task), `src/app/TasksScreen.tsx` (going there),
`src/storage/taskTimerRepository.ts`, `src/storage/localStorageTaskTimerRepository.ts`,
`src/storage/taskSchema.ts` (sessions saved in whole minutes, read as seconds).
**Tested in:** `src/core/timeLog.test.ts`, `src/core/taskTimer.test.ts`, `src/app/durationLabels.test.ts`,
`src/app/useTaskTimer.test.ts`, `src/app/components/TimePicker.test.tsx`,
`src/app/components/TaskItem.test.tsx`, `src/app/components/HabitList.test.tsx`,
`src/app/components/RunningTimerChip.test.tsx`, `src/app/view.test.ts`,
`src/storage/localStorageTaskTimerRepository.test.ts`, `src/storage/localTaskImport.test.ts`
(tasks saved before time goals, and before sessions kept seconds).
