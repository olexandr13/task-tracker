import { describe, expect, it } from 'vitest'
import { toLocalDay } from './day'
import {
  DEFAULT_NUDGE_WINDOW,
  DEFAULT_QUIET_HOURS,
  findNudge,
  isNudgeWindow,
  isQuietEnough,
  isQuietHours,
  isWithinNudgeWindow,
  lastFinishedAt,
  nudgeWindowOpenedAt,
  pickMostImportant,
  quietSince,
  QUIET_HOURS,
  settleNudge,
} from './nudge'
import { appendTask } from './order'
import { completeTask, createTask, setDueDate, type Task } from './task'
import { setUrgent } from './urgent'

/*
 * NUDGE ids refer to wiki/nudges.md. Local dates on purpose: overdue is read
 * against the local day. September 2026: Tue 15, Wed 16.
 */

const WED_16_NOON = new Date(2026, 8, 16, 12, 0)
const WED_16 = toLocalDay(WED_16_NOON)
const TUE_15 = toLocalDay(new Date(2026, 8, 15, 12, 0))

function hoursBefore(now: Date, hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000)
}

function withOrder(tasks: Task[]): Task[] {
  return tasks.reduce<Task[]>((list, task) => appendTask(list, task), [])
}

/** A task due today, made at `at`, still to do. */
function due(title: string, at: Date = WED_16_NOON): Task {
  return setDueDate(createTask(title, null, at), WED_16)
}

describe('the span', () => {
  it('offers whole hours and defaults to a couple of them', () => {
    expect(QUIET_HOURS).toEqual([1, 2, 3, 4])
    expect(DEFAULT_QUIET_HOURS).toBe(2)
  })

  it('knows a span it offers from anything else', () => {
    expect(isQuietHours(2)).toBe(true)
    expect(isQuietHours(5)).toBe(false)
    expect(isQuietHours('2')).toBe(false)
    expect(isQuietHours(null)).toBe(false)
  })
})

describe('the hours it may speak in', () => {
  const at = (hour: number, minute = 0) => new Date(2026, 8, 16, hour, minute)

  it('keeps to waking hours by default, and knows a window from anything else', () => {
    expect(DEFAULT_NUDGE_WINDOW).toEqual({ from: '09:00', to: '22:00' })
    expect(isNudgeWindow(DEFAULT_NUDGE_WINDOW)).toBe(true)
    expect(isNudgeWindow({ from: '09:00', to: '24:00' })).toBe(false)
    expect(isNudgeWindow({ from: '09:00' })).toBe(false)
    expect(isNudgeWindow('09:00–22:00')).toBe(false)
    expect(isNudgeWindow(null)).toBe(false)
  })

  it('speaks at any hour while there are none to keep to (NUDGE-12)', () => {
    expect(isWithinNudgeWindow(null, at(3))).toBe(true)
    expect(nudgeWindowOpenedAt(null, at(3))).toBeNull()
  })

  it('is inside from its first minute up to its last (NUDGE-12)', () => {
    const day = { from: '09:00', to: '22:00' } as const

    expect(isWithinNudgeWindow(day, at(8, 59))).toBe(false)
    expect(isWithinNudgeWindow(day, at(9))).toBe(true)
    expect(isWithinNudgeWindow(day, at(21, 59))).toBe(true)
    // The end is the moment it shuts, not the last minute it is open.
    expect(isWithinNudgeWindow(day, at(22))).toBe(false)
  })

  it('runs past midnight where its end comes before its start (NUDGE-12)', () => {
    const night = { from: '22:00', to: '07:00' } as const

    expect(isWithinNudgeWindow(night, at(23))).toBe(true)
    expect(isWithinNudgeWindow(night, at(3))).toBe(true)
    expect(isWithinNudgeWindow(night, at(7))).toBe(false)
    expect(isWithinNudgeWindow(night, at(12))).toBe(false)
  })

  it('shuts no hour out where both its ends are the same (NUDGE-12)', () => {
    const whole = { from: '09:00', to: '09:00' } as const

    expect(isWithinNudgeWindow(whole, at(9))).toBe(true)
    expect(isWithinNudgeWindow(whole, at(3))).toBe(true)
  })

  it('opens today, or yesterday while today’s opening is still to come (NUDGE-13)', () => {
    const day = { from: '09:00', to: '22:00' } as const

    expect(nudgeWindowOpenedAt(day, at(12))).toEqual(at(9))
    // Three in the morning is inside last night’s window, which opened yesterday.
    expect(nudgeWindowOpenedAt({ from: '22:00', to: '07:00' }, at(3))).toEqual(new Date(2026, 8, 15, 22, 0))
    expect(nudgeWindowOpenedAt(day, at(9))).toEqual(at(9))
  })
})

