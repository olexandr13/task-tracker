# Plan — Weekly quests (gamification idea 8)

## Context

Points and bonuses reward the same things every week. Quests give each week up to three fresh
challenges, built from the owner's own data, so there's a new reason to push beyond the usual.

**Owner's decision (2026-10-11):** a met quest is **claimed with a button** for its points; it isn't
paid automatically.

## Ground to build on

- The **whole reward ledger** is loaded on open. **Tasks are held from `historyStart`** (start of
  last week or month, STORE-55, `src/core/history.ts`), so this week and last week are complete.
  Repeating tasks are always held.
- The period-bonus pattern to copy: `withPeriodBonuses`, `bonusEarned`, `BONUS_IDS` and the private
  `isWithinPeriod` in `src/core/bonus.ts`. A non-task id plus a day inside the period is the record.
- Non-task ledger rows must be left out where "tasks" are counted (`isBonus`, `isCaseEarning` in
  `src/core/cases.ts` / `caseKey.ts`). Add **`isTaskEarning(taskId)`** in core if the Badges plan
  hasn't already, and include the quest ids in it.
- Deterministic per-account hash: the private `hashText` in `src/core/caseKey.ts` (FNV-1a). Move it
  to `src/core/hash.ts` and export it.
- Week totals per category: `balanceTotals(categories, tasks, 'week', now)` in `src/core/balance.ts`.
  "Logged in full" days: ACT-18 (`src/core/activity.ts`). Journal lines: `src/core/journal.ts`.
- A setting stored like `newTaskReward`: `PointsLedger` / `RewardRepository`
  (`src/storage/rewardRepository.ts`), `rewardSchema.ts`, `firestoreRewardRepository.ts`,
  `localRewardRepository.ts`, `RewardRulesPage.tsx`.
- Undo after an action: `useUndoToast` (`src/app/useUndoToast.ts`). The waiting dot: the case-key
  dot (CHST-22).
- New account collection checklist (AGENTS.md): `ACCOUNT_COLLECTIONS`, `firestore.rules`, schema +
  version, repository interface with Firestore and local implementations, `createAccountStorage`,
  the backup files, `backupLabels.ts`, `guestImport.ts`.

## Core — `src/core/quest.ts` (+ test)

- The `QuestKind` pool for v1. Each kind has `eligible(input)`, `target(input)` and
  `progress(input, now)` → `{ have, need }`:
  - `tasks`: finish N tasks this week. N = last week's count × 1.1, rounded up, at least 5.
  - `overdue`: finish N tasks after their due day. N ≤ 3, and only if some are overdue at the start
    of the week.
  - `oldTask`: finish a task that waited 14+ days, only if one exists.
  - `habitDays`: keep every habit on N days this week (Habits on, at least one habit).
  - `category`: log H hours in category X. X and H come from last week's `balanceTotals` × 1.1, at
    least 1h (Balance on).
  - `journal`: write in the Journal on N days (Journal on).
  - `loggedDays`: log N days in full, ACT-18 (Activity log on).
- `questsForWeek(input, weekStart, accountId)` shuffles the eligible kinds by `hashText(weekStart +
  accountId)` and takes the first three, so every device gets the same result.
- A claim is a ledger row under `QUEST_IDS = ['quest-1','quest-2','quest-3']`, on the **day
  claimed**, found within the week by `isWithinPeriod` (export it from `bonus.ts`).
  - `questState(quest, input, entries, now)` → `'open' | 'claimable' | 'claimed'`.
  - `claimQuest(...)` → the row to write, or null if the quest isn't met or was already claimed this
    week.
  - `questTakeBacks(...)` → claimed rows whose quest no longer holds, this week only (mirrors
    RWD-11). Claim comes back once the quest is met again.
- A met quest can be claimed **until the week ends**. An unclaimed one then lapses, and the page
  says so.

## Storage

- New collection `quests`, one doc per week, `quests/{weekStart}`, holding `{ version, quests: [{
  slot, kind, target, param }] }`. It's written the first time the week is seen, only if absent.
  Because the set is deterministic, two devices racing write the same thing. Storing it freezes the
  week's targets and keeps past weeks for a later recap.
- What a quest pays: `rewardSettings/questReward`, default 15, set on **Rules** like a bonus. Follow
  `newTaskReward` exactly, and bump `REWARD_SCHEMA_VERSION`.
- Work through the full collection checklist above (rules, backup, guest import).

## App

- `src/app/useQuests.ts`: subscribes to the week's doc, and creates it if it's missing.
  - `claim(slot)` is a handler. It writes through `RewardRepository.save` and returns the row, so
    the toast can offer **Undo**.
  - Once tasks, ledger, categories, journal and activity have all loaded, an effect applies
    `questTakeBacks`. If two offline devices claimed one slot on different days, it keeps the
    earliest row and revokes the rest.
- Page `rewards/quests` (`QuestsPage.tsx`), in `UNDER_REWARDS`:
  - Three rows, each with a plain sentence ("Finish 12 tasks this week"), a bar, "7 / 12" and what
    it pays.
  - A met quest shows **Claim**; a claimed one shows "Claimed +15".
  - Below, the last four weeks: claimed or lapsed.
- Being told:
  - When a quest can be claimed, a notice "Quest done: claim 15 points" with a link to Quests.
  - While a claim waits, a dot on Rewards and on Quests in the sidebar.
  - The Rewards page shows "Quests: 1 of 3 claimed".
- History rows for quests get names in `rewardLabels.ts`: "Quest: finish 12 tasks".
- Feature `'quests'`, child of `'rewards'`. A quest whose own feature is switched off (Journal,
  Balance, …) is never chosen. One chosen before its feature went off shows as paused.

## Left out of v1

- "Clear Today on N days": nothing reliably records which past days were cleared. That needs a
  record of cleared days first, which personal records (idea 7) would also use.

## Wiki

- New `wiki/quests.md` (QUEST-1…, with the pool as a table); a row in `wiki/README.md`; update
  `rewards.md` (the Rules setting, the pages, History rows), `features.md`, `storage.md` and
  `backup.md`.

## Tests

- Core:
  - Each kind's eligibility, target and progress.
  - The same three quests on two "devices".
  - A claim refused when the quest is unmet or already claimed.
  - Take-back within the week, then claiming again.
  - A lapsed week can't be claimed, and nothing in a past week is touched.
  - Cases ignore quest rows.
- Schema tests for the week doc and the reward setting.
- `QuestsPage.test.tsx` (jsdom, user-event): Claim writes once, Undo takes it back, a second click
  does nothing.

## Done when

- `package.json` gets a **minor** bump, the wiki matches, and `npm run lint && npm test && npm run
  build` pass.
- In Chrome (`localhost:5173`, the owner's **real account**): the Quests page shows this week's three
  with sensible targets and progress, with no console errors. Opening it writes this week's
  `quests/{weekStart}` doc, so tell the owner first. Claiming is proven by tests, or tried there
  only with the owner's OK. Check the phone layout in a 390px iframe.
