import type { List, ListId, ListOwner, Task, TaskId } from '../core'
import type { ListChanges } from './listRepository'
import type { RecordChanges } from './recordChanges'
import type { ListShare } from './shareSchema'
import type { TaskChanges } from './taskRepository'

/**
 * Lists shared between accounts (LST-27), as plain data: what an account sees
 * of them, and where each change it makes is written. A shared list and its
 * tasks stay in the owner's account; the people it is shared with read them
 * from there and write them back there (STORE-67). The questions asked of the
 * database are ./firestoreSharing's.
 */

/** A task kept in another account, in a list shared with this one. */
export interface KeptTask {
  /** The account it is kept in: the list's owner's. */
  readonly accountId: string
  readonly task: Task
}

/** What other accounts have shared with this one, as it stands. */
export interface SharedWithMe {
  /** Each list shared with this account, once read, as this account sees it (`sharedBy` set). */
  readonly lists: readonly List[]
  /** The tasks in them, each with the account it is kept in. */
  readonly tasks: readonly KeptTask[]
  /** The account each list shared with this one is kept in, read yet or not. */
  readonly owners: ReadonlyMap<ListId, string>
}

export const NOTHING_SHARED: SharedWithMe = { lists: [], tasks: [], owners: new Map() }

/** A list someone else shared, as read from their account, as this account sees it. */
export function asSharedWithMe(list: List, share: ListShare): List {
  return { ...list, sharedWith: share.members, sharedBy: share.owner }
}

/**
 * The account's own lists, each with whom it shares it (`ownShares`), and after
 * them the lists others shared with it.
 */
export function withSharing(
  own: readonly List[],
  ownShares: ReadonlyMap<ListId, ListShare>,
  shared: SharedWithMe,
): List[] {
  const ownIds = new Set(own.map((list) => list.id))
  return [
    ...own.map((list) => {
      const share = ownShares.get(list.id)
      return share === undefined ? list : { ...list, sharedWith: share.members }
    }),
    ...shared.lists.filter((list) => !ownIds.has(list.id)),
  ]
}

/**
 * Every task the account holds — its own, and those in lists shared with it —
 * in order of id as the account's own arrive, and the account each is kept in.
 *
 * A task moved between accounts is one write, but heard of from each account
 * on its own, so for a moment it can be in both. Its own copy is the one held,
 * unless that copy is filed under a list someone else shared: then it is on its
 * way there, and theirs is the newer.
 */
export function mergeTasks(
  own: readonly Task[],
  accountId: string,
  shared: SharedWithMe,
): { tasks: Task[]; keptIn: Map<TaskId, string> } {
  const held = new Map<TaskId, Task>()
  const keptIn = new Map<TaskId, string>()
  for (const task of own) {
    held.set(task.id, task)
    keptIn.set(task.id, accountId)
  }
  for (const { accountId: owner, task } of shared.tasks) {
    const mine = held.get(task.id)
    if (mine !== undefined && (mine.listId === null || !shared.owners.has(mine.listId))) continue
    held.set(task.id, task)
    keptIn.set(task.id, owner)
  }

  const tasks = [...held.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return { tasks, keptIn }
}

/**
 * Where one change to the tasks is written, account by account. A task is kept
 * in the account its list belongs to: a list someone else shared (`owners`) is
 * theirs, anywhere else — the Inbox, a list of the account's own — is the
 * account's. A task filed from one to the other is written where it now
 * belongs and deleted where it was (`keptIn`), in the same change. A task not
 * held is the account's own, there being nowhere else it could have been read.
 */
export function routeTaskChanges(
  changes: TaskChanges,
  accountId: string,
  owners: ReadonlyMap<ListId, string>,
  keptIn: ReadonlyMap<TaskId, string>,
): Map<string, RecordChanges<Task, TaskId>> {
  const routed = new Map<string, { saved: Task[]; removed: TaskId[] }>()
  function to(account: string) {
    let changesThere = routed.get(account)
    if (changesThere === undefined) {
      changesThere = { saved: [], removed: [] }
      routed.set(account, changesThere)
    }
    return changesThere
  }

  for (const task of changes.saved) {
    const belongs = (task.listId === null ? undefined : owners.get(task.listId)) ?? accountId
    const was = keptIn.get(task.id) ?? belongs
    to(belongs).saved.push(task)
    if (was !== belongs) to(was).removed.push(task.id)
  }
  for (const id of changes.removed) {
    to(keptIn.get(id) ?? accountId).removed.push(id)
  }
  return routed
}

/** What one change to the lists comes to once it is routed (`routeListChanges`). */
export interface ListWrites {
  /** The account's own lists, written or deleted. */
  readonly lists: RecordChanges<List, ListId>
  /** Whom the account's lists are shared with, written; and the shares that go. */
  readonly shares: RecordChanges<ListShare, ListId>
  /** Lists someone else shared that this account leaves. */
  readonly left: readonly ListId[]
}

function sameShare(share: ListShare, members: readonly string[], owner: ListOwner): boolean {
  return (
    share.owner.email === owner.email &&
    share.owner.name === owner.name &&
    share.members.length === members.length &&
    share.members.every((member, index) => member === members[index])
  )
}

/**
 * Where one change to the lists is written. The account's own lists are written
 * as lists, and whom each is shared with apart from it: written when it is
 * shared with anyone and that changed, and deleted when it is shared with no
 * one now, or the list itself is deleted. A list someone else shared is
 * theirs to change, so a change to it is not written; one taken out of the
 * account's lists is left (LST-30).
 */
export function routeListChanges(
  changes: ListChanges,
  owner: ListOwner,
  ownShares: ReadonlyMap<ListId, ListShare>,
  theirs: ReadonlySet<ListId>,
): ListWrites {
  const lists: { saved: List[]; removed: ListId[] } = { saved: [], removed: [] }
  const shares: { saved: ListShare[]; removed: ListId[] } = { saved: [], removed: [] }
  const left: ListId[] = []

  for (const list of changes.saved) {
    if (list.sharedBy !== null || theirs.has(list.id)) continue

    lists.saved.push(list)
    const known = ownShares.get(list.id)
    if (list.sharedWith.length > 0) {
      if (known === undefined || !sameShare(known, list.sharedWith, owner)) {
        shares.saved.push({ listId: list.id, owner, members: list.sharedWith })
      }
    } else if (known !== undefined) {
      shares.removed.push(list.id)
    }
  }

  for (const id of changes.removed) {
    if (theirs.has(id)) {
      left.push(id)
    } else {
      lists.removed.push(id)
      // Whether or not it was known to be shared: deleting a share there is not deletes nothing.
      shares.removed.push(id)
    }
  }

  return { lists, shares, left }
}
