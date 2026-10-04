import { describe, expect, it } from 'vitest'
import {
  bonusKeyAvailable,
  dailyKeyTime,
  anyKeyAvailable,
  keysOpened,
  KEY_HOUR_EARLIEST,
  KEY_HOUR_LATEST,
  nextKeyTime,
} from './caseKey'
import { CASE_DAILY_ID, CASE_TODAY_ID, CASE_WEEK_ID, DEFAULT_CASES } from './cases'
import type { RewardEntry } from './reward'
import { completeTask, createTask, setDueDate, type Task } from './task'

const WED_16 = new Date(2026, 8, 16, 9, 0)
const THU_17 = new Date(2026, 8, 17, 9, 0)
const MON_14 = new Date(2026, 8, 14, 5, 0)

function today(title: string, done = false): Task {
  const task = setDueDate(createTask(title, null, WED_16), '2026-09-17')
  return done ? completeTask(task, THU_17) : task
}

function earned(taskId: string, day: string, points: number): RewardEntry {
  return { taskId, day, points }
}

describe('dailyKeyTime', () => {
  it('is deterministic: the same day always yields the same time', () => {
    const a = dailyKeyTime('2026-09-17')
    const b = dailyKeyTime('2026-09-17')
    expect(a.getTime()).toBe(b.getTime())
  })

  it('falls within the allowed hour range', () => {
    for (let i = 0; i < 100; i++) {
      const day = `2026-09-${String((i % 28) + 1).padStart(2, '0')}`
      const time = dailyKeyTime(day)
      expect(time.getHours()).toBeGreaterThanOrEqual(KEY_HOUR_EARLIEST)
      expect(time.getHours()).toBeLessThanOrEqual(KEY_HOUR_LATEST)
    }
  })

  it('is different for different days', () => {
    const times = new Set<number>()
    for (let i = 0; i < 30; i++) {
      const day = `2026-09-${String(i + 1).padStart(2, '0')}`
      times.add(dailyKeyTime(day).getTime())
    }
    // Most days should have different times (not guaranteed all, but highly likely)
    expect(times.size).toBeGreaterThan(15)
  })

  it('returns a Date at the correct day', () => {
    const time = dailyKeyTime('2026-09-17')
    expect(time.getFullYear()).toBe(2026)
    expect(time.getMonth()).toBe(8) // September (0-indexed)
    expect(time.getDate()).toBe(17)
  })
})

describe('keysOpened', () => {
  it('counts only cases entries for today', () => {
    const entries = [
      earned(CASE_TODAY_ID, '2026-09-17', 12),
      earned(CASE_DAILY_ID, '2026-09-17', 5),
      earned(CASE_TODAY_ID, '2026-09-16', 8),
      earned('task-1', '2026-09-17', 3),
    ]
    expect(keysOpened(entries, THU_17)).toBe(2)
  })

  it('returns 0 when no cases entries exist', () => {
    expect(keysOpened([], THU_17)).toBe(0)
  })

  it('counts Monday’s Weekly among the cases opened that day', () => {
    const entries = [earned(CASE_WEEK_ID, '2026-09-14', 4), earned(CASE_TODAY_ID, '2026-09-14', 1)]
    expect(keysOpened(entries, MON_14)).toBe(2)
  })
})

describe('bonusKeyAvailable', () => {
  it('is false before the bonus time has passed', () => {
    const before = new Date(2026, 8, 17, 5, 0) // Before KEY_HOUR_EARLIEST
    expect(bonusKeyAvailable([], before)).toBe(false)
  })

  it('is true after the bonus time has passed and bonus not opened', () => {
    const day = '2026-09-17'
    const bonusTime = dailyKeyTime(day)
    const after = new Date(bonusTime.getTime() + 60_000) // One minute after
    expect(bonusKeyAvailable([], after)).toBe(true)
  })

  it('is false when both keys have been opened', () => {
    const entries = [
      earned(CASE_TODAY_ID, '2026-09-17', 12),
      earned(CASE_DAILY_ID, '2026-09-17', 5),
    ]
    const after = new Date(2026, 8, 17, 23, 0)
    expect(bonusKeyAvailable(entries, after)).toBe(false)
  })
})

describe('nextKeyTime', () => {
  it('returns null when the daily case has been opened', () => {
    const entries = [earned(CASE_DAILY_ID, '2026-09-17', 5)]
    const result = nextKeyTime([], entries, DEFAULT_CASES, THU_17)
    expect(result).toBeNull()
  })

  it('returns the bonus time when no keys opened and bonus time has not passed', () => {
    const before = new Date(2026, 8, 17, 5, 0)
    const result = nextKeyTime([], [], DEFAULT_CASES, before)
    expect(result).not.toBeNull()
    expect(result?.way).toBe('daily')
  })

  it('returns the bonus time when one key opened', () => {
    const entries = [earned(CASE_TODAY_ID, '2026-09-17', 12)]
    const result = nextKeyTime([], entries, DEFAULT_CASES, THU_17)
    expect(result).not.toBeNull()
    expect(result?.way).toBe('daily')
  })

  it('returns null once the daily case can be opened, there being nothing left to count', () => {
    const after = new Date(2026, 8, 17, 23, 0)
    expect(nextKeyTime([], [], DEFAULT_CASES, after)).toBeNull()
  })
})

describe('anyKeyAvailable', () => {
  it('is true when the day is clear', () => {
    const tasks = [today('pack', true)]
    expect(anyKeyAvailable(tasks, [], DEFAULT_CASES, THU_17)).toBe(true)
  })

  it('is true when the bonus time has passed', () => {
    const after = new Date(2026, 8, 17, 23, 0)
    expect(anyKeyAvailable([], [], DEFAULT_CASES, after)).toBe(true)
  })

  it('is false when neither condition is met', () => {
    const before = new Date(2026, 8, 17, 5, 0)
    expect(anyKeyAvailable([], [], DEFAULT_CASES, before)).toBe(false)
  })

  it('is false when both keys have been opened', () => {
    const entries = [
      earned(CASE_TODAY_ID, '2026-09-17', 12),
      earned(CASE_DAILY_ID, '2026-09-17', 5),
    ]
    const tasks = [today('pack', true)]
    expect(anyKeyAvailable(tasks, entries, DEFAULT_CASES, THU_17)).toBe(false)
  })

  it('is true on Monday morning, Weekly being ready before the Drop (CHST-30)', () => {
    expect(anyKeyAvailable([], [], DEFAULT_CASES, MON_14)).toBe(true)
  })

  it('is false on Monday once Weekly is open and nothing else is ready', () => {
    const entries = [earned(CASE_WEEK_ID, '2026-09-14', 4)]
    expect(anyKeyAvailable([], entries, DEFAULT_CASES, MON_14)).toBe(false)
  })
})
