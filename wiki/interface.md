# Interface

How the screen is laid out, and the behaviour that is not tied to one feature.

## The three areas

- **UI-1** The screen is three areas: **navigation** down the left, **the work** — the box for
  adding a task, then the list — in the middle, and a **rail** down the right of it holding the
  progress bars, with today's quote below them.
- **UI-2** The rail belongs to the views that show tasks — Today, Week, Month, Tasks, the Inbox, each
  list's and each tag's — not to
  the app: habits, rewards, More, the lists, the tags, the trash and settings do without it. The habits page is already a record of progress (HAB-15), and how much of
  the week is cleared says nothing about what was thrown away. Nobody needs spurring on to empty a
  bin.
- **UI-3** There is **no view heading** over the work. The navigation already marks which view you
  are on (UI-8), so a title would say it twice and cost a strip of the screen to do it; the work
  starts at the top of the page instead. The view's name is still there for a screen reader, as the
  page's heading, unseen. The app's own mark sits in the sidebar on a wide screen (UI-52), not over
  the list.
- **UI-52** On a wide screen the sidebar opens with the app's mark — the progress-ring icon (UI-39)
  beside the name **PickMe**. A phone has none: the home-screen icon already says which app it is,
  and there is no strip for one above the work.

## On a phone

- **UI-4** Below `md` there is no room for three columns, so they stack into one and the navigation
  moves to a **bar along the bottom of the screen**, in reach of a thumb (UI-32). A sidebar is a poor
  use of a phone. The end of the page, and the undo toast (TRASH-3), stay clear of the bar.
- **UI-5** Stacked, the rail comes **after** the work — the bars, then the quote at the very bottom
  of the page.
- **UI-6** Nothing is reachable only on a wide screen. On a phone a tap on a task opens a sheet
  with its details and the action buttons (UI-48), so the list, the tags, the clock and the reward
  are there (LST-23, TAG-16, TIME-10, RWD-8); a wide screen has the last two on the row and the first
  two on the woken strip and in the task's menu (UI-53). The Lists page (UI-34) and the Tags and
  Rewards pages (UI-45) are on a phone too. The task's menu itself needs no right-click: a finger
  opens it by holding a row (UI-44).
- **UI-47** On a phone the **completion box is larger**, so ticking a task off does not need a
  precise tap, and a habit's card uses the same box (HAB-4). The rows themselves are a little
  taller and sit further apart than on a wide screen, so a tap aimed at one task is less likely to
  land on the next. Checklist items stay a step smaller than the task's box, so they never read as
  the same rank, but they grow with it. On a wide screen the box and the row stay small (UI-23).
- **UI-49** On a phone a **menu's items are large enough for a thumb** — taller, with larger type
  and icons — so choosing one does not need a precise tap: the menus of the bottom bar
  (UI-33, UI-43), More's list of links (UI-45), and a task's menu (UI-31, UI-44). The Inbox and the lists indented under
  Lists grow with them. On a wide screen they stay compact with the rest of a panel (UI-40).
- **UI-48** On a phone, tapping a task — the title or the rest of the row, not the completion box —
  opens a **sheet from the bottom of the screen**, overlapping the bar (UI-4). It holds the title,
  which is the only place a title is edited (TASK-8), the checklist and the description, and the
  action buttons: the schedule, the list, the time, the tags, urgent, the reward, Duplicate and Delete. The
  row behind it stays a single line. The sheet closes on a tap on the dimmed page or on Escape
  (UI-9, UI-10). Opening it never takes the caret (UI-22).
- **UI-54** Every page with the add box also has a **Plus** button in the bottom-right corner — above
  the bar on a phone (UI-4), and in the same corner on a wide screen. A tap opens a **sheet** for
  adding a task with the same fields the edit sheet has (TASK-66), so more than a title can be set
  before it is saved. The one-line box at the top still adds a title on Enter (TASK-4). In the sheet,
  Enter in the title — including the phone keyboard's Done/Return — adds the same way (TASK-66).
  Closing the sheet without adding keeps nothing. Procrastination mode is started from **More**
  (JUST-1), not from beside the Plus.