describe('lastFinishedAt', () => {
  it('is null when nothing has ever been finished', () => {
    expect(lastFinishedAt([due('write')], WED_16_NOON)).toBeNull()
    expect(lastFinishedAt([], WED_16_NOON)).toBeNull()
  })

  it('is the most recent completion among the tasks (NUDGE-2)', () => {
    const early = completeTask(due('wash'), hoursBefore(WED_16_NOON, 5))
    const late = completeTask(due('call'), hoursBefore(WED_16_NOON, 1))
    expect(lastFinishedAt([early, late], WED_16_NOON)?.getHours()).toBe(11)
  })

  it('reads a completion from the future as work just done (NUDGE-2)', () => {
    const ahead = completeTask(due('call'), new Date(2026, 8, 16, 18, 0))
    expect(lastFinishedAt([ahead], WED_16_NOON)).toEqual(WED_16_NOON)
  })

  it('passes over a completion whose stamp cannot be read', () => {
    const broken: Task = { ...due('call'), status: 'done', completedAt: 'not a time' }
    expect(lastFinishedAt([broken], WED_16_NOON)).toBeNull()
  })
})

describe('quietSince', () => {
  const watchingSince = hoursBefore(WED_16_NOON, 1)

  it('measures from the last thing finished (NUDGE-2)', () => {
    const finishedAt = hoursBefore(WED_16_NOON, 3)
    expect(quietSince({ finishedAt, nudgedAt: null, watchingSince, openedAt: null })).toEqual(finishedAt)
  })

  it('measures from when this device started watching when nothing was ever finished (NUDGE-3)', () => {
    expect(quietSince({ finishedAt: null, nudgedAt: null, watchingSince, openedAt: null })).toEqual(watchingSince)
  })

  it('starts again from a nudge already shown (NUDGE-6)', () => {
    const nudgedAt = hoursBefore(WED_16_NOON, 1)
    const finishedAt = hoursBefore(WED_16_NOON, 4)
    expect(quietSince({ finishedAt, nudgedAt, watchingSince, openedAt: null })).toEqual(nudgedAt)
  })

  it('leaves a nudge older than the last completion alone (NUDGE-6)', () => {
    const nudgedAt = hoursBefore(WED_16_NOON, 4)
    const finishedAt = hoursBefore(WED_16_NOON, 1)
    expect(quietSince({ finishedAt, nudgedAt, watchingSince, openedAt: null })).toEqual(finishedAt)
  })

  it('starts again from the hours opening, so a night is not counted (NUDGE-13)', () => {
    const openedAt = hoursBefore(WED_16_NOON, 3)
    const finishedAt = hoursBefore(WED_16_NOON, 14)
    expect(quietSince({ finishedAt, nudgedAt: null, watchingSince, openedAt })).toEqual(openedAt)
  })

  it('leaves an opening older than the last completion alone (NUDGE-13)', () => {
    const openedAt = hoursBefore(WED_16_NOON, 3)
    const finishedAt = hoursBefore(WED_16_NOON, 1)
    expect(quietSince({ finishedAt, nudgedAt: null, watchingSince, openedAt })).toEqual(finishedAt)
  })
})

describe('isQuietEnough', () => {
  const watchingSince = hoursBefore(WED_16_NOON, 9)

  it('waits for the whole span, then says so (NUDGE-1)', () => {
    const almost = { finishedAt: hoursBefore(WED_16_NOON, 2), nudgedAt: null, watchingSince, openedAt: null }
    expect(isQuietEnough(almost, 3, WED_16_NOON)).toBe(false)
    expect(isQuietEnough(almost, 2, WED_16_NOON)).toBe(true)
    expect(isQuietEnough(almost, 1, WED_16_NOON)).toBe(true)
  })

  it('counts the span to the moment it is reached (NUDGE-1)', () => {
    const exactly = { finishedAt: hoursBefore(WED_16_NOON, 2), nudgedAt: null, watchingSince, openedAt: null }
    expect(isQuietEnough(exactly, 2, WED_16_NOON)).toBe(true)
    expect(isQuietEnough(exactly, 2, new Date(WED_16_NOON.getTime() - 1))).toBe(false)
  })

  it('is never quiet on a clock that has run backwards', () => {
    const ahead = { finishedAt: new Date(2026, 8, 16, 18, 0), nudgedAt: null, watchingSince, openedAt: null }
    expect(isQuietEnough(ahead, 1, WED_16_NOON)).toBe(false)
  })
})

