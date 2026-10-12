# Plan — Badges (gamification idea 6, "achievements")

## Context

PickMe rewards each task and each cleared period, but nothing marks a milestone: a first 30-day
streak, a 1000th task. Badges are lasting recognition, with progress toward the ones not earned yet.

**Named "Badges"**: the Journal already has an "Achievements" section (🏆), and the wishlist uses
`TrophyIcon`.

**Owner's decision (2026-10-11):** badges are recognition only and pay no points.

## Ground to build on

- The **whole reward ledger** is loaded on open (`firestoreRewardRepository.subscribe`), so anything
  derived from `entries` and `redemptions` is complete. **Tasks are not**: one-off tasks done before
  `historyStart` (start of last week or month) are not held (STORE-55, `src/core/history.ts`).
  Repeating tasks, which include all habits, are always held with full `doneDays`.
- Ledger rows that aren't tasks already exist: bonuses (`BONUS_IDS`, `isBonus` in
  `src/core/bonus.ts`) and cases (`CASE_*_ID`, `isCaseEarning` in `src/core/cases.ts`).
  `cases.ts` / `caseKey.ts` filter them out where they count "tasks". **Add one predicate
  `isTaskEarning(taskId)`** in core and use it at those sites. Weekly quests will extend it too.
- Habit streak logic: `habitStats`, private `restedDays` and the run helpers in `src/core/habit.ts`.
- Pages under Rewards: `UNDER_REWARDS` (`src/app/view.ts`), `rewardsPagesShown` (`src/app/features.ts`),
  `VIEW_LABELS`, `src/app/viewIcons.ts`, `RewardsNav.tsx`.
- Notices: toasts like `CaseNoticeToast`, mounted in `src/app/TasksScreen.tsx`.
- New account collection checklist (AGENTS.md): `ACCOUNT_COLLECTIONS` (`firestoreAccount.ts`),
  `firestore.rules`, a `*Schema.ts` with `*_SCHEMA_VERSION`, a repository interface with Firestore
  and local implementations, `createAccountStorage`, the backup (`AccountData` in
  `backupRepository.ts`, `backupFile.ts`, `firestoreBackupRepository.ts`, `localBackupRepository.ts`,
  `backupLabels.ts`) and guest import (`guestImport.ts`).

## Core — `src/core/badge.ts` (+ test)

- `BADGES`: a fixed catalogue, each `{ id, group, name, how, check(input) }`.
  - `how` is one plain sentence: "Keep one habit 30 days in a row".
  - `check` returns `{ reachedOn: LocalDay | null, have, need }`, so badges not yet earned can show
    progress.
- `BadgeInput` uses **only data that's always complete**: ledger `entries`, `redemptions`, and
  habits (`habitTasks`). Never one-off tasks.
- Catalogue v1 (~18):
  - **Habits:** one habit 7 / 30 / 100 / 365 days in a row; three habits at 7+ at once. Needs
    `streakReachedOn(task, n)` in `habit.ts`, reusing its run logic, so the badge carries the real
    day.
  - **Work:** 10 / 100 / 500 / 1000 / 5000 tasks finished with points (ledger rows where
    `isTaskEarning`). The badge's day is the day of the Nth row.
  - **Clearing:** Today cleared 1 / 10 / 50 times, from `today-bonus` or `chest-open` rows; a whole
    week, from `week-bonus`; a whole month, from `month-bonus`. The wiki says plainly that a clear
    counts only where a bonus or Payday recorded it.
  - **Cases:** first case opened; 50 opened (`caseOpenings`).
  - **Spending:** first redemption; 1 000 points spent.
- `badgesReached(input, now)` and `badgeChanges(earned, reached, now)` decide what to record and
  what to take back. Only a badge recorded **today** that no longer holds today is taken back
  (mirrors RWD-11). An older badge stays earned even if its data later shrinks, for example a
  habit purged or an earning deleted.

## Storage — new collection `badges`

- One doc, `badges/earned`, with a field per badge id → `{ on: LocalDay }`. It's merged, never
  replaced (same pattern as `rewardDays`), so two devices earning different badges keep both.
- `badgeSchema.ts` with `BADGE_SCHEMA_VERSION = 1`; repository interface + Firestore + local.
- Work through the full collection checklist above (rules, backup, guest import).

## App

- `src/app/useBadges.ts` subscribes. Once tasks, ledger and badges have all loaded, it reconciles in
  an effect, never in render, and reports refused loads and saves through `ReportProblem`.
- The first run backfills from history **silently**, each badge with its real date, so there's no
  flood of notices. From then on, a badge reached today raises a notice: "Badge earned: 30 days in a
  row", with a link to the Badges page.
- Page `rewards/badges` (`BadgesPage.tsx`) in `UNDER_REWARDS`: a grid grouped as above. An earned
  badge shows in colour with its date. One not earned yet shows in grey with "23 / 30 days" and its
  `how` sentence. The Rewards page shows "Badges: 7 of 18", linking there.
- Feature `'badges'`, child of `'rewards'` in `FEATURE_PARENT`, with its line in `featureLabels.ts`.

## Wiki

- New `wiki/badges.md` (BADGE-1…, with the catalogue as a table); a row in `wiki/README.md`; update
  `features.md`, `rewards.md` (RWD-30, the pages under Rewards), `storage.md` and `backup.md`.

## Tests

- Each badge's `check` at the edges: N−1, N, taken back the same day, an older badge kept.
- Backfill gives the real dates; `badgeSchema.test.ts`; backup round-trip.
- `BadgesPage` renders progress; the notice comes once.

## Done when

- `package.json` gets a **minor** bump, the wiki matches, and `npm run lint && npm test && npm run
  build` pass.
- In Chrome (`localhost:5173`, the owner's **real account**): the Badges page shows the backfilled
  badges with plausible dates and no console errors. Opening it writes the `badges/earned` doc,
  which is the feature working, so tell the owner first. Earning a new badge is proven by tests, not
  by ticking real tasks. Check the phone layout in a 390px iframe.
