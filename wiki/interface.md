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
  own under the task's, so a narrow screen keeps them too; so do the list and tag buttons (LST-23,
  TAG-16), which a wide screen has in the task's menu, the clock (TIME-10), the reward's star
  (RWD-8), the Lists page (UI-34) and the Tags and Rewards pages (UI-45). The task's menu itself needs no
  right-click: a finger opens it by holding a row or tapping an open one (UI-44).

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
- **UI-32** The bottom bar has five tabs, each an icon over its name: **the period** (UI-33),
  **Habits**, **Tasks**, **More** (UI-45) and **Settings**.
- **UI-33** Today, Week and Month share the first tab. It shows the one last on screen — Today to
  begin with — and a tap goes to it. **Holding it down**, or **tapping it again** while Today, Week or
  Month is on screen — so a double tap from anywhere — opens a menu above it to switch between
  Today, Week and Month; letting go of a hold does not also go to the tab. A right-click, the
  context-menu key or Shift+F10 open the same menu, and so does Enter on the tab while its period is
  on screen, from the keyboard starting on its first item. It closes as a task's menu does (UI-31),
  and on a tap on the tab while it is open, which does not open it again.
- **UI-34** The bar has no tab for the lists or the trash. **Tasks** ends with a **Lists** and a
  **Trash** button instead, the Tasks tab's menu has them too (UI-43), and **Tasks** stays marked
  while either is open, or one list or the Inbox. The sidebar keeps its own entries, so the buttons
  are only on a phone.
- **UI-35** **Settings** holds the signed-in account and the way out (AUTH-9), and under it
  **Backup**: exporting the account to a file and importing one back (BAK-1, BAK-4).
- **UI-36** The view you are on is **in the address** — `#/week`, `#/habits`, `#/inbox`,
  `#/list/{id}`, `#/tag/work` — so reloading the page
  keeps you on it, and a bookmark or a link opens on it. An address naming no view opens on Today.
- **UI-37** Each switch of view is a step in the browser's history: **back and forward** move
  between the views you went through.
- **UI-43** The **Tasks** tab has a menu of its own, opened as the period tab's is (UI-33): held
  down, or tapped again while Tasks is on screen, and closed by a tap on Tasks while open. It holds what the sidebar has in its place — **Lists**
  and **Trash**, each with its icon, then a **Lists** group of the Inbox and every list in the
  sidebar's order (UI-30) — so any list is two taps from anywhere, however long Tasks runs. Choosing
  one goes there. From any other view, a list's included, a tap on Tasks goes to Tasks.
- **UI-45** The bar has no tab for the tags or the rewards either: they are under **More**, marked
  with three dots. More has no page of its own, so **a tap opens its menu** straight away — **Tags**
  and **Rewards**, each with its icon — and so do holding it, a right-click, the context-menu key,
  Shift+F10 and Enter; choosing one goes there. A tap on More while its menu is open closes it, and
  a tap on it while another tab's menu is open closes that one and opens this. **More** stays
  marked while the Tags page, a tag's view or the Rewards page is open. It is a phone's alone: the
  sidebar has an entry for each (UI-30).

## Popovers

- **UI-9** Panels that open in place — the schedule (date and repeat), time and tag pickers, a task's menu, the menus
  of the bottom bar's tabs, the View panel (UI-41) — close on a click outside them or on Escape. The tags offered while typing
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
  both at once — and spells its date or repeat rule and its checklist count out under their buttons (UI-27). Clicking a task is asking to see the whole
  of it, not to be handed buttons to press. It all goes again when you click the row again (UI-28),
  click away, press Escape, or click into another row.
- **UI-18** Every control is **on show at rest**, set or not — the schedule (the date, or the rule
  on a repeating task, DUE-13), the checklist, the time (TIME-10), the reward (RWD-5), the description — so any of them is one click away
  on any row. Set ones are tinted (UI-26), empty ones muted, so what the task carries still reads at
  a glance. Deleting is always on show too, at the far end of the row, so it keeps its place as the
  row wakes and rests.
- **UI-27** The controls **line up down the list**: each is its icon alone, in a slot of its own
  that sits in the same place on every row, whatever the rows beside it hold. A slot is **no wider than the button in it** — an icon with no words
  beside it is padded to a square — and a small gap is between one slot and the next, enough that each icon
  reads as its own button while the controls still sit together and read as one group at the end of the row rather than as buttons scattered along it. The list and the
  tags have no slot at all: they are set from the task's menu (LST-14, TAG-7). On a phone the clock and the reward's star have no slot on
  the line either, and are on the woken row instead, with the list and the tags (TIME-10, RWD-8, LST-23, TAG-16). What a control holds — the due date
  (DUE-5) or the repeat rule (RPT-17), the checklist count (CHK-5), the time (TIME-12), the reward (RWD-7) — is not put
  beside its icon but on a **line of details under the task's line**, in muted small text, each
  detail **under its own button**, centred on it and free to run wider than it. The task's tags,
  having no button, are on that line under the title, starting where it does (TAG-12). The line belongs
  to the **woken row** only, unless **Show task details** is on (UI-42): at rest the tinted icons say
  what is set, so every resting row is the same single line high, dated or not. The schedule's detail, the first,
  ends under its button instead of centring on it and runs left over the title's column, the tags
  there giving up room to it, so however long a rule is it never reaches the details beside it. A woken row with nothing to
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
  A finger's tap there opens the task's menu instead (UI-44); a tap anywhere else puts the row away.
  Clicks inside its controls, pickers, checklist or description leave it awake: those are about the
  thing clicked, not the row.
