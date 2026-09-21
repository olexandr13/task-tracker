# Tags

Short names a task carries, so tasks that belong together can be seen together, whatever day
they are due. A task carries its tags by name; each tag is also kept on its own, so it lasts until
it is deleted, whether or not a task carries it.

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
- **TAG-6** The tags on offer are **every tag there is**, in alphabetical order. A tag comes into
  being when it is made on the Tags page (TAG-23) or first given to a task, and **stays until it is
  deleted** (TAG-22): not when the last task carrying it loses it, goes to the trash or is purged.
  A task tagged anywhere — another device too — keeps its tag this way (STORE-33).

## Tagging a task

- **TAG-7** A task is tagged from **its menu** — a right-click on the row, or a finger's hold or
  second tap (UI-31, UI-44) — and from a **tag button on the woken wide-screen row** (UI-53).
  **Tags**, under Duplicate and marked with the `#` glyph, opens the **tag panel** where the menu
  was: a box to find or add a tag, with the caret already in it, over every tag there is, the
  task's own ticked. Clicking a tag puts it on or takes it off. Enter in the box puts on the tag
  it names, making it first when there is none. The panel stays open for the next one, and closes
  as the other pickers do (UI-9, UI-10), giving focus back where it was. The row stays as it was,
  at rest or awake, and is marked while the panel is open, as for the menu. The resting row's line
  has **no tag button**, and no tags either: they are spelled out on its line of details (TAG-12).
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

- **TAG-12** A task's tags are **not on its line**: they show as **small labels on its line of
  details** (UI-27), under the title and starting where it does — so on the woken row, or on every
  row with Show task details on (UI-42), and never on a resting row otherwise. They keep to one
  line, each giving up room when there is not enough, and give up room to a repeat rule running
  left under the title (UI-27). They are labels, not controls: a click on one is a click on the
  row (UI-28).

## A tag's list

- **TAG-13** Every tag has **a list of its own**, opened from the Tags page (TAG-18): the live
  tasks carrying it, in any case. It shows what Tasks shows otherwise (LIST-7) — the same rows,
  urgent floating, overdue next, done sinking, dragging, the rail — headed with the tag's name, and **Tags** stays marked in
  the sidebar while it is open. It is in the address as `#/tag/name` (UI-36), so it survives a
  reload even when no task carries the tag, when it says there is nothing tagged yet.
- **TAG-14** A task added in a tag's list **carries that tag**, and has no day, as in Tasks.
- **TAG-15** Once everything in a tag's list is done, it praises the work (TASK-50).

## The Tags page

- **TAG-18** **Tags** has an entry of its own in the navigation, beside Tasks and Habits (UI-30). Its
  page lists **every tag there is**, alphabetically (TAG-6), and clicking one opens its list (TAG-13).
  No single tag has an entry in the navigation.
- **TAG-19** Beside each tag is how many of its tasks are **still to do**, a repeating one for its
  current occurrence. A tag whose tasks are all done, or that no task carries, shows no number, and
  is still listed.
- **TAG-20** With no tags yet the page says so, and how to make one: the box above (TAG-23), a task's
  menu (TAG-7, TAG-16), or `#` in its description (TAG-8).
- **TAG-21** The Tags page is not a list of tasks, so it has no box for adding one and no rail (UI-2).
  Its box makes a tag instead (TAG-23).
- **TAG-22** Beside each tag is a button that **deletes it**, after asking: the tag comes off every
  task carrying it — tasks in the trash too, so restoring one does not bring it back — the tasks
  themselves stay as they were otherwise, and the tag is gone from everywhere it was offered. There
  is no undo.
- **TAG-23** A box at the top of the Tags page, **Add a tag**, makes a tag no task carries yet —
  on Enter or its **Add** button, a `#` in front ignored (TAG-3). The new tag is listed at once, with
  nothing to do, and the box empties, staying on the page for the next one. A name some tag has
  already, in any case (TAG-4), makes nothing, and the box says so and keeps what was typed.

## On a phone

- **TAG-16** On a phone the sheet a tap opens (UI-48) has a **tag button**, naming the task's tags
  — or offering to add one — and opening the same panel (TAG-7) under it, a tap away rather than a
  menu away (UI-44). A resting row still shows the tag mark when the task carries any (UI-50).
- **TAG-17** On a phone the Tags page is reached from the **More** page's list (UI-45). More stays
  marked in the bottom bar while the Tags page or a tag's list is open.

---

**Where it lives:** `src/core/tag.ts` (names, the kept tag, putting on and taking off, deleting,
every tag there is, matching and suggesting, the tag being typed), `src/app/useTags.ts` (keeping tags,
and keeping the ones tasks carry; saving: [Storage](storage.md)),
`src/app/components/TagPanel.tsx` (the panel), `src/app/components/TagPicker.tsx` (the woken row's
and the phone's button), `src/app/components/TaskDescription.tsx` and `src/app/descriptionBox.ts` (typing `#`),
`src/app/components/TaskItem.tsx` (labels on the line of details, the menu's Tags, the woken strip and the phone's sheet), `src/app/components/TaskSheet.tsx`, `src/app/components/TagList.tsx`
(the Tags page and its box), `src/app/view.ts` (the Tags page and a tag's list, their addresses and what they say), `src/app/useTasks.ts`, `src/app/TasksScreen.tsx`,
`src/app/components/SideNav.tsx`, `src/app/components/BottomNav.tsx`, `src/app/components/TagIcon.tsx`.
**Tested in:** `src/core/tag.test.ts`, `src/app/useTags.test.ts` (keeping tags), `src/app/components/TagPicker.test.tsx`,
`src/app/components/TaskDescription.test.tsx` (typing `#`), `src/app/components/TaskItem.test.tsx`
(labels on the line of details, tagging from the menu), `src/app/components/TagList.test.tsx` (the Tags page and its box), `src/app/components/SideNav.test.tsx`,
`src/app/useView.test.ts` (the address), `src/app/components/BottomNav.test.tsx`.
