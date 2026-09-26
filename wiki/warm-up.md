# Warm-up

One of the two [modes](modes.md): a month that lets the habits in one at a time. Ten habits written
in one evening of enthusiasm are ten ways to be behind by the weekend, and being behind is what the
app is for fighting. So while the
warm-up is on, the first day allows one habit, the second two, the third three, and so on for thirty
days — after which it is over and asks nothing.

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
- **WARM-3** It runs **thirty days**, its first day counted. The day it is on is derived from the
  day it began and the day it is now, by **local** days (PRIN-1): a warm-up started at nine in the
  evening is on its second day a few hours later, at midnight.

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
  the only place the allowance is ever felt: the day it is on (`Day 3 of 30`), how much of that
  day's allowance is taken (`2 habits · 3 allowed today`), what that leaves for today, **More
  info** for the warm-up's own page (MODE-10), and **End warm-up** (WARM-9). Nothing is drawn there
  while no warm-up is under way.
- **WARM-11** What today leaves is said **plainly**, an allowance being easy to read as a threat:
  *One more habit can be taken on today*; with nothing left, the rule itself — *No new habit today.
  The warm-up allows one new habit a day, so tomorrow allows one more.*, which on the last day ends
  *From tomorrow there is no limit.* instead; and — for an account with more habits than the day
  allows (WARM-7) — *You have more habits than today allows, so no new one today. None of the
  habits you have is removed.* It says outright that nothing is taken away, which is the thing a
  limit makes people fear, and it says when the next habit can be added rather than only that
  today's allowance is full.
- **WARM-7** A habit's **own** rule can always be changed: turning it from daily to weekly-on-all-
  seven, or away from daily altogether, is never one habit more, so it is never held back. Nothing a
  warm-up does deletes or changes a habit that already exists. An account that keeps more habits
  than the day allows takes no new ones on until the days catch up, and loses none of the ones it
  has.
- **WARM-8** A habit held back is **said out loud**, at the top of the window: which day the
  warm-up is on, how many habits that allows, and that tomorrow allows one more. A refusal without
  a word reads as a fault. The notice stays until it is dismissed. Asked for from the detailed add
  sheet, the sheet **stays open** with everything typed still in it, so the rule can be changed
  instead of the work being lost.

## Leaving it

- **WARM-9** Turning the switch on **Modes** off (MODE-3), or **End warm-up** on the panel, ends it
  at once — no confirm — and nothing is held back from then on. It can be started again later, which
  begins a new month from that day.
- **WARM-10** A warm-up ends **by itself** after its thirty days. Nothing runs at midnight and
  nothing is rewritten to end it: the day it is on is asked for as it is needed, so a page left open
  across midnight allows one more habit on its next render (PRIN-2). The day it began is kept, and
  neither starting nor ending one ever touches a task.

---

**Where it lives:** `src/core/warmUp.ts` (the day it is on, what it allows, and what is left),
`src/core/habit.ts` (`isHabitRepeat`, what counts as a habit), `src/core/day.ts` (`daysBetween`),
`src/app/useWarmUp.ts` (the account's warm-up on screen, and what it holds back),
`src/app/warmUpLabels.ts` (wording), `src/app/components/WarmUpPanel.tsx` (the panel on Habits),
`src/app/components/WarmUpNoticeToast.tsx` (a habit held back),
`src/app/components/WarmUpIcon.tsx`, `src/app/modes.ts` and `src/app/components/ModesPage.tsx`
(starting and ending it),
`src/app/TasksScreen.tsx` (every way of adding a habit held to the allowance),
`src/storage/warmUpRepository.ts` (the interface), `firestoreWarmUpRepository.ts` (the account's),
`localWarmUpRepository.ts` (the guest's), `warmUpSchema.ts` (the saved shape and its version).
Who may read it: `firestore.rules`.
**Tested in:** `src/core/warmUp.test.ts`, `src/core/day.test.ts` (`daysBetween`),
`src/app/useWarmUp.test.ts`, `src/app/components/WarmUpPanel.test.tsx`,
`src/app/modes.test.ts` and `src/app/components/ModesPage.test.tsx` (starting and ending it),
`src/storage/warmUpSchema.test.ts` (reading a saved warm-up back).
