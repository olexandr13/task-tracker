# Plan — Limited habit rests (gamification idea 9)

## Context

Today a habit's **Skip** (HAB-31) marks the day as a rest. The streak runs on across it, and there's
no limit, so a streak can be kept going forever without doing the habit, which empties streaks of
meaning. With this change, a skip keeps the streak only while the habit has a **rest** to spend, and
rests are earned by keeping the habit.

**Owner's decision (2026-10-11):** rests are earned by keeping the habit, not bought with points.
It's switched on per account and off by default (today's behaviour).

## Ground to build on

- Skips are stored on the task: `Task.skippedDays` (`src/core/task.ts`).
  - `canSkipOccurrence`, `skipOccurrence`, `isSkippedToday` and `unskipToday` are in
    `src/core/due.ts`. A habit can only rest **today** (HAB-32).
  - Non-habit repeating tasks also skip (RPT-34); they're unaffected.
  - `passOverMissedOccurrence` in `task.ts` also writes `skippedDays`, but never for a daily rule.
- Streaks and rates: `habitStats`, `habitRate`, `habitWeeks`, `habitLastDays` and the private
  `restedDays` in `src/core/habit.ts`; `startedOn` in `task.ts`.
- Skip controls: `TaskActions.skip` / `unskip` (`src/app/taskActions.ts`, implemented in
  `src/app/useTasks.ts`), called from `TaskSheet.tsx`, `DueChoices.tsx` / `dateChoices.tsx` and
  `TaskItem.tsx`. The habit card is `HabitList.tsx`.
- Refusals: `useRefusal` (`src/app/useRefusal.ts`) and an amber `role="alert"` line like
  `CompletionRefusal.tsx`. Refuse in place, never disable.
- Settings under a feature's switch: FEAT-10 (`FeatureSwitches.tsx`).
- New account collection checklist (AGENTS.md): `ACCOUNT_COLLECTIONS`, `firestore.rules`, schema +
  version, repository interface with Firestore and local implementations, `createAccountStorage`,
  the backup files, `backupLabels.ts`, `guestImport.ts`.

## Rule

- Each habit starts with **1** rest, earns **1** for every **7** days done in a row, and holds up to
  **2**.
- A skip spends a rest. Taking the skip back (pressing **Skipped** again) returns it; this falls out
  of the rests being derived.
- Only skips on or after the day the limit was switched on count. Older skips stay rests.
- A skip with no rest to cover it, written by an older version or an offline device, reads as
  **missed**.
- Non-habit repeating tasks keep unlimited skips.

## Core — `src/core/habitRest.ts` (+ test)

- `HabitRests = { since: LocalDay } | null`, with `REST_EVERY = 7`, `REST_MAX = 2`, `REST_START = 1`.
- `restsOf(task, rests, now) → { left, nextIn, covered: Set<LocalDay>, uncovered: Set<LocalDay> }`
  walks the days from `max(since, startedOn(task))` to today:
  - A done day adds 1 to the run. At 7, a rest is earned and the run resets.
  - A covered skip spends a rest and leaves the run as it was.
  - An uncovered skip or a missed day resets the run; rests already earned are kept.
- `canRest(task, rests, now)` = `canSkipOccurrence` and (not a habit, or the limit is off, or
  `left > 0`).
- `habitStats`, `habitRate`, `habitWeeks` and `habitLastDays` take an optional `rests` argument
  (default null keeps today's behaviour). `restedDays` leaves out the `uncovered` days, so they read
  as `missed`.

## Storage — new collection `habitSettings`, doc `rests`

- The doc holds `{ version, since }`; no doc means the limit is off. `habitSettingsSchema.ts` with
  its version; repository interface + Firestore + local.
- Work through the full collection checklist above (rules, backup, guest import).

## App

- `TaskActions.skip` returns `'skipped' | 'noRest'`. Every Skip control answers `'noRest'` with
  `useRefusal` and an amber line: "No rests left. This habit earns one for every 7 days in a row — 3
  more to go." Nothing changes, so there's nothing to undo.
- The habit card in `HabitList.tsx` shows "2 rests" under the streak, with the countdown to the
  next one in the open details. Its stats and grid are passed the `rests` setting.
- Settings → Features → Habits settings (FEAT-10): a switch "Limit rests" with one plain sentence
  explaining it. Turning it on saves `since = today`; turning it off removes the doc.

## Wiki

- `habits.md`:
  - Rewrite HAB-31 in place: while the limit is on, Skip spends a rest.
  - Add new HAB ids at the end of the section for earning rests, holding them, the refusal, the line
    on the card, and uncovered skips.
- Update `features.md` (FEAT-10), `storage.md` and `backup.md`.

## Tests

- `habitRest.test.ts`:
  - A habit starts with 1 rest, earns one at 7 days, and caps at 2.
  - Spending a rest, then taking the skip back.
  - Skips before `since` are free; an uncovered skip reads as missed.
  - Non-habits are untouched.
- `habit.test.ts`: the streak breaks at an uncovered skip and runs on across a covered one.
- Component test (`*.test.tsx`, jsdom, user-event): Skip with no rest left shows the note and
  changes nothing.

## Later (not v1)

- Buying a rest with points: it needs a redemption tied to a habit and a day, which means a schema
  change to redemptions.

## Done when

- `package.json` gets a **minor** bump, the wiki matches, and `npm run lint && npm test && npm run
  build` pass.
- In Chrome (`localhost:5173`, the owner's **real account**): with the limit off, habits read exactly
  as before. Turning the limit on writes to the account, so it's the owner's call. Skipping and the
  refusal are proven by component tests, not by skipping real habits. Check the phone layout in a
  390px iframe.
