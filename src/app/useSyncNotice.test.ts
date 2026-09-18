// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SyncMonitor, SyncState } from '../storage/syncMonitor'
import { useSyncNotice } from './useSyncNotice'

/* The clocks behind the sync notice. OFF ids refer to wiki/offline.md; the rules
   themselves are tested in syncNotice.test.ts. */

const OFFLINE_PENDING: SyncState = { online: false, pending: true }
const PENDING: SyncState = { online: true, pending: true }
const CAUGHT_UP: SyncState = { online: true, pending: false }

function fakeMonitor(initial: SyncState) {
  let onState: ((state: SyncState) => void) | null = null
  const monitor: SyncMonitor = {
    subscribe(listener) {
      onState = listener
      listener(initial)
      return () => { onState = null }
    },
  }
  return {
    monitor,
    report(state: SyncState) {
      act(() => { onState?.(state) })
    },
    isSubscribed: () => onState !== null,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useSyncNotice', () => {
  it('says nothing about a change online that lands within two seconds (OFF-7)', () => {
    const fake = fakeMonitor(CAUGHT_UP)
    const { result } = renderHook(() => useSyncNotice(fake.monitor))

    fake.report(PENDING)
    act(() => { vi.advanceTimersByTime(1900) })
    fake.report(CAUGHT_UP)
    act(() => { vi.advanceTimersByTime(5000) })

    expect(result.current).toBeNull()
  })

  it('says syncing once a change online has taken two seconds, then synced for three (OFF-5, OFF-6)', () => {
    const fake = fakeMonitor(CAUGHT_UP)
    const { result } = renderHook(() => useSyncNotice(fake.monitor))

    fake.report(PENDING)
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current).toBe('syncing')

    fake.report(CAUGHT_UP)
    expect(result.current).toBe('synced')

    act(() => { vi.advanceTimersByTime(2900) })
    expect(result.current).toBe('synced')
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBeNull()
  })

  it('carries a change made offline through to synced (OFF-4, OFF-5, OFF-6)', () => {
    const fake = fakeMonitor(OFFLINE_PENDING)
    const { result } = renderHook(() => useSyncNotice(fake.monitor))
    expect(result.current).toBe('offline')

    act(() => { vi.advanceTimersByTime(60_000) })
    expect(result.current).toBe('offline')

    fake.report(PENDING)
    expect(result.current).toBe('syncing')

    fake.report(CAUGHT_UP)
    expect(result.current).toBe('synced')
  })

  it('stops listening when the screen goes', () => {
    const fake = fakeMonitor(CAUGHT_UP)
    const { unmount } = renderHook(() => useSyncNotice(fake.monitor))

    unmount()

    expect(fake.isSubscribed()).toBe(false)
  })
})
