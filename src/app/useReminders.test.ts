// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, setDueDate, setDueTime, toLocalDay, type Task } from '../core'
import { useReminders } from './useReminders'

/* REM ids refer to wiki/reminders.md. */

const NINE = new Date(2026, 8, 16, 9, 0)
const BEFORE = new Date(2026, 8, 16, 8, 59, 30)
const WED_16 = toLocalDay(NINE)

/**
 * A one-off due today at `time`. Built once and held still by each test: a task
 * made inside the render function would be a different task, with a different
 * id, on every render, and a standing notice would lose sight of it.
 */
function at(time: string, title = 'write'): Task {
  return setDueTime(setDueDate(createTask(title, null, BEFORE), WED_16), time)
}

function allowNotifications(): ReturnType<typeof vi.fn> {
  const NotificationMock = vi.fn()
  Object.defineProperty(NotificationMock, 'permission', { value: 'granted', configurable: true })
  vi.stubGlobal('Notification', NotificationMock)
  return NotificationMock
}

/** Runs the clock past the hook's tick, so it reads the clock again. */
async function tick() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(31 * 1000)
  })
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useReminders', () => {
  it('says nothing while no hour has come round (REM-1)', async () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 16, 8, 58, 0) })
    const notify = allowNotifications()

    const tasks = [at('09:00')]
    const { result } = renderHook(() => useReminders(tasks))
    expect(result.current.notices).toEqual([])

    // A tick still short of nine.
    await tick()
    expect(result.current.notices).toEqual([])
    expect(notify).not.toHaveBeenCalled()
  })

  it('names the task once its hour strikes, on screen and to the browser (REM-1, REM-6)', async () => {
    vi.useFakeTimers({ now: BEFORE })
    const notify = allowNotifications()

    const tasks = [at('09:00')]
    const { result } = renderHook(() => useReminders(tasks))
    vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 5))
    await tick()

    expect(result.current.notices).toMatchObject([{ title: 'write', at: NINE }])
    expect(notify).toHaveBeenCalledWith('Due now', { body: '“write”' })
  })

  it('says it once, not again on every tick (REM-2)', async () => {
    vi.useFakeTimers({ now: BEFORE })
    const notify = allowNotifications()

    const tasks = [at('09:00')]
    const { result } = renderHook(() => useReminders(tasks))
    vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 5))
    await tick()
    vi.setSystemTime(new Date(2026, 8, 16, 9, 1, 0))
    await tick()

    expect(result.current.notices).toHaveLength(1)
    expect(notify).toHaveBeenCalledTimes(1)
  })

  it('says nothing about an hour that went by before it started watching (REM-3)', async () => {
    // Opening the app in the evening: the morning's hours are simply overdue.
    vi.useFakeTimers({ now: new Date(2026, 8, 16, 18, 0) })
    const notify = allowNotifications()

    const tasks = [at('09:00')]
    const { result } = renderHook(() => useReminders(tasks))
    await tick()

    expect(result.current.notices).toEqual([])
    expect(notify).not.toHaveBeenCalled()
  })

  it('leaves the stretch unspent while the tasks are still loading (REM-2)', async () => {
    vi.useFakeTimers({ now: BEFORE })
    allowNotifications()
    const tasks = [at('09:00')]

    const { result, rerender } = renderHook(({ loaded }: { loaded: boolean }) => useReminders(loaded ? tasks : null), {
      initialProps: { loaded: false },
    })
    vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 5))
    await tick()
    expect(result.current.notices).toEqual([])

    // The hour struck while they were arriving, so it is still said once they are here.
    rerender({ loaded: true })
    await tick()
    expect(result.current.notices).toMatchObject([{ title: 'write' }])
  })

  it('takes the notice away once its task is done (REM-5)', async () => {
    vi.useFakeTimers({ now: BEFORE })
    allowNotifications()
    const task = at('09:00')

    const { result, rerender } = renderHook(({ tasks }: { tasks: Task[] }) => useReminders(tasks), {
      initialProps: { tasks: [task] },
    })
    vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 5))
    await tick()
    expect(result.current.notices).toHaveLength(1)

    rerender({ tasks: [completeTask(task, new Date(2026, 8, 16, 9, 1))] })
    expect(result.current.notices).toEqual([])
  })

  it('counts every hour that struck together, earliest first (REM-4, REM-6)', async () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 16, 8, 29, 30) })
    const notify = allowNotifications()

    const tasks = [at('09:00', 'later'), at('08:30', 'earlier')]
    const { result } = renderHook(() => useReminders(tasks))
    vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 5))
    await tick()

    expect(result.current.notices.map((one) => one.title)).toEqual(['earlier', 'later'])
    expect(notify).toHaveBeenCalledWith('2 tasks due now', { body: '“earlier” · “later”' })
  })

  it('goes when it is dismissed (REM-5)', async () => {
    vi.useFakeTimers({ now: BEFORE })
    allowNotifications()

    const tasks = [at('09:00')]
    const { result } = renderHook(() => useReminders(tasks))
    vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 5))
    await tick()

    act(() => { result.current.dismiss() })
    expect(result.current.notices).toEqual([])
  })
})
