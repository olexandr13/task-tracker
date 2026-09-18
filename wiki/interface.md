# Interface

How the screen is laid out, and the behaviour that is not tied to one feature.

## The three areas

- **UI-1** The screen is three areas: **navigation** down the left, **the work** — the box for
  adding a task, then the list — in the middle, and a **rail** down the right of it holding the
  progress bars, with today's quote below them.
- **UI-2** The rail belongs to the views that show tasks — Today, Week, Month, Tasks, the Inbox, each
  list's and each tag's — not to
  the app: habits, rewards, the lists, the tags, the trash and settings do without it. The habits page is already a record of progress (HAB-15), and how much of
  the week is cleared says nothing about what was thrown away. Nobody needs spurring on to empty a
  bin.
- **UI-3** There is **no heading** over any of it. The navigation already marks which view you are
  on (UI-8), so a title would say it twice and cost a strip of the screen to do it; the work starts
  at the top of the page instead. The view's name is still there for a screen reader, as the page's
  heading, unseen.

## On a phone

- **UI-4** Below `md` there is no room for three columns, so they stack into one and the navigation
  moves to a **bar along the bottom of the screen**, in reach of a thumb (UI-32). A sidebar is a poor
  use of a phone. The end of the page, and the undo toast (TRASH-3), stay clear of the bar.
- **UI-5** Stacked, the rail comes **after** the work — the bars, then the quote at the very bottom
  of the page.
- **UI-6** Nothing is reachable only on a wide screen. A row's details (UI-27) have a line of their
  own under the task's, so a narrow screen keeps them too; so do the list button (LST-23), the
  clock (TIME-10), the tag button (TAG-16), the
  reward's star (RWD-8), and the Lists, Tags and Rewards pages (UI-34).

## Navigation

- **UI-7** Eleven views: **Today**, **Week**, **Month**, **Tasks**, **Inbox**, **Habits**,
  **Rewards**, **Lists**, **Tags**,
  **Trash** and **Settings**, and a view for each list, opened from Lists, and one for each tag,
  opened from Tags. Each is named and carries an
  icon — every tag's view the same `#` as Tags, and every list the same folder as Lists. See
  [Views](views.md), [Lists](lists.md), [Habits](habits.md),
  [Rewards](rewards.md) and [Tags](tags.md).
- **UI-30** In the sidebar the views come in four groups with a thin line between each: the period
  views (**Today**, **Week**, **Month**), then **Tasks**, **Lists**, **Habits**, **Rewards** and **Tags**, then **Trash**,
  then **Settings**. **Lists** is always open, with the **Inbox** and then every list under it,
  indented (LST-13); the one open is marked itself, and Lists only on the Lists page. A tag's view
  has no entry of its own: **Tags** stays marked while one is open.
- **UI-8** The view you are on is marked, in the sidebar and in the bottom bar alike.
- **UI-32** The bottom bar has four tabs, each an icon over its name: **the period** (UI-33),
  **Habits**, **Tasks** and **Settings**.
- **UI-33** Today, Week and Month share the first tab. It shows the one last on screen — Today to
  begin with — and a tap goes to it. **Holding it down** opens a menu above it to switch between
  Today, Week and Month; letting go does not also go to the tab. A right-click, the context-menu key
  or Shift+F10 open the same menu, from the keyboard starting on its first item. It closes as a
  task's menu does (UI-31).
- **UI-34** The bar has no tab for the lists, the tags, the rewards or the trash. **Tasks** ends with
  a **Lists**, a **Tags**, a **Rewards** and a **Trash** button instead, and **Tasks** stays marked
  while any of them is open, or one list, the Inbox or a tag's view. The sidebar keeps its own entries, so the buttons are only on a
  phone.
- **UI-35** **Settings** holds the signed-in account and the way out (AUTH-9), and says there is
  nothing else to set yet.
- **UI-36** The view you are on is **in the address** — `#/week`, `#/habits`, `#/inbox`,
  `#/list/{id}`, `#/tag/work` — so reloading the page
  keeps you on it, and a bookmark or a link opens on it. An address naming no view opens on Today.
- **UI-37** Each switch of view is a step in the browser's history: **back and forward** move
  between the views you went through.

## Popovers

- **UI-9** Panels that open in place — the date, repeat, time and tag pickers, a task's menu, the period
  menu of the bottom bar — close on a click outside them or on Escape. The tags offered while typing
  `#` in a description close on Escape too, but a click outside is leaving the description (TAG-9).
- **UI-10** Escape inside an open panel closes the panel rather than reaching anything behind it.
- **UI-40** A panel's buttons are **compact** and the same in every panel — its choices, its menu
  items, a stepper's **−** and **+**. A panel is a quick aside, so nothing in it outweighs the screen
  behind it.
- **UI-15** A description is **not** a popover: it opens as an area inside the row, pushing the list
  down rather than floating over it, and a click outside keeps what was written instead of
  dismissing it.
- **UI-16** A checklist opens the same way. The checklist sits above the description, being the
  parts of the task rather than a note about it.

## The task row

