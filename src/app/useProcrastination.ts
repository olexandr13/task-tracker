import { useCallback, useEffect, useRef, useState } from 'react'
import {
  completionDays,
  isComplete,
  pickJustOne,
  PROCRASTINATION_OFF,
  settleProcrastination,
  toLocalDay,
  type ProcrastinationState,
  type RewardEntry,
  type Task,
  type TaskId,
} from '../core'
import type { ProcrastinationRepository } from '../storage/procrastinationRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

type ProcrastinationUpdate =
  | { readonly phase: 'off' }
  | { readonly phase: 'idle' }
  | { readonly phase: 'focus'; readonly taskId: TaskId }

/** Whether two modes say the same thing, an off mode being an off mode whatever else it carries. */
function sameState(a: ProcrastinationState, b: ProcrastinationState): boolean {
  if (a.phase !== b.phase) return false
  if (a.phase === 'off' || b.phase === 'off') return true
  if (a.day !== b.day) return false
  return ('taskId' in a ? a.taskId : null) === ('taskId' in b ? b.taskId : null)
}

/** The points ledger, as far as a win needs it: what completions earned, and writing one. */
export interface WinLedger {
  readonly entries: readonly RewardEntry[]
  readonly saveEarning: (entry: RewardEntry) => void
}

/** Procrastination mode as the screen draws and drives it (wiki/just-one.md). */
export interface Procrastination {
  readonly phase: ProcrastinationState['phase']
  /** The task focused on or just won, or null while the mode is off or resting. */
  readonly taskId: TaskId | null
  /** The task just won, while the win card is up (JUST-9). */
  readonly wonTask: Task | null
  /** What the won completion has earned so far (JUST-9). */
  readonly pointsEarned: number
  /** Whether the mode can be started or ended: a Today task still to do, or the mode on already (JUST-1, JUST-2). */
  readonly available: boolean
  /** Whether the mode, or the tasks it is settled against, are still on their way (MODE-8). */
  readonly isLoading: boolean
  /** Whether any Today task is still to do. */
  readonly canPick: boolean
  /** Whether there is another open Today task to switch to (JUST-6). */
  readonly hasOtherTask: boolean
  /** Focuses the easiest open Today task (JUST-3, JUST-4). */
  readonly start: () => void
  /** Focuses another open Today task than the current one where there is one; rests when there is none (JUST-6, JUST-9). */
  readonly pickNext: () => void
  /** Leaves the mode on with nothing picked (JUST-7). */
  readonly rest: () => void
  /** Turns the mode off (JUST-8). */
  readonly end: () => void
  /** Sets what the won completion earned in all (JUST-9). */
  readonly grantPoints: (total: number) => void
}

/**
 * The account's Procrastination mode: read when the screen opens, kept in step
 * with the account as it changes here, in another tab or on another device
 * (STORE-45), and settled against Today's tasks on every render — a new day
 * turns it off, a focused task finished is a win, one gone from Today leaves it
 * resting (`settleProcrastination`, JUST-7, JUST-10).
 *
 * `today` is Today's live tasks, or null while they are still loading. The mode
 * is written down once it has been drawn, in one place, never during a render.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13),
 * which is expected to stay the same function from render to render.
 */
export function useProcrastination(
  repository: ProcrastinationRepository,
  today: readonly Task[] | null,
  now: Date,
  ledger: WinLedger,
  onProblem: ReportProblem = ignoreProblems,
): Procrastination {
  // Boxed, there being nothing to tell an off mode from one not read yet.
  const [saved, setSaved] = useState<{ of: ProcrastinationState } | null>(null)
  // What the account is known to hold, so the mode is written only once and a
  // change arriving from another device is not sent straight back.
  const stored = useRef<ProcrastinationState>(PROCRASTINATION_OFF)
  const day = toLocalDay(now)

  useEffect(() => {
    return repository.subscribe(
      (state) => {
        stored.current = state ?? PROCRASTINATION_OFF
        setSaved({ of: stored.current })
      },
      (error) => {
        console.error('Could not load Procrastination mode.', error)
        stored.current = PROCRASTINATION_OFF
        setSaved({ of: PROCRASTINATION_OFF })
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const isLoading = saved === null || today === null
  const state = saved?.of ?? PROCRASTINATION_OFF

  // Adjusting state while rendering, which React redoes at once without drawing
  // the stale one; settling hands back the same state when there is nothing to do.
  // Nothing is settled — or written — before the mode itself has been read.
  const settled = saved === null ? state : settleProcrastination(state, today, now)
  if (saved !== null && settled !== state) setSaved({ of: settled })

  // The one place the mode is written: what is on screen, once it has been
  // drawn and once it says something the account does not hold already. A mode
  // settled by the day turning over or by a task being finished (JUST-7) is
  // written the same way a pressed button is, so the other device hears of it.
  useEffect(() => {
    if (saved === null || sameState(settled, stored.current)) return
    stored.current = settled
    repository.save(settled.phase === 'off' ? null : settled).catch((error: unknown) => {
      console.error('Could not save Procrastination mode.', error)
      onProblem('save')
    })
  }, [saved, settled, repository, onProblem])

  const change = useCallback(
    (next: ProcrastinationUpdate) => {
      setSaved({ of: next.phase === 'off' ? PROCRASTINATION_OFF : { ...next, day } })
    },
    [day],
  )

  const tasks = today ?? []
  const taskId = settled.phase === 'focus' || settled.phase === 'won' ? settled.taskId : null
  const open = tasks.filter((task) => !isComplete(task, now)).length
  const wonTask = settled.phase === 'won' ? (tasks.find((task) => task.id === settled.taskId) ?? null) : null
  // The day the win was done on: its latest completion, or today if the ledger is ahead of the task.
  const winDay = wonTask === null ? null : (completionDays(wonTask).at(-1) ?? day)
  const pointsEarned =
    wonTask === null
      ? 0
      : (ledger.entries.find((entry) => entry.taskId === wonTask.id && entry.day === winDay)?.points ?? 0)

  function focus(excludeId: TaskId | null) {
    const picked = pickJustOne(tasks, now, excludeId)
    change(picked === null ? { phase: 'idle' } : { phase: 'focus', taskId: picked.id })
  }

  return {
    phase: settled.phase,
    taskId,
    wonTask,
    pointsEarned,
    isLoading,
    available: open > 0 || settled.phase !== 'off',
    canPick: open > 0,
    hasOtherTask: open > 1,
    start: () => {
      const picked = pickJustOne(tasks, now)
      if (picked !== null) change({ phase: 'focus', taskId: picked.id })
    },
    pickNext: () => { focus(taskId) },
    rest: () => { change({ phase: 'idle' }) },
    end: () => { change({ phase: 'off' }) },
    grantPoints: (total) => {
      if (wonTask !== null && winDay !== null) ledger.saveEarning({ taskId: wonTask.id, day: winDay, points: total })
    },
  }
}
