import { describe, expect, it } from 'vitest'
import { createList, createTask, moveToList, setDueDate, toLocalDay } from '../core'
import { oneListView, parentView, rootView, tagView, viewShowingTask } from './view'

/* Which view a task is gone to on, and which view is above which. TIME ids refer to
   wiki/time-goals.md, UI ids to wiki/interface.md. */

const NOW = new Date(2026, 8, 16, 9, 0)
const TODAY = toLocalDay(NOW)

describe('parentView', () => {
  it('puts the bar\'s tabs at the top (UI-37, UI-32)', () => {
    for (const view of ['today', 'week', 'month', 'tasks', 'habits', 'rewards', 'more', 'settings'] as const) {
      expect(parentView(view)).toBeNull()
      expect(rootView(view)).toBe(view)
    }
  })

  it('puts Lists and the Trash under Tasks, and the Inbox and each list under Lists (UI-34, UI-43)', () => {
    expect(parentView('lists')).toBe('tasks')
    expect(parentView('trash')).toBe('tasks')
    expect(parentView('inbox')).toBe('lists')
    expect(parentView(oneListView('6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d'))).toBe('lists')
    expect(rootView(oneListView('6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d'))).toBe('tasks')
  })

  it('puts the rewards pages under Rewards (RWD-19)', () => {
    for (const view of ['rewards/history', 'rewards/prizes', 'rewards/wishlist', 'rewards/rules'] as const) {
      expect(parentView(view)).toBe('rewards')
    }
  })

  it('puts Tags and Modes under More, a tag\'s tasks under Tags and a mode\'s page under Modes (UI-45, MODE-7)', () => {
    expect(parentView('tags')).toBe('more')
    expect(parentView('modes')).toBe('more')
    expect(parentView(tagView('work'))).toBe('tags')
    expect(parentView('modes/procrastination')).toBe('modes')
    expect(parentView('modes/warm-up')).toBe('modes')
    expect(rootView(tagView('work'))).toBe('more')
    expect(rootView('modes/warm-up')).toBe('more')
  })
})

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
