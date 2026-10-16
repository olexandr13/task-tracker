# Goals

What the work is for. A goal is a **record of its own** — Run a half marathon, Ship the app — and a
task serves **one** of them or none. Each goal shows **how far it has got**: the share of the tasks
serving it that are done. That is what a goal has that a [list](lists.md) or a [tag](tags.md) does
not: a list says where a task lives and a tag what it is about; a goal says what it brings closer,
and so how close it is.

Not to be confused with a task's [time goal](time-goals.md) — a length of time one task asks for.
A goal here is something many tasks add up to.

## The goal

- **GOAL-1** A goal is a record: it has a name and it **stays until it is deleted**, whether or not
  any task serves it. It is made on the Goals page (GOAL-18), on purpose, rather than in passing
  from a task: a goal outlives the tasks that serve it.
- **GOAL-2** A task serves **one goal at a time**, or none, so it counts once, towards the one thing
  it is for. A new task serves none — a title is still all a task needs — unless it is added on a
  goal's view (GOAL-11). Being in a list and serving a goal are separate: a task in Work can serve
  Get promoted, and one in the Inbox can serve it too.
- **GOAL-3** A goal's name may be **a phrase**, with any punctuation: "Run a half marathon, by
  spring!" is a fair name. It is trimmed, the spaces inside it are squeezed to one, and it must be
  something other than space, on one line, and at most 60 characters. The address names a goal by
  its id (GOAL-10), so no character has to be kept free.
- **GOAL-4** **Case does not make another goal**: a name another goal has already, whatever its
  case, is refused when making a goal and when renaming one, and the box it was typed in says so
  and keeps what was typed, to fix rather than type again.
- **GOAL-5** A goal can be **renamed** at any time, from the pencil beside it on the Goals page.
  Its tasks serve it by its id, so renaming touches the goal alone, and no address changes. Giving
  up a rename with Escape leaves the goal named as it was.
- **GOAL-6** A task naming a goal that is **gone** — deleted on another device, say — serves none.

## How far it has got

- **GOAL-7** A goal's progress is the share of its tasks that are **done**: its live tasks — not
  those in the trash — and of them the ones done, a repeating task for its current occurrence, as
  everywhere else (RPT-9), so a daily task serving a goal counts as done once today's is done. It is
  drawn as a **bar** with `3 of 4 done · 75%` beside it. The percent is **rounded down**, so 100% is
  said only once every task is done — then the words read `All 4 done` in green. A goal is reached
  for as long as every task serving it is done: adding another takes it below 100% again.
- **GOAL-8** A goal **no task serves yet** says `No tasks yet` and a dash, with an empty bar: it is
  not 0% of the way anywhere, nor all the way.
- **GOAL-9** Work done **long ago counts too**. The tasks finished before last week and this month
  began are not loaded as the app opens (STORE-55), so for the goals on screen the server is asked
  how many of each goal's tasks those are — a count, never the tasks — and they count as done. It
  is asked again whenever more history is loaded, the last answer standing meanwhile. Offline, or
  until the answer arrives, a goal counts the tasks loaded.

## A goal's tasks

- **GOAL-10** Every goal has **a view of its own**, opened from the Goals page: the live tasks
  serving it. It shows what a list's view shows (LST-8) — the same rows, overdue floating, done
  sinking, dragging, no rail (UI-2) — its done tasks divided as the Inbox's are (TASK-72), and it is
  headed with a card naming the goal and showing **how far it has got** (GOAL-7). **Goals** stays
  marked in the sidebar while it is open; it has no entry of its own. It is in the address as
  `#/goal/{id}` (UI-36), and back climbs to the Goals page (UI-37), as does the **‹ Goals** link
  above the card (UI-85).
- **GOAL-11** A task added in a goal's view — from the box, or from the Plus's sheet — **serves
  that goal**, and has no day, as in a list's view (LST-9).
- **GOAL-12** A goal's view with nothing in it says nothing serves the goal yet and to add a task;
  once everything in it is done, it says every task for the goal is done — **Goal reached!**

## Linking a task

- **GOAL-13** A task is linked from **its menu** — a right-click on the row, or a finger's hold or
  second tap (UI-31, UI-44) — where a **Goal** group comes under the List group, offering **No goal**
  and then every goal in the order they are shown, the task's own **checked**. Choosing one links
  the task and closes the menu. A **target button** on the woken wide-screen row (UI-53) opens the
  same choices in a panel, closing on a choice. While there are no goals the menu has no Goal group
  and the row has no target button, No goal alone being no choice.
