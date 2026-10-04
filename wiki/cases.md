# Cases

A cleared day earns **Payday**. Another case, the **Drop**, arrives once a day, at a random time.
A third, **Weekly**, is ready on Monday and planned on every other day. The three pay different ranges. **Payday** pays any whole
number from the points of the cheapest task finished today up to half of everything earned today.
The **Drop** pays any whole number from 1 up to everything earned yesterday divided by how many
tasks that was. **Weekly** pays any whole number from the points of the cheapest task finished
last week up to everything earned last week divided by how many tasks that was. Each amount in a
case's own range is as likely as any other.

A task's reward pays a known amount for a known
piece of work, and a period bonus pays a known amount for clearing a stretch of it
([Rewards](rewards.md)); a case pays an **unknown** amount inside that range, which is the whole
of why it is here.

The six seconds it takes to open — a crate unlocking, a reel of cards running past a marker and
slowing to a crawl — are as much the feature as the points are.

## The key

- **CHST-1** Cases pays a **whole number of points inside a range of its own**, and it goes into
  the points ledger beside what the tasks earned (RWD-44). Payday's range, the Drop's
  range and Weekly's range are each worked out on their own (CHST-10).
- **CHST-2** A key is earned the moment **everything Today asks for is done** — when Today's bar
  reads 100% (PROG-3) — which is the moment the Today bonus is earned too (RWD-25). A day with
  **nothing on it earns nothing**: there was nothing to clear.
- **CHST-3** A cleared day earns no key unless it asked for **at least so many tasks**, an amount
  set on Rules (CHST-7). It is a whole number **from 1 to 99**, and it is **1** to begin with — so
  any cleared day earns a key until it is asked to be bigger. One thing remembered at bedtime and
  ticked off is not a day's work, and a day that asked for fewer than this says so rather than
  offering a key (CHST-17).
- **CHST-4** It is **one a day**, however much more is finished after it. The ledger names what was
  earned by the task and the day together, and Cases is recorded under a name of its own, so the
  one record **is** the day's opening: two devices seeing the same one count it once.
- **CHST-5** **Opened stays opened.** Anything that leaves Today unclear again — unticking a task,
  adding one Today shows — takes the *Today bonus* back (RWD-26) but never what Cases gave, and
  never hands the day's key back either. The lid was opened; that is the whole of it. A case is a
  moment rather than a balance, and there is no undoing a moment.
- **CHST-6** Changing what Cases asks of a day only affects **days from then on**, as
  changing a task's reward only affects completions from then on (RWD-3). A case already opened
  keeps what it gave.

## What a case pays

- **CHST-7** What a day **earned** is what the tasks finished that day earned and any bonus paid
  that day (RWD-25), the same sum the Today tile of what was earned shows before Cases is opened
  (RWD-21). It is not typed and not chosen — Rules says what today comes to so far, beside how
  many tasks a day must ask for (CHST-3, RWD-39) — and it grows with the day: every task finished
  before Payday is opened can raise what that case pays.
- **CHST-8** Cases' own opening is **left out** of what any case is worked out from: it cannot
  be part of the sum it was drawn from, and the Today tile goes on to count it once it is open.
- **CHST-9** A case is never asked to pay less than **1**, and its most is never under its least.
  A day that earned nothing yet, a yesterday with no tasks, or a previous week with no tasks,
  pays 1 rather than nothing (CHST-11).
- **CHST-10** Each case pays **any whole number from its least to its most, every one of them as
  likely as any other**. There are no tiers and no table.
  **Payday**, earned by finishing everything in Today, runs from the **points of the cheapest task
  finished today** up to **everything earned today divided by 2**, the remainder dropped. A bonus
  counts in the sum and is not a task, so it cannot be the cheapest. Where half of today is less
  than that cheapest task — a day of one task is the usual one — the case pays **exactly** that
  task's points, so it never pays less than the cheapest task.
  The **Drop**, the one that arrives at a random moment, runs from **1** up to **everything earned
  yesterday divided by how many tasks were finished yesterday**, the remainder dropped, and never
  under 1. The same task written twice is one task. Yesterday with no tasks pays 1.
  **Weekly**, ready on Monday and planned until then (CHST-30), runs from the **points of the cheapest task
  finished in the previous week** up to **everything earned that week divided by how many tasks
  were finished that week**, the remainder dropped. A task finished on two days of that week is
  two tasks. A bonus counts in the sum and is not a task, so it cannot be the cheapest. Where
  that average falls short of the cheapest task, the case pays **exactly** those points. A
  previous week with no tasks pays 1.

