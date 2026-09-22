import { useCallback, useEffect, useState } from 'react'
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

type ProcrastinationUpdate =
  | { readonly phase: 'off' }
  | { readonly phase: 'idle' }
  | { readonly phase: 'focus'; readonly taskId: TaskId }

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
 * Today's Procrastination mode on this device: restored on open for the same
 * local day, and settled against Today's tasks on every render — a new day turns
 * it off, a focused task finished is a win, one gone from Today leaves it
 * resting (`settleProcrastination`, JUST-7, JUST-10).
 *
 * `today` is Today's live tasks, or null while they are still loading. The mode
 * is written down once it has been drawn, in one place, never during a render.
 */
export function useProcrastination(
  repository: ProcrastinationRepository,
  today: readonly Task[] | null,
  now: Date,
  ledger: WinLedger,
): Procrastination {
  const [state, setState] = useState(() => repository.load())
  const day = toLocalDay(now)

  // Adjusting state while rendering, which React redoes at once without drawing
  // the stale one; settling hands back the same state when there is nothing to do.
  const settled = settleProcrastination(state, today, now)
  if (settled !== state) setState(settled)

  useEffect(() => {
    repository.save(settled)
  }, [repository, settled])

  const change = useCallback(
    (next: ProcrastinationUpdate) => {
      setState(next.phase === 'off' ? PROCRASTINATION_OFF : { ...next, day })
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
