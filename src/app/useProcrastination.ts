import { useCallback, useState } from 'react'
import { toLocalDay, type TaskId } from '../core'
import {
  PROCRASTINATION_OFF,
  type ProcrastinationRepository,
  type ProcrastinationState,
} from '../storage/procrastinationRepository'

export type ProcrastinationUpdate =
  | { readonly phase: 'off' }
  | { readonly phase: 'idle' }
  | { readonly phase: 'focus' | 'won'; readonly taskId: TaskId }

function loadForToday(repository: ProcrastinationRepository, now: Date): ProcrastinationState {
  const loaded = repository.load()
  if (loaded.phase === 'off') return PROCRASTINATION_OFF
  if (loaded.day !== toLocalDay(now)) {
    repository.save(PROCRASTINATION_OFF)
    return PROCRASTINATION_OFF
  }
  return loaded
}

/**
 * Today's Procrastination mode on this device: restored on open for the same
 * local day, cleared when the day rolls over (JUST-10).
 */
export function useProcrastination(
  repository: ProcrastinationRepository,
  now: Date,
): [ProcrastinationState, (next: ProcrastinationUpdate) => void] {
  const [state, setState] = useState(() => loadForToday(repository, now))
  const today = toLocalDay(now)

  // A page left open overnight drops yesterday's mode on the next render (PRIN-2).
  if (state.phase !== 'off' && state.day !== today) {
    setState(PROCRASTINATION_OFF)
    repository.save(PROCRASTINATION_OFF)
  }

  const change = useCallback(
    (next: ProcrastinationUpdate) => {
      if (next.phase === 'off') {
        setState(PROCRASTINATION_OFF)
        repository.save(PROCRASTINATION_OFF)
        return
      }
      if (next.phase === 'idle') {
        const saved: ProcrastinationState = { phase: 'idle', day: today }
        setState(saved)
        repository.save(saved)
        return
      }
      const saved: ProcrastinationState = { phase: next.phase, taskId: next.taskId, day: today }
      setState(saved)
      repository.save(saved)
    },
    [repository, today],
  )

  const current = state.phase !== 'off' && state.day !== today ? PROCRASTINATION_OFF : state
  return [current, change]
}
