import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyXp,
  clearXp,
  hasXp,
  joinXp,
  levelOf,
  offsetDay,
  settleXp,
  taskXp,
  toLocalDay,
  totalXp,
  type HabitRests,
  type LevelStanding,
  type RewardEntry,
  type Task,
  type XpDelta,
  type XpProgress,
} from '../core'
import type { XpRepository } from '../storage/xpRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

/** Where XP stands once everything it is read from has loaded. */
export interface XpStanding {
  readonly total: number
  readonly level: LevelStanding
}

/**
 * Holds where XP stands (LVL-1) and adds to it: what each change gave or took,
 * as the hooks holding the tasks, the time and the journal tell it. The rules
 * live in ../core/xp; this only wires them to React. The days gone by, and the
 * level, are `useLevel`'s, once the tasks are known: this is made ahead of
 * them, so a change to the tasks has somewhere to say what it gave.
 *
 * XP begins the first time it is read and has not begun: from that day on
 * (LVL-2). Nothing is kept of it but where it stands.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useXp(repository: XpRepository, onProblem: ReportProblem = ignoreProblems) {
  const [progress, setProgress] = useState<XpProgress | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
  // Where XP stands as the last change left it, so changes made in one go build
  // on each other rather than on the one last read (STORE-39).
  const latest = useRef<XpProgress | null>(null)

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = saved
        setProgress(saved)
        setStatus('loaded')
      },
      (error) => {
        console.error('Could not load XP.', error)
        setStatus('failed')
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const failed = useCallback(
    (error: unknown) => {
      console.error('Could not save XP.', error)
      onProblem('save')
    },
    [onProblem],
  )

  // The first time it is read and has not begun, it begins today (LVL-2).
  useEffect(() => {
    if (status !== 'loaded' || progress !== null) return
    repository.begin(toLocalDay(new Date())).catch(failed)
  }, [repository, failed, status, progress])

  /** Adds what a change gave or took. Nothing is added before XP has begun. */
  const record = useCallback(
    (delta: XpDelta) => {
      const stored = latest.current
      if (stored === null || !hasXp(delta)) return

      const today = toLocalDay(new Date())
      const next = applyXp(stored, delta, today)
      const gained = next.xp - stored.xp
      const adds = delta.addedToday === 0 ? null : { on: today, count: next.adds }
      if (gained === 0 && adds === null) return

      latest.current = next
      repository.add({ xp: gained, adds }).catch(failed)
    },
    [repository, failed],
  )

  /**
   * Adds what a change to the tasks gave and took (LVL-4 to LVL-7, LVL-12),
   * a day already counted put right where the change reaches back to it.
   */
  const recordTasks = useCallback(
    (before: readonly Task[], after: readonly Task[], now: Date) => {
      const settled = latest.current
      record(joinXp(taskXp(before, after, now, settled), { xp: clearXp(before, after, now), addedToday: 0 }))
    },
    [record],
  )

  /** Counts the days gone by not counted yet, against where XP stands as saved (LVL-12 to LVL-14). */
  const settle = useCallback(
    (tasks: readonly Task[], rests: HabitRests) => {
      const now = new Date()
      repository.settle((stored) => settleXp(tasks, stored, rests, now)).catch(failed)
    },
    [repository, failed],
  )

  return { status, progress, record, recordTasks, settle }
}

export type XpState = ReturnType<typeof useXp>

/**
 * Where XP stands (LVL-3), once the tasks, the points and the limit on rests
 * have loaded — null until then — and the days gone by counted against them,
 * whenever there is a day not counted yet. Nothing is counted before they are
 * known: a day counted against a list not loaded yet would find nothing done on
 * it, and never look again.
 */
export function useLevel(
  xp: XpState,
  tasks: readonly Task[] | null,
  points: readonly RewardEntry[] | null,
  rests: HabitRests | undefined,
): XpStanding | null {
  const today = toLocalDay(new Date())
  const { settle, progress } = xp
  const yesterday = offsetDay(today, -1)
  const waiting =
    progress !== null &&
    progress.startedOn <= yesterday &&
    (progress.settledThrough === null || progress.settledThrough < yesterday)

  useEffect(() => {
    if (!waiting || tasks === null || rests === undefined) return
    settle(tasks, rests)
  }, [settle, waiting, tasks, rests])

  return useMemo((): XpStanding | null => {
    if (progress === null || points === null) return null
    const total = totalXp(progress, points)
    return { total, level: levelOf(total) }
  }, [progress, points])
}
