# Features

The parts of the app that can be **switched off** on Settings, for someone who does not use them:
a page, a panel or a notice they would rather not see. Switched off, a part is gone from every place
it shows itself; switched back on, it is all there as it was left. The tasks themselves are the one
thing every account keeps.

## The switches

- **FEAT-1** **Settings** has a **Features** section, under Account (UI-35), with **one switch for each
  part** of the app that can be done without, in this order: **Habits**, **Rewards**, **Cases**,
  **Lists**, **Tags**, **Balance**, **Activity log**, **Modes**, **Progress bars**, **Daily quote** and
  **Reminders**. Each carries the glyph its page is navigated by, its name, and a line saying what it
  is in plain words — *Points for finished tasks, and prizes and a wishlist to spend them on*. A
  switch turns its part on or off **at once, with no confirm**: nothing is lost either way (FEAT-5).
  The **i** beside the heading (UI-73) says what the section is for, one thing a sentence: what off
  means, that nothing is deleted, which parts belong to which (FEAT-4), that a part with settings of
  its own has an arrow that shows them (FEAT-10), and that the switches are the account's (FEAT-6).
- **FEAT-10** A part with **settings of its own** keeps them **under its switch**, one step down
  the same tree, rather than on a card of its own: **Habits** holds how the habit cards start out
  (HAB-23), **Cases** whether tasks without points count (CHST-32) and practice (CHST-21). A
  **chevron** in front of the part's switch, named *Habits settings* or *Cases settings*, folds them
  away and brings them back; they start folded, and what is folded is kept on this device
  (STORE-57). Unfolded, they sit under the part's name, joined to it by a line down from its icon.
  Every switch keeps the chevron's column, so the switches start in one line whether or not they
  have anything under them. A part switched off takes its settings and its chevron with it (FEAT-3).
  A new setting of one part goes under that part.
- **FEAT-7** What cannot be switched off is what the app is: the **tasks**, their days, hours,
  repeats, checklists, time goals and descriptions, the period views, Tasks, the **trash**, and
  Settings itself with the account, the backup and the theme.

## What off means

- **FEAT-2** A page switched off is **gone from everywhere it is reached from**: its entry in the
  sidebar, with whatever is folded under it (UI-30); its tab on a phone's bar, the tabs left sharing
  the bar between them (UI-32); its entry in the Tasks and Rewards tabs' menus (UI-43, UI-67) and in
  the strip across the rewards pages (RWD-30); its row on **More** (UI-45) — and More itself, once
  every page on it is off; and its letter: **H** with Habits, **R** with Rewards, **C** with Cases (UI-56, UI-57, UI-72), **P** with the modes (UI-58). An **address** naming it — a bookmark,
  a reload, a notification pressed — opens the **nearest page above it** that is on instead (UI-37):
  Rewards for Cases, Tasks for a list or the Inbox, Modes for a mode, More for Balance — or
  Today, where nothing above it is on — and the address is put right to match.
- **FEAT-3** What a part shows **anywhere else** goes with it:
  - **Lists** — the list on a task's sheet, the add sheet and an open row, and the list choices in
    a task's menu. A task stays filed where it was, and shows in Today, Week, Month and Tasks as
    ever.
  - **Tags** — the tags on a task's sheet, the add sheet and an open row, **Tags** in a task's menu,
    the tags spelled out under a title (TAG-12), and the suggestions that `#` offers in a
    description (TAG-8), where a `#` is only a character again.
  - **Rewards** — the reward on a task's sheet, the add sheet and a row (its column too, an empty
    one on every row being a gap), the points spelled out on a row, and **Reward +1** on
    Procrastination's win card (JUST-9).
  - **Cases** — its card on Rewards (RWD-30), its section on Rules (CHST-3), the dot saying a key is
    waiting (CHST-22), the notice when Payday is earned (CHST-23), the notice when the Drop
    arrives (CHST-29), the notice when Weekly is here on Monday (CHST-30), and its settings under its
    switch on Settings, counting tasks without points and practice (FEAT-10).
  - **Habits** — its settings under its switch on Settings: how the habit cards start out
    (HAB-23, FEAT-10).
  - **Progress bars** and **Daily quote** — each from the rail beside the tasks (UI-1); with both
    off there is no rail, and the list takes its width. The quote service is not asked while the
    quote is off.
  - **Reminders** — the notice and the browser notification when a task's hour comes round (REM-1),
    and the browser being asked for permission when an hour is set (REM-7). The hours that strike
    while reminders are off are never said later: turning them on does not bring an afternoon's
    worth at once. An hour can still be set; it orders the list and is said on the row.
