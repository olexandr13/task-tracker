# Checklists

A task can be broken into parts. Each part is ticked on its own, and the task is done when they all
are — which is the point of it: a task with five unwritten parts is the kind of vague lump that
gets put off, and writing them down is what makes it startable.

A subtask is **not** a small task. It has no rule of its own, no trash, and no place in any period's
count.

## The item

| Field | Meaning |
|---|---|
| `id` | Its own UUID, fixed for life. |
| `title` | Trimmed, never blank — the same rule a task's title follows. |
| `createdAt` | When it was added. |
| `completedAt` | When it was most recently ticked, or nothing if it never has been. Not the answer to "is it ticked now" under a repeating task. |

- **CHK-1** A task starts with no checklist. Most tasks never get one, and one is never required.
- **CHK-2** An item needs only a title. It is trimmed, and a blank or whitespace-only one is refused
  rather than added as an empty line.
- **CHK-3** Items keep the order they were written in until one is moved (CHK-27). New ones join
  the end, unless written on a line opened under an item (CHK-26), which puts them there.

## Adding

- **CHK-4** The checklist **comes up with the row**: clicking into a task shows it under the
  title, above the description. The button beside the description one puts it away again without
  leaving the row, and brings it back. A row at rest shows no checklist, so the list stays
  something you can run your eye down. On a phone it comes up in the sheet (UI-48).
- **CHK-5** That button shows whether there is a checklist: marked on a resting row when there is
  one, and on a row at rest with none there is no button at all — it comes up, muted, when the row
  is woken (UI-18). The button is the **icon alone**. How it stands —
  `2/5` — is spelled out on the line of details, **under the button**, once the row is clicked into, on every
  screen width (UI-27); a screen reader is told the full count at rest too. On a phone the button is
  not on the rest row — the checklist is in the sheet (UI-48) — but a resting row still shows the
  checklist as a mark when there is one (UI-50).
- **CHK-6** Items are added on one line at the foot of the list: type and press Enter. There is no
  Add button, and Enter on an empty box does nothing.
- **CHK-7** The box **keeps its focus** after each Enter, so a checklist can be typed straight down
  rather than clicked back into item by item.
- **CHK-8** The add box does not take the caret when the checklist opens: it comes up on every
  click into a task, and one that grabbed the keyboard each time would be reaching for something it
  had not been asked for. Escape clears what is half-typed, and so does resting the row — an item
  exists only once Enter has been pressed.

## The rule

The whole of it: **a task with a checklist is done exactly when every item on it is.** It holds in
both directions, and nothing can leave a task reading done with an item still open.

- **CHK-9** Ticking the last open item completes the task, stamped at that moment.
- **CHK-10** Taking back any tick puts the task back to todo — and leaves the other items alone.
  Unticking one of five is not unticking the task. Reopening a repeating task this way passes over
  an occurrence that has gone by, as its own box does (RPT-38).
- **CHK-11** Ticking the **task's own box** ticks every item with it. That box speaks for the whole
  thing, so it cannot finish the task while leaving parts open. A tick already there keeps its own
  time rather than being restamped.
- **CHK-12** Un-ticking the task's own box clears the whole checklist, for the same reason.
- **CHK-13** Adding an item to a task already done **reopens it**: it has just been given another
  part.
- **CHK-14** Removing the last item that was still open completes the task.
- **CHK-15** Emptying the checklist altogether hands the decision back to the task's own box, which
  is then the only thing left to answer it. The task keeps whatever state it had.

## Under a repeating task

- **CHK-16** A repeating task has **one checklist**, not a fresh copy per occurrence, and ticks are
  read against the occurrence in play — the same way the task's own completion is. A daily routine's
  list is blank again tomorrow.
- **CHK-17** Nothing runs at midnight to clear it. A page left open picks the new day up on its next
  render, and no history of past ticks accumulates.
- **CHK-18** Dropping a repeat rule lets go of any tick from an occurrence that had already passed,
  so a stale tick cannot harden into a permanent one. Ticks that still count for the occurrence in
  play are kept.

## Renaming and removing