## What a case holds

- **CHST-11** A case is **never empty**: the least it gives is 1 point. An app
  that fights procrastination must not answer a cleared day with nothing, however good a gamble that
  would make it.
- **CHST-28** The page shows **three cases** until the day ends (CHST-30). The cards share their
  rows, so a possible win on only one of them leaves the other that row empty and the crates and
  names stay level. The three sit in a row once there is room; on a narrow screen Weekly wraps
  under the other two.
  **Payday** is earned by finishing everything in Today, and pays from the cheapest task finished
  today up to half of everything earned today (CHST-10). The **Drop** arrives at a random moment and
  pays from 1 up to everything earned yesterday divided by how many tasks that was. A ready case
  says that rule under it. While a case is planned and not yet
  available — Today still has work left, the Drop's moment has not come, or Weekly is waiting for
  Monday — it is shown **half transparent**. While Payday is still to be earned it reads *Finish everything in Today and a case
  is yours. Reward depends on the cheapest task today, up to half of today’s rewards.*, with
  **Today** set in bold. While the Drop is still on its way it reads *Arrives once a day, at a random
  time. Reward depends on yesterday: from 1 point, up to yesterday’s rewards divided by yesterday’s
  tasks.*, and it
  carries a small **timer** on it, counting down every second, until that moment arrives and the
  case is ready (CHST-29). The timer is only for today's Drop. While Weekly is still to come it
  reads *Arrives on Monday. Reward depends on last week: from the cheapest task last week, up to
  last week’s rewards divided by last week’s tasks.*, and it carries no timer. A case that has been opened stays
  until the end of the day, with its
  **lid open** and the picture **dimmed**, and it is not a button. Under it, it says when the next
  one comes. Payday reads *Take the next one tomorrow after completing all planned tasks.*
  The Drop reads *A new case will be given tomorrow. Earn more points today to increase reward.*
  It does not say at what time. Tomorrow’s Drop is worked out from today, so points earned
  today raise what that next case can pay.
  Weekly reads *A new case will be given next Monday.*
  The next day the opened case is gone, and Weekly is planned again until the following Monday. An
  empty day plans no Payday. Pressing a ready case opens it. The big cabinet is not on
  the page until then: it appears for that opening, plays it, and leaves once the show has
  finished. A case is not chosen
  first, and none is drawn with a frame around it.
- **CHST-26** A **ready** case says **what it can give**, as a line headed **Possible win** set in
  front of it: *4–20 points* where that is Payday’s range, *1–7 points* for the Drop, marked
  out in gold. Under a ready case the rule is written out: *From the cheapest task today, up to
  half of today’s rewards.*, *From 1 point, up to yesterday’s rewards divided by yesterday’s
  tasks.* and, for Weekly, *From the cheapest task last week, up to last week’s rewards divided
  by last week’s tasks.* A case that
  is only planned has **no** possible win, including when it would only have read *1 point*.
  Neither does one already opened. In
  practice every case is ready, Weekly included, and there is no timer: each runs from 1 up to the number typed
  just below (CHST-21). While a case is ready and that range is a single point, its line reads
  *1 point*. How the points stand says what today has earned (RWD-20), and Rules says the same,
  with how each case is worked out (CHST-7, CHST-10). The **i** on Cases writes that working out
  in numbers, from the ledger as it stands (CHST-22).

## Opening it

