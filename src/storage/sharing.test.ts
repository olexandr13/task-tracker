import { describe, expect, it } from 'vitest'
import { createList, createTask, moveToList, renameTask, shareList, unshareList, type List, type ListOwner, type Task } from '../core'
import type { ListShare } from './shareSchema'
import {
  asSharedWithMe,
  mergeTasks,
  NOTHING_SHARED,
  routeListChanges,
  routeTaskChanges,
  withSharing,
  type SharedWithMe,
} from './sharing'

const ME: ListOwner = { id: 'me', email: 'me@example.com', name: 'Me' }
const THEM: ListOwner = { id: 'them', email: 'them@example.com', name: 'Anna' }
const AT = new Date('2026-10-15T09:00:00Z')

const work = createList('Work', AT)
const groceries = createList('Groceries', AT)
const theirShare: ListShare = { listId: groceries.id, owner: THEM, members: ['me@example.com'] }
const theirGroceries = asSharedWithMe(groceries, theirShare)

function task(title: string, list: List | null = null): Task {
  return moveToList(createTask(title, null, AT), list?.id ?? null)
}

function sharedWithMe(tasks: readonly Task[]): SharedWithMe {
  return {
    lists: [theirGroceries],
    tasks: tasks.map((each) => ({ accountId: THEM.id, task: each })),
    owners: new Map([[groceries.id, THEM.id]]),
  }
}

describe('the lists an account sees', () => {
  it('reads someone else’s list as theirs, shared with whom they shared it', () => {
    expect(theirGroceries.sharedBy).toEqual(THEM)
    expect(theirGroceries.sharedWith).toEqual(['me@example.com'])
    expect(theirGroceries.name).toBe('Groceries')
  })

  it('carries whom each own list is shared with, then the lists shared with it', () => {
    const shares = new Map([[work.id, { listId: work.id, owner: ME, members: ['anna@example.com'] }]])
    const lists = withSharing([work], shares, sharedWithMe([]))

    expect(lists.map((list) => [list.name, list.sharedWith, list.sharedBy?.id ?? null])).toEqual([
      ['Work', ['anna@example.com'], null],
      ['Groceries', ['me@example.com'], 'them'],
    ])
  })

  it('shows an own list as not shared when nothing says otherwise', () => {
    expect(withSharing([work], new Map(), NOTHING_SHARED)).toEqual([work])
  })
})

describe('the tasks an account holds', () => {
  it('holds its own and those in lists shared with it, in order of id, and knows where each is kept', () => {
    const mine = task('Report', work)
    const milk = task('Milk', groceries)
    const { tasks, keptIn } = mergeTasks([mine], ME.id, sharedWithMe([milk]))

    expect(tasks.map((each) => each.id)).toEqual([mine.id, milk.id].sort())
    expect(keptIn.get(mine.id)).toBe(ME.id)
    expect(keptIn.get(milk.id)).toBe(THEM.id)
  })

  it('holds a task heard of in both accounts once: theirs while its own copy is on its way there', () => {
    const moving = task('Milk', groceries)
    const { tasks, keptIn } = mergeTasks([moving], ME.id, sharedWithMe([moving]))

    expect(tasks).toHaveLength(1)
    expect(keptIn.get(moving.id)).toBe(THEM.id)
  })

  it('holds its own copy of a task just taken out of a shared list', () => {
    const before = task('Milk', groceries)
    const after = moveToList(before, null)
    const { tasks, keptIn } = mergeTasks([after], ME.id, sharedWithMe([before]))

    expect(tasks).toEqual([after])
    expect(keptIn.get(after.id)).toBe(ME.id)
  })
})

