import { describe, expect, it } from 'vitest'
import { completeTask, createTask, renameTask } from '../core'
import { changesBetween } from './taskRepository'

const NOW = new Date('2026-09-15T10:00:00.000Z')

describe('changesBetween', () => {
  const taxes = createTask('file taxes', null, NOW)
  const plants = createTask('water plants', null, NOW)
  const call = createTask('call mum', null, NOW)

  it('writes only the tasks a change touched', () => {
    const renamed = renameTask(plants, 'water the plants')

    expect(changesBetween([taxes, plants], [taxes, renamed])).toEqual({ saved: [renamed], removed: [] })
  })

  it('writes a new task, and removes one that is gone', () => {
    expect(changesBetween([taxes, plants], [taxes, call])).toEqual({ saved: [call], removed: [plants.id] })
  })

  it('has nothing to write when nothing changed', () => {
    const done = completeTask(taxes, NOW)

    expect(changesBetween([done, plants], [done, plants])).toEqual({ saved: [], removed: [] })
  })
})