- **UI-29** The title takes **only the room its words need, plus 13 pixels past the end** — that
  is where a click edits it (TASK-8). The rest of the line is the row, and a click there opens or
  closes it. Once open, the title's box takes the whole width, so there is room to type.
- **UI-31** **Right-clicking a row opens the task's menu** at the pointer — on the other side of it
  where the window runs out — and marks the row's border while it is open, so it is plain which
  task the menu is for. It holds, first, the **Date** row of icons (DUE-14), then **Duplicate**
  (TASK-51), **Tags**, which opens the tag panel in the menu's place (TAG-7) — each marked with a
  small glyph before its name, two sheets and the `#` — and, once there are
  lists, a **List** group to file the task in, its own checked (LST-14). A group has a small heading
  and a line above it;
  a long menu scrolls rather than running off the window. The row stays as it was, at rest or awake:
  the menu is about the task as a whole, not working on it (as UI-19). Choosing an item, Escape, Tab,
  a click outside, scrolling the page or resizing the window closes it; scrolling a long menu itself does not. Right-clicking text being typed in —
  an open title or description — keeps the browser's own menu, which is there for the text. From
  the keyboard, the context-menu key or Shift+F10 opens it under the task's line; the arrow keys,
  Home and End move between items — a group's too, left and right stepping along a row of icons as
  down and up do — and focus goes back where it was when it closes.
- **UI-44** A finger has no right-click, so on a touch screen the task's menu (UI-31) opens at the
  finger two other ways: **holding a row** until it is picked up (TASK-39) and letting go where it
  was — moved first, it is a drag — or **tapping a woken row** on its own line (UI-28), so a double
  tap opens it on any row. It is the same menu, the Date row, Duplicate, Tags and List alike, the row
  staying as it was behind it, and letting go clicks nothing the menu opens over. A mouse keeps the
  right-click.

## The View button

- **UI-41** Every view that lists tasks has a **View** button beside the add box: a square as tall
  as the box, marked with sliders, opening a panel of how the tasks are shown. The options hold for
  **every** such view at once — Today, Week, Month, Tasks, the Inbox, each list and each tag — and
  are kept on this device (STORE-30). Each option is a **switch**: the whole line is the switch —
  an icon, its name, a line under the name saying what it does, and the track at the end, blue when
  on, whose icon takes a set control's tint. Like the pickers there is nothing to confirm: a change
  shows at once and the panel stays open for the next. The button lights up while its panel is open,
  and is tinted while anything in it differs from how the app starts, as a set control is (UI-26).
- **UI-42** **Show task details** puts the line of details (UI-27) under **every row**, at rest as
  well as woken: the date or the repeat rule, the checklist count, the time, the reward and the tags. Nothing
  else changes — a row's checklist and description still come up only when it is clicked into
  (UI-17), and on a phone the time and the reward, having no slot on the line, are still named on
  the woken row (UI-6). Off, which is how the app starts, the details are the woken row's alone.

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
row at rest and awake), `src/app/components/ContextMenu.tsx` (a task's menu), `src/app/components/FloatingPanel.tsx` (a menu or panel floating where the pointer was), `src/app/textOffsetAtPoint.ts` (which character a click landed on), `src/app/components/SideNav.tsx`,
`src/app/components/BottomNav.tsx` (the phone's bar), `src/app/components/ViewOptionsMenu.tsx` and `src/app/useViewOptions.ts` (the View button and its options), `src/app/components/TagPicker.tsx` (the tag panel), `src/app/components/RewardPicker.tsx` (the reward panel), `src/app/components/TimePicker.tsx` (the time panel), `src/app/useLongPress.ts` (a press told from a
long press), `src/app/components/SettingsList.tsx`, `src/app/components/AccountCard.tsx` (the account on it), `BackupCard.tsx` (the backup on it), `src/app/view.ts`, `src/app/useView.ts` (the view kept in the address), `src/app/viewIcons.ts` (each
view's icon), `src/app/rowControls.ts` (the shape and tones a row's controls share), `src/app/panelControls.ts` (the size a panel's buttons share), `src/styles.css`,
`public/favicon.svg` (the app's icon; the PNGs beside it are the same icon for installing).
**Tested in:** `src/app/components/BottomNav.test.tsx` (the bottom bar), `src/app/components/SideNav.test.tsx` (the sidebar), `src/app/useView.test.ts` (the
view in the address), `src/app/components/ViewOptionsMenu.test.tsx` (the View panel), `src/app/components/TaskItem.test.tsx`
(a row with Show task details on, and a finger on a row).
