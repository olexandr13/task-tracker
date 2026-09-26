# Rewards

Points: what a task is worth each time it is done, what was earned, what it was spent on, and what
it is all worth. A reward is set on a task; clearing a whole period earns a bonus of its own; and
the **wishlist** says what the points are being saved up for. What completions earn is kept in a
ledger of its own, so earned stays earned whatever becomes of the task afterwards.

## The reward

- **RWD-1** A task earns **nothing until it is given a reward**, and no task has one to begin with.
  A reward is a **whole number of points from 1 to 999**, earned on each completion.
- **RWD-2** A new reward **starts at what the task's rule is worth**. Daily is **1**, and so is a weekly
  rule on all seven days, which reads "Daily" (RPT-25). Weekly is **5**, monthly is **25**, and a
  task that happens once is **1**. It is where **+** lands when stepping up **from 0** in the panel
  (RWD-5). The star itself always gives **1**.
- **RWD-3** Changing or removing a reward only affects **completions from then on**. What earlier
  completions earned stays as it was (RWD-13).
- **RWD-4** A duplicated task carries the reward of the original (TASK-51).

## Setting a reward

- **RWD-5** The **star button** on a row opens the reward panel. It is tinted while the task has a
  reward (UI-26); a task with none shows no star until its row is woken (UI-18). The panel is a number with **−** and **+** beside it and nothing to confirm. **0 is
  no reward**. **Clicking the star of a task without a reward gives it 1 point** at once, whatever its
  rule, and opens the panel on it; opening the panel of a task that has a reward changes nothing.
  **+** from 0 gives the rule's starting amount (RWD-2); typing a number gives that.
- **RWD-6** **Every step and every number typed is saved as it is made**, as in the other pickers
  (RPT-22). Past 1, **−** and **+** move by one. **Stepping down to 0 or typing 0 takes the reward
  away**, and **−** stops there. A number that is neither 0 nor a reward is not saved, and the box goes
  back to what is saved on leaving it. Enter closes the panel, as do a click outside and Escape
  (UI-9, UI-10).
- **RWD-7** The star sits in a slot of its own after the clock (UI-27). A woken row spells the
  reward out under it: `+5`.
- **RWD-8** On a phone the row's line has no room for the star *button*, so the sheet a tap opens
  (UI-48) has it, in its row of icons (UI-63) — tinted when there is a reward, spelled out as `+5`
  in the line under them, named **Reward** by that row's **i** — and it opens the same panel; a
  resting row still shows the star as a mark when a reward is set (UI-50).

## Earning

- **RWD-9** **Every completion earns the reward.** A repeating task earns once for **every
  occurrence it is done**: a daily task done on seven days earns seven times, and a weekly one
  earns each week it is done. A task that happens once earns once. This is unlike the progress
  bars, which count tasks rather than occurrences (PROG-3).
- **RWD-10** A completion earns the reward the task has **when it is done**, on the day it is done
  for. A task without a reward earns nothing, and giving it one later does not earn for what was
  already done.
- **RWD-11** **Taking a completion back takes back what it earned**, whatever the reward is now. That
  covers unticking the box, unticking a checklist item or adding one to a finished task (CHK),
  and clearing a day on the Habits page (HAB-16). Marking an earlier day done on the Habits page
  earns for that day.
- **RWD-12** **A change of rule is not a completion.** Giving a task a rule, changing its rule or
  dropping it earns and takes back nothing, even where it changes which days read as done
  (RPT-13, RPT-14, RPT-30).
- **RWD-13** **Earned stays earned.** Changing or removing a reward, renaming the task, deleting it,
  and the trash purging it (TRASH) all leave what its completions earned in place.
- **RWD-14** A task earns at most once for a day. Completing, reopening and completing again the
  same day leaves one completion's worth, and two devices recording the same completion count
  it once.

## Clearing a period

- **RWD-24** Clearing **Today** earns points of its own: a **bonus**, one amount for the whole
  account rather than anything a task carries. It is a **whole number of points from 1 to 999**,
  and there is none to begin with — nothing earns a bonus until one is set (RWD-26). A task's
  reward pays for the task; this pays for the day.
- **RWD-25** The bonus is earned the moment **everything Today asks for is done** — when Today's
  bar reads 100% (PROG-3) — and is earned **for that day**, beside whatever the task itself earned.
  Any way the day comes to be clear earns it: the last open task ticked off, finished through its
  checklist, or leaving Today by being deleted or put off. A day with **nothing on it earns
  nothing**: there was nothing to clear.
