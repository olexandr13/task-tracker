# Levels

XP for nearly everything done in the app, and the level it adds up to. Points ([Rewards](rewards.md))
are a currency: earned and spent. XP is a record of effort: it is never spent, so buying a prize never
costs a level, but it is **lost** — for a habit skipped or missed, a day with nothing finished, a task
left overdue — so a level can drop as well as rise, though XP never goes below zero (LVL-17).

Each action is worth a little, and more for more work. The amounts below are the rules' own; the
page's **i** says them from the same numbers (LVL-15).

## XP and the level

- **LVL-1** **No history of XP is kept**, only **where it stands**: the XP in all, the day it began
  (LVL-2), the last day gone by that was counted (LVL-12 to LVL-14), and how many tasks today has added
  (LVL-4). Each change adds what it is worth to that, as the tasks, the time and the journal read
  before and after it — so **undoing something takes back what it is worth now**, which is what it
  gave unless the task was changed in between. What the points gave is read off the points ledger,
  which is kept anyway (LVL-9), and the level off the total (LVL-3). Where XP stands is the
  **account's**: every device signed in shows the same level, two devices adding at once both count,
  a guest's is kept in the browser and moved in on signing in (STORE-38), and it is in the backup
  (BAK-24).
- **LVL-2** XP **begins the first day the app is opened** with levels in it, at **level 0** and
  0 XP. Nothing from before that day counts: not the points earned before, not the days gone by
  before. Everyone starts at level 0.
- **LVL-3** Going from **level 0 to 1 takes 100 XP**, and every level after takes **10% more** than
  the one before, rounded to a whole number: 110, 121, 133… So level 4 is reached at 464 XP, level 9
  at 1 357. There is **no top level**. The level is read off the total each time it is shown, never
  kept, so **losing XP can take a level back**, down to level 0 at 0 XP (LVL-17).

## What gives XP

- **LVL-4** **Adding a task** gives **1** — from the one-line box, the add sheet, the Habits page or
  a duplicate alike. Only the **first 10** added in a day count. A task that goes to the trash
  **without ever having been finished** takes it back, so deleting one of today's first ten lets the
  eleventh count; restoring it gives it again. One finished before it was deleted keeps it.
- **LVL-5** **Finishing a task** — a one-off, an occurrence of a repeating task, a habit's day —
  gives **2**, plus **1 for every 15 minutes of its time goal**, up to 8 more, and **1 for every item
  of its checklist**, up to 5 more. An earlier day marked done on the Habits page (HAB-16) gives it
  too. Taking the tick back — the box, the checklist, the Habits grid — takes it back. A change of rule
  gives and takes nothing (RWD-12).
- **LVL-6** **Clearing a period** gives **5** for Today, **25** for this week and **100** for this
  month, whether or not a bonus is set for it (RWD-27) — the moment its bar reads 100% (PROG-3).
  Anything that leaves the period unclear again takes it back, and clearing it again gives it again,
  as with the bonus (RWD-26).
- **LVL-7** **Logging time** gives **1 for every full 15 minutes** of a session: one logged on a task
  (TIME-3), by hand or by the timer, one logged straight to a Balance category (BAL-14), or a record
  typed into the Activity log (ACT-2). A task's session is also written into the Activity log
  (ACT-21), and counts once. A session made longer or shorter (TIME-24) counts at its new length; one
  taken back (TIME-4, BAL-15) or a record deleted (ACT-11) takes back what it is worth, and so does a
  category deleted with its time (BAL-10). A session let go of with time (TIME-8) was spent all the
  same, and keeps it.
- **LVL-8** **Writing in the journal** gives **1** for a day with anything written in it, and **2
  more** once every section of that day has its five lines (JRN-3). Deleting lines takes back what the
  day no longer earns. The journal letting go of its older days (JRN-8) takes nothing.
- **LVL-9** **Every point earned** since XP began gives **1 XP**: a task's reward (RWD-9), a period's
  bonus (RWD-25) and what Cases paid (RWD-44) alike. It is read off the points ledger itself, so an
  earning taken back (RWD-11) or deleted on History (RWD-23) takes its XP with it. **Spending points
  never costs XP**: a redemption, a prize or a wish leaves the level where it is, and so does what a
  skip costs in points (HAB-34) — the skip costs XP of its own (LVL-12).

## What takes XP away

The days gone by are counted **once each**, the first time the app is open after the day ends, as
the tasks read then; days gone by while it was closed are counted when it next opens, and today never
is, being still in play. Two devices open at once count each day once.

