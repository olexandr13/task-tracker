# Tasks

The record the whole app is about, and the seven things that can happen to one: it is added, it is
renamed, it is described, it is completed, it is moved, it is duplicated, it is deleted. Deleting has a page of its own — see
[Trash](trash.md).

## The record

| Field | Meaning |
|---|---|
| `id` | Its own UUID, fixed for life. |
| `title` | Trimmed, never blank. |
| `description` | Free text about the task, or nothing. Trimmed at the ends; may be empty. |
| `status` | The last thing that happened — `todo` or `done`. Not the answer to "is it done now" for a repeating task. |
| `createdAt` | When it was added. |
| `completedAt` | When it was most recently completed, or nothing while it is todo. |
| `repeat` | A recurrence rule, or nothing for a task that happens once. See [Repeating tasks](repeating-tasks.md). |
| `dueDate` | The local day a one-off is due, or nothing. Always nothing on a repeating task. See [Due dates](due-dates.md). |
| `subtasks` | The checklist, in the order it was written, or empty. See [Checklists](checklists.md). |
| `tags` | The tags it carries, in the order they were put on, or empty. See [Tags](tags.md). |
| `listId` | The list it is filed under, by id, or nothing for one in no list — the Inbox. One at a time. See [Lists](lists.md). |
| `reward` | The points each completion earns, or nothing. What completions already earned is kept apart from the task. See [Rewards](rewards.md). |
| `timeGoal` | The minutes the task asks for, or nothing. See [Time goals](time-goals.md). |
| `timeLog` | The sessions of time logged, oldest first. Under a repeating task only the occurrence in play's count. See [Time goals](time-goals.md). |
| `deletedAt` | When it went to the trash, or nothing while it is live. |
| `order` | Where it sits in the list, as a number: lower comes first. |

- **TASK-1** A title is all a task needs. Everything else is either stamped for it or left empty.
- **TASK-2** Titles are trimmed, and a blank or whitespace-only title is not a task at all — it is
  refused rather than saved as an empty row.
- **TASK-3** Every task gets its own id and is stamped with when it was created.

## Adding

- **TASK-4** Adding is one line: type the title and press Enter. There is no Add button, and Enter
  on an empty box does nothing.
- **TASK-5** A task can be given a repeat rule, or a day it is due, in the same row, before it is
  added.
- **TASK-6** After adding, the box clears, the repeat choice goes back to "once" and the date to the
  list's own day, so the next task never inherits a rule or a date unnoticed.
- **TASK-7** New tasks join the end of the list.

## Renaming

- **TASK-8** Clicking a task's title turns it into a text box in place, with the caret **where you
  clicked or tapped** — between the two characters nearest the pointer, or at the end when the click
  is just past the last word. Nothing is selected: an edit is usually a tweak, not a rewrite. Opened
  from the keyboard, the caret goes to the end. The part of the row that edits the title is the
  words themselves and 13 pixels past them (UI-29).
- **TASK-9** Enter, or clicking away, keeps the new title. Escape drops the edit.
- **TASK-10** An empty box counts as an abandoned edit rather than a request for a nameless task:
  the old title stays.
- **TASK-11** A rename changes the title and nothing else — same id, same completion record, same
  rule — so nothing counting tasks sees a different one afterwards.

## Describing

- **TASK-21** A task can carry a description: free text about it, of any length. A new task has
  none — a title is still all a task needs.
- **TASK-22** The description **comes up with the row**: clicking into a task shows it under the
  title, alongside the checklist. The button beside the repeat one puts it away again without
  leaving the row, and brings it back. A row at rest shows no description, so the list stays
  something you can run your eye down.
- **TASK-23** That button shows whether there is anything written: marked when there is, muted when
  there is not. It is on the row at rest either way — see [Interface](interface.md).
- **TASK-24** It opens as text either way, a blank one reading as the line that invites you to
  write. Clicking that text turns it into a box in place, as a title does. Opening a row does
  **not** take the caret: the description comes up on every click into a task, and one that grabbed
  the keyboard each time would be reaching for something it had not been asked for.
- **TASK-25** Clicking away, or Cmd/Ctrl+Enter, keeps what was written. Escape drops the edit.
  Enter makes a new line, which is why keeping it has a shortcut of its own.
- **TASK-30** Clicking off the row while the box is open is clicking away: the row rests and takes
  the box with it, and what was written is kept, exactly as if the box alone had been left.
