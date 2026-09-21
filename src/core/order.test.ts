import { describe, expect, it } from 'vitest'
import { appendTask, compareOrder, insertTask, moveTask, ORDER_STEP, sortByOrder, sortForDisplay } from './order'
import { completeTask, createTask, deleteTask, setDueDate, type Task } from './task'

// Local noon so due days match the calendar day of NOW without UTC drift.
const NOW = new Date(2026, 8, 16, 12, 0)

/** A list built the way the app builds one: each task added at the end. */
function listOf(...titles: string[]): Task[] {
  return titles.reduce<Task[]>((tasks, title) => appendTask(tasks, createTask(title, null, NOW)), [])
}

function titles(tasks: readonly Task[]): string[] {
  return sortByOrder(tasks).map((task) => task.title)
}

function displayTitles(tasks: readonly Task[]): string[] {
  return sortForDisplay(tasks, NOW).map((task) => task.title)
}

function idOf(tasks: readonly Task[], title: string): string {
  const task = tasks.find((candidate) => candidate.title === title)
  if (task === undefined) throw new Error(`No task called ${title}`)
  return task.id
}

describe('appendTask', () => {
  it('puts the first task at zero and each one after it a step further on', () => {
    expect(listOf('a', 'b', 'c').map((task) => task.order)).toEqual([0, ORDER_STEP, 2 * ORDER_STEP])
  })

  it('goes past trashed tasks too, so a restored one never shares a number', () => {
    const [a, b] = listOf('a', 'b')
    const tasks = appendTask([a, deleteTask(b, NOW)], createTask('c', null, NOW))

    expect(tasks[2].order).toBe(2 * ORDER_STEP)
  })

  it('never modifies the list it is given', () => {
    const tasks = listOf('a')
    appendTask(tasks, createTask('b', null, NOW))

    expect(tasks).toHaveLength(1)
  })
})

describe('compareOrder', () => {
  it('breaks a tie by age, then by id, so the order is never left to chance', () => {
    const older = { ...createTask('older', null, new Date(2026, 8, 15, 10, 0)), order: 5 }
    const newer = { ...createTask('newer', null, NOW), order: 5 }

    expect(sortByOrder([newer, older]).map((task) => task.title)).toEqual(['older', 'newer'])
    expect(compareOrder(older, older)).toBe(0)
  })
})

describe('sortForDisplay', () => {
  it('floats overdue tasks to the top and sinks done ones to the bottom (TASK-17)', () => {
    const [open, overdue, done, later] = listOf('open', 'overdue', 'done', 'later')
    const tasks = [
      open,
      setDueDate(overdue, '2026-09-14'),
      completeTask(done, NOW),
      setDueDate(later, '2026-09-20'),
    ]

    expect(displayTitles(tasks)).toEqual(['overdue', 'open', 'later', 'done'])
  })

  it('floats urgent tasks above overdue ones (TASK-60)', () => {
    const [open, overdue, urgent, done] = listOf('open', 'overdue', 'urgent', 'done')
    const tasks = [
      open,
      setDueDate(overdue, '2026-09-14'),
      { ...urgent, urgent: true },
      completeTask(done, NOW),
    ]

    expect(displayTitles(tasks)).toEqual(['urgent', 'overdue', 'open', 'done'])
  })

  it('keeps stored order inside each band, so completing one does not shuffle the rest (TASK-17)', () => {
    const [a, b, c] = listOf('a', 'b', 'c')
    const tasks = [setDueDate(a, '2026-09-10'), setDueDate(c, '2026-09-12'), b]

    expect(displayTitles(tasks)).toEqual(['a', 'c', 'b'])
  })

  it('never modifies the list it is given', () => {
    const tasks = listOf('a', 'b')
    sortForDisplay(tasks, NOW)

    expect(tasks.map((task) => task.title)).toEqual(['a', 'b'])
  })
})

