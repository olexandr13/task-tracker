// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { localStorageTaskTimerRepository } from './localStorageTaskTimerRepository'
import { TASK_TIMER_IDLE } from './taskTimerRepository'

const KEY = 'task-tracker/task-timer'

afterEach(() => {
  localStorage.removeItem(KEY)
})

describe('localStorageTaskTimerRepository', () => {
  it('keeps a running timer across a load after save', () => {
    localStorageTaskTimerRepository.save({
      status: 'running',
      taskId: 'task-1',
      startedAt: '2026-09-21T10:00:00.000Z',
      goalNotified: false,
    })
    expect(localStorageTaskTimerRepository.load()).toEqual({
      status: 'running',
      taskId: 'task-1',
      startedAt: '2026-09-21T10:00:00.000Z',
      goalNotified: false,
    })
  })

  it('clears storage when idle', () => {
    localStorageTaskTimerRepository.save({
      status: 'running',
      taskId: 'task-1',
      startedAt: '2026-09-21T10:00:00.000Z',
      goalNotified: true,
    })
    localStorageTaskTimerRepository.save(TASK_TIMER_IDLE)
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorageTaskTimerRepository.load()).toEqual(TASK_TIMER_IDLE)
  })

  it('treats corrupt or empty storage as idle', () => {
    expect(localStorageTaskTimerRepository.load()).toEqual(TASK_TIMER_IDLE)

    localStorage.setItem(KEY, '{')
    expect(localStorageTaskTimerRepository.load()).toEqual(TASK_TIMER_IDLE)

    localStorage.setItem(KEY, JSON.stringify({ version: 99, status: 'running', taskId: 'a' }))
    expect(localStorageTaskTimerRepository.load()).toEqual(TASK_TIMER_IDLE)

    localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        status: 'running',
        taskId: 'a',
        startedAt: 'not-a-date',
        goalNotified: false,
      }),
    )
    expect(localStorageTaskTimerRepository.load()).toEqual(TASK_TIMER_IDLE)
  })
})