- **TASK-26** An **empty box clears the description** — the opposite of an empty title. Having
  nothing written about a task is an ordinary state, not an abandoned edit.
- **TASK-27** Blank lines inside a description are kept, being part of what was written; whitespace
  around the whole thing is trimmed. The text reads exactly as it was typed.
- **TASK-28** Writing a description changes that field alone — same id, same completion record,
  same rule — and counts for nothing in any period's bar. A description is not a task.
- **TASK-29** The box grows with what is written, up to a point, after which it scrolls rather than
  pushing the rest of the list down the screen.

## Emphasis

- **TASK-32** Text in a description can be bold, italic, or both. Cmd/Ctrl+B and Cmd/Ctrl+I put
  that on the selected words, and the same press on words that already carry it takes it off. The
  words change as the key is pressed — there is nothing to confirm and nothing to leave first.
- **TASK-33** Markers are never on screen. The box shows the words already bold, exactly as the
  resting text does. How a description is written down is not something to read.
- **TASK-34** A description is still one piece of plain text. Emphasis is saved into it as Markdown
  — `**bold**`, `*italic*` — so what is saved keeps its shape and a description stays readable
  anywhere, but that is a fact about the file rather than about the screen.
- **TASK-35** Asterisks typed as themselves stay themselves, in the box and after saving: `2 * 3`
  is arithmetic. Typing `**bold**` by hand gives those characters, not bold — the shortcut is how
  emphasis is put on.
- **TASK-36** Text pasted in arrives as text. Another app's fonts, sizes and colours are not part
  of a description; bold and italic are all one carries.

## Lists

- **TASK-44** A description can hold lists, bulleted or numbered. Typing `- ` at the start of a line
  turns that line into a bullet item, and a number, a dot and a space — `1. ` — into a numbered one.
  The marker goes as the space is typed and a bullet or number takes its place. Typed at the start of
  a line that already has words on it, it turns those words into the item.
- **TASK-45** Enter at the end of an item starts the next one. Enter on an item with nothing in it
  ends the list, and what follows is an ordinary line again. Backspace in an empty item takes it
  away.
- **TASK-46** A numbered list counts from 1 in the order its items are in, whatever number started
  it — `7. ` starts a list at 1 — and adding or removing an item renumbers the rest.
- **TASK-47** Lists are one level deep: an item never holds a list of its own. Turning a line into
  an item right beside a list of the same kind adds it to that list.
- **TASK-48** A list reads the same at rest as in the box, as emphasis does (TASK-33): the bullet or
  number sits outside the text, so an item that runs onto a second line lines up under its own first
  word. Items carry bold and italic like any other text.
- **TASK-49** Saved, a list is plain text like the rest of a description (TASK-34): each item is a
  line starting `- `, or its number and a dot. A line written that way reads as an item wherever it
  came from, so pasted lines starting with a marker show as pasted until the description is next
  opened, and as a list from then on. A dash or number that is part of the words — `-5 degrees`,
  `1.5 kg` — is not a marker.

## Completing

- **TASK-13** The round box at the head of the row toggles the task between done and not done.
- **TASK-14** Completing stamps the time. Completing something already done changes nothing — the
  first completion time stands.
- **TASK-15** Un-completing puts the task back to todo and forgets when it was done. For a
  repeating task that undoes the occurrence in play, which is all there is to undo.
- **TASK-16** A done task reads greyed and struck through.
- **TASK-31** A task carrying a checklist is done **exactly when every item on it is**, in both
  directions, and its own box ticks the whole list. See [Checklists](checklists.md).
- **TASK-55** A task with a time goal is **not** finished by its time: once the time logged reaches
  the goal the box invites a tick, and ticking it is still the owner's. See [Time goals](time-goals.md).

## The list

- **TASK-17** Done tasks sink to the bottom. Otherwise tasks keep the order they were put in —
  the order they were added, until one is moved — and completing one does not shuffle the rest.
- **TASK-18** A repeating task is only at the bottom while its current occurrence is done; it comes
  back up on its own when the next one arrives.
- **TASK-19** An empty list encourages a start and points at the box above it.
- **TASK-50** A list whose tasks are all done praises the work, above the done tasks. The moment one
  is open again, the praise goes.
- **TASK-20** Until the saved tasks have loaded, the list area says it is loading rather than
  flashing an empty list.
