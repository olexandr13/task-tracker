# Cases

A cleared day earns **Payday**. Another case, the **Drop**, arrives once a day, at a random time.
A third, **Weekly**, is ready on Monday and planned on every other day. The three pay different
ranges (CHST-10). **Payday** pays any whole number from the points of the cheapest task finished
today up to half of what today's tasks earned plus the tasks finished today without points. The
**Drop** pays any whole number from 0 up to yesterday's average task plus every task finished
yesterday. **Weekly** pays any whole number from the points of the cheapest task finished last
week up to last week's average task plus every task finished last week. A task finished without
points adds to a case's most only while **Count unrewarded tasks** is on, on Settings (CHST-32).
Each amount in a case's own range is as likely as any other.

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
  **nothing on it earns nothing**: there was nothing to clear. **However small** a cleared day is,
  it earns the key; there is no number of tasks it has to reach. How much Payday then pays is what
  keeps a small day small (CHST-10): a day of one task pays exactly that task's points, with no
  gamble in it, and a bigger day is what opens the range up.
- **CHST-4** It is **one a day**, however much more is finished after it. The ledger names what was
  earned by the task and the day together, and Cases is recorded under a name of its own, so the
  one record **is** the day's opening: two devices seeing the same one count it once.
- **CHST-5** **Opened stays opened.** Anything that leaves Today unclear again — unticking a task,
  adding one Today shows — takes the *Today bonus* back (RWD-26) but never what Cases gave, and
  never hands the day's key back either. The lid was opened; that is the whole of it. A case is a
  moment rather than a balance, and there is no undoing a moment.
- **CHST-6** Changing how Cases counts (CHST-32) only affects **cases from then on**, as
  changing a task's reward only affects completions from then on (RWD-3). A case already opened
  keeps what it gave.

## What a case pays

- **CHST-7** What Payday halves is **what the tasks finished that day earned**, as the ledger has
  it. A bonus paid that day (RWD-25) is not a task and is **left out**, so the bonus for clearing
  Today does not also raise the case that clearing earns. It is not typed and not chosen, and it
  grows with the day: every task finished before Payday is opened can raise what that case pays.
- **CHST-8** Cases' own opening is **left out** of what any case is worked out from: it cannot
  be part of the sum it was drawn from, and the Today tile goes on to count it once it is open.
- **CHST-9** Payday and Weekly are never asked to pay less than **1**; the Drop's least is **0**
  (CHST-11). A case's most is never under its least. A day that earned nothing yet, or a previous
  week with no tasks, pays 1 rather than nothing; a yesterday with no tasks pays 0.
- **CHST-10** Each case pays **any whole number from its least to its most, every one of them as
  likely as any other**. There are no tiers and no table. A task **with points** is one that
  earned some on that day, as the ledger has it, even if it has since gone to the trash; a task
  **without points** is one finished that day that earned nothing — a task given points only after
  it was done among them, that completion having earned none. A task without points is never
  the cheapest and never in an average, but it is **counted** wherever a case counts tasks — while
  the account counts them at all (CHST-32); switched off, every case below counts only the tasks
  with points, and Payday adds none. The
  **average task** is what the tasks with points earned, divided by how many they were, the
  remainder dropped, and 0 where there were none; a bonus is not a task, so it is not in it. A
  task is one completion: the same task written twice on a day is one, and a task finished on two
  days is two.
  **Payday**, earned by finishing everything in Today, runs from the **points of the cheapest task
  finished today**, or **1** where no task today has points, up to **what today's tasks earned
  divided by 2**, the remainder dropped, **plus the number of tasks finished today without
  points**. A bonus is not counted (CHST-7). Where that most is less than the
  cheapest task — a day of one task is the usual one — the case pays **exactly** that task's
  points, so it never pays less than the cheapest task.
  The **Drop**, the one that arrives at a random moment, runs from **0** up to **yesterday's
  average task plus the number of tasks finished yesterday**, with points and without. Yesterday
  with no tasks pays 0.
  **Weekly**, ready on Monday and planned until then (CHST-30), runs from the **points of the
  cheapest task finished in the previous week**, or **1** where no task that week had points, up
  to **that week's average task plus the number of tasks finished that week**, with points and
  without. A previous week with no tasks pays 1.
  Last week's done tasks are loaded as the app opens, so tasks without points are all counted
  (STORE-55).