- **RWD-26** It is earned **once a day**, however many more tasks are finished after it. **Anything
  that leaves Today unclear again takes it back** — unticking a task, or adding one Today shows — and
  clearing the day again earns it again. Taking back takes the whole of what that day was given,
  whatever the bonus is now (RWD-11). Only **today's** bonus is ever reached: what an earlier day
  earned stays as it was (RWD-13). As with every other earning, the device that makes the change
  records it (STORE-25).
- **RWD-27** The bonuses are set on **Rules** (RWD-39), with the same star panel a task's reward
  uses (RWD-5, RWD-6): **0 is no bonus**, every step and number typed is saved as it is made, and
  **+** from 0 gives **5** for Today, **20** for the week and **50** for the month — a longer
  stretch asks more. Changing one or taking it away only affects **periods from then on**; with no
  bonus set, clearing that period earns nothing and nothing is taken back.
- **RWD-28** A bonus is a row of the ledger like any other (RWD-23), named **All of Today done**,
  **All of this week done** or **All of this month done** rather than for a task, deleted the same
  way, and counting the same way towards the balance and the period tiles (RWD-17, RWD-21).
- **RWD-29** **This week** and **this month** have bonuses of their own, each its own amount, each
  earned and taken back by the rule above (RWD-25, RWD-26) asked of that period's bar rather than
  Today's (PROG-3). One change can earn all three at once: the last task of a month that is also the
  last of the week and of the day. A week's or a month's bonus is earned **on the day it came
  clear**, which may be any day inside it, and is taken back off that day wherever in the period it
  was — so a week cleared on Wednesday and unpicked on Friday loses what Wednesday was given. What
  an earlier week or month earned is never reached (RWD-13).

## Redeeming

- **RWD-15** Points are spent by **redeeming** them: a whole number of points, from 1, and **what
  for**. A note is required, up to 200 characters, trimmed at the ends. Redeem, or Enter, records it
  and clears the form. The form is at the foot of **Prizes** (RWD-36), under **Something else**:
  redeeming a prize or a wish is the same record with its name written in it for you.
- **RWD-16** **Nothing is spent that has not been earned.** Redeem stays off while the points asked
  for are more than the balance, with a line saying how many points there are. With no points at
  all, the form says there is nothing to redeem yet.
- **RWD-17** The **balance** is everything earned less everything redeemed. Taking back a
  completion whose points were already spent can take it **below zero**, and it is shown as it is.
  What was spent is not rewritten.
- **RWD-18** Redemptions are listed on **History** among the earnings (RWD-38), **most recent
  first**. Each row shows its day (Today, Yesterday or a short date), what it was for and its points
  as **−3**. The **×** beside one deletes it **at once**, and its points go back to the balance; for
  a few seconds a toast offers to undo (UI-38, TRASH-3). Deleting a redemption does not put back a
  wish it bought: undoing the redemption as it is made is how that is done (RWD-41).

## Prizes and the wishlist

- **RWD-40** What points are spent on comes in **two kinds**, on two pages of their own (RWD-30).
  **Prizes** are the small things, as often as they can be afforded — a square of chocolate, a
  coffee, five minutes of scrolling: redeeming one **leaves it exactly where it was**, to be
  redeemed again tomorrow. The **wishlist** is the big ones, bought once — a phone, a bicycle, a
  trip: buying one **takes it off what the points can buy**. A bought wish stays listed at the end
  of the list, struck through and marked **Bought today** (or the day it was bought), with nothing
  to redeem and nothing to change; the **×** still takes it off the list, and what it was bought
  with stays in the history either way (RWD-38).
- **RWD-33** Each one is a **name** — up to 60 characters, on one line — and a **price**, a whole
  number of points from 1. There are none of either to begin with. No two can share a name,
  whatever its case and whichever list they are on, so there is never a second Chocolate to wonder
  about; the box says **There is a prize called that already.** rather than making one.
- **RWD-34** One is **changed in place**: the pencil beside it opens its name and its price
  together, Enter or leaving them both keeps the change, Escape gives it up. The **×** takes it off
  its list, asking first, since there is nothing to undo it from. Renaming, repricing or deleting
  one **never rewrites what it was already redeemed for**: that redemption keeps the name and the
  points it was made with, as a completion keeps what it earned (RWD-3, RWD-17).