- **UI-55** On every page that lists tasks, pressing **N** opens the add sheet too, so a keyboard
  reaches it without Tabbing to the Plus. Typing in a box, or holding a modifier, leaves `N` alone —
  it is a letter then, not a shortcut. Habits has **H** instead (UI-56).
- **UI-56** Pressing **H** opens the add sheet for a **habit** — daily, named for a habit (HAB-24).
  From anywhere else in the app it opens Habits first, then the sheet. Typing in a box, or holding a
  modifier, leaves `H` alone, as with `N` (UI-55).
- **UI-57** Pressing **R** opens **Rewards** (RWD-19). From anywhere in the app; typing in a box, or
  holding a modifier, leaves `R` alone, as with the other letter shortcuts (UI-55, UI-56).
- **UI-58** Pressing **P** on **Today** starts **Procrastination mode** when More's control would
  offer it (JUST-1), and ends it while the mode is on (JUST-8). Elsewhere, or when the control is
  gone, `P` does nothing. Typing in a box, or holding a modifier, leaves `P` alone, as with the
  other letter shortcuts (UI-55, UI-56, UI-57).

## Navigation

- **UI-7** Twelve views: **Today**, **Week**, **Month**, **Tasks**, **Inbox**, **Habits**,
  **Rewards**, **Lists**, **Tags**, **More**,
  **Trash** and **Settings**, and a view for each list, opened from Lists, and one for each tag,
  opened from Tags. Each is named and carries an
  icon — every tag's view the same `#` as Tags, and every list the same folder as Lists. **Tags**,
  **Rewards** and **Procrastination** are reached from **More** (UI-45); the sidebar and the phone
  bar both have a **More** entry. See
  [Views](views.md), [Lists](lists.md), [Habits](habits.md),
  [Rewards](rewards.md) and [Tags](tags.md).
- **UI-30** In the sidebar the views come in four groups with a thin line between each: the period
  views (**Today**, **Week**, **Month**), then **Habits**, **Tasks**, **Lists** and **More**, then **Trash**,
  then **Settings**. **Lists** is always open, with the **Inbox** and then every list under it,
  indented (LST-13); the one open is marked itself, and Lists only on the Lists page. A tag's view
  has no entry of its own: **More** stays marked while Tags, Rewards or a tag's tasks are open.
- **UI-8** The view you are on is marked, in the sidebar and in the bottom bar alike.
- **UI-32** The bottom bar has five tabs, each an icon over its name: **the period** (UI-33),
  **Tasks**, **Habits**, **More** (UI-45) and **Settings**.
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
  **Backup**: exporting the account to a file and importing one back (BAK-1, BAK-4). Under
  those, the **version** of the app that is open — `MAJOR.MINOR.PATCH` from `package.json`,
  baked in when the app is built. The number is bumped with each change to the app (patch for a
  small fix, minor for a feature, major when something breaks for the person using it).
- **UI-36** The view you are on is **in the address** — `#/week`, `#/habits`, `#/inbox`,
  `#/list/{id}`, `#/tag/work` — so reloading the page
  keeps you on it, and a bookmark or a link opens on it. An address naming no view opens on Today.
- **UI-37** Each switch of view is a step in the browser's history: **back and forward** move
  between the views you went through.
- **UI-43** The **Tasks** tab has a menu of its own, opened as the period tab's is (UI-33): held
  down, or tapped again while Tasks is on screen, and closed by a tap on Tasks while open. It holds
  what the sidebar has in its place, laid out as the sidebar lays it out (UI-30) — **Lists**, with
  the **Inbox** and every list **indented under it** in the sidebar's order, then a line and
  **Trash**, each entry with its icon — so any list is two taps from anywhere, however long Tasks
  runs, and no heading repeats the name of the entry above it. Choosing one goes there. From any
  other view, a list's included, a tap on Tasks goes to Tasks.
- **UI-45** The bar and the sidebar have no entry for the tags or the rewards: they are under
  **More**, marked with three dots. **A tap opens More's page** — a list of links to **Tags** and
  **Rewards**, each with its icon, large enough for a thumb (UI-49) — and **Procrastination** when
  it is available (JUST-1). Choosing Tags or Rewards goes there; choosing Procrastination starts (or
  ends) the mode and opens Today. **More** stays marked while its own page, the Tags page, a tag's
  view or the Rewards page is open. Its address is `#/more` (UI-36).

