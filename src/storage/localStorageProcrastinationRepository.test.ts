// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { localStorageProcrastinationRepository } from './localStorageProcrastinationRepository'
import { PROCRASTINATION_OFF } from '../core'

const KEY = 'task-tracker/procrastination'

afterEach(() => {
  localStorage.removeItem(KEY)
})

describe('localStorageProcrastinationRepository (JUST-10)', () => {
  it('keeps focus across a load after save', () => {
    localStorageProcrastinationRepository.save({
      phase: 'focus',
      taskId: 'task-1',
      day: '2026-09-16',
    })
    expect(localStorageProcrastinationRepository.load()).toEqual({
      phase: 'focus',
      taskId: 'task-1',
      day: '2026-09-16',
    })
  })

  it('keeps idle and won across a load after save', () => {
    localStorageProcrastinationRepository.save({ phase: 'idle', day: '2026-09-16' })
    expect(localStorageProcrastinationRepository.load()).toEqual({ phase: 'idle', day: '2026-09-16' })

    localStorageProcrastinationRepository.save({
      phase: 'won',
      taskId: 'task-2',
      day: '2026-09-16',
    })
    expect(localStorageProcrastinationRepository.load()).toEqual({
      phase: 'won',
      taskId: 'task-2',
      day: '2026-09-16',
    })
  })

  it('clears storage when turned off', () => {
    localStorageProcrastinationRepository.save({
      phase: 'focus',
      taskId: 'task-1',
      day: '2026-09-16',
    })
    localStorageProcrastinationRepository.save(PROCRASTINATION_OFF)
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorageProcrastinationRepository.load()).toEqual(PROCRASTINATION_OFF)
  })
})