describe('where a change to the tasks is written', () => {
  const owners = new Map([[groceries.id, THEM.id]])

  it('writes a task in the account’s own lists, or the Inbox, to the account', () => {
    const mine = task('Report', work)
    const loose = task('Call back')
    const routed = routeTaskChanges({ saved: [mine, loose], removed: [] }, ME.id, owners, new Map())

    expect([...routed.keys()]).toEqual([ME.id])
    expect(routed.get(ME.id)).toEqual({ saved: [mine, loose], removed: [] })
  })

  it('writes a task in a list someone else shared to their account, a new one too', () => {
    const milk = task('Milk', groceries)
    const added = task('Eggs', groceries)
    const keptIn = new Map([[milk.id, THEM.id]])
    const routed = routeTaskChanges({ saved: [renameTask(milk, 'Oat milk'), added], removed: [] }, ME.id, owners, keptIn)

    expect([...routed.keys()]).toEqual([THEM.id])
    expect(routed.get(THEM.id)?.saved.map((each) => each.title)).toEqual(['Oat milk', 'Eggs'])
  })

  it('moves a task filed into a shared list: written there, deleted here, in one change', () => {
    const mine = task('Bread')
    const routed = routeTaskChanges({ saved: [moveToList(mine, groceries.id)], removed: [] }, ME.id, owners, new Map([[mine.id, ME.id]]))

    expect(routed.get(THEM.id)?.saved.map((each) => each.id)).toEqual([mine.id])
    expect(routed.get(ME.id)).toEqual({ saved: [], removed: [mine.id] })
  })

  it('moves a task filed out of a shared list back into the account', () => {
    const milk = task('Milk', groceries)
    const routed = routeTaskChanges({ saved: [moveToList(milk, work.id)], removed: [] }, ME.id, owners, new Map([[milk.id, THEM.id]]))

    expect(routed.get(ME.id)?.saved.map((each) => each.id)).toEqual([milk.id])
    expect(routed.get(THEM.id)).toEqual({ saved: [], removed: [milk.id] })
  })

  it('deletes a task for good where it is kept, and an unknown one here', () => {
    const routed = routeTaskChanges({ saved: [], removed: ['theirs', 'unknown'] }, ME.id, owners, new Map([['theirs', THEM.id]]))

    expect(routed.get(THEM.id)).toEqual({ saved: [], removed: ['theirs'] })
    expect(routed.get(ME.id)).toEqual({ saved: [], removed: ['unknown'] })
  })
})

describe('where a change to the lists is written', () => {
  const none = new Map<string, ListShare>()
  const theirs = new Set([groceries.id])

  it('writes an own list and nothing about sharing while it is shared with no one', () => {
    const writes = routeListChanges({ saved: [work], removed: [] }, ME, none, theirs)

    expect(writes).toEqual({ lists: { saved: [work], removed: [] }, shares: { saved: [], removed: [] }, left: [] })
  })

  it('writes whom an own list is shared with, apart from it, once that changes', () => {
    const shared = shareList(work, 'anna@example.com')
    const writes = routeListChanges({ saved: [shared], removed: [] }, ME, none, theirs)

    expect(writes.shares.saved).toEqual([{ listId: work.id, owner: ME, members: ['anna@example.com'] }])

    const known = new Map([[work.id, writes.shares.saved[0]]])
    const renamed = { ...shared, name: 'Office' }
    expect(routeListChanges({ saved: [renamed], removed: [] }, ME, known, theirs).shares).toEqual({ saved: [], removed: [] })
  })

  it('deletes the share once the list is shared with no one', () => {
    const shared = shareList(work, 'anna@example.com')
    const known = new Map([[work.id, { listId: work.id, owner: ME, members: ['anna@example.com'] }]])
    const writes = routeListChanges({ saved: [unshareList(shared, 'anna@example.com')], removed: [] }, ME, known, theirs)

    expect(writes.shares).toEqual({ saved: [], removed: [work.id] })
  })

  it('deletes the share with the list, so no one is left shared a list that has gone', () => {
    const writes = routeListChanges({ saved: [], removed: [work.id] }, ME, none, theirs)

    expect(writes.lists.removed).toEqual([work.id])
    expect(writes.shares.removed).toEqual([work.id])
  })

  it('never writes someone else’s list, and leaves it when it is taken out', () => {
    const writes = routeListChanges({ saved: [{ ...theirGroceries, name: 'Food' }], removed: [groceries.id] }, ME, none, theirs)

    expect(writes).toEqual({ lists: { saved: [], removed: [] }, shares: { saved: [], removed: [] }, left: [groceries.id] })
  })
})