## Popovers

- **UI-9** Panels that open in place — the schedule (date and repeat), time and tag pickers, a task's menu, the menus
  of the bottom bar's tabs, the View panel (UI-41, UI-46), a phone's task sheet (UI-48), and the add
  sheet (UI-54) — close on a click outside them or on Escape. The tags offered while typing
  `#` in a description close on Escape too, but a click outside is leaving the description (TAG-9).
- **UI-10** Escape inside an open panel closes the panel rather than reaching anything behind it.
- **UI-40** A panel's buttons are **compact** and the same in every panel — its choices, a
  stepper's **−** and **+**. A panel is a quick aside, so nothing in it outweighs the screen
  behind it. On a phone a menu's items are the exception (UI-49).
- **UI-15** A description is **not** a popover: on a wide screen it opens as an area inside the row, pushing the list
  down rather than floating over it, and a click outside keeps what was written instead of
  dismissing it. On a phone it is in the sheet (UI-48).
- **UI-16** A checklist opens the same way. The checklist sits above the description, being the
  parts of the task rather than a note about it.

## The task row

- **UI-17** A row at rest is the completion box, the title and its tags, its controls and the delete button.
  Clicking anywhere on the row **opens what the task holds** — its checklist and its description,
  both at once — and spells its date or repeat rule and its checklist count out under their buttons (UI-27). Clicking a task is asking to see the whole
  of it, not to be handed buttons to press. It all goes again when you click the row again (UI-28),
  click away, press Escape, or click into another row. On a phone a tap opens that as a sheet
  instead of growing the row (UI-48).
- **UI-18** Every control is **on show at rest**, set or not — the schedule (the date, or the rule
  on a repeating task, DUE-13), the checklist, the time (TIME-10), the reward (RWD-5), the description — so any of them is one click away
  on any row. Set ones are tinted (UI-26), empty ones muted, so what the task carries still reads at
  a glance. Deleting is always on show too, at the far end of the row, so it keeps its place as the
  row wakes and rests. On a phone the rest row is the box, the title and **marks** for what is set
  (UI-50); the controls themselves live in the sheet a tap opens (UI-48).
- **UI-50** On a phone, a resting row shows **tinted icons** for what the task carries — the
  schedule (calendar, or looping arrows once it repeats), the checklist, the clock, the star, the
  description and the tags — **set ones only**, and **not as buttons**: a tap on them is a tap on
  the row and opens the sheet (UI-48). Empty ones stay off, so a task with nothing set stays the
  box and the title alone. An overdue date is red, as on a wide screen (DUE-10). The words those
  icons stand for still come up under the title only with **Show task details** (UI-42), or inside
  the sheet.
- **UI-27** The controls **line up down the list**: each is its icon alone, in a slot of its own
  that sits in the same place on every row, whatever the rows beside it hold. A slot is **no wider than the button in it** — an icon with no words
  beside it is padded to a square — and a small gap is between one slot and the next, enough that each icon
  reads as its own button while the controls still sit together and read as one group at the end of the row rather than as buttons scattered along it. The list and the
  tags have no slot at all on the resting row: they are set from the task's menu (LST-14, TAG-7),
  from a strip on the woken row (UI-53), and so is urgent (TASK-63). On a phone the rest row
  has no control slots; the clock, the reward, the list, the tags and urgent are set from the sheet a tap opens
  (UI-48, TIME-10, RWD-8, LST-23, TAG-16, TASK-63), and set ones still read at a glance as marks on the row
  (UI-50) — urgent being the exception: it has no resting mark, only its label in details and the
  amber bar (TASK-62, TASK-64). What a control holds — the due date
  (DUE-5) or the repeat rule (RPT-17), the checklist count (CHK-5), the time (TIME-12), the reward (RWD-7) — is not put
  beside its icon but on a **line of details under the task's line**, in muted small text, each
  detail **under its own button**, centred on it and free to run wider than it. The task's tags and
  urgent, having no button at rest, are on that line under the title, starting where it does (TAG-12,
  TASK-62). The line belongs
  to the **woken row** only, unless **Show task details** is on (UI-42): at rest the tinted icons say
  what is set, so every resting row is the same single line high, dated or not. The schedule's detail, the first,
  ends under its button instead of centring on it and runs left over the title's column, the tags
  there giving up room to it, so however long a rule is it never reaches the details beside it. A woken row with nothing to
  spell out has no such line. The line is part of the task's own line (UI-28).