- **CHST-32** Whether a task finished **without points** adds to what a case can pay is the
  account's to say, with a switch on **Settings**, under the **Cases** switch in Features (FEAT-10):
  **Count unrewarded tasks**, *Each
  task done without points adds 1 to the most a case can pay.* It is **on** to begin with, which is
  how every case was worked out before there was a switch. **Off**, such a task adds nothing
  anywhere: Payday runs up to half of what today's tasks earned and no further, and the Drop and
  Weekly add one for each task **with points** only. The averages are of tasks with points either
  way, and the least a case pays does not change, so a day of tasks without points alone still
  gives Payday's 1 and an empty Drop. Every line that says how a case is worked out — under a
  ready case (CHST-26) and behind the **i** on Cases (CHST-22) — names only
  the tasks that are counted. It is kept in the account (STORE-48), so it travels
  with the account, and like that it only changes cases not yet opened (CHST-6). Until the
  account's settings have arrived, *Loading…* stands in place of the switch, so a press
  cannot save the starting settings over the ones the account holds. Some work earns nothing on
  purpose — a habit kept for itself, a chore not worth pricing — and someone who prices everything
  they care about may not want it inflating a case.

## What a case holds

- **CHST-11** **Payday and Weekly are never empty**: the least they give is 1 point. An app that
  fights procrastination must not answer a cleared day, or a week of work, with nothing, however
  good a gamble that would make it. The **Drop** can be empty: its least is **0**. It is not earned
  by clearing anything, and a yesterday with nothing done is worth nothing. An empty Drop opens as
  any other, and writes *0* to the ledger: nothing gained has no sign.
- **CHST-28** The page shows **three cases** until the day ends (CHST-30). The cards share their
  rows, so the names stay level. A possible win sits inside a ready case, above the crate. While any
  case is ready, every case keeps that band, so the crates stay level. The three sit in a row once there is room; on a narrow screen Weekly wraps
  under the other two.
  **Payday** is earned by finishing everything in Today, and the **Drop** arrives at a random
  moment; each pays inside a range of its own (CHST-10). A ready case says that rule under it. While a case is planned and not yet
  available — Today still has work left, the Drop's moment has not come, or Weekly is waiting for
  Monday — it is shown **half transparent**, its crate **grey**, and a **padlock** on the crate
  says when it will be ready (CHST-31). A planned Payday says how many tasks are left. A planned
  Drop carries a small **timer** on it, counting down in hours and minutes, until that moment
  arrives and the case is ready (CHST-29). A planned Weekly carries a timer too, counting down to
  Monday (CHST-30). A case that has been opened stays until the end of the day, with its
  **lid open** and the picture **dimmed**, and it is not a button. Across the dial, where a planned
  case has its padlock, a dark tag with a green tick reads **Opened**, so the case reads as had today
  rather than merely faint. Only a ready case has a line under its name; a planned or opened one
  has its name alone. When each case comes is said behind the **i** (CHST-22).
  The next day the opened case is gone, and Weekly is planned again until the following Monday. An
  empty day plans no Payday. Pressing a ready case opens it. The big cabinet is not on
  the page until then: it appears for that opening, plays it, and leaves a moment after the show
  has finished (CHST-25). A case is not chosen
  first, and none is drawn with a frame around it.
- **CHST-31** A case still on its way is **locked**, and says **when it will be ready** on the
  crate itself. Its crate loses its colour and fades, so it reads as shut rather than merely faint
  beside a ready one, and across the dial sits a dark tag with a **padlock** and what will open it,
  which stays solid while the rest of the case is half transparent. **Payday** says how many tasks
  are left: *3 tasks left*, *1 task left*. That is the tasks in Today still to be finished. It changes as tasks are
  ticked off and has no clock: Payday is earned, not waited for. The **Drop** reads *Arrives in
  2h 15m* (CHST-29) and **Weekly** *Arrives in 5d 16h* (CHST-30). Each is drawn light on dark
  whatever the theme (CHST-25). The moment a countdown runs out, the padlock goes with it. A case
  ready or opened has no padlock and keeps its colour; an opened one is tagged *Opened* in the
  padlock's place (CHST-28).