- **RWD-35** Each list shows **what can still be bought first, cheapest first**, then by name, so
  what is within reach heads the list and what is being saved up for follows it. What has been
  bought comes last.
- **RWD-36** **Redeem** beside one spends its price on its name, there and then. It is **off while
  the balance does not cover it** (RWD-16), and the row says how many points are still to earn —
  `4975 to go` — and off for a wish already bought. Under the **Prizes** list, **Something else**
  is the plain redeem form (RWD-15), for a treat that is not worth writing down; the wishlist has
  none, a wish being something you write down first.
- **RWD-41** Redeeming **says so**: a toast names what the points went on and how many they were —
  `Redeemed “Chocolate” for 20 points` — and offers to **undo** for a few seconds (UI-38), which
  gives the points back and puts a bought wish back among what can be bought. Without it a click
  would look like nothing happening, since a prize's row is meant not to change.
- **RWD-37** Each list opens with **what there is to spend**, and how the points stand (RWD-30)
  says what that reaches: for the prizes, **Within reach:** the ones the balance covers; for the
  wishlist, **Saving up for** the cheapest one it does not, with how far off it is. With neither
  list started it offers to name something instead.

## What a point is worth

- **RWD-31** A point can be given a **value in money** — `1 point = 1 UAH` — set on **Rules**
  (RWD-39): an amount of more than nothing, to two decimal places, and a currency of up to 8
  characters, written however it is written. There is none to begin with. Both boxes are saved as
  they are typed, once they say something that can be a rate; a box left saying anything else goes
  back to what is saved. The **×** forgets the rate again.
- **RWD-32** The value **counts nothing**. It changes no balance, no earning and no redemption — it
  only spells the points out in money beside them: the balance on how the points stand and on both
  lists, and each prize's and wish's price. With no value set, nothing says it and the points are counted in
  points alone. It is always the rate **as it stands now**, never the rate a point was earned at.

## The Rewards pages

- **RWD-19** **Rewards** has its own entry in the sidebar, with its three pages indented under it
  and a chevron that **folds them away** as Lists folds its lists (UI-30, LST-26); folded, Rewards
  itself is marked wherever you are under it, and open, each page is marked on its own. On a phone it
  has a **tab of its own** in the bottom bar, marked on any of its pages (UI-32) — it is no
  longer under **More** (UI-45). Pressing **R** opens it from anywhere (UI-57), on how the points
  stand.
- **RWD-20** **Rewards** itself is **how the points stand**, top to bottom: a line on how points are
  earned; the **balance**, with what it is worth in money where a point has a value (RWD-32); what
  was **earned** in each period (RWD-21); **Finish everything, earn extra** — the three period
  bonuses **side by side in one row**, each its amount and where it stands: `+5 earned`,
  `+20 all done = earned`, or `— no bonus` — under a line saying what the bonus is
  (RWD-27, RWD-29); and what the balance reaches on each list (RWD-37). Nothing is spent or set
  here. None of the five pages has a box for adding a task, or a rail (UI-2).
- **RWD-30** Rewards is **five pages**: **Rewards** itself (RWD-20), **History** (RWD-38),
  **Prizes** and **Wishlist** (RWD-40) and **Rules** (RWD-39). Their addresses are `#/rewards`,
  `#/rewards/history`, `#/rewards/prizes`, `#/rewards/wishlist` and `#/rewards/rules` (UI-36). On a wide screen they are
  reached from the sidebar (RWD-19); on a phone, which has no sidebar, a **strip of them runs
  across the top of whichever is open**, the one you are on marked. Each page answers one question:
  where am I, where did it all go, what can I have now, what am I saving for, and what earns it.
- **RWD-38** **History** is everything that happened to the points in **one run**, most recent
  first: what was earned (RWD-23) and what was spent (RWD-18) together, each row its day, what it
  was, and how many points it moved — **+5** earned, **−3** spent, told apart by the sign and a
  slight tint and no more, since they are one story. Within a day what was spent comes first. It is
  a page of its own rather than the foot of how the points stand: a year of days is a long page, and
  how you are doing should not be behind it.
- **RWD-39** **Rules** is what earns points and what they are worth: the bonus for clearing
  **Today**, **this week** and **this month** (RWD-27), and what a point is worth in money (RWD-31).
  What a *task* earns is not here — that is set on the task, with its star (RWD-5), being that
  task's own; everything on Rules is one amount for the whole account.
