import { useCallback, useEffect, useState } from 'react'
import {
  canTakeOnHabit,
  isHabitRepeat,
  startWarmUp,
  warmUpProgress,
  type Repeat,
  type Task,
  type WarmUp,
  type WarmUpProgress,
} from '../core'
import type { WarmUpRepository } from '../storage/warmUpRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

/** Warm-up mode as the screen draws and drives it (wiki/warm-up.md). */
export interface WarmUpMode {
  /** Where it stands, or null when none is under way — never started, or its month served. */
  readonly progress: WarmUpProgress | null
  /** Whether the warm-up or the tasks it counts are still on their way. */
  readonly isLoading: boolean
  /** Starts a warm-up today (WARM-2). */
  readonly start: () => void
  /** Ends the warm-up (WARM-9). */
  readonly end: () => void
  /**
   * Whether the warm-up holds a habit back, asked before a change that would
   * make one: `repeat` is the rule the task would carry, and `was` the rule it
   * carries now, so turning a habit's own rule over is not a new habit.
   *
   * Saying yes also puts the notice up (`notice`), since a change refused
   * without a word is a change that looks broken.
   */
  readonly holdsBack: (repeat: Repeat | null, was?: Repeat | null) => boolean
  /** What to say about the habit just held back, until it is dismissed (WARM-8). */
  readonly notice: WarmUpProgress | null
  readonly dismissNotice: () => void
}

/**
 * The account's warm-up: read when the screen opens, kept in step with the
 * account as it changes here or on another device, and settled against the
 * tasks and `now` on every render — a month gone by leaves nothing under way
 * without anything being rewritten (PRIN-2, `warmUpProgress`).
 *
 * `tasks` is the account's tasks, or null while they are still loading: what
 * the allowance is measured against is how many habits there are, so an
 * allowance cannot be answered for before they are here.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13),
 * which is expected to stay the same function from render to render.
 */
export function useWarmUp(
  repository: WarmUpRepository,
  tasks: readonly Task[] | null,
  now: Date,
  onProblem: ReportProblem = ignoreProblems,
): WarmUpMode {
  // Boxed, there being nothing under way to tell from not knowing yet.
  const [saved, setSaved] = useState<{ of: WarmUp | null } | null>(null)
  const [notice, setNotice] = useState<WarmUpProgress | null>(null)

  useEffect(() => {
    return repository.subscribe(
      (warmUp) => {
        setSaved({ of: warmUp })
      },
      (error) => {
        console.error('Could not load the warm-up.', error)
        setSaved({ of: null })
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const save = useCallback(
    (warmUp: WarmUp | null) => {
      setSaved({ of: warmUp })
      setNotice(null)
      repository.save(warmUp).catch((error: unknown) => {
        console.error('Could not save the warm-up.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  const warmUp = saved?.of ?? null
  const isLoading = saved === null || tasks === null
  const progress = isLoading ? null : warmUpProgress(warmUp, tasks ?? [], now)

  const start = useCallback(() => { save(startWarmUp(now)) }, [save, now])
  const end = useCallback(() => { save(null) }, [save])

  const holdsBack = useCallback(
    (repeat: Repeat | null, was: Repeat | null = null): boolean => {
      if (!isHabitRepeat(repeat) || isHabitRepeat(was)) return false
      if (isLoading || canTakeOnHabit(warmUp, tasks ?? [], now)) return false

      setNotice(warmUpProgress(warmUp, tasks ?? [], now))
      return true
    },
    [isLoading, warmUp, tasks, now],
  )

  const dismissNotice = useCallback(() => { setNotice(null) }, [])

  return { progress, isLoading, start, end, holdsBack, notice, dismissNotice }
}
