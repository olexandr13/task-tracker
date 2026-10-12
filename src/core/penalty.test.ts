import { describe, expect, it } from 'vitest'
import { skipOccurrence, unskipToday } from './due'
import { setDoneOnDay } from './habit'
import { hasPenaltyChanges, penaltyChanges, skipPenalty, skipPenaltyId, type PenaltyChanges } from './penalty'
import { isSkipPenalty } from './redemption'
import type { Repeat } from './repeat'
import { setReward } from './reward'
import { completeTask, createTask, deleteTask, renameTask, setRepeat, uncompleteTask, type Task } from './task'

/*
 * HAB ids refer to wiki/habits.md. Local dates on purpose: a skip is of the local
 * day it is on. September 2026 runs Mon 14, Tue 15, Wed 16.
 */

const MON_14 = new Date(2026, 8, 14, 9, 0)
const TUE_15 = new Date(2026, 8, 15, 9, 0)
const WED_16 = new Date(2026, 8, 16, 9, 0)

const DAILY: Repeat = { kind: 'daily' }
const EVERY_WEEKDAY: Repeat = { kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] }
const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }

const NOTHING: PenaltyChanges = { charged: [], refunded: [] }

/** A habit worth `reward` a day, begun on Monday. */
function habit(reward: number | null, repeat: Repeat = DAILY): Task {
  return setReward(createTask('stretch', repeat, MON_14), reward)
}

/** What changing one task comes to on `now`, as `penaltyChanges` sees a list of one. */
function changeOf(before: Task, after: Task, now: Date = TUE_15): PenaltyChanges {
  return penaltyChanges([before], [after], now)
}

describe('skipPenalty (HAB-34)', () => {
  it("is twice a habit's reward", () => {
    expect(skipPenalty(habit(1))).toBe(2)
    expect(skipPenalty(habit(15))).toBe(30)
    expect(skipPenalty(habit(3, EVERY_WEEKDAY))).toBe(6)
  })

  it('is nothing for a habit with no reward, or a task that is not a habit', () => {
    expect(skipPenalty(habit(null))).toBe(0)
    expect(skipPenalty(habit(5, MONDAYS))).toBe(0)
    expect(skipPenalty(setReward(createTask('call mum', null, MON_14), 5))).toBe(0)
  })
})

describe('penaltyChanges, skipping (HAB-34)', () => {
  it('takes twice the reward for a habit skipped today, made out for today', () => {
    const task = habit(2)
    const changes = changeOf(task, skipOccurrence(task, TUE_15))

    expect(changes).toEqual({
      charged: [
        {
          id: skipPenaltyId({ taskId: task.id, day: '2026-09-15' }),
          points: 4,
          note: 'stretch',
          redeemedAt: TUE_15.toISOString(),
          skip: { taskId: task.id, day: '2026-09-15' },
        },
      ],
      refunded: [],
    })
    expect(isSkipPenalty(changes.charged[0])).toBe(true)
    expect(hasPenaltyChanges(changes)).toBe(true)
  })

  it('names the record for the habit and the day, so the same skip is one record', () => {
    const task = habit(2)

    expect(skipPenaltyId({ taskId: task.id, day: '2026-09-15' })).toBe(`skip-${task.id}-2026-09-15`)
    expect(changeOf(task, skipOccurrence(task, TUE_15)).charged[0].id).toBe(
      changeOf(task, skipOccurrence(task, TUE_15)).charged[0].id,
    )
  })

  it('takes nothing for a habit with no reward, or for skipping a task that is not a habit', () => {
    const unrewarded = habit(null)
    expect(changeOf(unrewarded, skipOccurrence(unrewarded, TUE_15))).toEqual(NOTHING)

    const weekly = habit(5, MONDAYS)
    expect(changeOf(weekly, skipOccurrence(weekly, MON_14), MON_14)).toEqual(NOTHING)
    expect(hasPenaltyChanges(NOTHING)).toBe(false)
  })

  it('takes it at the reward the habit has when it is skipped', () => {
    const task = setReward(habit(2), 7)

    expect(changeOf(task, skipOccurrence(task, TUE_15)).charged[0].points).toBe(14)
  })
})

describe('penaltyChanges, giving back (HAB-34)', () => {
  it('gives back what the skip cost when it is taken back, whatever the reward is now', () => {
    const skipped = skipOccurrence(habit(2), TUE_15)
    const id = skipPenaltyId({ taskId: skipped.id, day: '2026-09-15' })

    expect(changeOf(skipped, unskipToday(skipped, TUE_15))).toEqual({ charged: [], refunded: [id] })

    const repriced = setReward(skipped, null)
    expect(changeOf(repriced, unskipToday(repriced, TUE_15))).toEqual({ charged: [], refunded: [id] })
  })

  it('gives it back when the day is done after all, and takes it again when that tick is taken back (RPT-36)', () => {
    const skipped = skipOccurrence(habit(2), TUE_15)
    const id = skipPenaltyId({ taskId: skipped.id, day: '2026-09-15' })
    const done = completeTask(skipped, TUE_15)

    expect(changeOf(skipped, done)).toEqual({ charged: [], refunded: [id] })
    expect(changeOf(done, uncompleteTask(done, TUE_15)).charged.map((each) => each.id)).toEqual([id])
  })

  it('takes it again for a day gone by that comes to rest again, made out for that day (HAB-16)', () => {
    const skipped = skipOccurrence(habit(2), TUE_15)
    const done = setDoneOnDay(skipped, '2026-09-15', true, WED_16)
    const id = skipPenaltyId({ taskId: skipped.id, day: '2026-09-15' })

    expect(changeOf(skipped, done, WED_16)).toEqual({ charged: [], refunded: [id] })

    const again = changeOf(done, setDoneOnDay(done, '2026-09-15', false, WED_16), WED_16)
    expect(again.charged).toEqual([
      {
        id,
        points: 4,
        note: 'stretch',
        redeemedAt: new Date(2026, 8, 15).toISOString(),
        skip: { taskId: skipped.id, day: '2026-09-15' },
      },
    ])
  })
})

describe('penaltyChanges, what is not a skip (HAB-34)', () => {
  it('changes nothing for a change of rule, a rename, a delete or a change of reward', () => {
    const skipped = skipOccurrence(habit(2), TUE_15)

    expect(changeOf(skipped, setRepeat(skipped, MONDAYS, TUE_15))).toEqual(NOTHING)
    expect(changeOf(skipped, renameTask(skipped, 'yoga'))).toEqual(NOTHING)
    expect(changeOf(skipped, deleteTask(skipped, TUE_15))).toEqual(NOTHING)
    expect(changeOf(skipped, setReward(skipped, 9))).toEqual(NOTHING)
  })

  it('changes nothing for a task newly added, purged, or handed back untouched', () => {
    const skipped = skipOccurrence(habit(2), TUE_15)

    expect(penaltyChanges([], [skipped], TUE_15)).toEqual(NOTHING)
    expect(penaltyChanges([skipped], [], TUE_15)).toEqual(NOTHING)
    expect(penaltyChanges([skipped], [skipped], TUE_15)).toEqual(NOTHING)
  })

  it('takes nothing for a rest kept for a day still to come', () => {
    const task = habit(2)
    const ahead = { ...task, skippedDays: ['2026-09-16'] }

    expect(changeOf(task, ahead)).toEqual(NOTHING)
  })
})
