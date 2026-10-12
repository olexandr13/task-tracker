# Gamification plans — index

The owner picked ideas 1, 6, 8 and 9 and asked for a separate plan for each. Each plan below stands
on its own: context, the code to build on, the steps, the wiki, the tests and the checks. Each is
built in its own session, one at a time, and none of them is built yet.

| # | Plan | File | Account storage |
|---|---|---|---|
| 1 | Levels | [gamification-levels.md](gamification-levels.md) | none (device record only) |
| 2 | Limited habit rests | [gamification-habit-rests.md](gamification-habit-rests.md) | `habitSettings/rests` |
| 3 | Badges | [gamification-badges.md](gamification-badges.md) | `badges/earned` |
| 4 | Weekly quests | [gamification-weekly-quests.md](gamification-weekly-quests.md) | `quests/{week}`, `rewardSettings/questReward` |

**Order:** the table's order, from smallest to largest. Badges adds `isTaskEarning` in core;
Quests extends it, and adds it itself if Badges hasn't been built yet.

**Owner's decisions (2026-10-11):**
- Rests are earned by keeping the habit.
- A level follows the points and can go down.
- Quests are claimed with a button.
- Badges pay no points.

**On approval:** nothing is built here. Each plan is offered as its own session to start when the
owner chooses.
