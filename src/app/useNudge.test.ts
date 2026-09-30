// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectConsole } from '../test/consoleGuard'
import { completeTask, createTask, DEFAULT_NUDGE_WINDOW, setDueDate, toLocalDay, type Task } from '../core'
import {
  NUDGE_UNSPOKEN,
  type NudgeDeviceRepository,
  type NudgeDeviceState,
} from '../storage/nudgeDeviceRepository'
import { NUDGE_OFF, type NudgePreference, type NudgeRepository } from '../storage/nudgeRepository'
import { useNudge } from './useNudge'

/* NUDGE ids refer to wiki/nudges.md. */

const NOON = new Date(2026, 8, 16, 12, 0)
const WED_16 = toLocalDay(NOON)

/** The nudge as it is once turned on: the default span, at any hour. */
function watching(over: Partial<NudgePreference> = {}): NudgePreference {
  return { ...NUDGE_OFF, on: true, ...over }
}

/** The account's setting, answering at once as a device already holding it does. */
function account(initial: NudgePreference = NUDGE_OFF): NudgeRepository & { saved: () => NudgePreference } {
  let saved = initial
  const listeners = new Set<(preference: NudgePreference | null) => void>()
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
    async importNudge() {
      // Nothing to move in a test.
    },
    saved: () => saved,
  }
}

/** What this device remembers: when it last spoke here, and the notice standing. */
function here(initial: NudgeDeviceState = NUDGE_UNSPOKEN): NudgeDeviceRepository & { saved: () => NudgeDeviceState } {
  let saved = initial
  return {
    load: () => saved,
    save: (next) => { saved = next },
    saved: () => saved,
  }
}

function due(title: string): Task {
  return setDueDate(createTask(title, null, NOON), WED_16)
}

/** A task finished `hours` ago, so the quiet is measured from then. */
function finished(title: string, hours: number): Task {
  return completeTask(due(title), new Date(NOON.getTime() - hours * 60 * 60 * 1000))
}