- **LVL-12** A habit's day is **worth** what doing it gives (LVL-5) plus its points: a habit worth 1
  point with no time goal and no checklist is worth 3. **Skipping** a habit's day (HAB-31) costs its
  worth, and taking the skip back — or doing the day after all (RPT-36) — gives it back. **Missing** a
  habit's day — a day gone by neither done nor skipped, since the habit started and while it was not
  in the trash — costs **twice** its worth. A skip no rest was left to pay for reads as missed
  (HAB-40), and costs what the skip did not. A missed day **marked done afterwards** (HAB-16) gives
  its miss back, and taking that tick back costs it again.
- **LVL-13** **A day with nothing finished** — no one-off, occurrence or habit's day done for it —
  costs **10**. A task marked done for that day afterwards gives it back, and taking that back costs it
  again. It costs XP alone: the points are left as they are.
- **LVL-14** **A task still overdue when a day ends** costs **1**, habits aside — a missed day is
  their overdue (LVL-12) — and being overdue costs **at most 10 a day** however many tasks are. A task
  finished later still counts as overdue on the days it was not, and moving its due date afterwards
  changes nothing already counted.

- **LVL-17** **XP never goes below zero.** What is lost beyond zero is **let go of**, not owed: the
  XP in all stops at **0**, and what is gained after counts from there. Since the points' own XP
  (LVL-9) is part of the total, it is the total that stops at zero, whatever an earning taken back or
  deleted on History takes with it. So taking back something lost at zero — a skip taken back, a
  missed day marked done afterwards — gives its XP all the same, as undoing does elsewhere (LVL-1).
  Two devices letting go of it at once let it go once; offline the total still reads 0, and the XP is
  let go of on the next connection.

## The page

- **LVL-10** **Level** is a page of its own, at `#/level` (UI-36), with an entry in the sidebar
  just above **Rewards** (UI-30), and on a phone a row on **More** (UI-45). It shows the heading
  **Level** with an **i** beside it (LVL-15), the level in large figures, the XP in all, and a bar of
  how far into the level it is — `30 / 110 XP to level 2`, which a screen reader hears too. There is
  **no history** to show, none being kept (LVL-1). Until XP and the points have loaded it says
  **Loading…**, and XP the account refused says **Couldn’t load your XP. Reload to try again.**
  (STORE-13).
- **LVL-11** When the level **changes while the app is open**, a toast says so: `Level up! You
  reached level 8.`, or `Down to level 7. Lost XP took it back.` Its **Open** goes to the Level page,
  and it goes by itself after a few seconds. Opening the app says nothing, whatever changed since, and
  nothing is said while the Level page is open, where the level itself shows it.
- **LVL-15** The **i** beside the heading opens **How XP works**: a table of **what gives XP** and one
  of **what takes XP away**, each line what is done and what it is worth — `Clear everything this
  month +100`, `A day ends with no task finished −10` — then what a habit's day is worth, that
  spending points never costs XP, that everyone starts at level 0 and how much each level takes, that
  a level can drop but XP never goes below zero, and the day XP began. Every amount is read off the rules themselves, so the
  explanation never says one thing while another is counted.
- **LVL-16** **Levels** has a switch on Settings (FEAT-1). Switched off, the page, its entry and its
  row are gone and no toast is said (FEAT-2), but XP is **still counted**, as points are while Rewards
  is off (FEAT-5): switched back on, the level is where everything done meanwhile put it.

---

**Where it lives:** `src/core/xp.ts` (what each change gives and takes, the days gone by, the daily
limits, the total and the level), `src/storage/xpRepository.ts`, `xpSchema.ts`,
`firestoreXpRepository.ts` and `localXpRepository.ts` (keeping where it stands —
[Storage](storage.md)), `src/app/useXp.ts` (holding it, adding to it, counting the days gone by, and
the level), `src/app/useTasks.ts`, `useCategories.ts`, `useActivities.ts` and `useJournal.ts` (telling
it what a change was), `src/app/useLevelChange.ts` and `components/LevelToast.tsx` (the toast),
`src/app/components/LevelPage.tsx` (the page and the **i**), `LevelIcon.tsx`, `src/app/levelLabels.ts`
(the wording), `src/app/TasksScreen.tsx`, `src/app/view.ts`, `src/app/features.ts`,
`src/app/components/SideNav.tsx` and `MorePage.tsx` (getting there).
**Tested in:** `src/core/xp.test.ts`, `src/storage/xpSchema.test.ts`,
`src/storage/localXpRepository.test.ts`, `src/storage/backupFile.test.ts` and
`backupRepository.test.ts` (BAK-24), `src/app/useXp.test.ts`, `src/app/components/LevelPage.test.tsx`.
