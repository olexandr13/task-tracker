import { describe, expect, it } from 'vitest'
import { createTask, toLocalDay } from '../core'
import { noticeKey, standingNotices, type NoticeSources } from './standingNotices'

/* NOTIF ids refer to wiki/notifications.md. */

const NOW = new Date(2026, 9, 12, 14, 5)
const write = createTask('write', null, NOW)
const read = createTask('read', null, NOW)

const NOTHING: NoticeSources = {
  tasks: [write, read],
  drop: false,
  haul: false,
  goal: null,
  reminders: [],
  checkIn: null,
  nudge: null,
  on: { cases: true, checkIn: true, nudge: true },
}

const EVERYTHING: NoticeSources = {
  ...NOTHING,
  drop: true,
  haul: true,
  goal: { taskId: read.id, title: 'read' },
  reminders: [
    { taskId: write.id, title: 'write', at: new Date(2026, 9, 12, 13, 0) },
    { taskId: read.id, title: 'read', at: new Date(2026, 9, 12, 14, 0) },
  ],
  checkIn: { slot: { day: toLocalDay(NOW), hour: 13 }, others: 2 },
  nudge: { taskId: write.id, title: 'write', quietHours: 2 },
}

describe('standingNotices', () => {
  it('is empty with nothing standing (NOTIF-3)', () => {
    expect(standingNotices(NOTHING)).toEqual([])
  })

  it('lists every notice standing, in the order the screen shows them (NOTIF-3)', () => {
    expect(standingNotices(EVERYTHING).map((notice) => notice.kind)).toEqual([
      'drop',
      'haul',
      'goal',
      'reminder',
      'reminder',
      'check-in',
      'nudge',
    ])
  })

  it('leaves out the notices of a part that is switched off (NOTIF-3)', () => {
    const kinds = standingNotices({ ...EVERYTHING, on: { cases: false, checkIn: false, nudge: false } }).map(
      (notice) => notice.kind,
    )
    expect(kinds).toEqual(['goal', 'reminder', 'reminder'])
  })

  it('leaves out a notice whose task is gone, as its toast does (NOTIF-3)', () => {
    const kinds = standingNotices({ ...EVERYTHING, tasks: [read] }).map((notice) => notice.kind)
    expect(kinds).toEqual(['drop', 'haul', 'goal', 'reminder', 'check-in'])
  })

  it('keeps each notice under a name of its own (NOTIF-3)', () => {
    const keys = standingNotices(EVERYTHING).map(noticeKey)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
