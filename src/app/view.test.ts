import { describe, expect, it } from 'vitest'
import { createList, createTask, moveToList, setDueDate, toLocalDay } from '../core'
import { oneListView, tagView, viewShowingTask } from './view'

/* Which view a task is gone to on. TIME ids refer to wiki/time-goals.md. */

const NOW = new Date(2026, 8, 16, 9, 0)
const TODAY = toLocalDay(NOW)

describe('viewShowingTask', () => {
  it('stays on the view open when it shows the task (TIME-20)', () => {
    const work = createList('Work', NOW)
    const task = moveToList(setDueDate(createTask('report', null, NOW), TODAY), work.id)

    expect(viewShowingTask(task, 'week', NOW, [work])).toBe('week')
    expect(viewShowingTask(task, oneListView(work.id), NOW, [work])).toBe(oneListView(work.id))
  })

  it('stays on Habits for a habit, and leaves it for any other task (TIME-20)', () => {
    const habit = createTask('stretch', { kind: 'daily' }, NOW)
    const task = setDueDate(createTask('report', null, NOW), TODAY)

    expect(viewShowingTask(habit, 'habits', NOW, [])).toBe('habits')
    expect(viewShowingTask(task, 'habits', NOW, [])).toBe('today')
  })

  it('goes to Today when the task is due today and the view open does not show it (TIME-20)', () => {
    const task = setDueDate(createTask('report', null, NOW), TODAY)

    expect(viewShowingTask(task, tagView('home'), NOW, [])).toBe('today')
    expect(viewShowingTask(task, 'settings', NOW, [])).toBe('today')
  })

  it('goes to Tasks for a task due another day (TIME-20)', () => {
    const later = setDueDate(createTask('report', null, NOW), '2026-10-30')

    expect(viewShowingTask(later, 'today', NOW, [])).toBe('tasks')
  })

  it('goes to Today for a task with no day, which Today shows (TIME-20, LIST-5)', () => {
    const undated = createTask('someday', null, NOW)

    expect(viewShowingTask(undated, 'rewards', NOW, [])).toBe('today')
  })
})
