import { describe, expect, it } from 'vitest'
import { isSubtaskComplete } from './subtask'
import {
  addSubtask,
  completeTask,
  countSubtasks,
  createTask,
  hasSubtasks,
  insertSubtask,
  isComplete,
  removeSubtask,
  renameSubtask,
  setRepeat,
  setSubtaskDone,
  uncompleteTask,
  type Task,
} from './task'
import { EmptyTitleError } from './title'

const NOW = new Date('2026-09-15T10:00:00.000Z')
const LATER = new Date('2026-09-15T18:30:00.000Z')
const TOMORROW = new Date('2026-09-16T09:00:00.000Z')

/** A task with `titles` on its checklist, none of them ticked. */
function withChecklist(titles: readonly string[], repeat: Task['repeat'] = null): Task {
  return titles.reduce((task, title) => addSubtask(task, title, NOW), createTask('ship it', repeat, NOW))
}

/** Ticks every item, oldest first, and hands back the task that leaves. */
function tickAll(task: Task, now: Date = LATER): Task {
  return task.subtasks.reduce<Task>((current, subtask) => setSubtaskDone(current, subtask.id, true, now), task)
}

describe('addSubtask', () => {
  it('appends to the end, so the list keeps the order it was written in', () => {
    const task = withChecklist(['crate it', 'label it', 'post it'])

    expect(task.subtasks.map((subtask) => subtask.title)).toEqual(['crate it', 'label it', 'post it'])
  })

  it('trims the title and refuses a blank one, exactly as a task does', () => {
    expect(withChecklist(['  crate it  ']).subtasks[0].title).toBe('crate it')
    expect(() => addSubtask(createTask('ship it', null, NOW), '   ', NOW)).toThrow(EmptyTitleError)
  })

  it('gives every item its own id, and stamps when it was added', () => {
    const [first, second] = withChecklist(['crate it', 'crate it']).subtasks

    expect(first.id).not.toBe(second.id)
    expect(first.createdAt).toBe(NOW.toISOString())
    expect(first.completedAt).toBeNull()
  })

  it('reopens a task that was already done: it has just been given another part', () => {
    const done = completeTask(createTask('ship it', null, NOW), LATER)
    const reopened = addSubtask(done, 'post it', LATER)

    expect(isComplete(reopened, LATER)).toBe(false)
    expect(reopened.completedAt).toBeNull()
  })
})

describe('insertSubtask', () => {
  const titles = (task: Task) => task.subtasks.map((subtask) => subtask.title)

  it('puts the item at the index and pushes the rest down', () => {
    const task = insertSubtask(withChecklist(['crate it', 'post it']), 1, 'label it', LATER)

    expect(titles(task)).toEqual(['crate it', 'label it', 'post it'])
  })

  it('holds an index past either end to that end', () => {
    const task = withChecklist(['label it'])

    expect(titles(insertSubtask(task, -3, 'crate it', LATER))).toEqual(['crate it', 'label it'])
    expect(titles(insertSubtask(task, 9, 'post it', LATER))).toEqual(['label it', 'post it'])
  })

  it('refuses a blank title and reopens a finished task, as adding does', () => {
    const finished = tickAll(withChecklist(['crate it', 'post it']))

    expect(() => insertSubtask(finished, 1, '  ', LATER)).toThrow(EmptyTitleError)
    expect(isComplete(insertSubtask(finished, 1, 'label it', LATER), LATER)).toBe(false)
  })
})