- **CHST-26** A **ready** case says **what it can give**, as a line headed **Possible win** inside
  the case, above the crate: *4–20 points* where that is Payday’s range, *1–7 points* for the Drop, marked
  out in gold, or *0–7 points* where the Drop can come up empty. Under a ready Payday and Weekly the
  rule is written out: *From the cheapest task today, up to half of today’s task points plus
  today’s tasks without points.* and *From the cheapest task last week, up to last week’s average task plus
  last week’s tasks.* While tasks without points are not counted (CHST-32), Payday's reads *From
  the cheapest task today, up to half of today’s task points.*, and Weekly's ends *tasks with points.*
  Under a ready Drop is a nudge instead of its rule: *Earn more points today to get a bigger reward
  tomorrow.* A case that
  is only planned has **no** possible win, including when it would only have read *1 point*.
  Neither does one already opened. In
  practice every case is ready, Weekly included, and there is no timer: each runs from 1 up to the number typed
  just below (CHST-21). While a case is ready and that range is a single point, its line reads
  *1 point*. How the points stand says what today has earned (RWD-20). The **i** on Cases says
  how each case is worked out (CHST-22).

## Opening it

- **CHST-13** **A ready case is the button** — the whole of its card takes the press — and **Enter**
  or **Space** on it opens it too. There is no frame to mark one chosen, no lever to drag and
  nothing to confirm: a key is spent the moment the case is pressed, and the big cabinet appears
  already opening, under the cases. The page scrolls it into view, clear of the bottom bar, so on
  a phone the opening is not left playing below the fold. Shut, that cabinet is a **supply crate** — cream enamel over a teal
  body, chipped at the corners, a band of hazard stripes where the lid meets it, a latch each side
  and a **dial lock** in the middle. What tells a key is there, before a word is read, is the ready
  case itself: solid, in colour, and a button, where a case still on its way is half transparent,
  grey and padlocked (CHST-28, CHST-31).
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
  (CHST-28). An unfinished Today says nothing under Cases. A case that can still be opened is
  **never dimmed out of reach**: a dimmed crate cannot say why it is dim. An opened one is dimmed
  because the day has already had it, and the line under it says when the next one of that kind appears.
- **CHST-18** Asked for **less motion**, the card is out **at once**, with the number already on
  screen: no breathing, no dust, no unlocking, no reel, no flash or rings, nothing thrown, no
  counting. The card and its light are still there; they simply do not arrive. The wait goes with the movement, there being
  nothing to watch it for. The result stays about two seconds, long enough to be read, and then the
  cabinet **fades out** rather than switching off (CHST-25).
- **CHST-19** Cases **makes a noise**, and it is meant to sound like heavy things in a big room
  rather than a toy: every impact is a low thump under a strike of metal, and all of it has a little
  room round it. A clunk, the ratchet of the dial and a clank as it stops; the latches either side
  and the long hiss of the seal; the thump, buzz and crackle of a tube warming up; under the reel a
  **low drone** whose tone opens and whose pulse quickens as it slows, with air rising under the
  last of it, and a **click for every card** that crosses the marker; a heavy catch as the reel
  stops and a breath drawn in through the beat; and as the card comes out a **boom**, a rush of air
  and a swept **chord** that is taller and longer for a higher quarter, with **bells** rising from
  the second quarter up and, for the top quarter, a second hit and a long shimmer. The counting clicks over
  like a counter's wheels. As the cabinet goes, the switch snaps and the tube winds down. Turning the sound off in the middle of the show stops it there and then. A **speaker button in the
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
  Once the show has finished, the result stays **a second more**, to be read, and then the cabinet
  **switches off** as an old set does: a flare, the picture squeezed to a line of light, the line
  drawn in to a dot and the dot gone, with the number under it drawn up into it. Then the room it
  took on the page **closes up**, so what is under it rises rather than jumps. Where the show had
  no wait, the result stays about two seconds before the cabinet goes (CHST-18). A case pressed
  while the cabinet is going starts its own show at once. While a case is still ready, the cabinet
  stays off the page until that case is pressed (CHST-13). An opened case remains in the row until
  the day ends (CHST-28).

## Practice