- **UI-53** On a wide screen, waking a row also brings a **strip of the menu's actions** under the
  task's line — list (once there is one to choose), tags, urgent and Duplicate — so those need
  not wait for a right-click (UI-31, LST-14, TAG-7, TASK-63, TASK-51). They sit as **icons on one
  row**, each naming itself on hover, and rest with the row. A phone already has them in the
  sheet (UI-48).
- **UI-51** A task still to do marked **urgent** carries a **thin amber bar on the left of its
  row** (TASK-64) — a quiet mark, not a badge or a tinted whole row — so the list stays readable and
  only urgent tasks stand out at a glance.
- **UI-26** A control with something set is **tinted quietly**, and brightens on hover. Every row
  can carry several, so a strong tint would turn the list into a column of highlights and drown the
  titles. An overdue date is the exception, being a warning (DUE-10). An urgent bar is the
  other (UI-51): it marks the row without tinting its controls.
- **UI-19** The completion box is the exception: ticking a task off leaves its row as it was. That
  is finishing a task, not settling down to work on it.
- **UI-20** Keyboard focus wakes a row too, so nothing on it is reachable by mouse only. The row
  rests again when focus leaves it. On a phone the controls live in the sheet, so focusing the box
  does not open it.
- **UI-21** The checklist and the description belong to the woken row and rest with it. While it is
  awake the two are independent: either button puts its own away without disturbing the other or
  leaving the row, and brings it back. On a phone both come up with the sheet and rest when it
  closes (UI-48).
- **UI-22** Waking a row never takes the caret. The boxes it opens are there to be clicked into,
  not to start typing in: a row is clicked for many reasons, and two boxes competing for the
  keyboard on each one would be reaching for something they had not been asked for.
- **UI-23** On a wide screen a row is as short as its contents allow — the completion box, one
  line of title, and the small controls beside it. The list is meant to be run down at a glance, so
  every row costs the same and none of it is padding. On a phone the row is taller and the list
  leaves more room between one and the next, so a finger can hit the box (UI-47).
- **UI-28** Clicking a woken row **on the task's own line** — anywhere on it that is not the title,
  a control, or an open picker — puts it away again, so a row opens and closes from the same place.
  A finger's tap there opens the task's menu instead (UI-44); a tap anywhere else puts the row away.
  Clicks inside its controls, pickers, checklist or description leave it awake: those are about the
  thing clicked, not the row. On a phone there is no second tap: a tap on the dimmed page closes the
  sheet (UI-48).
- **UI-29** The title takes **only the room its words need, plus 13 pixels past the end** — that
  is where a click edits it (TASK-8). The rest of the line is the row, and a click there opens or
  closes it. Once open, the title's box takes the whole width, so there is room to type. On a phone
  the title on the row is not an edit: a tap there opens the sheet, and the title is edited in the
  sheet (UI-48).
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
  finger by **holding a row** until it is picked up (TASK-39) and letting go where it was — moved
  first, it is a drag. On a wide screen a **tap on a woken row** on its own line (UI-28) opens it
  too, so a double tap opens it on any row. On a phone a tap opens the sheet instead (UI-48); the
  menu is still there on a hold. It is the same menu, the Date row, Duplicate, Tags and List alike,
  the row staying as it was behind it, and letting go clicks nothing the menu opens over. A mouse
  keeps the right-click.

## The View settings button

- **UI-41** Every view that lists tasks has a **View settings** button beside the add box: a square as tall
  as the box, marked with sliders, opening a panel of how the tasks are shown. The options hold for
  **every** such view at once — Today, Week, Month, Tasks, the Inbox, each list and each tag — and
  are kept on this device (STORE-30). Each option is a **switch**: the whole line is the switch —
  an icon, its name, a line under the name saying what it does, and the track at the end, blue when
  on, whose icon takes a set control's tint. Like the pickers there is nothing to confirm: a change
  shows at once and the panel stays open for the next. The button lights up while its panel is open,
  and is tinted while anything in it differs from how the app starts, as a set control is (UI-26).
  The panel sits **above** the list under it, so a row's controls never show through.
