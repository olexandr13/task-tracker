import { describe, expect, it } from 'vitest'
import {
  appendList,
  clearList,
  countInboxOpen,
  createList,
  findList,
  InvalidListNameError,
  isInInbox,
  isInList,
  isListName,
  isNameTaken,
  listOf,
  MAX_LIST_NAME_LENGTH,
  moveToList,
  normalizeListName,
  renameList,
  sameListName,
  sortLists,
  summarizeLists,
} from './list'
import { completeTask, createTask, deleteTask, type Task } from './task'

const AT = new Date('2026-09-17T09:00:00Z')

function list(name: string, at = AT) {
  return createList(name, at)
}

describe('naming a list', () => {
  it('takes a name of more than one word, unlike a tag', () => {
    expect(isListName('Reading list')).toBe(true)
    expect(normalizeListName('Reading list')).toBe('Reading list')
  })

  it('keeps the punctuation a tag may not hold: the address names a list by its id', () => {
    expect(normalizeListName('Work / Home #2')).toBe('Work / Home #2')
  })

  it('trims the ends and squeezes the spaces inside', () => {
    expect(normalizeListName('  Side   projects  ')).toBe('Side projects')
  })

  it('refuses a name that is only space, or one spread over two lines', () => {
    expect(isListName('   ')).toBe(false)
    expect(isListName('Work\nHome')).toBe(false)
    expect(() => normalizeListName('')).toThrow(InvalidListNameError)
  })

  it('refuses a name too long to read', () => {
    expect(isListName('x'.repeat(MAX_LIST_NAME_LENGTH))).toBe(true)
    expect(isListName('x'.repeat(MAX_LIST_NAME_LENGTH + 1))).toBe(false)
  })

  it('does not make another list out of a change of case', () => {
    expect(sameListName('Work', 'work')).toBe(true)
    expect(sameListName('Work', 'Home')).toBe(false)
  })

  it('renames in place, keeping the id its tasks are filed under', () => {
    const work = list('Work')
    const renamed = renameList(work, '  Day   job ')

    expect(renamed.name).toBe('Day job')
    expect(renamed.id).toBe(work.id)
  })

  it('hands back the very same list when the name has not changed', () => {
    const work = list('Work')
    expect(renameList(work, 'Work')).toBe(work)
  })

  it('knows when a name already belongs to another list, whatever its case', () => {
    const lists = [list('Work'), list('Home')]

    expect(isNameTaken(lists, 'work')).toBe(true)
    expect(isNameTaken(lists, ' HOME ')).toBe(true)
    expect(isNameTaken(lists, 'Errands')).toBe(false)
    // Its own name is not taken: renaming a list to what it is called already is no clash.
    expect(isNameTaken(lists, 'Work', lists[0].id)).toBe(false)
  })
})

describe('the order lists are shown in', () => {
  it('puts a new list at the end, with room left to move into', () => {
    const lists = appendList(appendList([], list('Work')), list('Home'))

    expect(lists.map((each) => each.name)).toEqual(['Work', 'Home'])
    expect(lists[1].order).toBeGreaterThan(lists[0].order)
  })

  it('sorts by that number, and settles a tie two merged devices could leave', () => {
    const early = { ...list('Home', new Date('2026-09-01T00:00:00Z')), order: 0 }
    const late = { ...list('Work', new Date('2026-09-10T00:00:00Z')), order: 0 }

    expect(sortLists([late, early]).map((each) => each.name)).toEqual(['Home', 'Work'])
  })

  it('never modifies the array it was given', () => {
    const lists = [{ ...list('Work'), order: 10 }, { ...list('Home'), order: 0 }]
    const before = [...lists]

    sortLists(lists)
    expect(lists).toEqual(before)
  })
})