describe('setSubtaskDone', () => {
  it('leaves the task todo while anything is still open', () => {
    const task = withChecklist(['crate it', 'label it'])
    const partly = setSubtaskDone(task, task.subtasks[0].id, true, LATER)

    expect(isComplete(partly, LATER)).toBe(false)
    expect(countSubtasks(partly, LATER)).toEqual({ done: 1, total: 2 })
  })

  it('completes the task when the last item is ticked, and stamps it', () => {
    const finished = tickAll(withChecklist(['crate it', 'label it']))

    expect(isComplete(finished, LATER)).toBe(true)
    expect(finished.completedAt).toBe(LATER.toISOString())
  })

  it('reopens the task when a tick is taken back', () => {
    const finished = tickAll(withChecklist(['crate it', 'label it']))
    const reopened = setSubtaskDone(finished, finished.subtasks[0].id, false, LATER)

    expect(isComplete(reopened, LATER)).toBe(false)
    expect(reopened.completedAt).toBeNull()
  })

  it('leaves the other items alone when one tick is taken back', () => {
    const finished = tickAll(withChecklist(['crate it', 'label it', 'post it']))
    const reopened = setSubtaskDone(finished, finished.subtasks[0].id, false, LATER)

    expect(countSubtasks(reopened, LATER)).toEqual({ done: 2, total: 3 })
  })

  it('changes nothing when the item is already the way it is being asked for', () => {
    const task = withChecklist(['crate it'])
    const ticked = setSubtaskDone(task, task.subtasks[0].id, true, LATER)

    expect(setSubtaskDone(ticked, ticked.subtasks[0].id, true, LATER)).toBe(ticked)
  })

  it('ignores an id that is not on the list', () => {
    const task = withChecklist(['crate it'])

    expect(setSubtaskDone(task, 'not-an-id', true, LATER).subtasks).toEqual(task.subtasks)
  })
})

describe('a checklist under a repeating task', () => {
  it('comes back with the task when the next occurrence arrives', () => {
    const finished = tickAll(withChecklist(['stretch', 'push-ups'], { kind: 'daily' }))

    expect(isComplete(finished, LATER)).toBe(true)
    expect(countSubtasks(finished, LATER)).toEqual({ done: 2, total: 2 })

    // Nothing has run in between: the same record, asked about a different day.
    expect(isComplete(finished, TOMORROW)).toBe(false)
    expect(countSubtasks(finished, TOMORROW)).toEqual({ done: 0, total: 2 })
  })

  it('counts a tick only from the occurrence in play', () => {
    const task = withChecklist(['stretch'], { kind: 'daily' })
    const ticked = setSubtaskDone(task, task.subtasks[0].id, true, LATER)

    expect(isSubtaskComplete(ticked.subtasks[0], ticked.repeat, LATER)).toBe(true)
    expect(isSubtaskComplete(ticked.subtasks[0], ticked.repeat, TOMORROW)).toBe(false)
  })

  it('treats a tick under a one-off task as simply ticked', () => {
    const task = withChecklist(['crate it'])
    const ticked = setSubtaskDone(task, task.subtasks[0].id, true, NOW)

    expect(isSubtaskComplete(ticked.subtasks[0], null, TOMORROW)).toBe(true)
  })
})

describe('completeTask and uncompleteTask, with a checklist', () => {
  it('ticks the whole list when the task itself is ticked', () => {
    const task = withChecklist(['crate it', 'label it'])
    const done = completeTask(task, LATER)

    expect(countSubtasks(done, LATER)).toEqual({ done: 2, total: 2 })
    expect(done.subtasks.every((subtask) => subtask.completedAt === LATER.toISOString())).toBe(true)
  })

  it('keeps a tick that was already there rather than restamping it', () => {
    const task = withChecklist(['crate it', 'label it'])
    const partly = setSubtaskDone(task, task.subtasks[0].id, true, NOW)
    const done = completeTask(partly, LATER)

    expect(done.subtasks[0].completedAt).toBe(NOW.toISOString())
    expect(done.subtasks[1].completedAt).toBe(LATER.toISOString())
  })

  it('clears the whole list when the task itself is unticked', () => {
    const done = completeTask(withChecklist(['crate it', 'label it']), LATER)
    const reopened = uncompleteTask(done, LATER)

    expect(countSubtasks(reopened, LATER)).toEqual({ done: 0, total: 2 })
    expect(reopened.subtasks.every((subtask) => subtask.completedAt === null)).toBe(true)
  })
})

