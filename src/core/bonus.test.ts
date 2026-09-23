import { describe, expect, it } from 'vitest'
import { BONUS_IDS, bonusEarned, isPeriodCleared, NO_BONUSES, withPeriodBonuses, type PeriodBonuses } from './bonus'
import type { Repeat } from './repeat'
import { setReward, type RewardChanges, type RewardEntry } from './reward'
import { completeTask, createTask, deleteTask, setDueDate, uncompleteTask, type Task } from './task'

/*
 * What clearing a period earns. RWD ids refer to wiki/rewards.md. Local dates on
 * purpose: a bonus is earned for the local day the period came clear on.
 * September 2026 runs Wed 16, Thu 17, Fri 18, in the week of Mon 14 to Sun 20.
 */

const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)
const THU_17_LATER = new Date(2026, 8, 17, 21, 0)
const FRI_18 = new Date(2026, 8, 18, 9, 0)

const DAILY: Repeat = { kind: 'daily' }

const NOTHING: RewardChanges = { earned: [], revoked: [] }

/** A bonus for one period and none for the others. */
function only(period: keyof PeriodBonuses, points: number | null): PeriodBonuses {
  return { ...NO_BONUSES, [period]: points }
}

/** A task due today, done or not. */
function today(title: string, done = false): Task {
  const task = setDueDate(createTask(title, null, WED_16), '2026-09-17')
  return done ? completeTask(task, THU_17) : task
}

/** A task due on a day of this week, done or not. */
function thisWeek(title: string, day: string, done: boolean, at: Date): Task {
  const task = setDueDate(createTask(title, null, WED_16), day)
  return done ? completeTask(task, at) : task
}

describe('whether a period is clear', () => {
  it('is clear once everything it asks for is done (RWD-25)', () => {
    expect(isPeriodCleared([today('pack', true), today('post', true)], 'today', THU_17)).toBe(true)
  })

  it('is not clear while anything is still to do', () => {
    expect(isPeriodCleared([today('pack', true), today('post')], 'today', THU_17)).toBe(false)
  })

  it('is not clear with nothing in it: there was nothing to clear (RWD-25)', () => {
    expect(isPeriodCleared([], 'today', THU_17)).toBe(false)
    expect(isPeriodCleared([setDueDate(createTask('later', null, WED_16), '2026-09-18')], 'today', THU_17)).toBe(false)
  })

  it('asks the day it is given, not the day the tasks were for', () => {
    const cleared = [today('pack', true)]

    expect(isPeriodCleared(cleared, 'today', THU_17)).toBe(true)
    expect(isPeriodCleared(cleared, 'today', FRI_18)).toBe(false)
  })

  it('counts the week and the month as their bars do (RWD-29)', () => {
    const tasks = [thisWeek('pack', '2026-09-16', true, WED_16), thisWeek('post', '2026-09-18', false, WED_16)]

    expect(isPeriodCleared(tasks, 'today', THU_17)).toBe(false)
    expect(isPeriodCleared(tasks, 'week', THU_17)).toBe(false)
    expect(isPeriodCleared([tasks[0]], 'week', THU_17)).toBe(true)
    expect(isPeriodCleared([tasks[0]], 'month', THU_17)).toBe(true)
  })
})