- **CHST-13** **A ready case is the button** — the whole of its card takes the press — and **Enter**
  or **Space** on it opens it too. There is no frame to mark one chosen, no lever to drag and
  nothing to confirm: a key is spent the moment the case is pressed, and the big cabinet appears
  already opening. Shut, that cabinet is a **supply crate** — cream enamel over a teal
  body, chipped at the corners, a band of hazard stripes where the lid meets it, a latch each side
  and a **dial lock** in the middle. What tells a key is there, before a word is read, is the ready
  case itself: solid, and a button, where a case still on its way is half transparent (CHST-28).
- **CHST-14** Opening takes about **six seconds**, and the shape of them is the point. The crate
  **squashes into its floor** as it is pressed; its **dial turns** three quarters round and its lamp
  goes white; the **latches spring off** with a hiss and a puff each side, the lid lifts a hair and
  light shows along the seam. Then the crate **drops away** and a **screen comes on** behind it as an
  old set's does — a line, then the picture: rounded glass, scanlines, a bar of light rolling down
  it. Across it a **reel of cards** runs past a **marker** down the middle, quick at first and
  **slowing to a crawl**, the marker **flicking** — and the reel ticking — as each card crosses it,
  so the ticks come further apart as it slows. It stops **inside a card, never on an edge**, and
  holds there a beat with nothing said. Then that card **comes out of the screen** — from exactly
  where it stopped — as the screen **switches off** behind it to a line and then to nothing: the
  card grows, a **starburst** in its colour opens behind it, a **flash** and **two rings of light**
  go out across the cabinet, a sweep of light crosses the card, and **sparks** streak out, **embers**
  drift up and — over half the jackpot — **shards** in the card's colour tumble and fall; the top
  quarter
  throws several times as much, its starburst runs through every colour, and the cabinet shakes.
  The points **spring in** and count up, slowing as they land — the number alone: the card has
  already shown how big it is, so nothing is written under it; a screen reader is told it as *14
  of a possible 20*. Only what follows the card coming out — how much is thrown, how long the
  counting takes — grows with a bigger opening. Everything
  before it, the reel's run included, is **the same length whatever is inside**, so the wait itself
  never says what is coming. The look is two things at once on purpose: the reel is a modern game's,
  quick and clean, and everything round it is the 1960s left out in the weather.
- **CHST-15** Every card on the reel shows **what it pays**, and says which **quarter of the
  jackpot** that is three ways: its **colour** — bone up to a quarter, teal up to half, amber up to
  three quarters, magenta over that — along its foot and glowing up from it; **pips** in its corner,
  one to four; and an **emblem** — a nut off the scrap heap, a charged cell, a bar of gold, an atom's
  core. The quarter is worked out from the amount and never the other way round: it changes nothing
  about what is drawn, only how it looks. With a jackpot of 80: 1–20 bone, 21–40 teal, 41–60 amber,
  61–80 magenta. The other cards are drawn from that case’s own range (CHST-10), so what runs past
  is a fair picture of **that case**. About **one opening in three**, the card **after** the
  one it stops on is from the **quarter above**, and the reel stops at the far edge of its own card,
  a hair short of it. Where the range is a single amount there is nothing higher, so it never stops
  short of another card. It is a show, and it says so here: what the
  case gives was decided and written down before the crate unlocked (CHST-16), and the reel is
  built round it.
- **CHST-16** **What an opening gives is written before any of it is drawn.** The unlocking, the
  reel and the counting are a replay of something already recorded, so a reload in the middle of
  it, a connection lost, or leaving the page cannot draw a second answer, and a second press cannot
  write over the first. A press while it is still opening does nothing, including a press on
  another case.
- **CHST-17** A case that is only planned is not a button, and one already opened is not either
  (CHST-28). An unfinished Today says nothing under Cases. A day that asked for too
  little says *Today asked for 2 tasks; a case needs 3.* A case that can still be opened is
  **never dimmed out of reach**: a dimmed crate cannot say why it is dim. An opened one is dimmed
  because the day has already had it, and the line under it says when the next one of that kind appears.