describe('pickMostImportant', () => {
  it('is null when there is nothing left to do (NUDGE-5)', () => {
    expect(pickMostImportant([], WED_16_NOON)).toBeNull()
    expect(pickMostImportant([completeTask(due('call'), WED_16_NOON)], WED_16_NOON)).toBeNull()
  })

  it('leads with the overdue (NUDGE-4)', () => {
    const today = due('write')
    const late = setDueDate(createTask('taxes', null, new Date(2026, 8, 15, 9, 0)), TUE_15)
    expect(pickMostImportant(withOrder([today, late]), WED_16_NOON)?.title).toBe('taxes')
  })

  it('takes urgent next (NUDGE-4)', () => {
    const plain = due('write')
    const urgent = setUrgent(due('call'), true)
    expect(pickMostImportant(withOrder([plain, urgent]), WED_16_NOON)?.title).toBe('call')
  })

  it('otherwise takes the top of the list, where the owner put it (NUDGE-4)', () => {
    const first = due('write')
    const second = due('call')
    expect(pickMostImportant(withOrder([first, second]), WED_16_NOON)?.title).toBe('write')
  })

  it('passes over what is already done (NUDGE-5)', () => {
    const done = completeTask(due('write'), WED_16_NOON)
    const open = due('call')
    expect(pickMostImportant(withOrder([done, open]), WED_16_NOON)?.title).toBe('call')
  })
})

describe('findNudge', () => {
  const watchingSince = hoursBefore(WED_16_NOON, 9)
  const quiet = { finishedAt: hoursBefore(WED_16_NOON, 3), nudgedAt: null, watchingSince, openedAt: null }

  it('names the task to pick up once the quiet has run (NUDGE-1, NUDGE-4)', () => {
    const tasks = withOrder([due('write'), setUrgent(due('call'), true)])
    expect(findNudge(tasks, quiet, 2, null, WED_16_NOON)).toMatchObject({ title: 'call', quietHours: 2 })
  })

  it('says nothing before the span has run (NUDGE-1)', () => {
    expect(findNudge(withOrder([due('write')]), quiet, 4, null, WED_16_NOON)).toBeNull()
  })

  it('says nothing when there is nothing left to do (NUDGE-5)', () => {
    const done = withOrder([completeTask(due('write'), hoursBefore(WED_16_NOON, 3))])
    expect(findNudge(done, quiet, 2, null, WED_16_NOON)).toBeNull()
  })

  it('says nothing outside the hours it may speak in (NUDGE-12)', () => {
    const tasks = withOrder([due('write')])
    const night = { from: '22:00', to: '07:00' } as const

    expect(findNudge(tasks, quiet, 2, night, WED_16_NOON)).toBeNull()
    // The same quiet stretch, inside hours that are open at noon.
    expect(findNudge(tasks, quiet, 2, { from: '09:00', to: '22:00' }, WED_16_NOON)).not.toBeNull()
  })

  it('counts the span from the opening rather than from the night before (NUDGE-13)', () => {
    const tasks = withOrder([due('write')])
    const day = { from: '09:00', to: '22:00' } as const
    // Nothing finished since yesterday evening, and the hours opened at nine.
    const overnight = {
      finishedAt: new Date(2026, 8, 15, 20, 0),
      nudgedAt: null,
      watchingSince: hoursBefore(WED_16_NOON, 9),
      openedAt: nudgeWindowOpenedAt(day, new Date(2026, 8, 16, 10, 0)),
    }

    expect(findNudge(tasks, overnight, 2, day, new Date(2026, 8, 16, 10, 0))).toBeNull()
    expect(findNudge(tasks, overnight, 2, day, WED_16_NOON)).not.toBeNull()
  })
})

describe('settleNudge', () => {
  const standing = { quietHours: 2 } as const

  it('has nothing to say when no nudge is standing', () => {
    expect(settleNudge(null, [due('write')], null, WED_16_NOON)).toBeNull()
  })

  it('names the task it fired on, reading its title afresh (NUDGE-8)', () => {
    const write = due('write')
    const renamed = { ...write, title: 'write it up' }
    expect(settleNudge({ ...standing, taskId: write.id }, [renamed], null, WED_16_NOON)).toMatchObject({
      title: 'write it up',
      quietHours: 2,
    })
  })

  it('goes once its task is done (NUDGE-8)', () => {
    const write = due('write')
    const done = completeTask(write, WED_16_NOON)
    expect(settleNudge({ ...standing, taskId: write.id }, [done], null, WED_16_NOON)).toBeNull()
  })

  it('goes once its task is out of the list (NUDGE-8)', () => {
    expect(settleNudge({ ...standing, taskId: 'gone' }, [due('write')], null, WED_16_NOON)).toBeNull()
  })

  it('goes once work has happened since it fired — nothing done being all it said (NUDGE-8)', () => {
    const write = due('write')
    const nudgedAt = hoursBefore(WED_16_NOON, 2)
    const since = completeTask(due('wash'), hoursBefore(WED_16_NOON, 1))
    expect(settleNudge({ ...standing, taskId: write.id }, [write, since], nudgedAt, WED_16_NOON)).toBeNull()
  })

  it('stands while the only work was before it fired (NUDGE-8)', () => {
    const write = due('write')
    const nudgedAt = hoursBefore(WED_16_NOON, 1)
    const before = completeTask(due('wash'), hoursBefore(WED_16_NOON, 3))
    expect(settleNudge({ ...standing, taskId: write.id }, [write, before], nudgedAt, WED_16_NOON)).not.toBeNull()
  })
})