describe('what clearing Today earns', () => {
  it('earns the bonus for the day the last task is finished (RWD-25)', () => {
    const pack = today('pack')

    expect(withPeriodBonuses(NOTHING, [pack], [completeTask(pack, THU_17)], only('today', 10), [], THU_17)).toEqual({
      earned: [{ taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 }],
      revoked: [],
    })
  })

  it('earns it once a day, however the day is added to afterwards (RWD-26)', () => {
    const done = [today('pack', true)]
    const withMore = [...done, today('post', true)]

    expect(withPeriodBonuses(NOTHING, done, withMore, only('today', 10), [], THU_17_LATER)).toEqual(NOTHING)
  })

  it('takes it back when the day stops being clear (RWD-26)', () => {
    const done = today('pack', true)
    const given: RewardEntry[] = [{ taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 }]

    expect(
      withPeriodBonuses(NOTHING, [done], [uncompleteTask(done)], only('today', 10), given, THU_17_LATER),
    ).toEqual({ earned: [], revoked: [{ taskId: BONUS_IDS.today, day: '2026-09-17' }] })
  })

  it('takes it back whatever the bonus is now: taking back undoes what was given (RWD-26)', () => {
    const done = today('pack', true)
    const given: RewardEntry[] = [{ taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 }]

    expect(
      withPeriodBonuses(NOTHING, [done], [uncompleteTask(done)], only('today', 1), given, THU_17_LATER).revoked,
    ).toEqual([{ taskId: BONUS_IDS.today, day: '2026-09-17' }])
  })

  it('has nothing to take back where the day was never given a bonus', () => {
    const done = today('pack', true)

    expect(withPeriodBonuses(NOTHING, [done], [uncompleteTask(done)], only('today', 10), [], THU_17_LATER)).toEqual(
      NOTHING,
    )
  })

  it('leaves what a task earned as it is, and adds to it', () => {
    const pack = setReward(today('pack'), 5)
    const changes: RewardChanges = { earned: [{ taskId: pack.id, day: '2026-09-17', points: 5 }], revoked: [] }

    expect(
      withPeriodBonuses(changes, [pack], [completeTask(pack, THU_17)], only('today', 10), [], THU_17).earned,
    ).toEqual([
      { taskId: pack.id, day: '2026-09-17', points: 5 },
      { taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 },
    ])
  })

  it('does nothing at all while no bonus is set (RWD-27)', () => {
    const pack = today('pack')
    const done = today('post', true)
    const given: RewardEntry[] = [{ taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 }]

    expect(withPeriodBonuses(NOTHING, [pack], [completeTask(pack, THU_17)], NO_BONUSES, given, THU_17)).toEqual(NOTHING)
    expect(withPeriodBonuses(NOTHING, [done], [uncompleteTask(done)], NO_BONUSES, given, THU_17)).toEqual(NOTHING)
  })

  it('does nothing where the day was clear before the change and after it', () => {
    const habit = createTask('stretch', DAILY, WED_16)

    expect(withPeriodBonuses(NOTHING, [habit], [habit], only('today', 10), [], THU_17)).toEqual(NOTHING)
  })

  it('earns it when the last open task is taken out of the day rather than done (RWD-25)', () => {
    const done = today('pack', true)
    const open = today('post')

    expect(
      withPeriodBonuses(NOTHING, [done, open], [done, deleteTask(open, THU_17_LATER)], only('today', 10), [], THU_17_LATER)
        .earned,
    ).toEqual([{ taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 }])
  })
})

describe('what clearing the week or the month earns (RWD-29)', () => {
  it('earns the week its own bonus, under its own id, on the day it came clear', () => {
    const post = thisWeek('post', '2026-09-18', false, THU_17)
    const packed = thisWeek('pack', '2026-09-16', true, WED_16)

    expect(
      withPeriodBonuses(NOTHING, [packed, post], [packed, completeTask(post, THU_17)], only('week', 20), [], THU_17),
    ).toEqual({ earned: [{ taskId: BONUS_IDS.week, day: '2026-09-17', points: 20 }], revoked: [] })
  })

  it('takes the week back wherever in the week it was earned (RWD-29)', () => {
    const post = thisWeek('post', '2026-09-18', true, THU_17)
    const given: RewardEntry[] = [{ taskId: BONUS_IDS.week, day: '2026-09-17', points: 20 }]

    expect(
      withPeriodBonuses(NOTHING, [post], [uncompleteTask(post)], only('week', 20), given, FRI_18).revoked,
    ).toEqual([{ taskId: BONUS_IDS.week, day: '2026-09-17' }])
  })

  it('leaves what an earlier week earned alone (RWD-13)', () => {
    const post = thisWeek('post', '2026-09-18', true, THU_17)
    const lastWeek: RewardEntry[] = [{ taskId: BONUS_IDS.week, day: '2026-09-10', points: 20 }]

    expect(withPeriodBonuses(NOTHING, [post], [uncompleteTask(post)], only('week', 20), lastWeek, FRI_18)).toEqual(
      NOTHING,
    )
  })

  it('earns every period a change clears, each its own amount (RWD-29)', () => {
    const pack = today('pack')
    const bonuses: PeriodBonuses = { today: 5, week: 20, month: 50 }

    expect(withPeriodBonuses(NOTHING, [pack], [completeTask(pack, THU_17)], bonuses, [], THU_17).earned).toEqual([
      { taskId: BONUS_IDS.today, day: '2026-09-17', points: 5 },
      { taskId: BONUS_IDS.week, day: '2026-09-17', points: 20 },
      { taskId: BONUS_IDS.month, day: '2026-09-17', points: 50 },
    ])
  })
})

describe('what a period has already earned (RWD-30)', () => {
  const given: RewardEntry[] = [
    { taskId: BONUS_IDS.today, day: '2026-09-17', points: 5 },
    { taskId: BONUS_IDS.week, day: '2026-09-16', points: 20 },
  ]

  it('finds the bonus the period was given, wherever in it that was', () => {
    expect(bonusEarned(given, 'today', THU_17)?.points).toBe(5)
    expect(bonusEarned(given, 'week', FRI_18)?.points).toBe(20)
  })

  it('is nothing where the period has not been given one', () => {
    expect(bonusEarned(given, 'month', THU_17)).toBeNull()
    expect(bonusEarned(given, 'today', FRI_18)).toBeNull()
    expect(bonusEarned([], 'today', THU_17)).toBeNull()
  })
})