describe('filing a task', () => {
  it('starts every task in the Inbox: a title is still all a task needs', () => {
    expect(createTask('Buy milk').listId).toBe(null)
    expect(isInInbox(createTask('Buy milk'), [])).toBe(true)
  })

  it('moves a task to a list, and back to the Inbox with null', () => {
    const work = list('Work')
    const task = moveToList(createTask('Ship it'), work.id)

    expect(isInList(task, work.id)).toBe(true)
    expect(listOf(task, [work])).toBe(work)

    expect(moveToList(task, null).listId).toBe(null)
  })

  it('holds a task in one list at a time: moving it takes it out of the last', () => {
    const [work, home] = [list('Work'), list('Home')]
    const task = moveToList(moveToList(createTask('Call the plumber'), work.id), home.id)

    expect(isInList(task, home.id)).toBe(true)
    expect(isInList(task, work.id)).toBe(false)
  })

  it('changes nothing else about the task', () => {
    const work = list('Work')
    const task = completeTask(createTask('Ship it'), AT)
    const moved = moveToList(task, work.id)

    expect(moved).toEqual({ ...task, listId: work.id })
  })

  it('hands back the very same task when it is in that list already', () => {
    const work = list('Work')
    const task = moveToList(createTask('Ship it'), work.id)

    expect(moveToList(task, work.id)).toBe(task)
  })

  it('reads a task naming a list that is gone as being in the Inbox', () => {
    const task = moveToList(createTask('Ship it'), 'a-list-deleted-elsewhere')

    expect(listOf(task, [])).toBe(null)
    expect(isInInbox(task, [])).toBe(true)
  })
})

describe('deleting a list', () => {
  it('puts every task in it back in the Inbox, the tasks themselves staying', () => {
    const work = list('Work')
    const tasks = [moveToList(createTask('Ship it'), work.id), createTask('Buy milk')]
    const cleared = clearList(tasks, work.id)

    expect(cleared[0].listId).toBe(null)
    expect(cleared[0].title).toBe('Ship it')
    // Untouched tasks come back as they were, so only what changed is ever written.
    expect(cleared[1]).toBe(tasks[1])
  })

  it('empties it in the trash too, so restoring a task never brings the list back', () => {
    const work = list('Work')
    const trashed = deleteTask(moveToList(createTask('Ship it'), work.id), AT)

    expect(clearList([trashed], work.id)[0].listId).toBe(null)
  })

  it('never modifies the array it was given', () => {
    const work = list('Work')
    const tasks: Task[] = [moveToList(createTask('Ship it'), work.id)]

    clearList(tasks, work.id)
    expect(tasks[0].listId).toBe(work.id)
  })
})

describe('what a list is holding', () => {
  const work = list('Work')
  const home = list('Home')
  const lists = appendList(appendList([], work), home)

  const tasks = [
    moveToList(createTask('Ship it'), work.id),
    completeTask(moveToList(createTask('Review'), work.id), AT),
    moveToList(createTask('Fix sink'), home.id),
    createTask('Buy milk'),
  ]

  it('counts only the tasks still to do, list by list, in the order shown', () => {
    expect(summarizeLists(lists, tasks, AT)).toEqual([
      { list: lists[0], open: 1 },
      { list: lists[1], open: 1 },
    ])
  })

  it('lists a list whose tasks are all done, with none to do', () => {
    const done = [completeTask(moveToList(createTask('Ship it'), work.id), AT)]

    expect(summarizeLists([work], done, AT)).toEqual([{ list: work, open: 0 }])
  })

  it('counts the Inbox the same way, a task of a deleted list included', () => {
    expect(countInboxOpen(tasks, lists, AT)).toBe(1)

    const orphan = moveToList(createTask('Old thing'), 'gone')
    expect(countInboxOpen([...tasks, orphan], lists, AT)).toBe(2)
  })

  it('finds a list by id, and nothing for one that is not there', () => {
    expect(findList(lists, work.id)?.name).toBe('Work')
    expect(findList(lists, 'nope')).toBe(null)
  })
})