- **FEAT-5** **Nothing is deleted.** A task keeps its list, its tags and its reward; the points,
  prizes, Balance categories and activity log all stay where they are; and a switch turned back on
  finds everything as it was. A task finished while Rewards is off still earns its points, and they
  are there when Rewards is back — what is earned stays earned (RWD-13). A task added while it is
  off still starts at the reward set for new tasks (RWD-45). The backup holds everything
  whatever is switched off (BAK-2).

## Parts of another

- **FEAT-4** **Cases** is a way of earning points, so it is part of **Rewards**; **Balance**
  divides logged time by the tags (BAL-1), so it is part of **Tags**. Each is **off whenever the
  one it is part of is**, whatever its own switch says. On Settings its switch sits **indented under**
  the other and is offered **only while that one is on** — a switch that would do nothing until
  something else were turned on would only puzzle. Its own switch is kept meanwhile, so Cases
  switched off stays off when Rewards comes back, and one left on comes back with it.

## The modes

- **FEAT-9** **Modes** switched off takes all four away: the Modes page and each mode's own, their
  place in the sidebar and on More, the banners on Today and Habits (MODE-10), the **P** letter, and
  the Check-in's row on the Activity log (ACT-19). A mode built on another part goes **with that
  part**: the **warm-up** with Habits, the habits being what it lets in, and the **check-in** with
  the Activity log, which is where it asks to be written. A mode taken away **does nothing**, whatever
  its own switch says: Procrastination dims nothing and Today has no banner, the warm-up holds no habit
  back (WARM-4), the nudge says nothing (NUDGE-1), and the check-in asks nothing — not on screen, not
  by notification, and not pushed while the app is closed (CHECKIN-10). Its own switch and what it is
  set to are kept, so it carries on as it was when what it needs is back; Procrastination ends with
  the day in any case (JUST-10).

## Where they are kept

- **FEAT-6** The switches are **the account's**, as the modes are (MODE-9): a part switched off at
  the laptop is off at the phone, and what someone uses the app for is theirs rather than the
  machine's (STORE-56). They are in the **backup** (BAK-20). As guest they are kept in this browser
  and moved into the account on signing in (STORE-37, STORE-38).
- **FEAT-8** Until the account has said how they stand, **everything reads as on**, and the card
  says `Loading…` and offers no switch. A part switched off may show for that moment, but nothing is
  hidden on a guess, no address is sent elsewhere on one (FEAT-2), and a switch drawn on a guess
  would send the guess back to the account.

---

**Where it lives:** `src/core/feature.ts` (the features, what each is part of, what each mode
needs, switching one), `src/storage/featureRepository.ts`, `featureSchema.ts`,
`firestoreFeatureRepository.ts` and `localFeatureRepository.ts` (keeping them),
`src/storage/checkInSender.ts` (the sender asking nothing while the check-in is switched away),
`src/app/useFeatures.ts` (loading and switching), `src/app/features.ts` (`FeaturesContext` and
`useFeatureOn`, for what is drawn inside a row or a sheet; which pages are there, and where an
address lands), `src/app/featureLabels.ts` (the wording), `src/app/components/FeatureSwitches.tsx` and
`SettingsList.tsx` (the switches, and a part's own settings under its switch), `src/app/TasksScreen.tsx` (the shortcuts, the notices, the modes, the
rail), `SideNav.tsx`, `BottomNav.tsx`, `MorePage.tsx`, `RewardsNav.tsx`, `ModesPage.tsx` (the
navigation), `TaskItem.tsx`, `TaskSheet.tsx`, `AddTaskSheet.tsx`, `TaskDescription.tsx`,
`ProcrastinationMode.tsx`, `RewardsPage.tsx`, `ActivityPage.tsx` (what goes with a part),
`src/app/useReminders.ts` and `useQuote.ts` (reminders and the quote, off).
**Tested in:** `src/core/feature.test.ts`, `src/storage/featureSchema.test.ts`,
`src/storage/checkInSender.test.ts`, `src/storage/backupFile.test.ts`,
`src/storage/backupRepository.test.ts`, `src/app/features.test.ts`, `src/app/useFeatures.test.ts`,
`src/app/useReminders.test.ts`, `src/app/useQuote.test.ts`,
`src/app/components/SettingsList.test.tsx`, `SideNav.test.tsx`, `BottomNav.test.tsx`,
`MorePage.test.tsx`, `ModesPage.test.tsx`, `TaskItem.test.tsx`.