- **CHST-21** **Practice mode** is for seeing how Cases goes without waiting for a day to
  clear. Its switch is on **Settings**, under the **Cases** switch in Features (FEAT-10), after
  **Count unrewarded tasks** (CHST-32), rather than on Cases' page: it
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
  **C** opens it from anywhere (UI-72). An **i** at its head (UI-73) says **how each case
  works**, in general and without anyone's numbers, one case at a time (CHST-10), in a sheet
  headed **How each case works**. Each case is a **card** of its own, banded down its side in
  the case's colour as its card on the page is (CHST-28), with the case's name at the top and,
  under it, **When**, **Min** and **Max** as small labels beside what each one is. The ÷ and + in
  a rule are drawn heavier than the words between them, so the sum reads at a glance. This is the
  one place that says when a case comes: the cards on the page do not (CHST-28). Payday's When is
  *Finish everything in Today to get this case.*, with **Today** set in bold; the Drop's *Arrives
  once a day, at a random time.*; Weekly's *Appears weekly on Monday.* Payday's Min is *Cheapest
  task finished today (only tasks with reward count)* and its Max *Half of today’s task points
  (bonuses don’t count) + number of tasks done today (only tasks without reward)*. The Drop's Min
  is *0* and its Max *Yesterday’s average task points (only tasks with reward count) + number of
  all tasks done yesterday*. Weekly's Min is *Cheapest task finished last week (only tasks with
  reward count)* and its Max says the same as the Drop's of *last week*. **Each part of a Min or
  Max says which tasks it takes**, so an average of the tasks with points is never read as a count
  of every task; nothing is set under it. While tasks without points are not counted (CHST-32), Payday's Max is *Half of today’s task
  points (bonuses don’t count)*, and the Drop's and Weekly's count reads *number of tasks done
  yesterday (only tasks with reward count)*, of *last week* for Weekly, in place of *all*. Nothing follows the three cases. The page itself holds the cases (CHST-28), what each can give while a key is waiting
  (CHST-26), the cabinet once a case is opened, what today's cases gave (CHST-33), and, while
  practice mode is on, how the practice run is going (CHST-21); whether tasks without
  points count (CHST-32) and practice mode are switched on Settings. While a key is
  waiting, Cases is **marked wherever it is reached from** —
  its entry in the sidebar, its pill in the phone's strip, the Rewards tab and its entry in that
  tab's menu (UI-67) — with a dot and the
  words behind it, a mark that is only a colour saying nothing to someone who cannot see it.
- **CHST-33** Under the cases, the page says **what each case opened today gave**, in a list
  headed **Opened today**: a row for each, its name and what it gave as the ledger spells it —
  *Payday +14*, *Drop 0* — banded down its side in the case's colour as its card is (CHST-28).
  The rows go in the cases' own order, Payday, the Drop, then Weekly: the ledger keeps which case
  gave how much, not when (RWD-44). It is **today's only** — every day's is on History (RWD-38),
  which is where a row is deleted; here there is nothing to press. With nothing opened yet today
  there is no list. What an opening gives is written the moment its case is pressed (CHST-16),
  but its row **waits for the reel to stop**, so the list never says first what the show is
  about to; one opened on another device, or before a reload, is simply there. Practice opens
  every case afresh (CHST-21), so while it is on the day's openings are not listed.
- **CHST-23** The moment the day comes clear, the app **says so**: *Today is clear. Payday is
  waiting.*, with **Open Cases** beside it, at the top of the window. Said **once a day on this
  device**, and dismissed either by going or by its ×. It is Payday: the Drop arriving
  on its own is said separately (CHST-29), and so is Weekly on Monday (CHST-30). The last task going is the moment Cases
  is worth most, and a key found a day later is a key half wasted. How the points stand says it too
  (RWD-20): what the key plays for, and whether it is waiting or already spent.
