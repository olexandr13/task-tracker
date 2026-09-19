# Rewards

Points: what a task is worth each time it is done, what was earned, and what it was spent on. A
reward is set on a task. What completions earn is kept in a ledger of its own, so earned stays
earned whatever becomes of the task afterwards.

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
  reward (UI-26). The panel is a number with **−** and **+** beside it and nothing to confirm. **0 is
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
- **RWD-8** On a phone the row's line has no room for the star, so the woken row has it on a line
  of its own below the tags (TAG-16). There it names the reward — `5 points` — or offers
  **Add reward**, and opens the same panel.

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

## Redeeming

- **RWD-15** Points are spent by **redeeming** them: a whole number of points, from 1, and **what
  for**. A note is required, up to 200 characters, trimmed at the ends. Redeem, or Enter, records it
  and clears the form.
- **RWD-16** **Nothing is spent that has not been earned.** Redeem stays off while the points asked
  for are more than the balance, with a line saying how many points there are. With no points at
  all, the form says there is nothing to redeem yet.
- **RWD-17** The **balance** is everything earned less everything redeemed. Taking back a
  completion whose points were already spent can take it **below zero**, and it is shown as it is.
  What was spent is not rewritten.
- **RWD-18** Redemptions are listed **most recent first**. Each row shows its day (Today, Yesterday
  or a short date), what it was for and its points. The **×** beside one deletes it **after asking**,
  and its points go back to the balance (UI-38).

## The Rewards page

- **RWD-19** **Rewards** has an entry in the sidebar, between Habits and Tags (UI-30). On a phone
  it is reached from the **More** tab's menu (UI-45), and More stays marked while it is open.
  Its address is `#/rewards` (UI-36).
- **RWD-20** The page is, top to bottom: a line on how points are earned; the **balance** with the
  **redeem form** (RWD-15); what was **earned** in each period (RWD-21); and what was **redeemed**
  (RWD-18). It has no box for adding a task and no rail (UI-2).
- **RWD-21** Points **earned** are shown for **today**, **this week** (Monday to Sunday, PROG-2),
  **this month**, **this year** and **all time**, one tile each. Underneath is what was redeemed in
  that period, when anything was. A completion counts on the day it was done for, so an earlier
  day marked on the Habits page counts on that day. A redemption counts on the local day it was
  made. Completions of deleted tasks still count (RWD-13).
- **RWD-22** Until the ledger has loaded, the page says it is loading rather than showing zeros.

---

**Where it lives:** `src/core/reward.ts` (a task's reward, its starting amount, what a change earns
and takes back), `src/core/redemption.ts` (redeeming, the balance and the totals),
`src/app/components/RewardPicker.tsx` (the panel), `src/app/components/TaskItem.tsx` (the star on the
row), `src/app/components/RewardsPage.tsx`, `RedeemForm.tsx`, `RewardTotals.tsx`,
`RedemptionList.tsx`, `StarIcon.tsx`, `src/app/rewardLabels.ts` (wording), `src/app/useTasks.ts`
(recording what a change earns), `src/app/useRewards.ts`, `src/app/TasksScreen.tsx`,
`src/storage/rewardRepository.ts`, `firestoreRewardRepository.ts`, `rewardSchema.ts` — see
[Storage](storage.md).
**Tested in:** `src/core/reward.test.ts`, `src/core/redemption.test.ts`, `src/core/task.test.ts`,
`src/storage/rewardSchema.test.ts`, `src/app/useTasks.test.ts` (what a change records),
`src/app/components/RewardPicker.test.tsx`,
`src/app/components/RedeemForm.test.tsx`, `src/app/components/RedemptionList.test.tsx`,
`src/app/components/TaskItem.test.tsx`, `src/app/components/SideNav.test.tsx`,
`src/app/components/BottomNav.test.tsx`.
