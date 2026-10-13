import { describe, expect, it } from 'vitest'
import { createList, createTask, moveToList, setDueDate, toLocalDay } from '../core'
import {
  doneSpans,
  foldedSpans,
  historyScope,
  isUnder,
  newTaskDueDay,
  oneListView,
  parentView,
  rootView,
  sectionOf,
  showsTask,
  tagView,
  viewShowingTask,
} from './view'

/* Which view a task is gone to on, which view is above which, and how each draws its
   done tasks. TIME ids refer to wiki/time-goals.md, UI ids to wiki/interface.md, TASK
   ids to wiki/tasks.md, STORE ids to wiki/storage.md, LIST ids to wiki/views.md. */

const NOW = new Date(2026, 8, 16, 9, 0)
const TODAY = toLocalDay(NOW)

describe('parentView', () => {
  it('puts the bar\'s tabs at the top (UI-37, UI-32)', () => {
    for (const view of ['today', 'tomorrow', 'week', 'month', 'tasks', 'habits', 'rewards', 'more', 'settings'] as const) {
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

  it('puts Modes, Organize and Reflect under More, Tags and the notes under Organize, Balance, the activity log and the journal under Reflect, a tag\'s tasks under Tags and a mode\'s page under Modes (UI-45, UI-81, UI-83, MODE-1, MODE-7, NOTE-1, BAL-1)', () => {
    expect(parentView('modes')).toBe('more')
    expect(parentView('organize')).toBe('more')
    expect(parentView('reflect')).toBe('more')
    expect(parentView('journal')).toBe('reflect')
    expect(parentView('balance')).toBe('reflect')
    expect(parentView('activity')).toBe('reflect')
    expect(rootView('journal')).toBe('more')
    expect(parentView('tags')).toBe('organize')
    expect(parentView('notes')).toBe('organize')
    expect(parentView('modes/check-in')).toBe('modes')
    expect(parentView(tagView('work'))).toBe('tags')
    expect(parentView('modes/procrastination')).toBe('modes')
    expect(parentView('modes/warm-up')).toBe('modes')
    expect(rootView(tagView('work'))).toBe('more')
    expect(rootView('modes/warm-up')).toBe('more')
    expect(rootView('notes')).toBe('more')
  })
})

describe('isUnder', () => {
  it('holds Tags, a tag\'s tasks and the notes under Organize, and not Modes (UI-81, MODE-1)', () => {
    for (const view of ['organize', 'tags', tagView('work'), 'notes'] as const) {
      expect(isUnder(view, 'organize')).toBe(true)
    }
    for (const view of ['modes', 'modes/nudge', 'balance', 'journal', 'more', 'lists', 'rewards'] as const) {
      expect(isUnder(view, 'organize')).toBe(false)
    }
  })

  it('holds each mode\'s page under Modes (MODE-7)', () => {
    for (const view of ['modes', 'modes/procrastination', 'modes/check-in'] as const) {
      expect(isUnder(view, 'modes')).toBe(true)
    }
    expect(isUnder('organize', 'modes')).toBe(false)
  })

  it('holds Balance, the activity log and the journal under Reflect (UI-83)', () => {
    for (const view of ['reflect', 'balance', 'activity', 'journal'] as const) {
      expect(isUnder(view, 'reflect')).toBe(true)
    }
    for (const view of ['organize', 'notes', 'more', 'notifications'] as const) {
      expect(isUnder(view, 'reflect')).toBe(false)
    }
  })

  it('holds Modes, Organize, Reflect and everything under them under More, and not Lists (UI-45, UI-34)', () => {
    for (const view of ['more', 'modes', 'modes/warm-up', 'organize', 'tags', tagView('work'), 'notes', 'reflect', 'balance', 'activity', 'journal'] as const) {
      expect(isUnder(view, 'more')).toBe(true)
    }
    expect(isUnder('lists', 'more')).toBe(false)
  })
})

describe('sectionOf (UI-84)', () => {
  it('puts each section\'s own page and the pages directly under it in that section', () => {
    const work = createList('Work', NOW)

    for (const view of ['lists', 'inbox', oneListView(work.id)] as const) expect(sectionOf(view)).toBe('lists')
    for (const view of ['rewards', 'rewards/cases', 'rewards/rules'] as const) expect(sectionOf(view)).toBe('rewards')
    expect(sectionOf('modes')).toBe('modes')
    expect(sectionOf('modes/warm-up')).toBe('modes')
    expect(sectionOf('organize')).toBe('organize')
    expect(sectionOf('tags')).toBe('organize')
    expect(sectionOf('notes')).toBe('organize')
    expect(sectionOf('reflect')).toBe('reflect')
    expect(sectionOf('journal')).toBe('reflect')
  })

  it('leaves out a tag\'s tasks, a step further down, and every page of no section', () => {
    for (const view of [tagView('work'), 'today', 'tasks', 'habits', 'level', 'more', 'notifications', 'trash', 'settings'] as const) {
      expect(sectionOf(view)).toBeNull()
    }
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

  it('goes to Tasks for a task with no day, which Today leaves out (TIME-20, LIST-5)', () => {
    const undated = createTask('someday', null, NOW)

    expect(viewShowingTask(undated, 'rewards', NOW, [])).toBe('tasks')
  })
})

describe('doneSpans and foldedSpans', () => {
  const work = oneListView('6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d')

  it('divides the done on Tasks by rolling windows, folding all but today\'s (TASK-56, TASK-73)', () => {
    expect(doneSpans('tasks')).toEqual(['today', 'yesterday', 'last7Days', 'last30Days'])
    expect(foldedSpans('tasks')).toEqual(['yesterday', 'last7Days', 'last30Days', 'earlier'])
  })

  it('shows a list\'s done work of today and folds the week\'s, the month\'s and earlier (TASK-72)', () => {
    for (const view of ['inbox', work, tagView('work')] as const) {
      expect(doneSpans(view)).toEqual(['today', 'last7Days', 'last30Days'])
      expect(foldedSpans(view)).toEqual(['last7Days', 'last30Days', 'earlier'])
    }
  })

  it('keeps one open run of done tasks on Today, Tomorrow, Week and Month (TASK-69)', () => {
    for (const view of ['today', 'tomorrow', 'week', 'month'] as const) {
      expect(doneSpans(view)).toBeNull()
      expect(foldedSpans(view)).toEqual([])
    }
  })
})

describe('Tomorrow', () => {
  it('shows what is due tomorrow, and nothing gathered up from before (LIST-22)', () => {
    const tomorrow = setDueDate(createTask('call the bank', null, NOW), '2026-09-17')
    const today = setDueDate(createTask('report', null, NOW), TODAY)
    const undated = createTask('someday', null, NOW)

    expect(showsTask('tomorrow', tomorrow, NOW, [])).toBe(true)
    expect(showsTask('tomorrow', today, NOW, [])).toBe(false)
    expect(showsTask('tomorrow', undated, NOW, [])).toBe(false)
    expect(showsTask('week', undated, NOW, [])).toBe(true)
  })

  it('gives a task added there tomorrow as its day (LIST-25)', () => {
    expect(newTaskDueDay('tomorrow', NOW)).toBe('2026-09-17')
    expect(newTaskDueDay('today', NOW)).toBe(TODAY)
  })
})

describe('historyScope', () => {
  it('asks after every task on Tasks, and the tasks in no list for the Inbox (STORE-55)', () => {
    expect(historyScope('tasks')).toEqual({ kind: 'all' })
    expect(historyScope('inbox')).toEqual({ kind: 'list', listId: null })
  })

  it('asks after a list\'s tasks, and a tag\'s as the tag is kept (STORE-55)', () => {
    expect(historyScope(oneListView('6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d'))).toEqual({
      kind: 'list',
      listId: '6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d',
    })
    expect(historyScope(tagView('work'), ['Errands', 'Work'])).toEqual({ kind: 'tag', tag: 'Work' })
  })

  it('asks nothing of a period\'s view, which folds no spans (STORE-55)', () => {
    expect(historyScope('today')).toBeNull()
  })
})
