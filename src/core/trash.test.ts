import { describe, expect, it } from 'vitest'
import { createTask, deleteTask, type Task } from './task'
import { TRASH_RETENTION_MS, isExpired, liveTasks, msUntilPurge, purgeExpired, trashedTasks } from './trash'

const NOW = new Date('2026-09-15T10:00:00.000Z')
const JUST_INSIDE = new Date(NOW.getTime() + TRASH_RETENTION_MS - 1)
const ON_THE_BOUNDARY = new Date(NOW.getTime() + TRASH_RETENTION_MS)

/** A task created and deleted at the same moment, which is the usual case here. */
function trashed(moment: Date, title = 'a task'): Task {
  return deleteTask(createTask(title, null, moment), moment)
}

describe('msUntilPurge', () => {
  it('gives the whole window at the moment of deletion', () => {
    expect(msUntilPurge(trashed(NOW), NOW)).toBe(TRASH_RETENTION_MS)
  })

  it('counts down as the window runs out', () => {
    expect(msUntilPurge(trashed(NOW), JUST_INSIDE)).toBe(1)
  })

  it('never reads below zero, however long ago the window closed', () => {
    expect(msUntilPurge(trashed(NOW), new Date(NOW.getTime() + TRASH_RETENTION_MS * 10))).toBe(0)
  })

  it('is zero for a task that is not in the trash at all', () => {
    expect(msUntilPurge(createTask('a task', null, NOW), NOW)).toBe(0)
  })
})

describe('isExpired', () => {
  it('keeps a task with time still left on it', () => {
    expect(isExpired(trashed(NOW), JUST_INSIDE)).toBe(false)
  })

  it('expires it the moment the window closes', () => {
    expect(isExpired(trashed(NOW), ON_THE_BOUNDARY)).toBe(true)
  })

  it('never expires a task that was never deleted, however old it is', () => {
    const old = createTask('a task', null, NOW)

    expect(isExpired(old, new Date(NOW.getTime() + TRASH_RETENTION_MS * 100))).toBe(false)
  })
})

describe('purgeExpired', () => {
  it('drops what has run out and keeps everything else', () => {
    const live = createTask('still here', null, NOW)
    const recent = trashed(NOW, 'just deleted')
    const stale = trashed(new Date(NOW.getTime() - TRASH_RETENTION_MS), 'long gone')

    expect(purgeExpired([live, recent, stale], NOW)).toEqual([live, recent])
  })

  it('leaves a list with nothing to purge alone', () => {
    const tasks = [createTask('still here', null, NOW), trashed(NOW)]

    expect(purgeExpired(tasks, NOW)).toEqual(tasks)
  })
})

describe('liveTasks', () => {
  it('is everything not in the trash', () => {
    const live = createTask('still here', null, NOW)

    expect(liveTasks([live, trashed(NOW)])).toEqual([live])
  })
})

describe('trashedTasks', () => {
  it('is what the trash holds, most recently deleted first', () => {
    const older = trashed(new Date(NOW.getTime() - 60_000), 'older')
    const newer = trashed(NOW, 'newer')
    const live = createTask('still here', null, NOW)

    expect(trashedTasks([older, live, newer], NOW).map((task) => task.title)).toEqual(['newer', 'older'])
  })

  it('hides a task whose window has closed, even where storage still holds it', () => {
    expect(trashedTasks([trashed(NOW)], ON_THE_BOUNDARY)).toEqual([])
  })
})
