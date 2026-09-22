# Lists

Somewhere to put a task. A list is a **record of its own** — Work, Home, Reading list — and a task
is in **one** of them or in none. That is what makes a list a place rather than another label:
[tags](tags.md) say what a task is about, and a task can carry any number of them; a list says
where the task lives, and there is only ever one answer.

Not to be confused with [Views](views.md) — Today, Week and Month — which are questions asked of
all the tasks rather than places tasks are kept. That page holds the `LIST-` prefix for historical
reasons; requirements here are `LST-`.

## The list

- **LST-1** A list is a record: it has a name and it **stays until it is deleted**, whether or not
  anything is in it. An empty list is not a mistake — somewhere to put the next thing is the point
  of it. This is the difference from a tag, which exists only as long as a task carries it (TAG-6).
- **LST-2** A task is in **one list at a time**, or in none. A new task is in none — a title is
  still all a task needs.
- **LST-3** A list name may be **more than one word** and hold any punctuation: "Reading list" and
  "Work / Home" are fair names. It is trimmed, the spaces inside it are squeezed to one, and it
  must be something other than space, on one line, and at most 40 characters. The address names a
  list by its id rather than its name (LST-8), so no character has to be kept free.
- **LST-4** A list is made on the Lists page (LST-13), on purpose, rather than in passing from a
  task. A list outlives the task that wanted it, so it is not something to create by accident.
- **LST-5** **Case does not make another list**: there is no second list called `work` beside
  `Work`. A name another list has already is refused, when making a list and when renaming one, and
  the box it was typed in says so and keeps what was typed, to fix rather than type again.
- **LST-6** A list can be **renamed** at any time. Its tasks are in it by its id, so renaming
  touches the list alone: not one task is rewritten, and no address changes.
- **LST-7** Giving up a rename with Escape leaves the list named as it was, as dropping a title
  edit does (TASK-11).
- **LST-12** A task naming a list that is **gone** — deleted on another device, say — reads as
  being in the Inbox. Nothing is ever out of reach of every view at once.

## A list's tasks

- **LST-8** Every list has **a view of its own**, opened from the Lists page (LST-13): the live
  tasks filed under it. It shows what Tasks shows otherwise (LIST-7) — the same rows, overdue
  floating, done sinking, dragging, the rail — and **Lists** stays marked in the sidebar while it is open. It is in
  the address as `#/list/{id}` (UI-36), by the list's id, so a rename does not break a bookmark.
- **LST-9** A task added in a list's view **goes into that list**, and has no day, as in Tasks.
- **LST-10** An empty list says nothing is in it yet and to add a task above; once everything in it
  is done, it praises the work (TASK-50).

## The Inbox

- **LST-11** The tasks in **no list** are the **Inbox**, which heads the Lists page and has a view
  of its own at `#/inbox`. The Inbox is not a record — it is what "in no list" looks like — so it
  is always there, cannot be renamed or deleted, and has no buttons of its own beside it. A task
  added in the Inbox is in no list, as anywhere else but a list's own view.
- **LST-20** Tasks is every live task whatever list it is in, so the Inbox is a part of Tasks and
  not the same thing as it.

## Filing a task

- **LST-14** A task is filed from **its menu** — a right-click on the row, or a finger's hold or
  second tap (UI-31, UI-44) — and from a **list button on the woken wide-screen row** once there
  is a list to choose (UI-53). Under
  Duplicate and Tags, a **List** group offers the Inbox and then every list — the Inbox with its
  tray icon and each list with a folder, as in the sidebar — the task's own **checked**.
  Choosing one files the task and closes the menu — a task is in one list at a time, so choosing is
  the whole of the job. The resting row itself has **no list button** and does not name its list:
  which list a task is in is asked of the task when it matters, not repeated on every resting row.
  A list cannot be made from here (LST-4); while there are no lists at all the menu has no List
  group and the woken strip has no list button, the Inbox alone being no choice.
- **LST-25** A task can be **dragged onto a list in the sidebar** — or onto the Inbox — to file it
  there, from any view that shows tasks. While a task is carried, what moves with the pointer is
  its **title**, just right of it, not the whole row, and the row stays in the list, faded, where
  it would land; the list under the pointer is **lit** as it is reached. A list only counts with the
  pointer on it, so moving a task among the rows never files it by accident, and filing a task
  leaves its place in the order as it was. Dropping it anywhere but a list or a row does nothing.
  Only a pointer does this: from the keyboard a task is filed from its menu (LST-14), and on a phone
  — which has no sidebar — from its menu or the sheet (LST-23). A screen reader hears which list the task
  is over and which it was dropped in.
- **LST-15** The Inbox is first in the group and always offered, so there is always a way back out
  of a list.
