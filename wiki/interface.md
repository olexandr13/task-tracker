# Interface

How the screen is laid out, and the behaviour that is not tied to one feature.

## The three areas

- **UI-1** The screen is three areas: **navigation** down the left, **the work** — the box for
  adding a task, then the list — in the middle, and a **rail** down the right of it holding today's
  quote and the progress bars.
- **UI-2** The rail belongs to the lists of tasks — Today and Tasks — not to the app: the trash does
  without it. How much
  of the week is cleared says nothing about what was thrown away, and nobody needs spurring on to
  empty a bin.
- **UI-3** The heading names the view you are on. The signed-in account sits at its far end
  (AUTH-9).

## On a phone

- **UI-4** Below `md` there is no room for three columns, so they stack into one and the navigation
  collapses to a single button naming the current view, which expands in place. A sidebar is a poor
  use of a phone.
- **UI-5** Stacked, the rail comes **before** the work — so a phone, and a screen reader, meet
  today's quote and the bars first.
- **UI-6** Nothing is reachable only on a wide screen. The one thing a narrow screen drops is the
  "done today" hint on a completed repeating task, where the width is worth more.

## Navigation

- **UI-7** Three views: **Today**, **Tasks** and **Trash**. Each is named and carries an icon. See
  [Lists](lists.md).
- **UI-8** The view you are on is marked, in the sidebar and in the collapsed button alike.

## Popovers

- **UI-9** Panels that open in place — the date and repeat pickers, the collapsed navigation — close on a
  click outside them or on Escape.
- **UI-10** Escape inside an open panel closes the panel rather than reaching anything behind it.
- **UI-15** A description is **not** a popover: it opens as an area inside the row, pushing the list
  down rather than floating over it, and a click outside keeps what was written instead of
  dismissing it.
- **UI-16** A checklist opens the same way. The checklist sits above the description, being the
  parts of the task rather than a note about it.

## The task row

- **UI-17** A row at rest is the completion box, the title and the delete button. Clicking anywhere on
  the row brings out its controls **and opens what the task holds** — its checklist and its
  description, both at once. Clicking a task is asking to see the whole of it, not to be handed two
  more buttons to press. It all goes again when you click away, press Escape, or click into another
  row. Only the row being worked on carries a toolbar.
- **UI-18** What is already set stays on show at rest — the due date, the repeat rule, the checklist
  and its count, the mark that there is a description — being information about the task rather than only a
  way of changing it. The empty ones appear on the active row alone. Deleting is always on show, at
  the far end of the row, so it keeps its place as the row wakes and rests.
- **UI-19** The completion box is the exception: ticking a task off leaves its row as it was. That
  is finishing a task, not settling down to work on it.
- **UI-20** Keyboard focus wakes a row too, so nothing on it is reachable by mouse only. The row
  rests again when focus leaves it.
- **UI-21** The checklist and the description belong to the woken row and rest with it. While it is
  awake the two are independent: either button puts its own away without disturbing the other or
  leaving the row, and brings it back.
- **UI-22** Waking a row never takes the caret. The boxes it opens are there to be clicked into,
  not to start typing in: a row is clicked for many reasons, and two boxes competing for the
  keyboard on each one would be reaching for something they had not been asked for.
- **UI-23** A row is as short as its contents allow — the completion box, one line of title, and
  the small controls beside it. The list is meant to be run down at a glance, so every row costs
  the same and none of it is padding.

## Everywhere

- **UI-11** Dark mode follows the system. There is no theme switch.
- **UI-12** Every control carries a name for a screen reader, and one that names its task where
  several of the same control are on screen at once.
- **UI-13** Toggles report whether they are on — the completion box, the repeat kinds, the weekday
  chips.
- **UI-24** The box a description is written in reads as a multi-line text box, and the emphasis
  in it is marked up as well as drawn: bold words are heard as bold rather than only seen.
- **UI-25** Lists in that box are marked up as lists, so an item is heard as one of so many rather
  than as a line that happens to start with a bullet. At rest the description is a single control
  that opens the box — reached with Tab and opened with Enter or Space, like any button.
- **UI-14** The whole screen is drawn for one moment, so the list order, each row, the three bars,
  the trash countdown and the quote can never disagree about which day it is.

---

**Where it lives:** `src/app/TasksScreen.tsx` (the three areas), `src/app/components/TaskItem.tsx` (the
row at rest and awake), `src/app/components/SideNav.tsx`,
`src/app/view.ts`, `src/styles.css`.
