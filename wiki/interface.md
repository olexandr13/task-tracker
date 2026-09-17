# Interface

How the screen is laid out, and the behaviour that is not tied to one feature.

## The three areas

- **UI-1** The screen is three areas: **navigation** down the left, **the work** — the box for
  adding a task, then the list — in the middle, and a **rail** down the right of it holding today's
  quote and the progress bars.
- **UI-2** The rail belongs to the lists of tasks — Today and Tasks — not to the app: habits and the
  trash do without it. The habits page is already a record of progress (HAB-15), and how much of
  the week is cleared says nothing about what was thrown away. Nobody needs spurring on to empty a
  bin.
- **UI-3** The heading names the view you are on. The signed-in account sits at its far end
  (AUTH-9).

## On a phone

- **UI-4** Below `md` there is no room for three columns, so they stack into one and the navigation
  collapses to a single button naming the current view, which expands in place. A sidebar is a poor
  use of a phone.
- **UI-5** Stacked, the rail comes **before** the work — so a phone, and a screen reader, meet
  today's quote and the bars first.
- **UI-6** Nothing is reachable only on a wide screen. What a narrow screen drops is the words
  beside a row's icons — the date, the checklist count, the repeat rule and how long a completion
  holds — the width being worth more. Each control still has them as its name and tooltip.

## Navigation

- **UI-7** Four views: **Today**, **Tasks**, **Habits** and **Trash**. Each is named and carries an
  icon. See [Lists](lists.md) and [Habits](habits.md).
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

- **UI-17** A row at rest is the completion box, the title, its controls and the delete button.
  Clicking anywhere on the row **opens what the task holds** — its checklist and its description,
  both at once — and spells its repeat rule out (RPT-17). Clicking a task is asking to see the whole
  of it, not to be handed buttons to press. It all goes again when you click the row again (UI-28),
  click away, press Escape, or click into another row.
- **UI-18** Every control is **on show at rest**, set or not — the due date (on a one-off task,
  DUE-6), repeat, the checklist and its count, the description — so any of them is one click away
  on any row. Set ones are tinted (UI-26), empty ones muted, so what the task carries still reads at
  a glance. Deleting is always on show too, at the far end of the row, so it keeps its place as the
  row wakes and rests.
- **UI-27** The controls **line up down the list**: each icon sits in the same place on every row,
  whatever the rows beside it hold. Each control has a slot of its own width, as wide as the longest
  thing it usually says (`Sep 20, 2027`, `9/9`), and a repeating task keeps an empty slot where a date
  would be (DUE-6), which carries its rule's note instead (RPT-17). On a narrow screen the
  words go and each slot is just its icon.
- **UI-30** The checklist slot is sized for **up to nine items**, so its icon sits close to the
  description button. Its digits are all one width, so every count up to `9/9` takes the same room.
  A checklist of ten or more widens its own slot, moving that row's checklist, repeat and date
  controls left a little rather than running into the description button.
- **UI-26** A control with something set is **tinted quietly**, and brightens on hover. Every row
  can carry several, so a strong tint would turn the list into a column of highlights and drown the
  titles. An overdue date is the exception, being a warning (DUE-10).
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
- **UI-28** Clicking a woken row **on the task's own line** — anywhere on it that is not the title,
  a control, or an open picker — puts it away again, so a row opens and closes from the same place.
  Clicks inside its controls, pickers, checklist or description leave it awake: those are about the
  thing clicked, not the row.
- **UI-29** The title takes **only the room its words need, plus a few pixels past the end** — that
  is where a click edits it (TASK-8). The rest of the line is the row, and a click there opens or
  closes it. Once open, the title's box takes the whole width, so there is room to type.

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
row at rest and awake), `src/app/textOffsetAtPoint.ts` (which character a click landed on), `src/app/components/SideNav.tsx`,
`src/app/view.ts`, `src/app/rowControls.ts` (the tones a row's controls share), `src/styles.css`.
