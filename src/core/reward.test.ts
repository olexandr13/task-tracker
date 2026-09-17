import { describe, expect, it } from 'vitest'
import { setDoneOnDay } from './habit'
import type { Repeat } from './repeat'
import {
  completionDays,
  defaultReward,
  hasReward,
  InvalidRewardError,
  rewardChanges,
  setReward,
  type RewardChanges,
} from './reward'
import {
  addSubtask,
  completeTask,
  createTask,
  deleteTask,
  renameTask,
  setRepeat,
  setSubtaskDone,
  uncompleteTask,
  type Task,
} from './task'
import { purgeExpired } from './trash'

/*
 * RWD ids refer to wiki/rewards.md. Local dates on purpose: a completion earns for
 * the local day it is on. September 2026 runs Mon 14, Tue 15, Wed 16, Thu 17.
 */

const MON_14 = new Date(2026, 8, 14, 9, 0)
const TUE_15 = new Date(2026, 8, 15, 9, 0)
const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)
const MON_21 = new Date(2026, 8, 21, 9, 0)

const DAILY: Repeat = { kind: 'daily' }
const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }

/** What changing one task comes to, as `rewardChanges` sees a list of one. */
function changeOf(before: Task, after: Task): RewardChanges {
  return rewardChanges([before], [after])
}

const NOTHING: RewardChanges = { earned: [], revoked: [] }

describe('defaultReward (RWD-2)', () => {
  it('is worth more for a task that comes round less often', () => {
    expect(defaultReward(DAILY)).toBe(1)
    expect(defaultReward(MONDAYS)).toBe(5)
    expect(defaultReward({ kind: 'monthly', day: 5 })).toBe(25)
  })

  it('is a daily reward for a weekly rule on all seven days, and for a one-off', () => {
    expect(defaultReward({ kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] })).toBe(1)
    expect(defaultReward(null)).toBe(1)
  })
})

describe('setReward (RWD-1)', () => {
  it('gives a task a reward, changes it, and takes it away', () => {
    const task = setReward(createTask('run', DAILY, MON_14), 3)

    expect(task.reward).toBe(3)
    expect(hasReward(task)).toBe(true)
    expect(setReward(task, 7).reward).toBe(7)
    expect(setReward(task, null).reward).toBeNull()
  })

  it('takes whole numbers of points from 1 to 999 only', () => {
    const task = createTask('run', DAILY, MON_14)

    expect(setReward(task, 999).reward).toBe(999)
    for (const points of [0, -1, 1.5, 1000, Number.NaN]) {
      expect(() => setReward(task, points)).toThrow(InvalidRewardError)
    }
  })

  it('hands back the task itself when nothing changes', () => {
    const task = setReward(createTask('run', DAILY, MON_14), 3)

    expect(setReward(task, 3)).toBe(task)
  })
})

describe('completionDays', () => {
  it("is a repeating task's history, and a one-off's day while it is done", () => {
    const habit = completeTask(completeTask(createTask('run', DAILY, MON_14), MON_14), TUE_15)
    const oneOff = createTask('pack', null, MON_14)

    expect(completionDays(habit)).toEqual(['2026-09-14', '2026-09-15'])
    expect(completionDays(oneOff)).toEqual([])
    expect(completionDays(completeTask(oneOff, WED_16))).toEqual(['2026-09-16'])
  })
})

describe('rewardChanges, earning (RWD-9, RWD-10)', () => {
  it('earns the reward for every day a repeating task is done', () => {
    let task = setReward(createTask('run', DAILY, MON_14), 2)
    const earned = []

    for (const day of [MON_14, TUE_15, WED_16]) {
      const next = completeTask(task, day)
      earned.push(...changeOf(task, next).earned)
      task = next
    }

    expect(earned).toEqual([
      { taskId: task.id, day: '2026-09-14', points: 2 },
      { taskId: task.id, day: '2026-09-15', points: 2 },
      { taskId: task.id, day: '2026-09-16', points: 2 },
    ])
  })

  it('earns for every occurrence of a weekly task that is done', () => {
    const task = setReward(createTask('review', MONDAYS, MON_14), 5)
    const first = completeTask(task, MON_14)
    const second = completeTask(first, MON_21)

    expect(changeOf(task, first).earned).toEqual([{ taskId: task.id, day: '2026-09-14', points: 5 }])
    expect(changeOf(first, second).earned).toEqual([{ taskId: task.id, day: '2026-09-21', points: 5 }])
  })

  it('earns once for a one-off, on the day it is done', () => {
    const task = setReward(createTask('pack', null, MON_14), 4)

    expect(changeOf(task, completeTask(task, TUE_15))).toEqual({
      earned: [{ taskId: task.id, day: '2026-09-15', points: 4 }],
      revoked: [],
    })
  })

  it('earns at the reward the task has when it is done', () => {
    const task = setReward(completeTask(setReward(createTask('run', DAILY, MON_14), 1), MON_14), 3)

    expect(changeOf(task, completeTask(task, TUE_15)).earned).toEqual([{ taskId: task.id, day: '2026-09-15', points: 3 }])
  })

  it('earns nothing for a task without a reward', () => {
    const task = createTask('run', DAILY, MON_14)

    expect(changeOf(task, completeTask(task, MON_14))).toEqual(NOTHING)
  })

  it("earns when a checklist's last tick finishes the task", () => {
    const task = setReward(addSubtask(createTask('pack', null, MON_14), 'socks', MON_14), 2)
    const ticked = setSubtaskDone(task, task.subtasks[0].id, true, TUE_15)

    expect(changeOf(task, ticked).earned).toEqual([{ taskId: task.id, day: '2026-09-15', points: 2 }])
  })

  it('earns for an earlier day marked done on a habit', () => {
    const task = setReward(createTask('run', DAILY, MON_14), 1)

    expect(changeOf(task, setDoneOnDay(task, '2026-09-14', true, WED_16)).earned).toEqual([
      { taskId: task.id, day: '2026-09-14', points: 1 },
    ])
  })
})