describe('moveTask', () => {
  it('moves a task down, to just after its target', () => {
    const tasks = listOf('a', 'b', 'c')

    expect(titles(moveTask(tasks, idOf(tasks, 'a'), idOf(tasks, 'c'), 'after'))).toEqual(['b', 'c', 'a'])
  })

  it('moves a task up, to just before its target', () => {
    const tasks = listOf('a', 'b', 'c')

    expect(titles(moveTask(tasks, idOf(tasks, 'c'), idOf(tasks, 'a'), 'before'))).toEqual(['c', 'a', 'b'])
  })

  it('lands between two neighbours', () => {
    const tasks = listOf('a', 'b', 'c')

    expect(titles(moveTask(tasks, idOf(tasks, 'c'), idOf(tasks, 'a'), 'after'))).toEqual(['a', 'c', 'b'])
  })

  it('rewrites the moved task and nothing else', () => {
    const tasks = listOf('a', 'b', 'c')
    const moved = moveTask(tasks, idOf(tasks, 'a'), idOf(tasks, 'b'), 'after')

    expect(moved[1]).toBe(tasks[1])
    expect(moved[2]).toBe(tasks[2])
    expect(moved[0]).toEqual({ ...tasks[0], order: ORDER_STEP * 1.5 })
  })

  it('lands next to its target even with a trashed task between them', () => {
    const [a, b, c] = listOf('a', 'b', 'c')
    const tasks = [a, deleteTask(b, NOW), c]

    const moved = moveTask(tasks, c.id, a.id, 'after')

    expect(titles(moved.filter((task) => task.deletedAt === null))).toEqual(['a', 'c'])
    expect(titles(moved)).toEqual(['a', 'c', 'b'])
  })

  it('numbers the list afresh once there is no room left between neighbours', () => {
    const [a, b, c] = listOf('a', 'b', 'c')
    const cramped = [a, { ...b, order: Number.MIN_VALUE }, c]

    const moved = moveTask(cramped, c.id, a.id, 'after')

    expect(titles(moved)).toEqual(['a', 'c', 'b'])
    expect(sortByOrder(moved).map((task) => task.order)).toEqual([0, ORDER_STEP, 2 * ORDER_STEP])
    expect(moved[0]).toBe(cramped[0])
  })

  it('changes nothing when the task is already where it was asked to go', () => {
    const tasks = listOf('a', 'b', 'c')

    expect(moveTask(tasks, idOf(tasks, 'a'), idOf(tasks, 'b'), 'before')).toEqual(tasks)
    expect(moveTask(tasks, idOf(tasks, 'b'), idOf(tasks, 'b'), 'after')).toEqual(tasks)
  })

  it('changes nothing when either task is not in the list', () => {
    const tasks = listOf('a', 'b')

    expect(moveTask(tasks, 'missing', idOf(tasks, 'a'), 'before')).toEqual(tasks)
    expect(moveTask(tasks, idOf(tasks, 'a'), 'missing', 'after')).toEqual(tasks)
  })

  it('never modifies the list it is given', () => {
    const tasks = listOf('a', 'b', 'c')
    const before = structuredClone(tasks)

    moveTask(tasks, idOf(tasks, 'a'), idOf(tasks, 'c'), 'after')

    expect(tasks).toEqual(before)
  })
})

describe('insertTask', () => {
  it('puts a new task just after its target, between it and the next (TASK-54)', () => {
    const tasks = listOf('a', 'b', 'c')
    const inserted = insertTask(tasks, createTask('copy', null, NOW), idOf(tasks, 'a'), 'after')

    expect(titles(inserted)).toEqual(['a', 'copy', 'b', 'c'])
    expect(inserted.slice(0, 3)).toEqual(tasks)
  })

  it('puts it at the end when the target is the last task', () => {
    const tasks = listOf('a', 'b')

    expect(titles(insertTask(tasks, createTask('copy', null, NOW), idOf(tasks, 'b'), 'after'))).toEqual(['a', 'b', 'copy'])
  })

  it('puts it at the end when the target is not in the list', () => {
    const tasks = listOf('a', 'b')

    expect(titles(insertTask(tasks, createTask('copy', null, NOW), 'missing', 'after'))).toEqual(['a', 'b', 'copy'])
  })

  it('never modifies the list it is given', () => {
    const tasks = listOf('a', 'b')
    const before = structuredClone(tasks)

    insertTask(tasks, createTask('copy', null, NOW), idOf(tasks, 'a'), 'after')

    expect(tasks).toEqual(before)
  })
})
