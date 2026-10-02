// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createActivityEntry, type ActivityEntry } from '../core'
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
