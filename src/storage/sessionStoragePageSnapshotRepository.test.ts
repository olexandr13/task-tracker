// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { sessionStoragePageSnapshotRepository } from './sessionStoragePageSnapshotRepository'

/* STORE-68 and UI-86 refer to wiki/storage.md and wiki/interface.md. */

const KEY = 'task-tracker/page-snapshot'

const SNAPSHOT = { address: '/#/today', day: '2026-10-22', phone: true, html: '<main>Water the plants</main>' }

afterEach(() => {
  sessionStorage.removeItem(KEY)
})

describe('sessionStoragePageSnapshotRepository', () => {
  it('keeps the page across a load after save', () => {
    sessionStoragePageSnapshotRepository.save(SNAPSHOT)
    expect(sessionStoragePageSnapshotRepository.load()).toEqual(SNAPSHOT)
  })

  it('forgets the page when saved as nothing', () => {
    sessionStoragePageSnapshotRepository.save(SNAPSHOT)
    sessionStoragePageSnapshotRepository.save(null)
    expect(sessionStoragePageSnapshotRepository.load()).toBeNull()
  })

  it('keeps no page too long to be worth keeping, nor the one before it', () => {
    sessionStoragePageSnapshotRepository.save(SNAPSHOT)
    sessionStoragePageSnapshotRepository.save({ ...SNAPSHOT, html: 'x'.repeat(2_000_001) })
    expect(sessionStoragePageSnapshotRepository.load()).toBeNull()
  })

  it('drops versions it does not know and anything it cannot read', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ ...SNAPSHOT, version: 2 }))
    expect(sessionStoragePageSnapshotRepository.load()).toBeNull()
    sessionStorage.setItem(KEY, JSON.stringify({ ...SNAPSHOT, version: 1, phone: 'yes' }))
    expect(sessionStoragePageSnapshotRepository.load()).toBeNull()
    sessionStorage.setItem(KEY, '{not json')
    expect(sessionStoragePageSnapshotRepository.load()).toBeNull()
  })
})