- **CHK-19** Clicking an item's title turns it into a text box in place, with the caret at the end.
  Enter (which also opens a line under it, CHK-26), or clicking away, keeps it; Escape drops the
  edit; an empty box is an abandoned edit, not a request for a nameless item.
- **CHK-20** A rename changes the title alone — same id, same tick — so it can neither finish a task
  nor reopen one.
- **CHK-21** An item is removed outright. There is no undo and no trash for a checklist item: it is
  a line of text inside a task, and the task itself is what the trash is for.
- **CHK-25** Backspace in an item's text box once it is already empty removes the item, and the
  caret goes on to the end of the item above — so a list can be deleted from the keyboard the way it
  was typed. The first item has nothing above, so the caret goes to the item that takes its place,
  and to the add box when none is left.
- **CHK-26** Enter in an item's text box opens a **blank line under it**, caret in it, looking like
  an item but not one yet — there are no nameless items (CHK-2). Typing and pressing Enter adds the
  item there and opens the next line under it, so a list can be written straight down from the
  middle as well as from the foot. Clicking away keeps what was typed; Escape drops it; Enter on the
  empty line closes it, and Backspace on it closes it and goes back to the item above, as CHK-25.

## Moving

- **CHK-27** Items are put in a new order by **dragging** them, the way tasks are (TASK-37): the
  item rides up and down with the pointer while the others slide aside to show where it will land,
  and the new order is saved when it is dropped. It lands where it was let go — below the item it
  was dropped on coming down the list, above it going up. It rides straight up and down, having
  nowhere else to go: an item belongs to its own checklist, and cannot be dropped on another task,
  on a list in the sidebar, or anywhere off the list. This works wherever the checklist is drawn —
  a row, a phone's sheet, and the sheet a task is added from, where the order of a checklist
  written before the task exists can be changed just the same.
- **CHK-28** An item is picked up anywhere on it, or by the grip in the margin to its left, which
  shows when the pointer is over the item and once the keyboard reaches it. A press in its text box
  is selecting text. A press anywhere on the checklist never picks the **task** up (TASK-38): the
  checklist answers for it, and the row behind it stays where it is.
- **CHK-29** With a mouse the drag starts once the pointer has moved a few pixels, so a click still
  opens the item for editing; with a finger you hold for a moment first, so the page still scrolls.
  A phone draws no grip, having no pointer to show one to — there an item is picked up by holding
  it. From the keyboard the grip picks the item up with Space or Enter, the arrow keys move it,
  Space or Enter drops it, and Escape puts it back and leaves the checklist open rather than resting
  the row around it. Screen readers hear the item's title and its position as it moves.
- **CHK-30** A move changes the order **alone** — same ids, same ticks — so it can neither finish a
  task nor reopen one, and counts for nothing in any period's bar. A ticked item stays where it was
  put rather than sinking to the foot of the list the way a done task does (TASK-70), and nothing
  reorders a checklist on its own.

## What a checklist is not

- **CHK-22** Items **count for nothing in any period's bar**. The unit is the task: one with five
  items counts once, done or not. See [Progress](progress.md).
- **CHK-23** A checklist travels with its task into the trash and back out again, unchanged.
- **CHK-24** An item has no repeat rule, no description and no checklist of its own. Nesting stops
  at one level.

---

**Where it lives:** `src/core/subtask.ts` (the item, how a tick is read, and the reordering),
`src/core/task.ts` (the rule binding a checklist to its task), `src/app/components/SubtaskList.tsx`,
`SubtaskItem.tsx`, `SubtaskDraft.tsx` (the line Enter opens), `TaskItem.tsx` (the button and the
block), `src/app/dragSensors.ts` (what a press on a checklist does to the row around it),
`src/app/useTasks.ts`.
**Tested in:** `src/core/subtask.test.ts` (the rules, moving among them),
`src/app/components/SubtaskList.test.tsx` (the keyboard: adding, editing, Enter and Backspace —
CHK-6, 7, 19, 25, 26), `src/app/dragSensors.test.ts` (which press picks what up — CHK-28).