- **CHST-18** Asked for **less motion**, the card is out **at once**, with the number already on
  screen: no breathing, no dust, no unlocking, no reel, no flash or rings, nothing thrown, no
  counting. The card and its light are still there; they simply do not arrive. The wait goes with the movement, there being
  nothing to watch it for. The result stays about two seconds, long enough to be read, and then the
  cabinet leaves (CHST-25).
- **CHST-19** Cases **makes a noise**, and it is meant to sound like heavy things in a big room
  rather than a toy: every impact is a low thump under a strike of metal, and all of it has a little
  room round it. A clunk, the ratchet of the dial and a clank as it stops; the latches either side
  and the long hiss of the seal; the thump, buzz and crackle of a tube warming up; under the reel a
  **low drone** whose tone opens and whose pulse quickens as it slows, with air rising under the
  last of it, and a **click for every card** that crosses the marker; a heavy catch as the reel
  stops and a breath drawn in through the beat; and as the card comes out a **boom**, a rush of air
  and a swept **chord** that is taller and longer for a higher quarter, with **bells** rising from
  the second quarter up and, for the top quarter, a second hit and a long shimmer. The counting clicks over
  like a counter's wheels. Turning the sound off in the middle of the show stops it there and then. A **speaker button in the
  corner of the cabinet** turns it off and on, and says which it will do. It starts **on**, which
  nothing else in the app does: pressing a case is as plain a yes as a control gets, and silence is
  half the moment. Where the device can buzz, it buzzes as it is pressed, as the latches go, as the reel stops
  and as the card comes out.
- **CHST-20** While the ledger or the tasks are **still on their way**, Cases has nothing to say
  and nothing to give — no key waiting, no notice, and a press that does nothing. A ledger not read
  yet would read as a case not opened, which would both promise a key already spent and let an
  opening write over what the morning's gave. The switch waits rather than guessing, as a mode's
  does (MODE-8).

- **CHST-25** Cases stands in a **dark cabinet whatever the theme** — the one place in the app
  that does not follow the system's light or dark (PRIN-12). Light can only be seen to come out of
  something against what is darker than itself: on a white card a bone card's pale glow was simply
  not there and amber washed out to nothing. So the cabinet is lined dark — gunmetal with grit
  in the paint, a lamp somewhere above it and hazard stripes along its foot —
  as a jeweller's box is lined whatever room it is opened in, and on a light page it reads as a box
  on the page rather than a hole in it. Open, it is **ringed in the colour** of what came out of it.
  Once the show has finished, the cabinet leaves. Where the show had no wait, the result stays
  about two seconds and then the cabinet leaves (CHST-18). While a case is still ready, the cabinet
  stays off the page until that case is pressed (CHST-13). An opened case remains in the row until
  the day ends (CHST-28).

## Practice

- **CHST-21** **Practice mode** is for seeing how Cases goes without waiting for a day to
  clear. Its switch is on **Settings**, under **Cases** (UI-35), rather than on Cases' page: it
  is a way to try Cases, not to use it, and kept off the page it cannot sit beside every real
  opening. While it is on, a case opens **as often as you like**, whatever the day stands at, and
  **nothing is earned and nothing is saved**: no points, no record, no notice. A band across the
  cabinet, once a case is opened, reads **Practice — nothing is earned**, so a practice jackpot is
  never mistaken for a real one. Under Cases, only while it is on, a **Practice mode** card says it is on and offers
  **Turn practice off** there and then, beside **how much to play for at most**, since the real one
  may be 1 and turn every opening into the same answer; **Skip the wait**, so thirty openings do not
  cost three minutes of reels; and a **tally** of the run — how many came to each quarter of the
  jackpot, and the average — to eye against the odds: every quarter about as often, the average
  about half (CHST-10). It stays on from page to page until it is turned off, but it is kept on no
  device and in no account: it is **off whenever the app is opened**, so it cannot be left on
  without being noticed.

## The page and the notice