- **LST-17** Filing a task changes that and nothing else — same id, same completion record, same
  rule — and counts for nothing in any period's bar.

## The Lists page

- **LST-13** **Lists** has an entry of its own in the navigation, between Tasks and More (UI-30).
  Its page is the Inbox (LST-11) and then every list, in the order they were made, each opening its
  own view (LST-8). In the sidebar, Lists opens onto the Inbox and then every list, in the
  same order, indented under it, each going straight to its view and marked while it is open
  (UI-8). A long name is cut rather than widening the sidebar. Each is also somewhere to drop a
  task (LST-25). The lists can be folded away (LST-26).
- **LST-26** A **chevron** at the end of Lists in the sidebar **folds** the Inbox and the lists
  away, and unfolds them again; it points down while they are shown and right while they are
  folded. Folding goes nowhere — Lists itself still opens its page. Lists starts **unfolded**, and
  whichever way it was left is **kept on this device** (STORE-31), so it is the same after a reload.
  While folded, **Lists is marked** whenever a list's view or the Inbox is open, as the entry that
  would be marked is out of sight (UI-8), and no list is there to drop a task on (LST-25): unfold
  them first.
- **LST-18** Beside each list is how many of its tasks are **still to do**, a repeating one for its
  current occurrence. A list whose tasks are all done shows no number, and is still listed. The
  Inbox carries its own count the same way.
- **LST-19** Beside each list is a button that **renames** it in place (LST-6), and one that
  **deletes** it, after asking. Deleting puts every task that was in it **back in the Inbox** —
  tasks in the trash too, so restoring one does not file it under a list that has gone — and the
  tasks themselves stay as they were otherwise. There is no undo. Deleting the list whose view is
  open leaves that view for the Lists page.
- **LST-21** A box at the top of the page makes a list (LST-4), on Enter or with its Add button, and
  **opens the new list** so the next thing typed goes into it. The box is cleared for the next one.
- **LST-22** The Lists page is not a list of tasks, so it has no box for adding one and no rail
  (UI-2).

## On a phone

- **LST-23** On a phone the **sheet** a tap opens (UI-48) carries a list button, naming the task's
  list — or offering to file it — so filing is a tap away rather than a menu away (UI-44). It opens
  a panel of the same choices as the menu (LST-14, LST-15), the task's own marked, and closes on a
  choice or as the other pickers do (UI-9, UI-10); with no lists yet, the panel says where to make
  one.
- **LST-24** The Lists page is reached from a **Lists** button at the foot of Tasks, beside the Trash
  button, and from the Tasks tab's menu, which offers the Inbox and every list as well
  (UI-43). Tasks stays marked in the bottom bar while the Lists page, a list's view or the Inbox is
  open (UI-34).

---

**Where it lives:** `src/core/list.ts` (the record, names, filing a task, emptying a list, the
counts), `src/app/components/TaskItem.tsx` (the List group in a task's menu),
`src/app/components/ContextMenu.tsx` (a menu's groups and checked choices),
`src/app/components/SideNav.tsx` (the lists under Lists, and folding them), `src/app/useDeviceSetting.ts`
(whether they are folded), `src/app/useListDropTarget.ts` (a list as a
place to drop a task), `src/app/components/TaskDragAndDrop.tsx` and `src/app/taskDrop.ts` (carrying a
task, and what dropping it does),
`src/app/components/ListPicker.tsx` (the panel on a woken row and a phone's task sheet),
`src/app/components/ListsPage.tsx` (the Lists page), `src/app/useLists.ts` (the lists on screen), `src/app/useTasks.ts` (filing a
task, emptying a list), `src/app/view.ts` (the Lists page, a list's view and the Inbox, their
addresses and what they say), `src/app/TasksScreen.tsx`, `src/app/components/SideNav.tsx`,
`src/app/components/BottomNav.tsx`, `src/app/components/FolderIcon.tsx`,
`src/app/components/InboxIcon.tsx`, `src/app/components/PencilIcon.tsx`.
**Saved in:** `src/storage/listSchema.ts` and `src/storage/firestoreListRepository.ts` (one document
per list), with `listId` on the task itself; whether the sidebar's lists are folded in
`src/storage/localStorageSideNavRepository.ts` — see [Storage](storage.md).
**Tested in:** `src/core/list.test.ts`, `src/app/components/TaskItem.test.tsx` (the task's menu),
`src/app/taskDrop.test.ts` (dropping a task on a list),
`src/app/components/ListPicker.test.tsx`,
`src/app/components/ListsPage.test.tsx`, `src/app/components/SideNav.test.tsx`,
`src/app/useView.test.ts` (the address), `src/storage/listRepository.test.ts`,
`src/storage/listSchema.test.ts`, `src/storage/sideNavSchema.test.ts`.
