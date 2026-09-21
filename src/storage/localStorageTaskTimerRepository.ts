import {
  TASK_TIMER_IDLE,
  type TaskTimerRepository,
  type TaskTimerState,
} from './taskTimerRepository'

const STORAGE_KEY = 'task-tracker/task-timer'
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
export const localStorageTaskTimerRepository: TaskTimerRepository = {
  load(): TaskTimerState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) return TASK_TIMER_IDLE
      return readState(JSON.parse(raw)) ?? TASK_TIMER_IDLE
    } catch {
      return TASK_TIMER_IDLE
    }
  },

  save(state: TaskTimerState): void {
    try {
      if (state.status === 'idle') {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: SCHEMA_VERSION,
          status: 'running',
          taskId: state.taskId,
          startedAt: state.startedAt,
          goalNotified: state.goalNotified,
        }),
      )
    } catch {
      // Kept on screen for this visit only.
    }
  },
}
