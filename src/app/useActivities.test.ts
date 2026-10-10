// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createActivityEntry, createTask, logTime, type ActivityEntry } from '../core'
import type { ActivityChanges, ActivityRepository } from '../storage/activityRepository'
import { expectConsole } from '../test/consoleGuard'
import { useActivities } from './useActivities'

/* Holding the activity log. ACT ids refer to wiki/activity-log.md, STORE ids to wiki/storage.md. */

const SLOT = { day: '2026-10-02', hour: 14 }

function fakeRepository(initial: ActivityEntry[] = [], saveFails = false) {
  const saved: ActivityChanges[] = []
  const repository: ActivityRepository = {
    subscribe(onEntries) {
      onEntries(initial)
      return () => {}
    },
    save(changes) {
      saved.push(changes)
      return saveFails ? Promise.reject(new Error('permission denied')) : Promise.resolve()
    },
  }
  return { repository, saved }
}

describe('useActivities', () => {
  it('adds a record, spelled as the activity already is (ACT-2, ACT-4)', () => {
    const reading = createActivityEntry('Reading', 900, SLOT)
    const { repository, saved } = fakeRepository([reading])
    const { result } = renderHook(() => useActivities(repository))

    act(() => { result.current.add('reading', 600, { day: '2026-10-02', hour: 15 }) })

    expect(result.current.entries).toHaveLength(2)
    expect(result.current.entries[1]).toMatchObject({ activity: 'Reading', seconds: 600, hour: 15 })
    expect(saved).toEqual([{ saved: [result.current.entries[1]], removed: [] }])
  })

  it('changes a record and takes one out, writing only what changed (ACT-10, ACT-11, STORE-51)', () => {
    const work = createActivityEntry('Work', 2700, SLOT)
    const call = createActivityEntry('Call', 1800, SLOT)
    const { repository, saved } = fakeRepository([work, call])
    const { result } = renderHook(() => useActivities(repository))

    act(() => { result.current.change(work.id, { activity: 'Work', seconds: 3600, hour: 13 }) })
    act(() => { result.current.remove(call.id) })

    expect(result.current.entries).toEqual([{ ...work, seconds: 3600, hour: 13, loggedAt: expect.any(String) as string }])
    expect(saved[1]).toEqual({ saved: [], removed: [call] })
  })

  it('builds changes made in one go on each other (STORE-39)', () => {
    const { repository } = fakeRepository()
    const { result } = renderHook(() => useActivities(repository))

    act(() => {
      result.current.add('Work', 1800, SLOT)
      result.current.add('Reading', 900, SLOT)
    })

    expect(result.current.entries.map((entry) => entry.activity)).toEqual(['Work', 'Reading'])
  })

  it('writes the time sessions on tasks took up, and takes it out with the session (ACT-21)', () => {
    const work = createActivityEntry('Work', 900, SLOT)
    const { repository, saved } = fakeRepository([work])
    const { result } = renderHook(() => useActivities(repository))
    const task = logTime(createTask('work'), 30, new Date(2026, 9, 2, 11, 10))
    const [session] = task.timeLog

    act(() => { result.current.addSessions([{ task, entry: session }]) })

    const made = result.current.entries.slice(1)
    expect(made.map(({ activity, hour, seconds }) => ({ activity, hour, seconds }))).toEqual([
      { activity: 'Work', hour: 10, seconds: 1200 },
      { activity: 'Work', hour: 11, seconds: 600 },
    ])
    expect(saved).toEqual([{ saved: made, removed: [] }])

    act(() => { result.current.removeSession(session.id) })

    expect(result.current.entries).toEqual([work])
    expect(saved[1]).toEqual({ saved: [], removed: made })
  })

  it('writes a session’s records again once its length is changed, unless they were taken out (TIME-24)', () => {
    const work = createActivityEntry('Work', 900, SLOT)
    const { repository, saved } = fakeRepository([work])
    const { result } = renderHook(() => useActivities(repository))
    const task = logTime(createTask('work'), 30, new Date(2026, 9, 2, 11, 10))
    const [session] = task.timeLog
    act(() => { result.current.addSessions([{ task, entry: session }]) })
    const made = result.current.entries.slice(1)

    act(() => { result.current.resizeSessions([{ task, entry: { ...session, seconds: 5 * 60 } }]) })

    const remade = result.current.entries.slice(1)
    expect(remade.map(({ hour, seconds }) => ({ hour, seconds }))).toEqual([{ hour: 11, seconds: 300 }])
    expect(saved[1]).toEqual({ saved: remade, removed: made })

    act(() => { result.current.remove(remade[0].id) })
    act(() => { result.current.resizeSessions([{ task, entry: { ...session, seconds: 20 * 60 } }]) })

    expect(result.current.entries).toEqual([work])
    expect(saved).toHaveLength(3)
  })

  it('puts a record taken out back, for the undo (ACT-11)', () => {
    const work = createActivityEntry('Work', 2700, SLOT)
    const { repository } = fakeRepository([work])
    const { result } = renderHook(() => useActivities(repository))

    act(() => { result.current.remove(work.id) })
    act(() => { result.current.restore(work) })

    expect(result.current.entries).toEqual([work])
  })

  it('says so when a save is refused (STORE-13)', async () => {
    expectConsole('Could not save the activity log.')
    const onProblem = vi.fn()
    const { repository } = fakeRepository([], true)
    const { result } = renderHook(() => useActivities(repository, onProblem))

    await act(async () => { result.current.add('Work', 60, SLOT) })

    expect(onProblem).toHaveBeenCalledWith('save')
  })
})
