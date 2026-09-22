// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  TASK_TIMER_IDLE,
  type TaskTimerRepository,
  type TaskTimerState,
} from '../storage/taskTimerRepository'
import { useTaskTimer, type TaskTimerInfo } from './useTaskTimer'

function memory(initial: TaskTimerState = TASK_TIMER_IDLE): TaskTimerRepository {
  let saved = initial
  return {
    load: () => saved,
    save: (next) => {
      saved = next
    },
  }
}

const INFO: Record<string, TaskTimerInfo> = {
  a: { title: 'sport', goal: 60, spentSeconds: 0 },
  b: { title: 'read', goal: null, spentSeconds: 0 },
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useTaskTimer', () => {
  it('starts a timer and logs the run to the second on stop (TIME-15)', () => {
    vi.useFakeTimers({ now: new Date('2026-09-21T10:00:00.000Z') })
    const onLog = vi.fn()
    const repo = memory()
    const { result } = renderHook(() =>
      useTaskTimer(repo, (id) => INFO[id] ?? null, onLog),
    )

    act(() => { result.current.start('a') })
    expect(result.current.state).toMatchObject({ status: 'running', taskId: 'a' })
    expect(result.current.isRunningFor('a')).toBe(true)

    act(() => { vi.advanceTimersByTime(90_400) })
    act(() => { result.current.stop() })

    expect(onLog).toHaveBeenCalledWith('a', 90)
    expect(result.current.state).toEqual(TASK_TIMER_IDLE)
    expect(repo.load()).toEqual(TASK_TIMER_IDLE)
  })

  it('logs a run under a minute, so short runs add up (TIME-22)', () => {
    vi.useFakeTimers({ now: new Date('2026-09-21T10:00:00.000Z') })
    const onLog = vi.fn()
    const { result } = renderHook(() =>
      useTaskTimer(memory(), (id) => INFO[id] ?? null, onLog),
    )

    act(() => { result.current.start('a') })
    act(() => { vi.advanceTimersByTime(20_000) })
    act(() => { result.current.stop() })

    expect(onLog).toHaveBeenCalledWith('a', 20)
  })

  it('logs nothing when stopped under a second', () => {
    vi.useFakeTimers({ now: new Date('2026-09-21T10:00:00.000Z') })
    const onLog = vi.fn()
    const { result } = renderHook(() =>
      useTaskTimer(memory(), (id) => INFO[id] ?? null, onLog),
    )

    act(() => { result.current.start('a') })
    act(() => { vi.advanceTimersByTime(900) })
    act(() => { result.current.stop() })

    expect(onLog).not.toHaveBeenCalled()
  })

  it('stops and logs the previous task when starting another', () => {
    vi.useFakeTimers({ now: new Date('2026-09-21T10:00:00.000Z') })
    const onLog = vi.fn()
    const { result } = renderHook(() =>
      useTaskTimer(memory(), (id) => INFO[id] ?? null, onLog),
    )

    act(() => { result.current.start('a') })
    act(() => { vi.advanceTimersByTime(120_000) })
    act(() => { result.current.start('b') })

    expect(onLog).toHaveBeenCalledWith('a', 120)
    expect(result.current.state).toMatchObject({ status: 'running', taskId: 'b' })
  })

  it('notifies once when the live run reaches the goal', () => {
    vi.useFakeTimers({ now: new Date('2026-09-21T10:00:00.000Z') })
    const NotificationMock = vi.fn()
    Object.defineProperty(NotificationMock, 'permission', { value: 'granted', configurable: true })
    vi.stubGlobal('Notification', NotificationMock)

    const info = { title: 'sport', goal: 2, spentSeconds: 0 }
    const { result } = renderHook(() =>
      useTaskTimer(memory(), () => info, vi.fn()),
    )

    act(() => { result.current.start('a') })
    expect(result.current.goalNotice).toBeNull()

    act(() => { vi.advanceTimersByTime(120_000) })
    expect(result.current.goalNotice).toEqual({ title: 'sport' })
    expect(NotificationMock).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(60_000) })
    expect(NotificationMock).toHaveBeenCalledTimes(1)
    expect(result.current.state).toMatchObject({ goalNotified: true, status: 'running' })
  })

  it('counts seconds left over from earlier sessions toward the goal', () => {
    vi.useFakeTimers({ now: new Date('2026-09-21T10:00:00.000Z') })
    const info = { title: 'sport', goal: 1, spentSeconds: 40 }
    const { result } = renderHook(() =>
      useTaskTimer(memory(), () => info, vi.fn()),
    )

    act(() => { result.current.start('a') })
    act(() => { vi.advanceTimersByTime(19_000) })
    expect(result.current.goalNotice).toBeNull()

    act(() => { vi.advanceTimersByTime(1_000) })
    expect(result.current.goalNotice).toEqual({ title: 'sport' })
  })

  it('restores a running timer from the repository', () => {
    const repo = memory({
      status: 'running',
      taskId: 'a',
      startedAt: '2026-09-21T10:00:00.000Z',
      goalNotified: false,
    })
    const { result } = renderHook(() =>
      useTaskTimer(repo, (id) => INFO[id] ?? null, vi.fn()),
    )
    expect(result.current.state).toMatchObject({ status: 'running', taskId: 'a' })
  })
})
