import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  elapsedSeconds,
  isGoalExceeded,
  MAX_SESSION_SECONDS,
  type TaskId,
} from '../core'
import {
  TASK_TIMER_IDLE,
  type TaskTimerRepository,
  type TaskTimerState,
} from '../storage/taskTimerRepository'
import { askToNotify, notifyBrowser } from './browserNotification'

export type TaskTimerInfo = {
  readonly title: string
  /** Minutes, or null for no goal. */
  readonly goal: number | null
  /** Seconds already logged that count for the occurrence in play. */
  readonly spentSeconds: number
}

export type GoalNotice = {
  readonly title: string
}

export type TaskTimer = {
  readonly state: TaskTimerState
  /** Wall clock for live elapsed while a timer is running. */
  readonly clock: Date
  readonly start: (taskId: TaskId) => void
  readonly stop: () => void
  readonly isRunningFor: (taskId: TaskId) => boolean
  readonly goalNotice: GoalNotice | null
  readonly dismissGoalNotice: () => void
}

/** A task with a goal is one that will want to say so; ask before it does. */
function requestNotificationIfNeeded(goal: number | null): void {
  if (goal === null) return
  void askToNotify()
}

function finishRun(
  running: Extract<TaskTimerState, { status: 'running' }>,
  now: Date,
  onLog: (taskId: TaskId, seconds: number) => void,
): void {
  const seconds = Math.min(elapsedSeconds(running.startedAt, now), MAX_SESSION_SECONDS)
  if (seconds >= 1) onLog(running.taskId, seconds)
}

/**
 * One running timer on this device: start/stop against a task, persist across
 * refresh, log the run to the second on stop, and notice once when the run
 * reaches the task's time goal.
 */
export function useTaskTimer(
  repository: TaskTimerRepository,
  describe: (taskId: TaskId) => TaskTimerInfo | null,
  onLog: (taskId: TaskId, seconds: number) => void,
): TaskTimer {
  const [state, setState] = useState<TaskTimerState>(() => repository.load())
  const [clock, setClock] = useState(() => new Date())
  const [goalNotice, setGoalNotice] = useState<GoalNotice | null>(null)
  // The timer as the last start or stop left it, so two in one go — stopping one
  // task's run by starting another's — each see the one before.
  const stateRef = useRef(state)
  // The latest of what the screen passed, for start and stop to call: they are
  // handed out once, and must not see the tasks as they were when they were.
  const describeRef = useRef(describe)
  const onLogRef = useRef(onLog)
  useLayoutEffect(() => {
    describeRef.current = describe
    onLogRef.current = onLog
  })

  useEffect(() => {
    if (state.status !== 'running') return
    const id = window.setInterval(() => { setClock(new Date()) }, 1000)
    return () => { window.clearInterval(id) }
  }, [state.status])

  const persist = useCallback(
    (next: TaskTimerState) => {
      stateRef.current = next
      setState(next)
      repository.save(next)
    },
    [repository],
  )

  // A tick that has reached the goal fires the notice once for this run.
  useEffect(() => {
    if (state.status !== 'running' || state.goalNotified) return
    const info = describeRef.current(state.taskId)
    if (info === null || info.goal === null) return
    const seconds = elapsedSeconds(state.startedAt, clock)
    if (!isGoalExceeded({ spentSeconds: info.spentSeconds, elapsedSeconds: seconds, goal: info.goal })) return

    const next: TaskTimerState = { ...state, goalNotified: true }
    persist(next)
    setGoalNotice({ title: info.title })
    notifyBrowser('Time goal reached', `Time goal reached for “${info.title}”`)
  }, [state, clock, persist])

  const stop = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'running') return
    finishRun(current, new Date(), onLogRef.current)
    persist(TASK_TIMER_IDLE)
  }, [persist])

  const start = useCallback(
    (taskId: TaskId) => {
      const now = new Date()
      const current = stateRef.current
      if (current.status === 'running') {
        if (current.taskId === taskId) return
        finishRun(current, now, onLogRef.current)
      }
      const info = describeRef.current(taskId)
      requestNotificationIfNeeded(info?.goal ?? null)
      const alreadyExceeded =
        info !== null &&
        isGoalExceeded({ spentSeconds: info.spentSeconds, elapsedSeconds: 0, goal: info.goal })
      const next: TaskTimerState = {
        status: 'running',
        taskId,
        startedAt: now.toISOString(),
        goalNotified: alreadyExceeded,
      }
      persist(next)
      setClock(now)
      if (alreadyExceeded && info !== null) {
        setGoalNotice({ title: info.title })
        notifyBrowser('Time goal reached', `Time goal reached for “${info.title}”`)
      }
    },
    [persist],
  )

  const isRunningFor = useCallback(
    (taskId: TaskId) => state.status === 'running' && state.taskId === taskId,
    [state],
  )

  const dismissGoalNotice = useCallback(() => { setGoalNotice(null) }, [])

  return {
    state,
    clock: state.status === 'running' ? clock : new Date(0),
    start,
    stop,
    isRunningFor,
    goalNotice,
    dismissGoalNotice,
  }
}
