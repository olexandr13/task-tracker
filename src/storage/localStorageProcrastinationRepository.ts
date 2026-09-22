import { isLocalDay, PROCRASTINATION_OFF, type LocalDay, type ProcrastinationState } from '../core'
import { createLocalStorageSetting } from './localStorageSetting'
import type { ProcrastinationRepository } from './procrastinationRepository'

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
 * for the day it was started. Anything unreadable is treated as off; a day that
 * has rolled over is turned off as it is read (`settleProcrastination`).
 */
export const localStorageProcrastinationRepository: ProcrastinationRepository = createLocalStorageSetting({
  key: 'task-tracker/procrastination',
  read: readState,
  write: (state) => (state.phase === 'off' ? null : { version: SCHEMA_VERSION, ...state }),
  fallback: PROCRASTINATION_OFF,
})
