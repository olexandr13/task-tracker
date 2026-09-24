import { isLocalDay, type LocalDay, type ProcrastinationState } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of Procrastination mode (JUST-10). Its own version, apart
 * from everything else's; bump it whenever the shape below changes and migrate
 * on load (STORE-5).
 */
export const PROCRASTINATION_SCHEMA_VERSION = 1

/** The one document the mode is kept as, under this name. */
export const PROCRASTINATION = 'procrastination'

/** The mode while it is on: off is no document at all, as with the warm-up. */
export type ProcrastinationOn = Exclude<ProcrastinationState, { phase: 'off' }>

export interface StoredProcrastination {
  version: number
  /** The name it is filed under, so it reads like the other settings (`firestore.rules`). */
  name: typeof PROCRASTINATION
  state: { phase: ProcrastinationOn['phase']; day: string; taskId?: string }
}

export function toStoredProcrastination(state: ProcrastinationOn): StoredProcrastination {
  return {
    version: PROCRASTINATION_SCHEMA_VERSION,
    name: PROCRASTINATION,
    state:
      state.phase === 'idle'
        ? { phase: 'idle', day: state.day }
        : { phase: state.phase, day: state.day, taskId: state.taskId },
  }
}

/**
 * A saved mode in today's shape, or null when it cannot be trusted — an unknown
 * version, a day that is no day, a phase that is no phase, or a focus with no
 * task. Unreadable reads as off (STORE-7): the mode is a way through one
 * afternoon, never a record worth guessing at.
 */
export function readProcrastination(data: unknown): ProcrastinationOn | null {
  if (!isRecord(data) || data.version !== PROCRASTINATION_SCHEMA_VERSION) return null
  if (!isRecord(data.state)) return null

  const { phase, day, taskId } = data.state
  if (typeof day !== 'string' || !isLocalDay(day)) return null
  const on = day as LocalDay

  if (phase === 'idle') return { phase: 'idle', day: on }
  if (phase !== 'focus' && phase !== 'won') return null
  if (typeof taskId !== 'string' || taskId === '') return null

  return { phase, taskId, day: on }
}