- **UI-42** **Show task details** puts the line of details (UI-27) under **every row**, at rest as
  well as woken: the date or the repeat rule, the checklist count, the time, the reward and the tags. Nothing
  else changes — a row's checklist and description still come up only when it is clicked into
  (UI-17), and on a phone they come up in the sheet (UI-48), with the time and the reward named
  there (UI-6). Off, which is how the app starts, the details are the woken row's alone — or, on a
  phone, the sheet's.
- **UI-46** **Habits** has a View settings button of the same shape, beside its add box. Its option is how
  the habit cards start — folded or open — and is kept on this device apart from the task views'
  (HAB-23, STORE-36).

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
row at rest and awake), `src/app/components/TaskSheet.tsx` and `src/app/components/BottomSheet.tsx` (a
phone's look at a task), `src/app/usePhoneLayout.ts` (whether the screen is a phone's), `src/app/components/TaskList.tsx` (the room between rows), `src/app/components/ContextMenu.tsx` (a task's menu), `src/app/components/FloatingPanel.tsx` (a menu or panel floating where the pointer was), `src/app/textOffsetAtPoint.ts` (which character a click landed on), `src/app/components/SideNav.tsx`,
`src/app/components/BottomNav.tsx` (the phone's bar), `src/app/components/AddTaskForm.tsx` (the one-line
add box and the Plus), `src/app/components/AddTaskSheet.tsx` (the detailed add sheet), `src/app/letterShortcut.ts`
and `src/app/useLetterShortcut.ts` (`N` and `H` open the sheet, `R` opens Rewards, `P` toggles
Procrastination mode), `src/app/components/MorePage.tsx` (More's list of
links and Procrastination), `src/app/components/ViewMenu.tsx` (the View
button and its panel), `src/app/components/ViewOptionsMenu.tsx` and `src/app/useViewOptions.ts` (the
task views' options), `src/app/components/HabitViewOptionsMenu.tsx` and `src/app/useHabitViewOptions.ts`
(Habits'), `src/app/components/TagPicker.tsx` (the tag panel), `src/app/components/RewardPicker.tsx` (the reward panel), `src/app/components/TimePicker.tsx` (the time panel), `src/app/useLongPress.ts` (a press told from a
long press), `src/app/components/SettingsList.tsx` (and the version on it, from `package.json` via
`vite.config.ts`), `src/app/components/AccountCard.tsx` (the account on it), `BackupCard.tsx` (the backup on it), `src/app/view.ts`, `src/app/useView.ts` (the view kept in the address), `src/app/viewIcons.ts` (each
view's icon), `src/app/rowControls.ts` (the shape and tones a row's controls share), `src/app/panelControls.ts` (the size a panel's buttons share), `src/styles.css`,
`public/favicon.svg` (the app's icon; the PNGs beside it are the same icon for installing),
`src/app/components/AppLogo.tsx` (the mark in the sidebar).
**Tested in:** `src/app/components/BottomNav.test.tsx` (the bottom bar, and that a phone's menu
items are large enough for a finger), `src/app/components/MorePage.test.tsx` (More's links), `src/app/components/SideNav.test.tsx` (the sidebar, and the mark on it), `src/app/useView.test.ts` (the
view in the address), `src/app/components/ViewOptionsMenu.test.tsx` (the View panel), `src/app/components/HabitViewOptionsMenu.test.tsx`
(Habits'), `src/app/components/SettingsList.test.tsx` (the version on Settings), `src/app/components/TaskItem.test.tsx`
(a row with Show task details on, a finger on a row, and a phone's sheet),
`src/app/components/AddTaskForm.test.tsx` (the one-line box, the Plus and the detailed sheet),
`src/app/letterShortcut.test.ts` and `src/app/useLetterShortcut.test.ts` (`N`, `H`, `R` and `P`).
