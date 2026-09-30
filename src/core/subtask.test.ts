import { describe, expect, it } from 'vitest'
import { isSubtaskComplete } from './subtask'
import {
  addSubtask,
  completeTask,
  countSubtasks,
  createTask,
  hasOpenSubtasks,
  hasSubtasks,
  insertSubtask,
  isComplete,
  moveSubtask,
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

/** Ticks every item, oldest first, and hands back the task that leaves — still todo (CHK-9). */
function tickAll(task: Task, now: Date = LATER): Task {
  return task.subtasks.reduce<Task>((current, subtask) => setSubtaskDone(current, subtask.id, true, now), task)
}

/** Finishes a checklisted task the only way there is: every part, then its own box (CHK-9, CHK-11). */
function finish(task: Task, now: Date = LATER): Task {
  return completeTask(tickAll(task, now), now)
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
    const finished = finish(withChecklist(['crate it', 'post it']))

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

  it('leaves the task todo when the last item is ticked, for its own box to finish (CHK-9)', () => {
    const ticked = tickAll(withChecklist(['crate it', 'label it']))

    expect(countSubtasks(ticked, LATER)).toEqual({ done: 2, total: 2 })
    expect(isComplete(ticked, LATER)).toBe(false)
    expect(ticked.completedAt).toBeNull()
  })

  it('reopens the task when a tick is taken back (CHK-10)', () => {
    const finished = finish(withChecklist(['crate it', 'label it']))
    const reopened = setSubtaskDone(finished, finished.subtasks[0].id, false, LATER)

    expect(isComplete(reopened, LATER)).toBe(false)
    expect(reopened.completedAt).toBeNull()
  })

  it('leaves the other items alone when one tick is taken back (CHK-10)', () => {
    const finished = finish(withChecklist(['crate it', 'label it', 'post it']))
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
    const finished = finish(withChecklist(['stretch', 'push-ups'], { kind: 'daily' }))

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

describe('hasOpenSubtasks', () => {
  it('is false with no checklist at all, which leaves the task to its own box', () => {
    expect(hasOpenSubtasks(createTask('ship it', null, NOW), LATER)).toBe(false)
  })

  it('is true while any item is still to tick, however many are done', () => {
    const task = withChecklist(['crate it', 'label it'])

    expect(hasOpenSubtasks(task, LATER)).toBe(true)
    expect(hasOpenSubtasks(setSubtaskDone(task, task.subtasks[0].id, true, NOW), LATER)).toBe(true)
    expect(hasOpenSubtasks(tickAll(task), LATER)).toBe(false)
  })

  it('opens again with the next occurrence of a repeating task (CHK-16)', () => {
    const daily = tickAll(withChecklist(['crate it'], { kind: 'daily' }), NOW)

    expect(hasOpenSubtasks(daily, LATER)).toBe(false)
    expect(hasOpenSubtasks(daily, TOMORROW)).toBe(true)
  })
})

describe('completeTask and uncompleteTask, with a checklist', () => {
  it('refuses the task its own box while an item is open, changing nothing (CHK-11)', () => {
    const task = withChecklist(['crate it', 'label it'])
    const partly = setSubtaskDone(task, task.subtasks[0].id, true, NOW)

    expect(completeTask(task, LATER)).toBe(task)
    expect(completeTask(partly, LATER)).toBe(partly)
    expect(countSubtasks(partly, LATER)).toEqual({ done: 1, total: 2 })
  })

  it('refuses a repeating task whose list has come back open, day after day (CHK-11, CHK-16)', () => {
    const daily = finish(withChecklist(['crate it'], { kind: 'daily' }), NOW)

    expect(isComplete(daily, LATER)).toBe(true)
    expect(completeTask(daily, TOMORROW)).toBe(daily)
    expect(isComplete(daily, TOMORROW)).toBe(false)
  })

  it('has nothing to refuse once every item is ticked, and stamps the box (CHK-9)', () => {
    const ticked = tickAll(withChecklist(['crate it', 'label it']), NOW)
    const done = completeTask(ticked, LATER)

    expect(isComplete(done, LATER)).toBe(true)
    expect(done.completedAt).toBe(LATER.toISOString())
    expect(countSubtasks(done, LATER)).toEqual({ done: 2, total: 2 })
  })

  it('leaves the whole list as it was when the task itself is unticked (CHK-12)', () => {
    const done = finish(withChecklist(['crate it', 'label it']))
    const reopened = uncompleteTask(done, LATER)

    expect(isComplete(reopened, LATER)).toBe(false)
    expect(countSubtasks(reopened, LATER)).toEqual({ done: 2, total: 2 })
    expect(reopened.subtasks).toEqual(done.subtasks)
  })
})

describe('renameSubtask', () => {
  it('changes the title and trims it', () => {
    const task = withChecklist(['crate it'])
    const renamed = renameSubtask(task, task.subtasks[0].id, '  crate it properly  ')

    expect(renamed.subtasks[0].title).toBe('crate it properly')
  })

  it('keeps the id and the tick, so a rename cannot finish or reopen anything', () => {
    const finished = finish(withChecklist(['crate it']))
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

  it('leaves the task todo when the item removed was the last one still open (CHK-14)', () => {
    const task = withChecklist(['crate it', 'label it'])
    const partly = setSubtaskDone(task, task.subtasks[0].id, true, LATER)
    const shorter = removeSubtask(partly, partly.subtasks[1].id, LATER)

    expect(isComplete(shorter, LATER)).toBe(false)
    expect(completeTask(shorter, LATER).completedAt).toBe(LATER.toISOString())
  })

  it('leaves a task emptied of its checklist to its own box', () => {
    const finished = finish(withChecklist(['crate it']))
    const emptied = removeSubtask(finished, finished.subtasks[0].id, LATER)

    expect(hasSubtasks(emptied)).toBe(false)
    expect(isComplete(emptied, LATER)).toBe(true)
  })

  it('ignores an id that is not on the list', () => {
    const task = withChecklist(['crate it'])

    expect(removeSubtask(task, 'not-an-id', LATER)).toBe(task)
  })
})

describe('moveSubtask', () => {
  /** The checklist as it reads, which is the only thing a move is about. */
  function titles(task: Task): string[] {
    return task.subtasks.map((subtask) => subtask.title)
  }

  it('puts an item after another, dragged down the list', () => {
    const task = withChecklist(['crate it', 'label it', 'post it'])
    const moved = moveSubtask(task, task.subtasks[0].id, task.subtasks[2].id, 'after')

    expect(titles(moved)).toEqual(['label it', 'post it', 'crate it'])
  })

  it('puts an item before another, dragged up the list', () => {
    const task = withChecklist(['crate it', 'label it', 'post it'])
    const moved = moveSubtask(task, task.subtasks[2].id, task.subtasks[0].id, 'before')

    expect(titles(moved)).toEqual(['post it', 'crate it', 'label it'])
  })

  it('lands between the target and its neighbour, not on the target', () => {
    const task = withChecklist(['crate it', 'label it', 'post it'])
    const moved = moveSubtask(task, task.subtasks[0].id, task.subtasks[1].id, 'after')

    expect(titles(moved)).toEqual(['label it', 'crate it', 'post it'])
  })

  it('keeps every id and every tick, so a move cannot finish or reopen a task', () => {
    const task = withChecklist(['crate it', 'label it'])
    const ticked = setSubtaskDone(task, task.subtasks[0].id, true, LATER)
    const moved = moveSubtask(ticked, ticked.subtasks[0].id, ticked.subtasks[1].id, 'after')

    expect(moved.subtasks.map((subtask) => subtask.id).sort()).toEqual(
      ticked.subtasks.map((subtask) => subtask.id).sort(),
    )
    expect(titles(moved)).toEqual(['label it', 'crate it'])
    expect(moved.subtasks[1].completedAt).toBe(ticked.subtasks[0].completedAt)
    expect(isComplete(moved, LATER)).toBe(false)
  })

  it('leaves a ticked item where it was put rather than sinking it', () => {
    const task = withChecklist(['crate it', 'label it', 'post it'])
    const ticked = setSubtaskDone(task, task.subtasks[2].id, true, LATER)
    const moved = moveSubtask(ticked, ticked.subtasks[2].id, ticked.subtasks[0].id, 'before')

    expect(titles(moved)).toEqual(['post it', 'crate it', 'label it'])
  })

  it('does nothing when the item is already where it would land', () => {
    const task = withChecklist(['crate it', 'label it'])

    expect(moveSubtask(task, task.subtasks[0].id, task.subtasks[1].id, 'before')).toBe(task)
  })

  it('does nothing for an item or a target that is not on the list, or for itself', () => {
    const task = withChecklist(['crate it', 'label it'])

    expect(moveSubtask(task, 'not-an-id', task.subtasks[0].id, 'after')).toBe(task)
    expect(moveSubtask(task, task.subtasks[0].id, 'not-an-id', 'after')).toBe(task)
    expect(moveSubtask(task, task.subtasks[0].id, task.subtasks[0].id, 'after')).toBe(task)
  })

  it('never modifies the task it is given', () => {
    const task = withChecklist(['crate it', 'label it'])
    moveSubtask(task, task.subtasks[0].id, task.subtasks[1].id, 'after')

    expect(titles(task)).toEqual(['crate it', 'label it'])
  })
})

describe('setRepeat, with a checklist', () => {
  it('lets go of ticks from an occurrence that has passed when the rule is dropped', () => {
    const finished = finish(withChecklist(['stretch', 'push-ups'], { kind: 'daily' }))

    // Tomorrow the task reads as todo and so does its list; making it a one-off
    // must not harden yesterday's ticks into permanent ones.
    const once = setRepeat(finished, null, TOMORROW)

    expect(once.subtasks.every((subtask) => subtask.completedAt === null)).toBe(true)
    expect(isComplete(once, TOMORROW)).toBe(false)
  })

  it('keeps ticks that still count for the occurrence in play', () => {
    const finished = finish(withChecklist(['stretch', 'push-ups'], { kind: 'daily' }))
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
