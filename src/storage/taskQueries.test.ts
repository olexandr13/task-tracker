import { describe, expect, it } from 'vitest'
import {
  completeTask,
  createTask,
  deleteTask,
  isHistory,
  moveToList,
  setDueDate,
  addTag,
  uncompleteTask,
  type Task,
} from '../core'
import { heldFromStart, historyFrom, scopeFilters, type TaskFilter, type TaskQuery } from './taskQueries'
import { inScope, type TaskScope } from './taskRepository'
import { readStoredTask, toStoredTask } from './taskSchema'

/*
 * What the questions asked of the saved tasks come to, answered here the way
 * Firestore answers them: a field a document lacks matches nothing, `!=` wants
 * the field there and different, and a range compares text with text alone.
 * STORE ids refer to wiki/storage.md.
 */

/** A field of a saved document, by its dotted path, or undefined where it has none. */
function fieldOf(saved: unknown, path: string): unknown {
  let value: unknown = saved
  for (const part of path.split('.')) {
    if (typeof value !== 'object' || value === null || !(part in value)) return undefined
    value = (value as Record<string, unknown>)[part]
  }
  return value
}

function matchesFilter(saved: unknown, [field, op, expected]: TaskFilter): boolean {
  const value = fieldOf(saved, field)
  if (value === undefined) return false

  switch (op) {
    case '==':
      return value === expected
    case '!=':
      return value !== expected
    case '>=':
      return typeof value === 'string' && typeof expected === 'string' && value >= expected
    case '<':
      return typeof value === 'string' && typeof expected === 'string' && value < expected
    case 'array-contains':
      return Array.isArray(value) && value.includes(expected)
  }
}

const matches = (saved: unknown, query: TaskQuery) => query.filters.every((filter) => matchesFilter(saved, filter))
const heldBy = (saved: unknown, queries: readonly TaskQuery[]) => queries.some((query) => matches(saved, query))

// Friday 2 October 2026; history ends where the week began, on Monday 28 September.
const START = '2026-09-28'
const LONG_AGO = new Date(2026, 6, 10, 12, 0)
const BEFORE_START = new Date(2026, 8, 27, 21, 0)
const THIS_WEEK = new Date(2026, 8, 29, 10, 0)
const MADE = new Date(2026, 5, 1, 9, 0)

const task = (title: string) => createTask(title, null, MADE)

/** One of every kind of task there is to hold or leave behind. */
const TASKS: Record<string, Task> = {
  'open, no day': task('open'),
  'open, overdue': setDueDate(task('late'), '2026-07-01'),
  'open, due later': setDueDate(task('later'), '2026-10-20'),
  'done long ago': completeTask(task('old'), LONG_AGO),
  'done the night before the start': completeTask(task('eve'), BEFORE_START),
  'done long ago, due long ago': completeTask(setDueDate(task('old, dated'), '2026-07-09'), LONG_AGO),
  'done long ago, due this month': completeTask(setDueDate(task('early'), '2026-10-15'), LONG_AGO),
  'done this week': completeTask(task('fresh'), THIS_WEEK),
  'a habit last done long ago': completeTask(createTask('stretch', { kind: 'daily' }, MADE), LONG_AGO),
  'a weekly task never done': createTask('bins', { kind: 'weekly', weekdays: [1] }, MADE),
  'done long ago, in the trash': deleteTask(completeTask(task('binned'), LONG_AGO), THIS_WEEK),
  'open, in the trash': deleteTask(task('dropped'), THIS_WEEK),
  'done before anything said when': { ...completeTask(task('ancient'), LONG_AGO), completedAt: null },
  'done long ago, taken back': uncompleteTask(completeTask(task('reopened'), LONG_AGO), THIS_WEEK),
}

const saved = (one: Task) => toStoredTask(one)

describe('heldFromStart', () => {
  it.each(Object.entries(TASKS))('holds %s exactly when it is not history (STORE-55)', (_name, one) => {
    expect(heldBy(saved(one), heldFromStart(START))).toBe(!isHistory(one, START))
  })

  it('leaves history behind, and holds every other kind (STORE-55)', () => {
    const left = Object.entries(TASKS)
      .filter(([, one]) => !heldBy(saved(one), heldFromStart(START)))
      .map(([name]) => name)

    expect(left).toEqual([
      'done long ago',
      'done the night before the start',
      'done long ago, due long ago',
      'done before anything said when',
    ])
  })

  it('reads a task saved before its fields existed the way the app reads it (STORE-55, STORE-6)', () => {
    // Version 1 knew a title, a status and the two times, and nothing else.
    const doneV1 = { version: 1, task: { id: 'a', title: 'old', status: 'done', createdAt: MADE.toISOString(), completedAt: LONG_AGO.toISOString() } }
    const openV1 = { version: 1, task: { id: 'b', title: 'open', status: 'todo', createdAt: MADE.toISOString(), completedAt: null } }

    for (const old of [doneV1, openV1]) {
      const read = readStoredTask(old)
      expect(read).not.toBeNull()
      expect(heldBy(old, heldFromStart(START))).toBe(!isHistory(read as Task, START))
    }
  })
})

describe('historyFrom', () => {
  it('holds every task finished from the day reached back to (STORE-55)', () => {
    const asked = [...heldFromStart(START), ...historyFrom('2026-07-10', START)]

    expect(heldBy(saved(TASKS['done long ago']), asked)).toBe(true)
    expect(heldBy(saved(TASKS['done the night before the start']), asked)).toBe(true)
    expect(heldBy(saved(completeTask(task('older'), new Date(2026, 6, 9, 23, 0))), asked)).toBe(false)
  })

  it('holds every task there is once reached back to the start of everything (STORE-55)', () => {
    const asked = [...heldFromStart(START), ...historyFrom('2026-07-10', START), ...historyFrom(null, '2026-07-10')]

    for (const one of Object.values(TASKS)) {
      expect(heldBy(saved(one), asked)).toBe(true)
    }
  })
})

describe('scopeFilters', () => {
  const work = '6f1b2c3d-0f3a-4a1b-9c2e-8d7f6a5b4c3d'
  const filed = moveToList(task('report'), work)
  const tagged = addTag(task('walk'), 'rest')
  const loose = task('call')

  it.each<[string, TaskScope]>([
    ['every task', { kind: 'all' }],
    ['a list', { kind: 'list', listId: work }],
    ['the Inbox', { kind: 'list', listId: null }],
    ['a tag', { kind: 'tag', tag: 'rest' }],
  ])('counts %s on the server as the app does (STORE-55)', (_name, scope) => {
    for (const one of [filed, tagged, loose]) {
      const query = { key: 'scope', filters: scopeFilters(scope) }
      expect(matches(saved(one), query)).toBe(inScope(one, scope))
    }
  })
})
