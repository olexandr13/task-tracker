import { createLocalStorageSetting } from './localStorageSetting'
import {
  TASK_TIMER_IDLE,
  type TaskTimerRepository,
  type TaskTimerState,
} from './taskTimerRepository'

const SCHEMA_VERSION = 1

function readState(value: unknown): TaskTimerState | null {
  if (value === null || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (record.version !== SCHEMA_VERSION) return null
  if (record.status === 'idle') return TASK_TIMER_IDLE
  if (record.status !== 'running') return null
  if (typeof record.taskId !== 'string' || record.taskId === '') return null
  if (typeof record.startedAt !== 'string' || Number.isNaN(Date.parse(record.startedAt))) return null
  return {
    status: 'running',
    taskId: record.taskId,
    startedAt: record.startedAt,
    goalNotified: record.goalNotified === true,
  }
}

/**
 * The running timer in this browser's `localStorage`, so a refresh keeps it.
 * Anything unreadable is treated as idle.
 */
export const localStorageTaskTimerRepository: TaskTimerRepository = createLocalStorageSetting({
  key: 'task-tracker/task-timer',
  read: readState,
  write: (state) => (state.status === 'idle' ? null : { version: SCHEMA_VERSION, ...state }),
  fallback: TASK_TIMER_IDLE,
})
