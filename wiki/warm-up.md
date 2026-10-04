# Warm-up

One of the two [modes](modes.md): a month that lets the habits in one at a time. Ten habits written
in one evening of enthusiasm are ten ways to be behind by the weekend, and being behind is what the
app is for fighting. So while the
warm-up is on, the first day allows one habit, the second two, the third three, and so on for thirty
days it is running — after which it is over and asks nothing. Pausing holds that still: the days it
is paused add no habit, and the habits already there stay.

Only habits ([Habits](habits.md)) are held back. Ordinary tasks are what a day actually holds, and
there is never a limit on them.

## Starting and ending

- **WARM-1** A warm-up is the account's, not the device's: every device signed in shows the same day
  and the same allowance, so a habit held back on the laptop is held back on the phone
  (STORE-44).
- **WARM-2** The warm-up is turned on by its **switch on Modes** (🌱), on its row or on its own
  page (MODE-3). It starts a warm-up on **today**, which is its day one, and stays on the page it
  was turned on from, the warm-up being about the habits rather than about this moment. With none
  under way the switch reads as off; a warm-up already served its month reads the same, and turning
  it on starts a new one.
- **WARM-3** It runs **thirty days** it is running, its first day counted. The day it is on is derived
  from the day it began, the day it is now, and any pause (WARM-11), by **local** days (PRIN-1): a
  warm-up started at nine in the evening is on its second day a few hours later, at midnight. A day
  it is paused is not one of the thirty, and does not move it on.

## What it allows

- **WARM-4** The day a warm-up is on is how many habits it allows: **one on day one, two on day
  two**, and so on to thirty on day thirty. What counts against that allowance is **how many habits
  there are** (HAB-1), not how many were taken on since it began, so there is one number to
  understand and no way round it. Every way of making one habit more is held to it: adding a task
  with a daily rule, from the one-line box, the detailed sheet or the Habits page; giving an
  existing task a daily rule; and duplicating a habit.
- **WARM-5** Tasks that are not habits are **never** held back, however many there are. Neither is
  anything at all once no warm-up is under way.
- **WARM-6** **Habits** carries the warm-up at the head of the page, where habits are added and so
  the only place the allowance is ever felt, in **one line**: the mode's name, the day it is on
  (`Day 3/30`) and how many habits there are over how many the day allows (`2/3 habits`), with
  **More info** beside it for the warm-up's own page (MODE-10). The count is never capped: an
  account past the allowance (WARM-7) reads `7/3 habits`, so every habit is seen to be counted and
  none to be taken away. While it is paused the line says so (`Day 3/30 · Paused · 2/3 habits`),
  the allowance being the one it froze on (WARM-11). Nothing more is said there — what today leaves is the notice's to say,
  when a habit is actually held back (WARM-8) — and the way out is the switch on Modes (WARM-9).
  Nothing is drawn there while no warm-up is under way.
- **WARM-7** A habit's **own** rule can always be changed: turning it from daily to weekly-on-all-
  seven, or away from daily altogether, is never one habit more, so it is never held back. Nothing a
  warm-up does deletes or changes a habit that already exists. An account that keeps more habits
  than the day allows takes no new ones on until the days catch up, and loses none of the ones it
  has.
- **WARM-8** A habit held back is **said out loud**, at the top of the window: which day the
  warm-up is on, how many habits that allows, and that tomorrow allows one more. While it is paused
  that last is that the allowance stays until it is resumed, tomorrow allowing nothing more until
  then. A refusal without a word reads as a fault. The notice stays until it is dismissed. Asked for
  from the detailed add sheet, the sheet **stays open** with everything typed still in it, so the
  rule can be changed instead of the work being lost.

## Pausing

- **WARM-11** While a warm-up is on, its own page offers **Pause**. Pausing freezes the day it is
  on. The days that then pass add **no** habit: the allowance stays the one that day allows, and
  every habit already there stays — a pause changes no habit. Room left on that day can still be
  filled; one habit more than it allows is still held back (WARM-4, WARM-8). **Habits** and the
  Modes row say **Paused**. **Resume** lets it run again. Resumed the same day, it is still that
  day. Resumed on a later day, that day allows **one** more, the days between having been the pause.
  Pausing or resuming keeps the day it began. Nothing is offered to pause while no warm-up is under
  way, and the switch on Modes still ends it (WARM-9).

## Leaving it

- **WARM-9** Turning the switch on **Modes** off (MODE-3), on its row or on its own page, asks
  first. The warning says that enabling it again starts from scratch, on day one: the month under
  way ends, and a later start begins a new one from that day. Cancelling leaves it running.
  Confirmed, nothing is held back from then on. That switch is the only way out: the panel on
  Habits (WARM-6) has none, so a warm-up is not ended by a stray tap where habits are added.
- **WARM-10** A warm-up ends **by itself** once thirty days of it have run. Nothing runs at midnight and
  nothing is rewritten to end it: the day it is on is asked for as it is needed, so a page left open
  across midnight allows one more habit on its next render (PRIN-2). A pause holds the ending off:
  it does not end on a day it is paused, and those days are not part of the thirty. Resuming after
  the last day has already been spent ends it, there being no further day. The day it began is kept, and
  neither starting nor ending one ever touches a task.

---

**Where it lives:** `src/core/warmUp.ts` (the day it is on, what it allows, and what is left),
`src/core/habit.ts` (`isHabitRepeat`, what counts as a habit), `src/core/day.ts` (`daysBetween`),
`src/app/useWarmUp.ts` (the account's warm-up on screen, and what it holds back),
`src/app/warmUpLabels.ts` (wording), `src/app/components/WarmUpPanel.tsx` (the panel on Habits),
`src/app/components/WarmUpPause.tsx` (pausing it, on its own page),
`src/app/components/WarmUpNoticeToast.tsx` (a habit held back),
`src/app/components/WarmUpIcon.tsx`, `src/app/modes.ts` and `src/app/components/ModesPage.tsx`
(starting and ending it),
`src/app/TasksScreen.tsx` (every way of adding a habit held to the allowance),
`src/storage/warmUpRepository.ts` (the interface), `firestoreWarmUpRepository.ts` (the account's),
`localWarmUpRepository.ts` (the guest's), `warmUpSchema.ts` (the saved shape and its version).
Who may read it: `firestore.rules`.
**Tested in:** `src/core/warmUp.test.ts`, `src/core/day.test.ts` (`daysBetween`),
`src/app/useWarmUp.test.ts`, `src/app/warmUpLabels.test.ts`,
`src/app/components/WarmUpPanel.test.tsx`, `src/app/components/WarmUpPause.test.tsx`,
`src/app/modes.test.ts` and `src/app/components/ModesPage.test.tsx` (starting and ending it),
`src/storage/warmUpSchema.test.ts` (reading a saved warm-up back).
