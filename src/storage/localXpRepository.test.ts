// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import type { XpProgress } from '../core'
import { clearGuestXp, createLocalXpRepository, loadGuestXpProgress } from './localXpRepository'

/* Where the guest's XP stands on this device. STORE ids refer to wiki/storage.md. */

afterEach(() => {
  clearGuestXp()
  localStorage.clear()
})

describe('createLocalXpRepository (STORE-37, STORE-64)', () => {
  it('begins at nothing, adds to it, and counts the days gone by, kept across a fresh repository', async () => {
    await createLocalXpRepository().begin('2026-10-01')
    await createLocalXpRepository().add({ xp: 5, adds: { on: '2026-10-02', count: 3 } })
    await createLocalXpRepository().settle((stored) => ({ xp: stored.xp - 12, settledThrough: '2026-10-01' }))

    const seen: (XpProgress | null)[] = []
    createLocalXpRepository().subscribe((progress) => {
      seen.push(progress)
    }, () => {})

    expect(seen.at(-1)).toEqual({ xp: -2, startedOn: '2026-10-01', settledThrough: '2026-10-01', addsOn: '2026-10-02', adds: 3 })
  })

  it('lifts the XP kept to the least it may be, and never lowers it (LVL-17)', async () => {
    const repository = createLocalXpRepository()
    await repository.begin('2026-10-01')
    await repository.add({ xp: -40, adds: null })
    await repository.lift(-10)
    expect(loadGuestXpProgress()).toMatchObject({ xp: -10 })

    await repository.lift(-20)
    expect(loadGuestXpProgress()).toMatchObject({ xp: -10 })
  })

  it('does not begin again once begun, nor take on another’s from elsewhere', async () => {
    const repository = createLocalXpRepository()
    await repository.begin('2026-10-01')
    await repository.add({ xp: 7, adds: null })
    await repository.begin('2026-10-05')
    await repository.importProgress({ xp: 100, startedOn: '2026-09-01', settledThrough: null, addsOn: null, adds: 0 })

    expect(loadGuestXpProgress()).toMatchObject({ xp: 7, startedOn: '2026-10-01' })
  })

  it('moves in what version 1 kept as guest, and lets it go (STORE-5)', async () => {
    localStorage.setItem('task-tracker/guest/xp-start', JSON.stringify({ version: 1, name: 'start', startedOn: '2026-10-01', settledThrough: null }))
    localStorage.setItem(
      'task-tracker/guest/xp',
      JSON.stringify({ records: { 'add:a': { version: 1, record: { key: 'add:a', day: '2026-10-01', xp: 1 } } } }),
    )

    await createLocalXpRepository().begin('2026-10-05')

    expect(loadGuestXpProgress()).toEqual({ xp: 1, startedOn: '2026-10-01', settledThrough: null, addsOn: null, adds: 0 })
    expect(localStorage.getItem('task-tracker/guest/xp')).toBeNull()
  })
})