- **CHST-29** The Drop's moment is **the account's own**: worked out from the day and the account,
  somewhere between 06:00 and 21:59. Every device signed into the account waits for the same moment,
  and another account waits for another one. Nothing is saved for it, and it is a different moment
  each day. While today's Drop is still on its way, its timer **counts down** in hours and
  minutes, with no seconds: *2h 15m*, then *45m*. The minutes are rounded up, so the last minute
  reads *1m* until the case arrives. An opened Drop does not count toward tomorrow's: that
  moment is not shown before its day. The
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
  is **planned**: half transparent, grey, not a button, with no possible win, and with a **timer**
  on its padlock (CHST-31),
  counting down to midnight on Monday — in days and hours while a day or more is left, *5d 16h*,
  then in hours and minutes as the Drop's is (CHST-29). As Monday begins, the timer goes and the
  case is ready. It pays from
  the cheapest task finished in the previous week — Monday to Sunday, the week just closed — up to
  that week's average task plus the number of tasks finished that week (CHST-10). A ready Weekly says
  that rule under it, and what it
  can give. Once opened it stays until Monday ends. The next day it is planned again. The app **says so** once that Monday on this device,
  while Weekly is still to open: *Weekly is here.*, with **Open Cases** beside it, dismissed by going
  or by its ×. Opening the app on Monday says it, the case having been there since midnight. It is
  not said again once dismissed, and it is not said on any other day. While Cases is switched off
  the notice stays off with it; turning Cases on while Weekly is still to open says it then.
  There is no browser notification: it does not arrive in the middle of the day.
- **CHST-24** What Cases keeps on this device, rather than in the account: whether it **makes a
  noise here**, which opening it is **still glowing from** — which quarter of the jackpot it came to
  — whether it has **already said here** that a key is waiting, and whether it has **already said
  here** that Weekly is here (STORE-49). Whether it counts tasks without
  points (CHST-32) is the account's (STORE-48) — how someone wants to be paid travels with them — but the room you are
  in is not, a
  notice given on the laptop is no reason to withhold it on the phone, and the ledger says what
  Payday, the Drop or Weekly gave without saying which colour it gave it in, that being the show rather than the
  record.

---

**Where it lives:** `src/core/cases.ts` (what an opening draws, each case’s range, which quarter of it an
amount is, whether a key is waiting, and what today's cases gave), `src/core/caseKind.ts` (how a range is spread), `src/app/useCases.ts` (Cases as its page reads it, and
the one way to open it), `src/app/useCaseKey.ts` (watching the Drop arrive), `src/app/components/KeyTimer.tsx` (the countdown on it, and on Weekly), `src/app/components/CaseLock.tsx` and `LockIcon.tsx` (the padlock on a case still on its way), `src/app/components/CasesPage.tsx` (the page, and what today's cases gave), `src/app/components/CaseCards.tsx` (the cases),
`src/app/components/CaseOpening.tsx` (the opening), `src/app/components/CaseArt.tsx` (the crate),
`src/app/components/CaseReel.tsx` (the screen, the reel, the cards and the card once it is out),
`src/app/caseReel.ts` (the reel built round an opening, the near miss, and when each card ticks),
`src/app/components/CaseBurst.tsx` (what is thrown off the card),
`src/app/components/CaseRange.tsx` (the possible win inside a case),
`src/app/components/CasesSettings.tsx` and `SettingsList.tsx` (counting tasks without points, and the practice switch, under Cases on Settings),
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
`src/app/rewardLabels.ts` (the ledger row), `src/app/TasksScreen.tsx`,
`src/storage/rewardSchema.ts`, `rewardRepository.ts`, `firestoreRewardRepository.ts`,
`localRewardRepository.ts` (the settings), `src/storage/caseDeviceRepository.ts`,
`caseDeviceSchema.ts`, `localStorageCaseDeviceRepository.ts`, `deviceStorage.ts` (what this device
keeps) — see [Storage](storage.md).
**Tested in:** `src/core/cases.test.ts`, `src/core/caseKind.test.ts`, `src/app/useCases.test.ts`, `src/app/components/KeyTimer.test.tsx`, `src/app/caseReel.test.ts`,
`src/app/components/CaseOpening.test.tsx`, `CasesPage.test.tsx`,
`SettingsList.test.tsx` (counting tasks without points, and the practice switch),
`src/storage/rewardSchema.test.ts`, `src/storage/caseDeviceSchema.test.ts`,
`src/app/components/RewardsPage.test.tsx` (where the points stand),
`src/app/components/SideNav.test.tsx`,
`BottomNav.test.tsx`, `RewardsNav.test.tsx` (the way in), `src/app/useView.test.ts` (the address),
`src/storage/backupFile.test.ts` and `backupRepository.test.ts` (the settings in a backup).
