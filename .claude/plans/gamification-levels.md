# Plan — Levels (gamification idea 1)

## Context

PickMe has points, bonuses, prizes and cases, but nothing that shows progress over months. AGENTS.md
names "XP, levels" as part of the app, and nothing builds it yet. A level gives every task a second
meaning: on top of today's points, it moves you toward the next level.

**Owner's decision (2026-10-11):** the level follows the points. XP is every point ever earned.
Spending on prizes never lowers it, but taking a completion back (RWD-11) does, so a level **can go
down**.

## Ground to build on

- The **whole reward ledger** is loaded on open (`firestoreRewardRepository.subscribe` reads every
  `rewardDays` doc), so XP derived from `entries` is complete. No new account data is needed.
- `rewardTotals(entries, redemptions, now).all.earned` in `src/core/redemption.ts` already sums every
  earning: tasks, bonuses (`BONUS_IDS`), cases (`CASE_*_ID`), and the win card's extra (JUST-9).
- Features: `FEATURES` / `FEATURE_PARENT` in `src/core/feature.ts`, read with `useFeatureOn`
  (`src/app/features.ts`), labels in `src/app/featureLabels.ts`.
- Notices: toasts like `CaseNoticeToast` / `GoalNoticeToast`, mounted in `src/app/TasksScreen.tsx`.
- Device-only memory: the `caseDevice*` trio (`caseDeviceRepository.ts`,
  `localStorageCaseDeviceRepository.ts`, `caseDeviceSchema.ts`) registered in
  `src/storage/deviceStorage.ts`.

## Core — `src/core/level.ts` (+ `level.test.ts`), exported from `src/core/index.ts`

- `xpOf(entries)`: everything earned. Reuse `rewardTotals(...).all.earned` rather than summing twice.
- `LEVEL_BASE`, `LEVEL_STEP`: points from level n to n+1 = `BASE + STEP × (n − 1)`. Start at
  100 / 25 and tune (see Calibration).
- `levelOf(xp) → { level, into, needed }`: the level (from 1), the points into it, and the points it
  asks for.
- Pure, `now`-free, nothing stored.

## Device memory — `levelDevice` (same shape as the `caseDevice*` trio)

- Remembers the highest level this device has celebrated, with its own schema version.
- The first load on a device records the current level **silently**, so an existing account isn't
  greeted by a level-14 notice.

## App

- `src/app/useLevel.ts`: derives `levelOf(xpOf(ledger.entries))` only once the ledger has loaded
  (never from a loading or failed ledger, RWD-22). An effect compares it with the device record,
  raises the level-up notice and saves the new high. A level lost and regained isn't celebrated
  twice.
- `src/app/components/LevelCard.tsx` at the top of `RewardsPage.tsx`: "Level 7", a bar, "340 of 500
  points to level 8", and an **i** (`InfoButton`) that says in plain sentences that spending points
  doesn't lower the level, and taking a task back does.
- `src/app/components/LevelUpToast.tsx`, mounted in `TasksScreen.tsx` beside the case notices: "You
  reached level 8", with a link to Rewards.
- Feature: add `'levels'` to `FEATURES` after `'cases'`, set `FEATURE_PARENT.levels = 'rewards'`,
  and add its line to `featureLabels.ts`. Switched off, the card and the notice are gone (FEAT-3).

## Calibration

- Choose `BASE`/`STEP` from the owner's typical week, which they can read on Rewards (this week /
  this month): level 2 should come in ~2–3 days, level 10 in ~2 months. Ask the owner for the number;
  no admin reads.

## Wiki

- New `wiki/levels.md` (LVL-1…): what XP is; the curve; going down on take-back; the card; the
  notice, once per device.
- Add a row to `wiki/README.md`; update `features.md` (FEAT-1 list, FEAT-3 entry), `rewards.md`
  (RWD-20, what Rewards shows) and `storage.md` (a new STORE id for the device record).

## Tests

- `level.test.ts`: 0 XP is level 1; the exact boundary and one under it; a take-back drops a level;
  very large XP.
- `useLevel` test: one notice per new level per device; none on first load; none while loading.
- `RewardsPage.test.tsx`: the card shows the level and progress; `features.test.ts`: it's hidden
  with the feature off.

## Done when

- `package.json` gets a **minor** bump, the wiki matches, and `npm run lint && npm test && npm run
  build` pass.
- In Chrome (`localhost:5173`, which is the owner's **real account**): Rewards shows the level card
  from the real ledger, with no console errors and no notice on first load. This check is read-only.
  The level-up notice is proven by tests, not by ticking real tasks. Check the phone layout in a
  390px iframe.