- **UI-17** A row at rest is the completion box, the title and its tags, its controls and the delete button.
  Clicking anywhere on the row **opens what the task holds** — its checklist and its description,
  both at once — and spells its repeat rule and checklist count out under their buttons (UI-27). Clicking a task is asking to see the whole
  of it, not to be handed buttons to press. It all goes again when you click the row again (UI-28),
  click away, press Escape, or click into another row.
- **UI-18** Every control is **on show at rest**, set or not — the due date (on a one-off task,
  DUE-6), repeat, the checklist, the time (TIME-10), the tags, the reward (RWD-5), the description — so any of them is one click away
  on any row. Set ones are tinted (UI-26), empty ones muted, so what the task carries still reads at
  a glance. Deleting is always on show too, at the far end of the row, so it keeps its place as the
  row wakes and rests.
- **UI-27** The controls **line up down the list**: each is its icon alone, in a slot of its own
  that sits in the same place on every row, whatever the rows beside it hold; a repeating task keeps
  the date's slot empty (DUE-6). A slot is **no wider than the button in it** — an icon with no words
  beside it is padded to a square — and only a narrow gap is between one slot and the next, so the controls
  sit close together and read as one group at the end of the row rather than as buttons scattered along it. On a phone the clock, the tag button and the reward's star have no slot on
  the line, and are on the woken row instead (TIME-10, TAG-16, RWD-8). What a control holds — the due date
  (DUE-5), the repeat rule (RPT-17), the checklist count (CHK-5), the time (TIME-12), the reward (RWD-7) — is not put
  beside its icon but on a **line of details under the task's line**, in muted small text, each
  detail **under its own button**, centred on it and free to run wider than it. The date is there
  whenever the task has one; the rule, the count, the time and the reward once the row is woken. A rule too long to centre beside a count ends under its button
  instead, running left over the empty date slot, so the two never touch. A row with nothing to
  spell out has no such line. The line is part of the task's own line (UI-28).
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
- **UI-29** The title takes **only the room its words need, plus 13 pixels past the end** — that
  is where a click edits it (TASK-8). The rest of the line is the row, and a click there opens or
  closes it. Once open, the title's box takes the whole width, so there is room to type.
- **UI-31** **Right-clicking a row opens the task's menu** at the pointer — on the other side of it
  where the window runs out — and marks the row's border while it is open, so it is plain which
  task the menu is for. It holds **Duplicate** (TASK-51) and, once there are lists, a **List** group
  to file the task in, its own checked (LST-14). A group has a small heading and a line above it;
  a long menu scrolls rather than running off the window. The row stays as it was, at rest or awake:
  the menu is about the task as a whole, not working on it (as UI-19). Choosing an item, Escape, Tab,
  a click outside, scrolling or resizing the window closes it. Right-clicking text being typed in —
  an open title or description — keeps the browser's own menu, which is there for the text. From
  the keyboard, the context-menu key or Shift+F10 opens it under the task's line; the arrow keys,
  Home and End move between items — a group's too — and focus goes back where it was when it closes.

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
- **UI-38** Every control that **deletes or removes** something — a task, a checklist item, a task
  in the trash for good, a tag, a redemption — is muted at rest like the controls around it and **turns red under
  the pointer**, so what a click would do is plain before it is done. Closing the undo toast deletes
  nothing, and stays neutral.
- **UI-14** The whole screen is drawn for one moment, so the list order, each row, the three bars,
  the trash countdown and the quote can never disagree about which day it is.
- **UI-39** The app's icon, shown in the browser tab, is a **progress ring** about three-quarters full
  around a check, drawn in the app's blue on a dark tile, so it reads well on light and dark tab bars.
  The same icon stands for the app once installed on a home screen or a desktop (OFF-10).

---

**Where it lives:** `src/app/TasksScreen.tsx` (the three areas), `src/app/components/TaskItem.tsx` (the
row at rest and awake), `src/app/components/ContextMenu.tsx` (a task's menu), `src/app/textOffsetAtPoint.ts` (which character a click landed on), `src/app/components/SideNav.tsx`,
`src/app/components/BottomNav.tsx` (the phone's bar), `src/app/components/TagPicker.tsx` (the tag panel), `src/app/components/RewardPicker.tsx` (the reward panel), `src/app/components/TimePicker.tsx` (the time panel), `src/app/useLongPress.ts` (a press told from a
long press), `src/app/components/SettingsList.tsx`, `src/app/components/AccountCard.tsx` (the account on it), `src/app/view.ts`, `src/app/useView.ts` (the view kept in the address), `src/app/viewIcons.ts` (each
view's icon), `src/app/rowControls.ts` (the shape and tones a row's controls share), `src/app/panelControls.ts` (the size a panel's buttons share), `src/styles.css`,
`public/favicon.svg` (the app's icon; the PNGs beside it are the same icon for installing).
**Tested in:** `src/app/components/BottomNav.test.tsx` (the bottom bar), `src/app/components/SideNav.test.tsx` (the sidebar), `src/app/useView.test.ts` (the
view in the address).
