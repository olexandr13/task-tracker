# Tags

Short names a task carries, so tasks that belong together can be seen together, whatever day
they are due. A tag is not a record of its own: it is a name written on the tasks that carry it.

## The tag

- **TAG-1** A task can carry **any number of tags**, in the order they were put on it, each once. A
  new task has none — a title is still all a task needs.
- **TAG-2** Taking a tag off a task leaves its other tags as they were.
- **TAG-3** A tag name is **one word**: no spaces, and none of `\ / " # : * ? < > |` or commas. A
  `#` typed in front of it is not part of the name. A name that cannot be a tag is not made, and the
  box it was typed in says why.
- **TAG-4** **Case does not make another tag**: `Work` and `work` are one tag. It keeps the spelling
  it was first given, and putting it on another task in any case uses that spelling.
- **TAG-5** Tagging a task changes that and nothing else — same id, same completion record, same
  rule — and counts for nothing in any period's bar.
- **TAG-6** The tags on offer are the ones **live tasks carry**, in alphabetical order. A tag comes
  into being on the first task given it and goes with the last one, or when it is deleted (TAG-22). A tag carried only by tasks in
  the trash is not offered anywhere, and comes back with its task.

## Tagging a task

- **TAG-7** The **tag button** on a row opens a panel: a box to find or add a tag, with the caret
  already in it, over every tag there is, the task's own ticked. Clicking a tag puts it on or takes
  it off. Enter in the box puts on the tag it names, making it first when there is none. The panel
  stays open for the next one, and closes as the other pickers do (UI-9, UI-10).
- **TAG-8** **Typing `#` in a description** offers tags at the caret, narrowed as a name is typed
  after it. The arrow keys move between them; Enter, Tab or a click chooses one. Choosing **takes
  the `#name` out of the text** and puts the tag on the task: a tag is something the task carries,
  not something written in it. The description stays open for more writing, and the tag stays on
  even if the edit is then dropped with Escape.
- **TAG-9** Escape puts the suggestions away without dropping the edit, and what was typed stays as
  text; they do not come back until the caret has left that `#`. A `#` inside a word — `C#` — offers
  nothing, and neither does one whose word has ended with a space or a character a tag cannot hold.
- **TAG-10** Suggestions come best first: the tag of that very name, then those starting with what
  was typed, then those holding it anywhere, case ignored. Tags the task carries already are left
  out.
- **TAG-11** When what was typed is a tag name that no tag has, the last suggestion is to **create
  it**.

## On the row

- **TAG-12** A task's tags show as **small labels at the far end of its line**, before the
  controls, at rest and awake. They keep to one line, each giving up room when there is not enough,
  and go under the title when there is no room beside it. On a done task they are dimmed with the
  title. They are labels, not controls: a click on one is a click on the row (UI-28). While the
  title is being edited they give it their room.

## A tag's list

- **TAG-13** Every tag has **a list of its own**, opened from the Tags page (TAG-18): the live
  tasks carrying it, in any case. It shows what Tasks shows otherwise (LIST-7) — the same rows,
  done tasks sinking, dragging, the rail — headed with the tag's name, and **Tags** stays marked in
  the sidebar while it is open. It is in the address as `#/tag/name` (UI-36), so it survives a
  reload even after the last task with the tag has gone, when it says there is nothing tagged yet.
- **TAG-14** A task added in a tag's list **carries that tag**, and has no day, as in Tasks.
- **TAG-15** Once everything in a tag's list is done, it praises the work (TASK-50).

## The Tags page

- **TAG-18** **Tags** has an entry of its own in the navigation, beside Tasks and Habits (UI-30). Its
  page lists **every tag in use**, alphabetically (TAG-6), and clicking one opens its list (TAG-13).
  No single tag has an entry in the navigation.
- **TAG-19** Beside each tag is how many of its tasks are **still to do**, a repeating one for its
  current occurrence. A tag whose tasks are all done shows no number, and is still listed.
- **TAG-20** With no tags in use the page says so, and how to tag a task: its tag button (TAG-7), or
  `#` in its description (TAG-8).
- **TAG-21** The Tags page is not a list of tasks, so it has no box for adding one and no rail (UI-2).
- **TAG-22** Beside each tag is a button that **deletes it**, after asking: the tag comes off every
  task carrying it — tasks in the trash too, so restoring one does not bring it back — and the tasks
  themselves stay as they were otherwise. There is no undo.

## On a phone

- **TAG-16** A row's line has no room for the tag button beside the others, so on a phone the woken
  row has a line of its own under the description holding it, naming the task's tags — or offering
  to add one — and opening the same panel (TAG-7).
- **TAG-17** The Tags page is reached from a **Tags** button at the foot of Tasks, beside the Trash
  button, and Tasks stays marked in the bottom bar while the Tags page or a tag's list is open (UI-34).

---

**Where it lives:** `src/core/tag.ts` (names, putting on and taking off, deleting, the tags in use, matching
and suggesting, the tag being typed), `src/app/components/TagPicker.tsx` (the panel),
`src/app/components/TaskDescription.tsx` and `src/app/descriptionBox.ts` (typing `#`),
`src/app/components/TaskItem.tsx` (labels and the button on the row), `src/app/components/TagList.tsx`
(the Tags page), `src/app/view.ts` (the Tags page and a tag's list, their addresses and what they say), `src/app/useTasks.ts`, `src/app/TasksScreen.tsx`,
`src/app/components/SideNav.tsx`, `src/app/components/BottomNav.tsx`, `src/app/components/TagIcon.tsx`.
**Tested in:** `src/core/tag.test.ts`, `src/app/components/TagPicker.test.tsx`,
`src/app/components/TaskDescription.test.tsx` (typing `#`), `src/app/components/TaskItem.test.tsx`
(labels), `src/app/components/TagList.test.tsx` (the Tags page), `src/app/components/SideNav.test.tsx`,
`src/app/useView.test.ts` (the address), `src/app/components/BottomNav.test.tsx`.
