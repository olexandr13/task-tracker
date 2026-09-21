import type { LocalDay, TaskId } from '../core'

/**
 * Procrastination mode on this device for Today: which phase and task, and the
 * local day it belongs to so a new day clears it (JUST-10).
 */
export type ProcrastinationState =
  | { readonly phase: 'off' }
  | { readonly phase: 'idle'; readonly day: LocalDay }
  | { readonly phase: 'focus' | 'won'; readonly taskId: TaskId; readonly day: LocalDay }

export const PROCRASTINATION_OFF: ProcrastinationState = { phase: 'off' }

/**
 * Where today's Procrastination mode is kept between visits on this device.
 * Not the account: it is a way of looking at Today here, not data to sync.
 */
export interface ProcrastinationRepository {
  load(): ProcrastinationState
  save(state: ProcrastinationState): void
}
