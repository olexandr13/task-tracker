import { describe, expect, it } from 'vitest'
import { appendTask, completeTask, createTask, insertSubtask, moveTask, renameTask, sortByOrder, type Task } from '../core'
import { changedFields, sameData, type FieldChange } from './recordFields'
import { readStoredTask, SCHEMA_VERSION, toStoredTask } from './taskSchema'

/*
 * What a change writes into a task already saved (STORE-16): the fields it
 * changed, so two devices changing different parts of one task both keep
 * theirs. STORE ids refer to wiki/storage.md.
 */

const AT = new Date('2026-10-25T09:00:00Z')

/** The task as it is saved, `{ version, task }`, as a plain map of fields. */
function stored(task: Task): Record<string, unknown> {
  return { ...toStoredTask(task) }
}

function threeTasks(): Task[] {
  return ['Write', 'Call', 'Read'].reduce<Task[]>((tasks, title) => appendTask(tasks, createTask(title, null, AT)), [])
}

/** A saved document as Firestore holds it once `changes` are applied, the way `update` applies them. */
function applied(saved: Record<string, unknown>, changes: readonly FieldChange[]): Record<string, unknown> {
  const result = structuredClone(saved)
  for (const { path, value } of changes) {
    let at: Record<string, unknown> = result
    for (const part of path.slice(0, -1)) at = at[part] as Record<string, unknown>
    at[path[path.length - 1] as string] = value
  }
  return result
}

function titles(tasks: readonly Task[]): string[] {
  return sortByOrder(tasks).map((task) => task.title)
}

describe('what a change writes into a saved task (STORE-16)', () => {
  it('writes only its place when it is moved', () => {
    const tasks = threeTasks()
    const moved = moveTask(tasks, tasks[2]!.id, tasks[0]!.id, 'before')
    const read = stored(tasks[2]!)

    expect(changedFields(stored(moved[2]!), read)).toEqual([{ path: ['task', 'order'], value: moved[2]!.order }])
  })

  it('writes nothing when nothing differs from what was read', () => {
    const [task] = threeTasks()

    expect(changedFields(stored(task!), stored(task!))).toEqual([])
  })

  it('writes a list held by a field whole', () => {
    const [task] = threeTasks()
    const listed = insertSubtask(task!, 0, 'Outline', AT)

    expect(changedFields(stored(listed), stored(task!))).toEqual([
      { path: ['task', 'subtasks'], value: listed.subtasks },
    ])
  })

  it('writes the whole task when it was never read here', () => {
    const [task] = threeTasks()

    expect(changedFields(stored(task!), undefined)).toBeNull()
  })

  it('writes the whole task when it was read in an older version, bringing it up to today’s (STORE-4)', () => {
    const [task] = threeTasks()

    expect(changedFields(stored(task!), { ...stored(task!), version: SCHEMA_VERSION - 1 })).toBeNull()
  })

  it('writes the whole task when what was read does not line up field for field', () => {
    const [task] = threeTasks()
    const { title: _title, ...untitled } = toStoredTask(task!).task

    expect(changedFields(stored(task!), { version: SCHEMA_VERSION, task: untitled })).toBeNull()
    expect(changedFields(stored(task!), { version: SCHEMA_VERSION, task: task, extra: true })).toBeNull()
  })

  it('keeps a move made on one device when another, not yet told of it, ticks the task off', () => {
    const tasks = threeTasks()
    const read = stored(tasks[2]!)
    // The desktop moves Read to the top; the server has it there.
    const desktop = moveTask(tasks, tasks[2]!.id, tasks[0]!.id, 'before')
    const onServer = applied(read, changedFields(stored(desktop[2]!), read)!)
    // The phone still has Read last, and ticks it off.
    const phone = changedFields(stored(completeTask(tasks[2]!, AT)), read)!
    const after = readStoredTask(applied(onServer, phone))!

    expect(phone.map((change) => change.path.join('.'))).not.toContain('task.order')
    expect(after.order).toBe(desktop[2]!.order)
    expect(after.status).toBe('done')
    expect(titles([desktop[0]!, desktop[1]!, after])).toEqual(['Read', 'Write', 'Call'])
  })

  it('keeps a rename made on one device when another, not yet told of it, moves the task', () => {
    const tasks = threeTasks()
    const read = stored(tasks[0]!)
    const onServer = applied(read, changedFields(stored(renameTask(tasks[0]!, 'Write the plan')), read)!)
    const moved = moveTask(tasks, tasks[0]!.id, tasks[2]!.id, 'after')
    const after = readStoredTask(applied(onServer, changedFields(stored(moved[0]!), read)!))!

    expect(after.title).toBe('Write the plan')
    expect(titles([after, moved[1]!, moved[2]!])).toEqual(['Call', 'Read', 'Write the plan'])
  })
})

describe('whether two saved values hold the same', () => {
  it('reads maps field by field, in any order', () => {
    expect(sameData({ a: 1, b: [1, { c: null }] }, { b: [1, { c: null }], a: 1 })).toBe(true)
    expect(sameData({ a: 1 }, { a: 1, b: undefined })).toBe(false)
  })

  it('reads lists item by item, in order', () => {
    expect(sameData(['2026-10-24', '2026-10-25'], ['2026-10-24', '2026-10-25'])).toBe(true)
    expect(sameData(['2026-10-24', '2026-10-25'], ['2026-10-25', '2026-10-24'])).toBe(false)
    expect(sameData([], {})).toBe(false)
  })
})