describe('rewardChanges, taking back (RWD-11)', () => {
  it('takes back what a completion earned when it is undone', () => {
    const done = completeTask(setReward(createTask('run', DAILY, MON_14), 2), MON_14)

    expect(changeOf(done, uncompleteTask(done, MON_14))).toEqual({
      earned: [],
      revoked: [{ taskId: done.id, day: '2026-09-14' }],
    })
  })

  it('takes back a one-off reopened days after it was done, for the day it was done', () => {
    const done = completeTask(setReward(createTask('pack', null, MON_14), 2), MON_14)

    expect(changeOf(done, uncompleteTask(done, THU_17)).revoked).toEqual([{ taskId: done.id, day: '2026-09-14' }])
  })

  it('takes back whatever the reward is now, and a task that never had one too', () => {
    const done = setReward(completeTask(setReward(createTask('run', DAILY, MON_14), 2), MON_14), null)

    expect(changeOf(done, uncompleteTask(done, MON_14)).revoked).toEqual([{ taskId: done.id, day: '2026-09-14' }])
  })

  it('takes back when an item added to a finished task reopens it', () => {
    const done = completeTask(setReward(createTask('pack', null, MON_14), 2), MON_14)

    expect(changeOf(done, addSubtask(done, 'socks', MON_14)).revoked).toEqual([{ taskId: done.id, day: '2026-09-14' }])
  })

  it('takes back an earlier day cleared on a habit, and only that day', () => {
    const task = setReward(createTask('run', DAILY, MON_14), 1)
    const done = completeTask(completeTask(task, MON_14), TUE_15)

    expect(changeOf(done, setDoneOnDay(done, '2026-09-14', false, WED_16))).toEqual({
      earned: [],
      revoked: [{ taskId: task.id, day: '2026-09-14' }],
    })
  })
})

describe('rewardChanges, what is not a completion (RWD-12, RWD-13)', () => {
  const done = completeTask(completeTask(setReward(createTask('run', DAILY, MON_14), 2), MON_14), TUE_15)

  it('changes nothing for a change of rule, even where it changes which days read as done', () => {
    const dropped = setRepeat(done, null, WED_16)

    expect(changeOf(done, dropped)).toEqual(NOTHING)
    expect(changeOf(dropped, setRepeat(dropped, DAILY, WED_16))).toEqual(NOTHING)
    expect(changeOf(done, setRepeat(done, MONDAYS, WED_16))).toEqual(NOTHING)
  })

  it('reads a rule rebuilt with its days in another order as the same rule, not a change of it', () => {
    const weekly: Task = { ...done, repeat: { kind: 'weekly', weekdays: [1, 3] } }
    const same: Task = { ...weekly, repeat: { kind: 'weekly', weekdays: [3, 1] }, doneDays: [] }

    expect(changeOf(weekly, same).revoked).toHaveLength(2)
  })

  it('keeps what was earned through a delete, a purge, a rename and a change of reward', () => {
    const deleted = deleteTask(done, WED_16)

    expect(changeOf(done, deleted)).toEqual(NOTHING)
    expect(rewardChanges([deleted], purgeExpired([deleted], new Date(2026, 8, 30)))).toEqual(NOTHING)
    expect(changeOf(done, renameTask(done, 'jog'))).toEqual(NOTHING)
    expect(changeOf(done, setReward(done, 9))).toEqual(NOTHING)
    expect(changeOf(done, setReward(done, null))).toEqual(NOTHING)
  })

  it('changes nothing for a task newly added, or one handed back untouched', () => {
    expect(rewardChanges([], [done])).toEqual(NOTHING)
    expect(rewardChanges([done], [done])).toEqual(NOTHING)
  })
})