- **RWD-21** Points **earned** are shown on how the points stand, for **today**, **this week**
  (Monday to Sunday, PROG-2), **this month**, **this year** and **all time**, one tile each. Underneath is what was redeemed in
  that period, when anything was. A completion counts on the day it was done for, so an earlier
  day marked on the Habits page counts on that day. A redemption counts on the local day it was
  made. Completions of deleted tasks still count (RWD-13).
- **RWD-22** Until the ledger has loaded, each of the rewards pages says it is loading rather than
  showing zeros; a ledger the account **refused** says **Couldn’t load your points. Reload to try
  again.** in its place, for the same reason a task list that could not be loaded says so rather than looking empty
  (STORE-13). A balance of 0 means no points, never points unread.
- **RWD-23** Completions that earned points are listed on **History** among the redemptions
  (RWD-38), **most recent day first**. Each row shows its day (Today, Yesterday or a short date),
  the task's title — or what a period's bonus cleared (RWD-28) — and its points as **+5**. A task that has been purged still shows as **Deleted task** — earned stays earned
  (RWD-13). The **×** beside one deletes it **at once**, and its points leave the balance; for a few
  seconds a toast offers to undo (UI-38, TRASH-3). That does not reopen the task: undoing the
  completion is how that is done.

---

**Where it lives:** `src/core/reward.ts` (a task's reward, its starting amount, what a change earns
and takes back), `src/core/bonus.ts` (whether a period is clear, and what clearing it earns),
`src/core/prize.ts` (the prizes and the wishlist), `src/core/pointValue.ts` (what a point is worth),
`src/core/redemption.ts` (redeeming, the balance, the totals and the histories),
`src/app/components/RewardPicker.tsx` (the panel), `src/app/components/TaskItem.tsx` (the star on the
row), `src/app/components/RewardsPage.tsx` (how the points stand), `RewardsHistoryPage.tsx`,
`LedgerList.tsx` (the one run of rows), `PrizeListPage.tsx` (both lists), `RewardRulesPage.tsx`,
`RewardsNav.tsx` (the strip on a phone), `RedeemForm.tsx`, `RewardTotals.tsx`, `StarIcon.tsx`,
`GiftIcon.tsx`, `TrophyIcon.tsx`, `HistoryIcon.tsx`, `src/app/rewardLabels.ts` and
`src/app/prizeLabels.ts` (wording), `src/app/useUndoToast.ts` (what a toast says), `src/app/useTasks.ts`
(recording what a change earns), `src/app/useRewards.ts`, `src/app/usePrizes.ts`,
`src/app/storageProblem.ts` (what a refused load says), `src/app/useUndoToast.ts` (undo after
deleting an earning or a redemption), `src/app/TasksScreen.tsx`, `src/app/view.ts` (the pages
and their addresses), `src/app/components/SideNav.tsx` (the entry and its fold),
`src/app/components/BottomNav.tsx` (the tab),
`src/app/letterShortcut.ts` and `src/app/useLetterShortcut.ts` (`R` opens Rewards),
`src/storage/rewardRepository.ts`, `firestoreRewardRepository.ts`, `rewardSchema.ts`,
`prizeRepository.ts`, `firestorePrizeRepository.ts`, `localPrizeRepository.ts`, `prizeSchema.ts` —
see [Storage](storage.md).
**Tested in:** `src/core/reward.test.ts`, `src/core/bonus.test.ts`, `src/core/prize.test.ts`,
`src/core/pointValue.test.ts`, `src/core/redemption.test.ts`, `src/core/task.test.ts`,
`src/storage/rewardSchema.test.ts`, `src/storage/prizeSchema.test.ts`,
`src/app/useTasks.test.ts` (what a change records), `src/app/useRewards.test.ts`,
`src/app/usePrizes.test.ts`, `src/app/components/RewardPicker.test.tsx`,
`src/app/components/RewardsPage.test.tsx`, `src/app/components/PrizeListPage.test.tsx`,
`src/app/components/LedgerList.test.tsx`,
`src/app/components/RewardRulesPage.test.tsx`, `src/app/components/RewardsNav.test.tsx`,
`src/app/components/RedeemForm.test.tsx`,
`src/app/components/TaskItem.test.tsx`, `src/app/components/SideNav.test.tsx`,
`src/app/components/BottomNav.test.tsx`, `src/app/components/MorePage.test.tsx`,
`src/app/letterShortcut.test.ts` and `src/app/useLetterShortcut.test.ts` (`R` opens Rewards).
