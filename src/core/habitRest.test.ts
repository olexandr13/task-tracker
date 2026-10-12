import { describe, expect, it } from 'vitest'
import { offsetDay, type LocalDay } from './day'
import { skipOccurrence, unskipToday } from './due'
import { canRest, isOutOfRests, REST_EVERY, REST_MAX, REST_START, restsOf, type RestLimit } from './habitRest'
import type { Repeat } from './repeat'
import { createTask, type Task } from './task'

/*
 * HAB ids refer to wiki/habits.md. Local dates on purpose: rests are counted
 * day by day. September 2026 runs Mon 14, Tue 15, Wed 16, Thu 17.
 */

const WED_16 = new Date(2026, 8, 16, 9, 0)
const DAILY: Repeat = { kind: 'daily' }
/** Switched on long before any habit here started. */
const LIMITED: RestLimit = { since: '2026-06-01' }

/** A habit that started on `from`, done on `done` and skipped on `skipped`. */
function habit(from: LocalDay, done: readonly LocalDay[], skipped: readonly LocalDay[] = []): Task {
  const [year, month, day] = from.split('-').map(Number)
  return { ...createTask('stretch', DAILY, new Date(year, month - 1, day, 8, 0)), doneDays: done, skippedDays: skipped }
}

/** The `count` days from `from` on, in order. */
function daysFrom(from: LocalDay, count: number): LocalDay[] {
  return Array.from({ length: count }, (_, at) => offsetDay(from, at))
}

describe('restsOf: how many a habit has (HAB-37)', () => {
  it('starts a habit with one rest', () => {
    expect(REST_START).toBe(1)
    expect(restsOf(habit('2026-09-16', []), LIMITED, WED_16)).toMatchObject({ left: 1, nextIn: REST_EVERY })
  })

  it('earns one for every 7 days done in a row', () => {
    // Done Thu 10 to Wed 16: seven in a row, the last of them today.
    const task = habit('2026-09-10', daysFrom('2026-09-10', 7))

    expect(restsOf(task, LIMITED, WED_16)).toMatchObject({ left: 2, nextIn: 7 })
  })

  it('counts towards the next one day by day', () => {
    const task = habit('2026-09-12', daysFrom('2026-09-12', 4))

    expect(restsOf(task, LIMITED, WED_16)).toMatchObject({ left: 1, nextIn: 3 })
  })

  it('holds two at most, a third earned being let go', () => {
    expect(REST_MAX).toBe(2)
    // Fourteen days in a row from Thu 3 to Wed 16.
    const task = habit('2026-09-03', daysFrom('2026-09-03', 14))

    expect(restsOf(task, LIMITED, WED_16)).toMatchObject({ left: 2, nextIn: 7 })
  })

  it('starts the count again after a day missed, keeping the rests earned', () => {
    // Seven days from Sat 5 to Fri 11, Sat 12 missed, then Sun 13 to Wed 16.
    const task = habit('2026-09-05', [...daysFrom('2026-09-05', 7), ...daysFrom('2026-09-13', 4)])

    expect(restsOf(task, LIMITED, WED_16)).toMatchObject({ left: 2, nextIn: 3 })
  })

  it('ends nothing on today while it is still to do', () => {
    const task = habit('2026-09-13', daysFrom('2026-09-13', 3))

    expect(restsOf(task, LIMITED, WED_16)).toMatchObject({ left: 1, nextIn: 4 })
  })
})

describe('restsOf: spending them (HAB-36)', () => {
  it('spends one on a skip, the count towards the next running on across it', () => {
    // Done Sun 13 and Mon 14, skipped Tue 15, done Wed 16.
    const task = habit('2026-09-13', ['2026-09-13', '2026-09-14', '2026-09-16'], ['2026-09-15'])
    const standing = restsOf(task, LIMITED, WED_16)

    expect(standing).toMatchObject({ left: 0, nextIn: 4 })
    expect([...standing.covered]).toEqual(['2026-09-15'])
    expect([...standing.uncovered]).toEqual([])
  })

  it('gives it back when the skip is taken back', () => {
    const task = habit('2026-09-14', ['2026-09-14', '2026-09-15'])
    const skipped = skipOccurrence(task, WED_16)

    expect(restsOf(skipped, LIMITED, WED_16).left).toBe(0)
    expect(restsOf(unskipToday(skipped, WED_16), LIMITED, WED_16).left).toBe(1)
  })

  it('leaves a skip with no rest to pay for it uncovered, and ends the run there (HAB-40)', () => {
    // Skipped Mon 14 and Tue 15: the one rest pays for Monday alone.
    const task = habit('2026-09-12', ['2026-09-12', '2026-09-13', '2026-09-16'], ['2026-09-14', '2026-09-15'])
    const standing = restsOf(task, LIMITED, WED_16)

    expect([...standing.covered]).toEqual(['2026-09-14'])
    expect([...standing.uncovered]).toEqual(['2026-09-15'])
    expect(standing).toMatchObject({ left: 0, nextIn: 6 })
  })

  it('counts only the skips from the day the limit was switched on', () => {
    // Skipped Sat 12 and Sun 13 before the limit, Tue 15 after it.
    const task = habit('2026-09-10', ['2026-09-10', '2026-09-11', '2026-09-14'], ['2026-09-12', '2026-09-13', '2026-09-15'])
    const standing = restsOf(task, { since: '2026-09-14' }, WED_16)

    expect([...standing.covered]).toEqual(['2026-09-15'])
    expect([...standing.uncovered]).toEqual([])
    expect(standing.left).toBe(0)
  })

  it('reads a day done after all as done, not as a skip (RPT-36)', () => {
    const task = habit('2026-09-14', ['2026-09-14', '2026-09-15'], ['2026-09-15'])

    expect(restsOf(task, LIMITED, WED_16)).toMatchObject({ left: 1, nextIn: 5 })
  })
})

describe('canRest (HAB-36, HAB-38)', () => {
  it('lets a habit skip while it has a rest', () => {
    const task = habit('2026-09-14', ['2026-09-14', '2026-09-15'])

    expect(canRest(task, LIMITED, WED_16)).toBe(true)
    expect(isOutOfRests(task, LIMITED, WED_16)).toBe(false)
  })

  it('turns the skip down once none is left', () => {
    // Monday's skip spent the one rest.
    const task = habit('2026-09-13', ['2026-09-13', '2026-09-15'], ['2026-09-14'])

    expect(canRest(task, LIMITED, WED_16)).toBe(false)
    expect(isOutOfRests(task, LIMITED, WED_16)).toBe(true)
  })

  it('lets any habit skip while the limit is off', () => {
    const task = habit('2026-09-13', ['2026-09-13', '2026-09-15'], ['2026-09-14'])

    expect(canRest(task, null, WED_16)).toBe(true)
    expect(isOutOfRests(task, null, WED_16)).toBe(false)
  })

  it('leaves a task that is not a habit its unlimited skips (RPT-34)', () => {
    const weekly = {
      ...createTask('water the plants', { kind: 'weekly', weekdays: [3] }, new Date(2026, 8, 1, 8, 0)),
      skippedDays: ['2026-09-02', '2026-09-09'],
    }

    expect(canRest(weekly, LIMITED, WED_16)).toBe(true)
    expect(isOutOfRests(weekly, LIMITED, WED_16)).toBe(false)
  })

  it('offers nothing where there is nothing to skip', () => {
    const resting = habit('2026-09-14', ['2026-09-14'], ['2026-09-16'])

    expect(canRest(resting, null, WED_16)).toBe(false)
    expect(isOutOfRests(resting, LIMITED, WED_16)).toBe(false)
  })
})
