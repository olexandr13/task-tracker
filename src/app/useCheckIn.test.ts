// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createActivityEntry, type ActivityEntry } from '../core'
import { CHECK_IN_DEVICE_NEW, type CheckInDeviceRepository, type CheckInDeviceState } from '../storage/checkInDeviceRepository'
import { CHECK_IN_OFF, type CheckInPreference, type CheckInRepository } from '../storage/checkInRepository'
import { useCheckIn } from './useCheckIn'

/* The check-in on the device. CHECKIN ids refer to wiki/check-ins.md. */

const ON: CheckInPreference = { ...CHECK_IN_OFF, on: true }

/** A log with nothing in it, the same one every render. */
const NOTHING: readonly ActivityEntry[] = []

/** The account's setting, answering at once as a device already holding it does. */
function account(initial: CheckInPreference = CHECK_IN_OFF): CheckInRepository & { saved: () => CheckInPreference } {
  let saved = initial
  const listeners = new Set<(preference: CheckInPreference | null) => void>()
  return {
    subscribe(onPreference) {
      listeners.add(onPreference)
      onPreference(saved)
      return () => listeners.delete(onPreference)
    },
    async save(next) {
      saved = next
      for (const listener of listeners) listener(next)
    },
    async importCheckIn() {
      // Nothing to move in a test.
    },
    saved: () => saved,
  }
}

function here(initial: CheckInDeviceState = CHECK_IN_DEVICE_NEW): CheckInDeviceRepository & { saved: () => CheckInDeviceState } {
  let saved = initial
  return { load: () => saved, save: (next) => { saved = next }, saved: () => saved }
}

function allowNotifications(): ReturnType<typeof vi.fn> {
  const NotificationMock = vi.fn()
  Object.defineProperty(NotificationMock, 'permission', { value: 'granted', configurable: true })
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

function logged(hour: number): ActivityEntry {
  return createActivityEntry('Work', 3600, { day: '2026-10-02', hour }, new Date(2026, 9, 2, 14, 30))
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useCheckIn', () => {
  it('asks nothing while it is off (CHECKIN-1)', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 2, 15, 20) })
    const posted = allowNotifications()
    const setting = account()
    const device = here()
    const { result } = renderHook(() => useCheckIn(setting, device, NOTHING))

    expect(result.current.notice).toBeNull()
    act(() => { vi.advanceTimersByTime(60 * 60 * 1000) })
    expect(posted).not.toHaveBeenCalled()
  })

  it('asks about the hour that ended at the top of the hour, once, by notice and notification (CHECKIN-3, CHECKIN-5)', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 30, 23, 0) })
    vi.setSystemTime(new Date(2026, 9, 2, 14, 59, 30))
    const posted = allowNotifications()
    const setting = account(ON)
    const device = here()
    const { result } = renderHook(() => useCheckIn(setting, device, NOTHING))

    expect(result.current.notice?.slot).toEqual({ day: '2026-10-02', hour: 13 })
    act(() => { vi.advanceTimersByTime(31 * 1000) })

    expect(result.current.notice?.slot).toEqual({ day: '2026-10-02', hour: 14 })
    expect(posted).toHaveBeenCalledExactlyOnceWith('What did you do 14:00–15:00?', {
      body: 'Log it in PickMe’s Activity log.',
      tag: 'check-in-2026-10-02T14',
    })

    act(() => { vi.advanceTimersByTime(10 * 60 * 1000) })
    expect(posted).toHaveBeenCalledOnce()
  })

  it('says nothing of an hour already logged, or outside the hours kept to (CHECKIN-2, CHECKIN-3)', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 2, 14, 59, 30) })
    const posted = allowNotifications()
    const setting = account(ON)
    const device = here()
    const entries = [logged(14)]
    const { result } = renderHook(() => useCheckIn(setting, device, entries))

    act(() => { vi.advanceTimersByTime(31 * 1000) })
    expect(result.current.notice).toBeNull()
    expect(posted).not.toHaveBeenCalled()
  })

  it('shows an hour that ended while the app was closed, but posts nothing for it (CHECKIN-5)', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 2, 15, 20) })
    const posted = allowNotifications()
    const setting = account(ON)
    const device = here()
    const { result } = renderHook(() => useCheckIn(setting, device, NOTHING))

    act(() => { vi.advanceTimersByTime(60 * 1000) })
    expect(result.current.notice).toEqual({ slot: { day: '2026-10-02', hour: 14 }, others: 5 })
    expect(posted).not.toHaveBeenCalled()
  })

  it('leaves the notification to the sender on a device it pushes to (CHECKIN-10)', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 2, 14, 59, 30) })
    const posted = allowNotifications()
    const device = here({ dismissedSlot: null, pushDeviceId: 'phone', pushOn: true })
    const setting = account(ON)
    const { result } = renderHook(() => useCheckIn(setting, device, NOTHING))

    act(() => { vi.advanceTimersByTime(31 * 1000) })
    expect(result.current.notice?.slot.hour).toBe(14)
    expect(posted).not.toHaveBeenCalled()
  })

  it('waits for the log before spending an hour, so one that ended while it loaded is still said (CHECKIN-5)', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 2, 14, 59, 30) })
    const posted = allowNotifications()
    const setting = account(ON)
    const device = here()
    const { result, rerender } = renderHook(({ entries }) => useCheckIn(setting, device, entries), {
      initialProps: { entries: null as readonly ActivityEntry[] | null },
    })

    act(() => { vi.advanceTimersByTime(31 * 1000) })
    expect(result.current.notice).toBeNull()
    expect(posted).not.toHaveBeenCalled()

    rerender({ entries: NOTHING })
    act(() => { vi.advanceTimersByTime(30 * 1000) })
    expect(posted).toHaveBeenCalledOnce()
  })

  it('puts the notice away when dismissed, on this device, until the next hour asks (CHECKIN-4)', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 2, 15, 20) })
    const device = here()
    const setting = account(ON)
    const { result } = renderHook(() => useCheckIn(setting, device, NOTHING))

    act(() => { result.current.dismiss() })
    expect(result.current.notice).toBeNull()
    expect(device.saved().dismissedSlot).toBe('2026-10-02T14')

    act(() => { vi.advanceTimersByTime(45 * 60 * 1000) })
    expect(result.current.notice?.slot.hour).toBe(15)
  })

  it('keeps the setting in the account, and asks the browser when turned on (CHECKIN-2, CHECKIN-9)', async () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 2, 15, 20) })
    allowNotifications()
    const setting = account()
    const device = here()
    const { result } = renderHook(() => useCheckIn(setting, device, NOTHING))

    await act(async () => { result.current.turnOn(true) })
    expect(setting.saved()).toEqual(ON)
    expect(result.current.permission).toBe('granted')

    act(() => { result.current.changeWindow({ from: '08:00', to: '20:00' }) })
    expect(setting.saved()).toEqual({ on: true, window: { from: '08:00', to: '20:00' } })
  })
})