- **GOAL-14** On a phone the task's **sheet** carries the target button in its row of icons (UI-63),
  **tinted** while the task serves a goal — the name left to the panel it opens, the row having no
  width for it (LST-23). So does the sheet for adding a task in detail (UI-54). With no goals yet
  the panel says to make one on the Goals page.
- **GOAL-15** Linking a task changes that and nothing else — same id, same completion record, same
  rule — and counts for nothing in any period's bar, in points or in XP. A **duplicate** serves the
  same goal as the original (TASK-51): another go at the same thing serves the same end.

## The Goals page

- **GOAL-16** **Goals** has an entry of its own in the sidebar, right after Lists, in the group of
  the work and where it is filed (UI-30), with a target for its icon. Its page lists **every goal**,
  in the order they were made, each with its bar and its count (GOAL-7), and opening its view
  (GOAL-10). An **i** beside the heading (UI-73) says, in plain sentences, what a goal is, how to
  make one, how to link a task, and what the bar counts.
- **GOAL-17** Beside each goal is a button that **renames** it (GOAL-5) and one that **deletes**
  it, after asking in the app's own sheet (UI-74): **Delete the goal "Get fit"?**, then
  `Its tasks stop counting towards it.` and `The tasks themselves are not deleted.` **Delete** goes
  ahead; anything else leaves the goal as it was. Deleting unlinks every task that served it —
  tasks in the trash too, so restoring one does not link it to a goal that has gone — and the tasks
  stay as they were otherwise. A finished task not loaded yet (STORE-55) goes on naming the goal, and
  serves none all the same (GOAL-6). There is no undo. Deleting the goal whose view is open leaves
  that view for the Goals page.
- **GOAL-18** A box at the top of the page makes a goal, on Enter or with its **Add** button, and
  **opens the new goal** so the next thing typed is one of its tasks. The box is cleared for the next
  one. With no goals yet, the page says to name one and link the tasks that move it forward.

## On a phone

- **GOAL-19** The Goals page is reached from a **Goals** link on **More's page**, after Lists (UI-45),
  and **More** stays marked while Goals or a goal's view is open.

## Switching it off

- **GOAL-20** **Goals** can be switched off on Settings, in the Tasks group (FEAT-1, FEAT-11): its
  page, its entry, its link on More, the Goal group of a task's menu and the target button on rows
  and sheets all go. A task keeps the goal it serves, and comes back serving it (FEAT-5). An
  address naming a goal's view, or Goals, opens More instead (FEAT-2).

---

**Where it lives:** `src/core/goal.ts` (the record, names, linking a task, unlinking a goal's tasks,
how far a goal has got), `src/app/goals.ts` (`GoalsContext`, every goal for whatever is drawn inside a
row or a sheet), `src/app/useGoals.ts` (the goals on screen), `src/app/useGoalHistory.ts` (counting
each goal's history on the server), `src/app/useTasks.ts` (linking a task, unlinking a goal's tasks),
`src/app/goalLabels.ts` (the wording), `src/app/components/GoalsPage.tsx` (the Goals page),
`src/app/components/GoalHeader.tsx` (the head of a goal's view), `src/app/components/UpLink.tsx`
(the link back to Goals), `src/app/components/GoalProgressBar.tsx`
(the bar), `src/app/components/GoalPicker.tsx` (the panel on a woken row and a sheet),
`src/app/components/TaskItem.tsx` (the Goal group of a task's menu), `src/app/components/TaskSheet.tsx`,
`src/app/components/AddTaskSheet.tsx`, `src/app/view.ts` (Goals and a goal's view, their addresses
and what they say), `src/app/TasksScreen.tsx`, `src/app/components/SideNav.tsx`,
`src/app/components/TargetIcon.tsx`.
**Saved in:** `src/storage/goalSchema.ts` and `src/storage/firestoreGoalRepository.ts` (one document
per goal), `src/storage/localGoalRepository.ts` (the guest's), with `goalId` on the task itself
(`src/storage/taskSchema.ts`) — see [Storage](storage.md) (STORE-65) and [Backup](backup.md) (BAK-25).
**Tested in:** `src/core/goal.test.ts`, `src/app/useGoals.test.ts`, `src/app/useGoalHistory.test.ts`,
`src/app/components/GoalsPage.test.tsx`, `src/app/components/GoalPicker.test.tsx`,
`src/app/components/TaskItem.test.tsx` (the Goal group), `src/app/view.test.ts` and
`src/app/useView.test.ts` (a goal's view and its address), `src/storage/goalSchema.test.ts`,
`src/storage/taskSchema.test.ts` (tasks saved before goals), `src/storage/taskQueries.test.ts` (the
server's count of a goal's tasks).
