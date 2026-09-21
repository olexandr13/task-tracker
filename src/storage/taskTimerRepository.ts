import type { TaskId } from '../core'

/**
 * A timer running against one task on this device. Elapsed time is derived
 * from `startedAt`; `goalNotified` remembers that this run already told the
 * owner the goal was reached.
 */
export type TaskTimerState =
  | { readonly status: 'idle' }
  | {
      readonly status: 'running'
      readonly taskId: TaskId
      /** ISO 8601 timestamp when this run began. */
      readonly startedAt: string
      /** Whether a goal-reached notice has already been shown for this run. */
      readonly goalNotified: boolean
    }

export const TASK_TIMER_IDLE: TaskTimerState = { status: 'idle' }

/**
 * Where the running timer is kept between visits on this device. Not the
 * account: it is a clock here, not data to sync.
 */
export interface TaskTimerRepository {
  load(): TaskTimerState
  save(state: TaskTimerState): void
}
