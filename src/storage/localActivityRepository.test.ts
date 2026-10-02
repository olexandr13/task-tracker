// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createActivityEntry, type ActivityEntry } from '../core'
import { clearGuestActivities, createLocalActivityRepository, loadGuestActivities } from './localActivityRepository'

/* The guest's activity log on this device. STORE ids refer to wiki/storage.md. */

afterEach(() => {
  clearGuestActivities()
  localStorage.clear()
})

const AT = new Date('2026-10-02T12:00:00.000Z')

describe('createLocalActivityRepository (STORE-37, STORE-51)', () => {
  it('keeps records across a fresh repository, and takes out one removed', async () => {
    const work = { ...createActivityEntry('Work', 2700, { day: '2026-10-02', hour: 9 }, AT), id: 'work' }
    const call = { ...createActivityEntry('Call', 1800, { day: '2026-10-02', hour: 10 }, AT), id: 'call' }
    await createLocalActivityRepository().save({ saved: [work, call], removed: [] })
    await createLocalActivityRepository().save({ saved: [], removed: [work] })

    const seen: ActivityEntry[][] = []
    createLocalActivityRepository().subscribe((entries) => {
      seen.push(entries)
    }, () => {})

    expect(seen.at(-1)).toEqual([call])
    expect(loadGuestActivities()).toEqual([call])
  })

  it('keeps a record moved to another day as the one record', async () => {
    const call = createActivityEntry('Call', 1800, { day: '2026-10-01', hour: 10 }, AT)
    const moved = { ...call, day: '2026-10-02' }
    await createLocalActivityRepository().save({ saved: [call], removed: [] })
    await createLocalActivityRepository().save({ saved: [moved], removed: [call] })

    expect(loadGuestActivities()).toEqual([moved])
  })
})