- **TASK-56** On **Tasks**, the done tasks are divided by when they were finished, each span under
  a small, muted gray heading with its count, the spans set close together: **Done today**, **Done yesterday**, **Done in the last 7 days**, **Done
  in the last 30 days** and **Done earlier**, most recent first. The spans count back in local days
  and each leaves out the ones before it, so a task is under exactly one; a span with nothing in it
  has no heading. Tasks still to do stay above, with no heading. Today, Week, Month, the Inbox, lists
  and tags keep one run of done tasks.
- **TASK-57** A repeating task is under the span of its latest completion while that completion
  still covers the occurrence in play (TASK-18); once the next occurrence comes it is back among the
  tasks to do. A completion stamped later than today, by a device whose clock ran ahead, counts as
  today's.
- **TASK-58** Nothing is rewritten when the day turns: what is under each heading follows from the
  day it is, so a page left open moves yesterday's work along on its next render (PRIN-2).

## Moving

- **TASK-37** Tasks are put in a new order by dragging them. The task's title rides with the
  pointer, and its row stays in the list, faded, while the other rows slide aside to show where it
  will land; the new order is saved when it is dropped. A task can also be dropped on a list in the
  sidebar to file it there (LST-25).
- **TASK-38** A row can be picked up anywhere on it, or by the grip in the margin to its left. The
  grip shows when the pointer is over the row, and on a woken row. A press inside a text box being
  typed in selects text instead.
- **TASK-39** With a mouse, a drag starts only once the pointer has moved a few pixels, so a click
  is still a click. With a finger, you hold for a moment first, so a swipe still scrolls the page.
  Letting go never opens the row or starts editing its title.
- **TASK-40** From the keyboard, the grip picks the row up with Space or Enter. The arrow keys move
  it, Space or Enter drops it, and Escape puts it back. Screen readers hear the task's title and its
  position as it moves.
- **TASK-41** A task moves only within its own group. A to-do task can't be dropped among done
  ones, or a done task among to-do ones. Completing a task, or un-completing it, is what moves it
  between the two, and it goes back to its place in the order when it returns. On Tasks a done task
  moves only among those under its own heading (TASK-56): a drag never changes when a task was
  finished.
- **TASK-42** A task keeps its place while it is in the trash: restoring it puts it back where it
  was. New tasks still join the end (TASK-7).
- **TASK-43** A move changes the moved task's `order` and nothing else, so it counts for nothing in
  any period's bar.

## Duplicating

- **TASK-51** **Duplicate**, in the menu a right-click on a row opens (UI-31), adds a copy of the
  task carrying what it says: the same title, description, repeat rule, due date, checklist
  items, tags, reward and time goal.
- **TASK-52** The copy is a task of its own — its own id, stamped as created now — and each item on
  its checklist is its own too, so changing one never changes the other.
- **TASK-53** It carries **none of what happened** to the original: it is not done, its checklist is
  unticked, it has no time logged (TIME-9), and a repeating one starts with no history of done days
  and no skipped occurrences (RPT-34), so a duplicated habit starts its streak afresh. A copy is another go at the same thing, not a second record of the first.
- **TASK-54** The copy goes **just below the original**, among the tasks still to do (TASK-17). The
  original is left exactly as it was.

---

**Where it lives:** `src/core/task.ts` (the rules), `src/core/completed.ts` (the spans done tasks are
divided into), `src/app/completionLabels.ts` (their headings), `src/core/due.ts` and `src/core/day.ts` (due dates), `src/core/emphasis.ts` (bold and italic, written
down and read back), `src/core/descriptionLists.ts` (lists, the same), `src/app/components/AddTaskForm.tsx`,
`TaskList.tsx`, `TaskItem.tsx`, `ContextMenu.tsx` (a task's menu), `TaskDescription.tsx`, `src/app/descriptionBox.ts` (the box a
description is written in), `src/app/useTasks.ts`, `src/app/TasksScreen.tsx` (ordering), `src/core/order.ts`
(where a task sits, moving it, and where a copy goes), `src/app/components/TaskDragAndDrop.tsx`,
`src/app/taskDrop.ts`, `src/app/components/SortableTasks.tsx`, `src/app/useSortableTask.ts` and
`src/app/dragSensors.ts` (dragging).

**Tested in:** `src/core/task.test.ts`, `src/core/completed.test.ts`, `src/core/emphasis.test.ts`, `src/core/descriptionLists.test.ts`,
`src/core/order.test.ts`, `src/app/taskDrop.test.ts` (what a drop does), `src/app/components/TaskList.test.tsx` (what a list says),
`src/app/components/TaskItem.test.tsx` (the row, and its menu).