describe('renameSubtask', () => {
  it('changes the title and trims it', () => {
    const task = withChecklist(['crate it'])
    const renamed = renameSubtask(task, task.subtasks[0].id, '  crate it properly  ')

    expect(renamed.subtasks[0].title).toBe('crate it properly')
  })

  it('keeps the id and the tick, so a rename cannot finish or reopen anything', () => {
    const finished = tickAll(withChecklist(['crate it']))
    const renamed = renameSubtask(finished, finished.subtasks[0].id, 'crate it properly')

    expect(renamed.subtasks[0].id).toBe(finished.subtasks[0].id)
    expect(renamed.subtasks[0].completedAt).toBe(finished.subtasks[0].completedAt)
    expect(isComplete(renamed, LATER)).toBe(true)
  })

  it('refuses a blank title, as a task rename does', () => {
    const task = withChecklist(['crate it'])

    expect(() => renameSubtask(task, task.subtasks[0].id, '   ')).toThrow(EmptyTitleError)
  })
})

describe('removeSubtask', () => {
  it('takes the item off the list', () => {
    const task = withChecklist(['crate it', 'label it'])
    const shorter = removeSubtask(task, task.subtasks[0].id, LATER)

    expect(shorter.subtasks.map((subtask) => subtask.title)).toEqual(['label it'])
  })

  it('completes the task when the item removed was the last one still open', () => {
    const task = withChecklist(['crate it', 'label it'])
    const partly = setSubtaskDone(task, task.subtasks[0].id, true, LATER)

    expect(isComplete(removeSubtask(partly, partly.subtasks[1].id, LATER), LATER)).toBe(true)
  })

  it('leaves a task emptied of its checklist to its own box', () => {
    const finished = tickAll(withChecklist(['crate it']))
    const emptied = removeSubtask(finished, finished.subtasks[0].id, LATER)

    expect(hasSubtasks(emptied)).toBe(false)
    expect(isComplete(emptied, LATER)).toBe(true)
  })

  it('ignores an id that is not on the list', () => {
    const task = withChecklist(['crate it'])

    expect(removeSubtask(task, 'not-an-id', LATER)).toBe(task)
  })
})

describe('setRepeat, with a checklist', () => {
  it('lets go of ticks from an occurrence that has passed when the rule is dropped', () => {
    const finished = tickAll(withChecklist(['stretch', 'push-ups'], { kind: 'daily' }))

    // Tomorrow the task reads as todo and so does its list; making it a one-off
    // must not harden yesterday's ticks into permanent ones.
    const once = setRepeat(finished, null, TOMORROW)

    expect(once.subtasks.every((subtask) => subtask.completedAt === null)).toBe(true)
    expect(isComplete(once, TOMORROW)).toBe(false)
  })

  it('keeps ticks that still count for the occurrence in play', () => {
    const finished = tickAll(withChecklist(['stretch', 'push-ups'], { kind: 'daily' }))
    const once = setRepeat(finished, null, LATER)

    expect(countSubtasks(once, LATER)).toEqual({ done: 2, total: 2 })
    expect(isComplete(once, LATER)).toBe(true)
  })
})

describe('countSubtasks', () => {
  it('reads zero of zero for a task with no checklist', () => {
    expect(countSubtasks(createTask('ship it', null, NOW), NOW)).toEqual({ done: 0, total: 0 })
  })
})

describe('the checklist and the rest of the record', () => {
  it('never mutates the task it was handed', () => {
    const task = withChecklist(['crate it'])
    const before = structuredClone(task)

    setSubtaskDone(task, task.subtasks[0].id, true, LATER)
    renameSubtask(task, task.subtasks[0].id, 'crate it properly')
    removeSubtask(task, task.subtasks[0].id, LATER)
    addSubtask(task, 'post it', LATER)

    expect(task).toEqual(before)
  })

  it('leaves the id, the creation stamp and the rule alone', () => {
    const task = withChecklist(['crate it'], { kind: 'daily' })
    const finished = tickAll(task)

    expect(finished.id).toBe(task.id)
    expect(finished.createdAt).toBe(task.createdAt)
    expect(finished.repeat).toEqual(task.repeat)
  })
})
