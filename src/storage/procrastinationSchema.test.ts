import { describe, expect, it } from 'vitest'
import {
  PROCRASTINATION,
  PROCRASTINATION_SCHEMA_VERSION,
  readProcrastination,
  toStoredProcrastination,
} from './procrastinationSchema'

/* The saved shape of Procrastination mode. STORE ids refer to wiki/storage.md,
   JUST ids to wiki/just-one.md. */

describe('the procrastination schema', () => {
  it('reads back a focused mode, under its version and name (STORE-45)', () => {
    const stored = toStoredProcrastination({ phase: 'focus', taskId: 'task-1', day: '2026-09-16' })

    expect(stored.version).toBe(PROCRASTINATION_SCHEMA_VERSION)
    expect(stored.name).toBe(PROCRASTINATION)
    expect(readProcrastination(stored)).toEqual({ phase: 'focus', taskId: 'task-1', day: '2026-09-16' })
  })

  it('reads back resting and a win, a rest carrying no task (JUST-7, JUST-9)', () => {
    expect(readProcrastination(toStoredProcrastination({ phase: 'idle', day: '2026-09-16' }))).toEqual({
      phase: 'idle',
      day: '2026-09-16',
    })
    expect(toStoredProcrastination({ phase: 'idle', day: '2026-09-16' }).state.taskId).toBeUndefined()

    const won = { phase: 'won', taskId: 'task-2', day: '2026-09-16' } as const
    expect(readProcrastination(toStoredProcrastination(won))).toEqual(won)
  })

  it('reads anything it cannot trust as off (STORE-7)', () => {
    const good = toStoredProcrastination({ phase: 'focus', taskId: 'task-1', day: '2026-09-16' })

    expect(readProcrastination({ ...good, version: PROCRASTINATION_SCHEMA_VERSION + 1 })).toBeNull()
    expect(readProcrastination({ ...good, state: { ...good.state, day: 'someday' } })).toBeNull()
    expect(readProcrastination({ ...good, state: { ...good.state, phase: 'dawdling' } })).toBeNull()
    expect(readProcrastination({ ...good, state: { phase: 'focus', day: '2026-09-16' } })).toBeNull()
    expect(readProcrastination(null)).toBeNull()
    expect(readProcrastination('off')).toBeNull()
  })
})
