// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, DEFAULT_NUDGE_WINDOW, setDueDate, toLocalDay, type Task } from '../core'
import { NUDGE_RESTING, type NudgeRepository, type NudgeSetting } from '../storage/nudgeRepository'
import { useNudge } from './useNudge'

/* NUDGE ids refer to wiki/nudges.md. */

const NOON = new Date(2026, 8, 16, 12, 0)
const WED_16 = toLocalDay(NOON)

/** The nudge as it is once turned on: the default span, at any hour, nothing said yet. */
function watching(over: Partial<NudgeSetting> = {}): NudgeSetting {
  return { ...NUDGE_RESTING, on: true, ...over }
}

function memory(initial: NudgeSetting = NUDGE_RESTING): NudgeRepository & { saved: () => NudgeSetting } {
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
    const repo = memory()
    const tasks = [finished('wash', 5), due('write')]

    const { result } = renderHook(() => useNudge(repo, tasks))

    expect(result.current.notice).toBeNull()
  })

  it('names the task to pick up once the quiet has run (NUDGE-1, NUDGE-4)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    const repo = memory(watching({ quietHours: 2 }))
    const tasks = [finished('wash', 5), due('write')]

    const { result } = renderHook(() => useNudge(repo, tasks))

    expect(result.current.notice).toMatchObject({ title: 'write', quietHours: 2 })
    expect(notify).toHaveBeenCalledTimes(1)
  })

  it('does not nudge again on a refresh inside the same quiet stretch (NUDGE-6)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    const repo = memory(watching({ quietHours: 2 }))
    const tasks = [finished('wash', 5), due('write')]

    const first = renderHook(() => useNudge(repo, tasks))
    expect(first.result.current.notice).not.toBeNull()
    expect(repo.saved().nudgedAt).toBe(NOON.toISOString())

    // The same device opening again inside the same quiet stretch.
    first.unmount()
    const again = renderHook(() => useNudge(repo, tasks))
    expect(notify).toHaveBeenCalledTimes(1)
    expect(again.result.current.setting.nudgedAt).toBe(NOON.toISOString())
  })

  it('keeps a notice that has already spent its quiet stretch through a remount (NUDGE-8)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const repo = memory(watching({ quietHours: 2 }))
    const tasks = [finished('wash', 5), due('write')]

    const first = renderHook(() => useNudge(repo, tasks))
    expect(first.result.current.notice).toMatchObject({ title: 'write' })

    // Firing is what spends the stretch, so a notice lost to a remount would be
    // a nudge paid for and never seen.
    first.unmount()
    const again = renderHook(() => useNudge(repo, tasks))
    expect(again.result.current.notice).toMatchObject({ title: 'write' })
  })

  it('takes the notice away once its task is done (NUDGE-8)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const repo = memory(watching({ quietHours: 2 }))
    const write = due('write')

    const { result, rerender } = renderHook(({ tasks }) => useNudge(repo, tasks), {
      initialProps: { tasks: [finished('wash', 5), write] as Task[] },
    })
    expect(result.current.notice).toMatchObject({ title: 'write' })

    rerender({ tasks: [finished('wash', 5), completeTask(write, NOON)] })

    expect(result.current.notice).toBeNull()
  })

  it('says it again once another whole span has gone by (NUDGE-6)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    const repo = memory(watching({ quietHours: 1 }))
    const tasks = [finished('wash', 5), due('write')]

    renderHook(() => useNudge(repo, tasks))
    expect(notify).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(61 * 60 * 1000) })
    expect(notify).toHaveBeenCalledTimes(2)
  })

  it('says nothing while the tasks are still loading (NUDGE-5)', () => {
    vi.useFakeTimers({ now: NOON })
    const repo = memory(watching({ quietHours: 2 }))

    const { result } = renderHook(() => useNudge(repo, null))

    expect(result.current.notice).toBeNull()
  })

  it('says nothing when there is nothing left to do (NUDGE-5)', () => {
    vi.useFakeTimers({ now: NOON })
    const repo = memory(watching({ quietHours: 2 }))

    const { result } = renderHook(() => useNudge(repo, [finished('wash', 5)]))

    expect(result.current.notice).toBeNull()
  })

  it('starts the quiet from the moment it is turned on (NUDGE-7)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const repo = memory()
    const tasks = [finished('wash', 5), due('write')]

    const { result } = renderHook(() => useNudge(repo, tasks))
    act(() => { result.current.turnOn(true) })

    // Five quiet hours were already behind it; being turned on is where it starts.
    expect(result.current.notice).toBeNull()
    expect(repo.saved()).toMatchObject({ on: true, nudgedAt: NOON.toISOString() })
  })

  it('keeps the span and takes the notice away when turned off (NUDGE-9)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const repo = memory(watching({ quietHours: 2 }))
    const tasks = [finished('wash', 5), due('write')]
    const { result } = renderHook(() => useNudge(repo, tasks))
    expect(result.current.notice).not.toBeNull()

    act(() => { result.current.turnOn(false) })

    expect(result.current.notice).toBeNull()
    expect(repo.saved()).toMatchObject({ on: false, quietHours: 2 })
  })

  it('shows on screen even where the browser will not post a notification (NUDGE-10)', () => {
    vi.useFakeTimers({ now: NOON })
    vi.stubGlobal('Notification', undefined)
    const repo = memory(watching({ quietHours: 2 }))
    const tasks = [finished('wash', 5), due('write')]

    const { result } = renderHook(() => useNudge(repo, tasks))

    expect(result.current.notice).toMatchObject({ title: 'write' })
    expect(result.current.permission).toBe('unavailable')
  })

  it('a dismissed notice stays dismissed, through a refresh as well (NUDGE-8)', () => {
    vi.useFakeTimers({ now: NOON })
    allowNotifications()
    const repo = memory(watching({ quietHours: 2 }))
    const tasks = [finished('wash', 5), due('write')]
    const { result, unmount } = renderHook(() => useNudge(repo, tasks))

    act(() => { result.current.dismiss() })
    expect(result.current.notice).toBeNull()

    act(() => { vi.advanceTimersByTime(60 * 1000) })
    expect(result.current.notice).toBeNull()

    unmount()
    const again = renderHook(() => useNudge(repo, tasks))
    expect(again.result.current.notice).toBeNull()
  })

  it('says nothing outside the hours it may speak in (NUDGE-12)', () => {
    vi.useFakeTimers({ now: NOON })
    const notify = allowNotifications()
    // Noon is outside the night, so the same quiet stretch says nothing.
    const repo = memory(watching({ quietHours: 2, window: { from: '22:00', to: '07:00' } }))
    const tasks = [finished('wash', 5), due('write')]

    const { result } = renderHook(() => useNudge(repo, tasks))

    expect(result.current.notice).toBeNull()
    expect(notify).not.toHaveBeenCalled()
  })

  it('counts the quiet from the hours opening, not from before them (NUDGE-13)', () => {
    // Ten in the morning, with the hours open since nine and nothing finished
    // since last night: the span runs from nine, so there is nothing to answer yet.
    const TEN = new Date(2026, 8, 16, 10, 0)
    vi.useFakeTimers({ now: TEN })
    allowNotifications()
    const repo = memory(watching({ quietHours: 2, window: DEFAULT_NUDGE_WINDOW }))
    const tasks = [completeTask(due('wash'), new Date(2026, 8, 15, 20, 0)), due('write')]

    const { result } = renderHook(() => useNudge(repo, tasks))
    expect(result.current.notice).toBeNull()

    // Eleven, a whole span after the hours opened.
    act(() => { vi.advanceTimersByTime(61 * 60 * 1000) })
    expect(result.current.notice).toMatchObject({ title: 'write' })
  })

  it('takes on hours and gives them up again (NUDGE-12)', () => {
    vi.useFakeTimers({ now: NOON })
    const repo = memory(watching({ quietHours: 2, nudgedAt: NOON.toISOString() }))
    const { result } = renderHook(() => useNudge(repo, [due('write')]))

    act(() => { result.current.changeWindow(DEFAULT_NUDGE_WINDOW) })
    expect(result.current.setting.window).toEqual(DEFAULT_NUDGE_WINDOW)
    expect(repo.saved().window).toEqual(DEFAULT_NUDGE_WINDOW)

    act(() => { result.current.changeWindow(null) })
    expect(repo.saved().window).toBeNull()
  })

  it('changes the span it waits for (NUDGE-9)', () => {
    vi.useFakeTimers({ now: NOON })
    const repo = memory(watching({ quietHours: 2, nudgedAt: NOON.toISOString() }))
    const { result } = renderHook(() => useNudge(repo, [due('write')]))

    act(() => { result.current.changeQuietHours(4) })

    expect(result.current.setting.quietHours).toBe(4)
    expect(repo.saved().quietHours).toBe(4)
  })
})
