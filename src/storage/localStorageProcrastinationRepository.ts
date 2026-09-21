import { isLocalDay, type LocalDay } from '../core'
import {
  PROCRASTINATION_OFF,
  type ProcrastinationRepository,
  type ProcrastinationState,
} from './procrastinationRepository'

const STORAGE_KEY = 'task-tracker/procrastination'
const SCHEMA_VERSION = 2

function readState(value: unknown): ProcrastinationState | null {
  if (value === null || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (record.version !== SCHEMA_VERSION) return null
  if (typeof record.day !== 'string' || !isLocalDay(record.day)) return null
  const day = record.day as LocalDay

  if (record.phase === 'off') return PROCRASTINATION_OFF
  if (record.phase === 'idle') return { phase: 'idle', day }
  if (record.phase !== 'focus' && record.phase !== 'won') return null
  if (typeof record.taskId !== 'string' || record.taskId === '') return null
  return { phase: record.phase, taskId: record.taskId, day }
}

/**
 * Procrastination mode in this browser's `localStorage`, so a refresh keeps it
 * for the day it was started. A day that has rolled over, or anything unreadable,
 * is treated as off.
 */
export const localStorageProcrastinationRepository: ProcrastinationRepository = {
  load(): ProcrastinationState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === null) return PROCRASTINATION_OFF
      return readState(JSON.parse(raw)) ?? PROCRASTINATION_OFF
    } catch {
      return PROCRASTINATION_OFF
    }
  },

  save(state: ProcrastinationState): void {
    try {
      if (state.phase === 'off') {
        localStorage.removeItem(STORAGE_KEY)
        return
      }
      if (state.phase === 'idle') {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ version: SCHEMA_VERSION, phase: 'idle', day: state.day }),
        )
        return
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: SCHEMA_VERSION,
          phase: state.phase,
          taskId: state.taskId,
          day: state.day,
        }),
      )
    } catch {
      // Kept on screen for this visit only.
    }
  },
}