function allowNotifications(): ReturnType<typeof vi.fn> {
  const NotificationMock = vi.fn()
  Object.defineProperty(NotificationMock, 'permission', { value: 'granted', configurable: true })
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useNudge', () => {
  it('says nothing while it is off (NUDGE-9)', () => {
    vi.useFakeTimers({ now: NOON })
    const tasks = [finished('wash', 5), due('write')]
    const setting = account()
    const device = here()

    const { result } = renderHook(() => useNudge(setting, device, tasks))

    expect(result.current.notice).toBeNull()
  })

  it('names the task to pick up once the quiet has run (NUDGE-1, NUDGE-4)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    const tasks = [finished('wash', 5), due('write')]
    const setting = account(watching({ quietHours: 2 }))
    const device = here()

    const { result } = renderHook(() => useNudge(setting, device, tasks))

    expect(result.current.notice).toMatchObject({ title: 'write', quietHours: 2 })
    expect(notify).toHaveBeenCalledTimes(1)
  })

  it('waits for the setting rather than reading it as off (MODE-8, STORE-46)', () => {
    vi.useFakeTimers({ now: NOON })
    // An account that has not answered yet, as one on a slow connection has not.
    const silent: NudgeRepository = {
      subscribe: () => () => undefined,
      save: async () => undefined,
      importNudge: async () => undefined,
    }

    const device = here()
    const { result } = renderHook(() => useNudge(silent, device, [due('write')]))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.preference).toEqual(NUDGE_OFF)
  })

  it('does not nudge again on a refresh inside the same quiet stretch (NUDGE-6)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    const setting = account(watching({ quietHours: 2 }))
    const device = here()
    const tasks = [finished('wash', 5), due('write')]

    const first = renderHook(() => useNudge(setting, device, tasks))
    expect(first.result.current.notice).not.toBeNull()
    expect(device.saved().nudgedAt).toBe(NOON.toISOString())

    // The same device opening again inside the same quiet stretch.
    first.unmount()
    renderHook(() => useNudge(setting, device, tasks))
    expect(notify).toHaveBeenCalledTimes(1)
    expect(device.saved().nudgedAt).toBe(NOON.toISOString())
  })

  it('keeps a notice that has already spent its quiet stretch through a remount (NUDGE-8)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const setting = account(watching({ quietHours: 2 }))
    const device = here()
    const tasks = [finished('wash', 5), due('write')]

    const first = renderHook(() => useNudge(setting, device, tasks))
    expect(first.result.current.notice).toMatchObject({ title: 'write' })

    // Firing is what spends the stretch, so a notice lost to a remount would be
    // a nudge paid for and never seen.
    first.unmount()
    const again = renderHook(() => useNudge(setting, device, tasks))
    expect(again.result.current.notice).toMatchObject({ title: 'write' })
  })

  it('takes the notice away once its task is done (NUDGE-8)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const setting = account(watching({ quietHours: 2 }))
    const device = here()
    const write = due('write')

    const { result, rerender } = renderHook(({ tasks }) => useNudge(setting, device, tasks), {
      initialProps: { tasks: [finished('wash', 5), write] as Task[] },
    })
    expect(result.current.notice).toMatchObject({ title: 'write' })

    rerender({ tasks: [finished('wash', 5), completeTask(write, NOON)] })

    expect(result.current.notice).toBeNull()
  })

  it('says it again once another whole span has gone by (NUDGE-6)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    const tasks = [finished('wash', 5), due('write')]
    const setting = account(watching({ quietHours: 1 }))
    const device = here()

    renderHook(() => useNudge(setting, device, tasks))
    expect(notify).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(61 * 60 * 1000) })
    expect(notify).toHaveBeenCalledTimes(2)
  })

  it('says nothing while the tasks are still loading (NUDGE-5)', () => {
    vi.useFakeTimers({ now: NOON })

    const setting = account(watching({ quietHours: 2 }))
    const device = here()

    const { result } = renderHook(() => useNudge(setting, device, null))

    expect(result.current.notice).toBeNull()
  })

  it('says nothing when there is nothing left to do (NUDGE-5)', () => {
    vi.useFakeTimers({ now: NOON })

    const setting = account(watching({ quietHours: 2 }))
    const device = here()

    const { result } = renderHook(() => useNudge(setting, device, [finished('wash', 5)]))

    expect(result.current.notice).toBeNull()
  })

  it('starts the quiet from the moment it is turned on (NUDGE-7)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const setting = account()
    const device = here()
    const tasks = [finished('wash', 5), due('write')]

    const { result } = renderHook(() => useNudge(setting, device, tasks))
    act(() => { result.current.turnOn(true) })

    // Five quiet hours were already behind it; being turned on is where it starts.
    expect(result.current.notice).toBeNull()
    expect(setting.saved()).toMatchObject({ on: true })
    expect(device.saved().nudgedAt).toBe(NOON.toISOString())
  })

  it('starts the quiet here too when it is turned on somewhere else (NUDGE-7, STORE-46)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    const setting = account()
    const device = here()
    const tasks = [finished('wash', 5), due('write')]

    // The app has been open with the nudge off, and five hours have gone quiet.
    const { result } = renderHook(() => useNudge(setting, device, tasks))
    expect(result.current.notice).toBeNull()

    // Turned on at the phone: the span asked for is a span from here as well.
    act(() => { void setting.save(watching({ quietHours: 2 })) })

    expect(result.current.preference.on).toBe(true)
    expect(result.current.notice).toBeNull()
    expect(notify).not.toHaveBeenCalled()
  })

  it('keeps the span and takes the notice away when turned off (NUDGE-9)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const setting = account(watching({ quietHours: 2 }))
    const device = here()
    const tasks = [finished('wash', 5), due('write')]
    const { result } = renderHook(() => useNudge(setting, device, tasks))
    expect(result.current.notice).not.toBeNull()

    act(() => { result.current.turnOn(false) })

    expect(result.current.notice).toBeNull()
    expect(setting.saved()).toMatchObject({ on: false, quietHours: 2 })
    expect(device.saved()).toEqual(NUDGE_UNSPOKEN)
  })

  it('shows on screen even where the browser will not post a notification (NUDGE-10)', () => {
    vi.useFakeTimers({ now: NOON })
    vi.stubGlobal('Notification', undefined)
    const tasks = [finished('wash', 5), due('write')]
    const setting = account(watching({ quietHours: 2 }))
    const device = here()

    const { result } = renderHook(() => useNudge(setting, device, tasks))

    expect(result.current.notice).toMatchObject({ title: 'write' })
    expect(result.current.permission).toBe('unavailable')
  })

  it('a dismissed notice stays dismissed, through a refresh as well (NUDGE-8)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const setting = account(watching({ quietHours: 2 }))
    const device = here()
    const tasks = [finished('wash', 5), due('write')]
    const { result, unmount } = renderHook(() => useNudge(setting, device, tasks))

    act(() => { result.current.dismiss() })
    expect(result.current.notice).toBeNull()

    act(() => { vi.advanceTimersByTime(60 * 1000) })
    expect(result.current.notice).toBeNull()

    unmount()
    const again = renderHook(() => useNudge(setting, device, tasks))
    expect(again.result.current.notice).toBeNull()
  })

  it('says nothing outside the hours it may speak in (NUDGE-12)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    // Noon is outside the night, so the same quiet stretch says nothing.
    const setting = account(watching({ quietHours: 2, window: { from: '22:00', to: '07:00' } }))
    const device = here()
    const tasks = [finished('wash', 5), due('write')]

    const { result } = renderHook(() => useNudge(setting, device, tasks))

    expect(result.current.notice).toBeNull()
    expect(notify).not.toHaveBeenCalled()
  })

  it('counts the quiet from the hours opening, not from before them (NUDGE-13)', () => {
    // Ten in the morning, with the hours open since nine and nothing finished
    // since last night: the span runs from nine, so there is nothing to answer yet.
    const TEN = new Date(2026, 8, 16, 10, 0)
    vi.useFakeTimers({ now: TEN })
    allowNotifications()
    const setting = account(watching({ quietHours: 2, window: DEFAULT_NUDGE_WINDOW }))
    const device = here()
    const tasks = [completeTask(due('wash'), new Date(2026, 8, 15, 20, 0)), due('write')]

    const { result } = renderHook(() => useNudge(setting, device, tasks))
    expect(result.current.notice).toBeNull()

    // Eleven, a whole span after the hours opened.
    act(() => { vi.advanceTimersByTime(61 * 60 * 1000) })
    expect(result.current.notice).toMatchObject({ title: 'write' })
  })

  it('takes on hours and gives them up again (NUDGE-12)', () => {
    vi.useFakeTimers({ now: NOON })
    const setting = account(watching({ quietHours: 2 }))
    const device = here({ nudgedAt: NOON.toISOString(), standing: null })
    const { result } = renderHook(() => useNudge(setting, device, [due('write')]))

    act(() => { result.current.changeWindow(DEFAULT_NUDGE_WINDOW) })
    expect(result.current.preference.window).toEqual(DEFAULT_NUDGE_WINDOW)
    expect(setting.saved().window).toEqual(DEFAULT_NUDGE_WINDOW)

    act(() => { result.current.changeWindow(null) })
    expect(setting.saved().window).toBeNull()
  })

  it('changes the span it waits for, whether it is on or off (NUDGE-9, MODE-12)', () => {
    vi.useFakeTimers({ now: NOON })
    const setting = account()
    const device = here()
    const { result } = renderHook(() => useNudge(setting, device, [due('write')]))

    act(() => { result.current.changeQuietHours(4) })

    expect(result.current.preference.quietHours).toBe(4)
    expect(setting.saved().quietHours).toBe(4)
  })

  it('says a refused load and a refused save (STORE-13)', async () => {
    vi.useFakeTimers({ now: NOON })
    const report = vi.fn()
    const refusing: NudgeRepository = {
      subscribe: (_onPreference, onError) => { onError(new Error('no')); return () => undefined },
      save: () => Promise.reject(new Error('no')),
      importNudge: async () => undefined,
    }
    expectConsole('Could not load the nudge setting.', 'Could not save the nudge setting.')

    const device = here()
    const { result } = renderHook(() => useNudge(refusing, device, [due('write')], report))
    expect(report).toHaveBeenCalledWith('load')

    await act(async () => { result.current.changeQuietHours(4) })
    expect(report).toHaveBeenCalledWith('save')
  })
})
