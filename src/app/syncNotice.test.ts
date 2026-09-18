import { describe, expect, it } from 'vitest'
import type { SyncState } from '../storage/syncMonitor'
import { IN_SYNC, nextSyncView, type SyncEvent, type SyncView } from './syncNotice'

/* What the screen says about changes reaching the server. OFF ids refer to wiki/offline.md. */

const OFFLINE: SyncState = { online: false, pending: false }
const OFFLINE_PENDING: SyncState = { online: false, pending: true }
const PENDING: SyncState = { online: true, pending: true }
const CAUGHT_UP: SyncState = { online: true, pending: false }

function state(value: SyncState): SyncEvent {
  return { type: 'state', state: value }
}

function run(...events: SyncEvent[]): SyncView {
  return events.reduce(nextSyncView, IN_SYNC)
}

describe('nextSyncView', () => {
  it('says nothing online and caught up (OFF-7)', () => {
    expect(run(state(CAUGHT_UP)).notice).toBeNull()
  })

  it('says offline at once, with or without changes waiting (OFF-4)', () => {
    expect(run(state(OFFLINE)).notice).toBe('offline')
    expect(run(state(OFFLINE_PENDING)).notice).toBe('offline')
    expect(run(state(PENDING), state(OFFLINE_PENDING)).notice).toBe('offline')
  })

  it('says nothing about an ordinary change online until it is slow (OFF-7, OFF-5)', () => {
    expect(run(state(PENDING)).notice).toBeNull()
    expect(run(state(PENDING), state(CAUGHT_UP)).notice).toBeNull()
    expect(run(state(PENDING), { type: 'slow' }).notice).toBe('syncing')
  })

  it('ignores a slow clock that is out of date (OFF-5)', () => {
    expect(run(state(PENDING), state(CAUGHT_UP), { type: 'slow' }).notice).toBeNull()
    expect(run(state(OFFLINE_PENDING), { type: 'slow' }).notice).toBe('offline')
  })

  it('says syncing straight after being offline while changes are still on their way (OFF-5)', () => {
    expect(run(state(OFFLINE_PENDING), state(PENDING)).notice).toBe('syncing')
  })

  it('says synced once everything has landed after offline or syncing (OFF-6)', () => {
    expect(run(state(OFFLINE_PENDING), state(PENDING), state(CAUGHT_UP)).notice).toBe('synced')
    expect(run(state(OFFLINE), state(CAUGHT_UP)).notice).toBe('synced')
    expect(run(state(PENDING), { type: 'slow' }, state(CAUGHT_UP)).notice).toBe('synced')
  })

  it('takes synced down when its time is up, and not before (OFF-6)', () => {
    const synced = run(state(OFFLINE), state(CAUGHT_UP))
    expect(nextSyncView(synced, state(CAUGHT_UP)).notice).toBe('synced')
    expect(nextSyncView(synced, { type: 'settled' }).notice).toBeNull()
  })

  it('takes synced down as soon as a new change makes it untrue (OFF-6)', () => {
    expect(run(state(OFFLINE), state(CAUGHT_UP), state(PENDING)).notice).toBeNull()
  })

  it('ignores a settled clock once something else is said (OFF-6)', () => {
    expect(run(state(OFFLINE), state(CAUGHT_UP), state(OFFLINE), { type: 'settled' }).notice).toBe('offline')
  })
})