- **CHST-22** **Cases** is a page under **Rewards**, at `#/rewards/cases` (UI-36) — an address still
  written `#/rewards/chest` opens it too — and it comes
  **first of them**, ahead of the history (RWD-30): a key nobody notices earns nothing. Pressing
  **C** opens it from anywhere (UI-72). An **i** at its head (UI-73) says the rules, one case at a
  time: Payday is earned by finishing everything in Today, and its reward depends on what was
  finished today — from the cheapest task finished today up to half of everything earned today. The
  Drop arrives once a day, at a random time, and its reward depends on yesterday — from 1 point up
  to everything earned yesterday divided by how many tasks that was. Weekly is ready on Monday and
  planned until then, and its reward depends on last week — from the cheapest task finished last week up to everything
  earned last week divided by how many tasks that was. Under each rule it also says how that range
  stands just now, from the ledger: for Payday, the cheapest task finished today, everything earned
  today, and half of that; for the Drop, everything earned yesterday and how many tasks that was;
  for Weekly, the cheapest task finished last week, everything earned last week, and how many
  tasks that was. Each line ends with what the case pays. The same short rule sits under a ready
  case (CHST-26); the **i** is where the sum is written out. Each amount in a case’s range is as likely
  as any other. The page itself holds the cases (CHST-28), what each can give while a key is waiting
  (CHST-26), the cabinet once a case is opened, and, while practice mode is on, how
  the practice run is going (CHST-21); what it *asks* and plays for is set on Rules, with
  everything else that is one amount for the whole account (CHST-7), and practice mode is switched
  on Settings. While a key is
  waiting, Cases is **marked wherever it is reached from** —
  its entry in the sidebar, its pill in the phone's strip, the Rewards tab — with a dot and the
  words behind it, a mark that is only a colour saying nothing to someone who cannot see it.
- **CHST-23** The moment the day comes clear, the app **says so**: *Today is clear. Payday is
  waiting.*, with **Open Cases** beside it, at the top of the window. Said **once a day on this
  device**, and dismissed either by going or by its ×. It is Payday: the Drop arriving
  on its own is said separately (CHST-29), and so is Weekly on Monday (CHST-30). The last task going is the moment Cases
  is worth most, and a key found a day later is a key half wasted. How the points stand says it too
  (RWD-20): what the key plays for, and whether it is waiting or already spent.
- **CHST-29** While today's Drop is still on its way, its timer **counts down** every second. A time
  on another day is not shown, and an opened Drop does not count toward tomorrow. The
  moment that time arrives, the case is ready — the timer goes, and what it can give is shown
  (CHST-26) — and the app **says so**: *The Drop is here.*, with **Open Cases** beside it,
  at the top of the window. Said **once**, the moment the timer runs out while the app is open, and
  dismissed by going or by its ×. A case whose time has already passed when the app is opened is
  simply ready; it is not announced then, and neither is one whose time passes while Cases is
  switched off (FEAT-3). Where the browser allows notifications there is also a **browser
  notification**, so the arrival is heard with the app in the background. Pressing it opens the
  cases. A browser that has no notifications, or is blocking them, loses only the reach: the notice
  on screen says the same thing.
- **CHST-30** **Weekly** is ready on **Monday**, from the start of the day. On every other day it
  is **planned**: half transparent, not a button, with no possible win and no timer. It pays from
  the cheapest task finished in the previous week — Monday to Sunday, the week just closed — up to
  everything earned that week divided by how many tasks that was (CHST-10). A ready Weekly says
  that rule under it, and what it
  can give. Once opened it stays until Monday ends, and reads *A new case will be given next
  Monday.* The next day it is planned again. The app **says so** once that Monday on this device,
  while Weekly is still to open: *Weekly is here.*, with **Open Cases** beside it, dismissed by going
  or by its ×. Opening the app on Monday says it, the case having been there since midnight. It is
  not said again once dismissed, and it is not said on any other day. While Cases is switched off
  the notice stays off with it; turning Cases on while Weekly is still to open says it then.
  There is no browser notification: it does not arrive in the middle of the day.
