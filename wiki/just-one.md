# Just one (Procrastination mode)

A Today-only way through putting things off: enter **Procrastination mode**, get one open
task to do, fade the rest, and earn a rest by finishing it.

## When it is there

- **JUST-1** While any Today task is still to do, **More** offers a **Procrastination** control
  (🫠). It starts Procrastination mode and opens **Today**. It is not offered on Week, Month or any
  other period. Pressing **P** on Today does the same from the keyboard (UI-58).
- **JUST-2** Once everything in Today is done and the mode is off, the control is gone from More —
  there is nothing to focus on. After a win with no open tasks left, the win card stays until **Rest**.
- **JUST-10** The mode is kept on **this device** for the **local day** it was started: a refresh
  keeps it (including while tasks are still loading). It ends automatically at the next local
  midnight (PRIN-2), or when the person ends the mode (JUST-8).

## What it picks

- **JUST-3** Starting the mode chooses one open Today task by rule, with no network and no model.
  The choice is derived from the tasks as they stand and the same `now` the list uses (PRIN-3).
- **JUST-4** Among open Today tasks, easier wins, in this order: fewer open checklist items; a
  shorter time goal (a task with no time goal loses to any that has one); a lower reward (none
  counts as zero); a habit over a non-habit; more days done in the **rolling last seven local
  days** (`doneDays` in that window — momentum); then the task's place in the list. Urgent is
  not a signal.

## How focus shows

- **JUST-5** While focusing, a banner says **Procrastination mode** and **Some functionality dimmed to prevent distraction. Do just one
  highlighted task**, with no emoji on the banner. The chosen task stays at full strength with
  extra space above and below it, and is drawn **first** in the list — so a finished win stays
  above the dimmed rows instead of sinking with other done work.
  Every other row on Today — done included — is shown at a quarter opacity. The view navigation
  (sidebar or phone bar) and the progress bars are dimmed the same way, so attention stays on the
  one task. After **Rest**, the banner becomes **Resting** (😌) with a calm note (**No rush —
  pick another only if you want to**) and an optional **Choose another task**; every row stays
  dimmed, and so do the navigation and the bars. Focus and idle banners also offer **End mode**
  (JUST-8). The mode banner uses a calm sky tint, not a warning colour. Nothing is hidden or
  filtered.
- **JUST-6** **Other task** (a smaller control) picks again among open Today tasks, skipping the
  current one when there is another to choose. When only one open Today task is left, the same
  control becomes **Create new task** and opens the add-task sheet (UI-54) instead.
- **JUST-7** Completing the focused task does **not** turn the mode off: it opens the win card
  (JUST-9) and More's Procrastination control stays active. **Rest** leaves the mode on and goes to idle
  (**Choose another task**, optional). A focused or won task that is deleted, or no longer in
  Today, leaves the mode resting in the same way — however that happened, on this device or
  another. The mode ends only when they end it (JUST-8) or when the day rolls over (JUST-10).

## Leaving without a win

- **JUST-8** There is no free **Show all**. Pressing **Procrastination** on More again while the
  mode is on, pressing **P** again on Today (UI-58), or **End mode** on the focus or idle banner or
  the win card, turns the mode off at once and brings the list back to normal — no confirm. The mode
  can be started again later the same day.

## After a win

- **JUST-9** Completing the focused task shows a spark burst and **Well done!** Mode stays on.
  **End mode** sits as a smaller control beside the title (JUST-8). The win card’s main actions
  share one full-width row, in this order: **⭐ Reward +1** (adds one point to this completion
  each click; once any points are on it, the button also shows the total as **· N points**, and a
  short tip shows the new total after each click), **➕ Get one more task** (immediately focuses
  another open Today task), then **😌 Rest** (goes to idle without ending the mode and without
  pushing for more work). Idle offers **Choose another task** only as an option.

---

**Where it lives:** `src/core/justOne.ts` (the pick, and how the mode settles as its task is done or
moves on), `src/app/components/ProcrastinationMode.tsx`,
`src/app/components/ProcrastinationIcon.tsx`, `src/app/components/RestingIcon.tsx`, `src/app/components/CelebrateIcon.tsx`,
`src/app/useProcrastination.ts`, `src/storage/localStorageProcrastinationRepository.ts`,
`src/app/components/MorePage.tsx` (the entry control), `src/app/components/TaskList.tsx` / `TaskItem.tsx` (dimming),
`src/app/components/SideNav.tsx`, `src/app/components/BottomNav.tsx`, `src/app/components/ProgressPanel.tsx`,
`src/app/TasksScreen.tsx`, `src/styles.css` (win animation).
**Tested in:** `src/core/justOne.test.ts`, `src/app/useProcrastination.test.ts`,
`src/app/components/ProcrastinationMode.test.tsx`, `src/app/components/MorePage.test.tsx`,
`src/app/components/TaskList.test.tsx`, `src/app/components/SideNav.test.tsx`, `src/app/components/BottomNav.test.tsx`.