- **CHST-24** What Cases keeps on this device, rather than in the account: whether it **makes a
  noise here**, which opening it is **still glowing from** — which quarter of the jackpot it came to
  — whether it has **already said here** that a key is waiting, and whether it has **already said
  here** that Weekly is here (STORE-49). What it asks of a day
  is the account's (STORE-48) — how someone wants to be paid travels with them — but the room you are
  in is not, a
  notice given on the laptop is no reason to withhold it on the phone, and the ledger says what
  Payday, the Drop or Weekly gave without saying which colour it gave it in, that being the show rather than the
  record.

---

**Where it lives:** `src/core/cases.ts` (what an opening draws, each case’s range, which quarter of it an
amount is, and whether a key is waiting), `src/core/caseKind.ts` (how a range is spread), `src/app/useCases.ts` (Cases as its page reads it, and
the one way to open it), `src/app/useCaseKey.ts` (watching the Drop arrive), `src/app/components/KeyTimer.tsx` (the countdown on it), `src/app/components/CasesPage.tsx` (the page), `src/app/components/CaseCards.tsx` (the cases),
`src/app/components/CaseOpening.tsx` (the opening), `src/app/components/CaseArt.tsx` (the crate),
`src/app/components/CaseReel.tsx` (the screen, the reel, the cards and the card once it is out),
`src/app/caseReel.ts` (the reel built round an opening, the near miss, and when each card ticks),
`src/app/components/CaseBurst.tsx` (what is thrown off the card),
`src/app/components/CaseRange.tsx` (the possible win just in front of a case),
`src/app/components/CasesSettingsCard.tsx` (what it asks and plays for, on Rules),
`src/app/components/CasesPracticeCard.tsx` and `SettingsList.tsx` (the practice switch, on Settings),
`src/app/components/CaseNoticeToast.tsx` (the notice when Today comes clear, when the Drop arrives, and when Weekly is here),
`src/app/browserNotification.ts` (the browser notification, shared with reminders, nudges and check-ins),
`src/app/components/KeyWaitingMark.tsx` (the mark on the way in),
`src/app/components/CasesIcon.tsx`, `src/app/components/SpeakerIcon.tsx`,
`src/app/caseTiming.ts` (the six seconds), `src/app/caseTones.ts` (each quarter's colour), `src/app/caseSound.ts` (the noise, made up on the spot),
`src/app/caseLabels.ts` (wording), `src/styles.css` (the cabinet, the crate's breathing and
unlocking, the screen, the cards, the starburst, the flash, the rings),
`src/app/view.ts` (the page and its address), `src/app/viewIcons.ts`,
`src/app/components/SideNav.tsx`, `BottomNav.tsx`, `RewardsNav.tsx` (the way in, and the mark),
`src/app/components/RewardsPage.tsx` (where the points stand),
`src/app/components/RewardRulesPage.tsx` (the settings' place),
`src/app/rewardLabels.ts` (the ledger row), `src/app/TasksScreen.tsx`,
`src/storage/rewardSchema.ts`, `rewardRepository.ts`, `firestoreRewardRepository.ts`,
`localRewardRepository.ts` (the settings), `src/storage/caseDeviceRepository.ts`,
`caseDeviceSchema.ts`, `localStorageCaseDeviceRepository.ts`, `deviceStorage.ts` (what this device
keeps) — see [Storage](storage.md).
**Tested in:** `src/core/cases.test.ts`, `src/core/caseKind.test.ts`, `src/app/useCases.test.ts`, `src/app/components/KeyTimer.test.tsx`, `src/app/caseReel.test.ts`,
`src/app/components/CaseOpening.test.tsx`, `CasesPage.test.tsx`, `CasesSettingsCard.test.tsx`,
`SettingsList.test.tsx` (the practice switch),
`src/storage/rewardSchema.test.ts`, `src/storage/caseDeviceSchema.test.ts`,
`src/app/components/RewardsPage.test.tsx` (where the points stand),
`RewardRulesPage.test.tsx` (the settings' place), `src/app/components/SideNav.test.tsx`,
`BottomNav.test.tsx`, `RewardsNav.test.tsx` (the way in), `src/app/useView.test.ts` (the address),
`src/storage/backupFile.test.ts` and `backupRepository.test.ts` (the settings in a backup).
