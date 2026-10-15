import {
  arrayRemove,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type CollectionReference,
  type Firestore,
  type Unsubscribe,
  type WriteBatch,
} from 'firebase/firestore'
import { normalizeEmail, type List, type ListId, type ListOwner, type LocalDay, type Task, type TaskId } from '../core'
import { commitInBatches, type BatchWrite } from './firestoreBatches'
import { accountCollection } from './firestoreAccount'
import { readRecords, type RecordKind } from './firestoreRecords'
import type { ListRepository } from './listRepository'
import { readList, toStoredList } from './listSchema'
import { readShare, toStoredShare, type ListShare } from './shareSchema'
import {
  asSharedWithMe,
  mergeTasks,
  NOTHING_SHARED,
  routeListChanges,
  routeTaskChanges,
  withSharing,
  type KeptTask,
  type SharedWithMe,
} from './sharing'
import type { TaskRepository } from './taskRepository'
import { readStoredTask, toStoredTask } from './taskSchema'

const TASK: RecordKind<Task> = { noun: 'task', read: readStoredTask, write: toStoredTask }
const SHARE: RecordKind<ListShare> = { noun: 'share', read: readShare, write: toStoredShare }

/**
 * Whom lists are shared with: one document per shared list, at
 * `shares/{listId}` — between accounts rather than under one, so both the owner
 * and the people it is shared with can ask for theirs (STORE-66).
 */
function sharesCollection(firestore: Firestore): CollectionReference {
  return collection(firestore, 'shares')
}

/** Whom each of the account's own lists is shared with, now and whenever it changes. */
function watchOwnShares(
  firestore: Firestore,
  accountId: string,
  onShares: (shares: ReadonlyMap<ListId, ListShare>) => void,
): Unsubscribe {
  return onSnapshot(
    query(sharesCollection(firestore), where('share.ownerId', '==', accountId)),
    (snapshot) => {
      onShares(new Map(readRecords(snapshot.docs, SHARE).map((share) => [share.listId, share])))
    },
    (error) => {
      // The lists themselves are still the account's to show.
      console.warn('Could not load whom the lists are shared with.', error)
      onShares(new Map())
    },
  )
}

/**
 * The lists other accounts shared with this one, each read from its owner's
 * account — the list itself, and with `withTasks` every task filed under it —
 * now and whenever any of it changes. A list's tasks are all read, done ones
 * too: what is held back as history is the owner's to hold back (STORE-67).
 * Firestore shares one listener between every caller asking the same, so two
 * callers cost no more reads than one.
 */
function watchSharedWithMe(
  firestore: Firestore,
  accountId: string,
  email: string,
  withTasks: boolean,
  onShared: (shared: SharedWithMe) => void,
): Unsubscribe {
  interface Watched {
    share: ListShare
    list: List | null
    tasks: readonly Task[]
    readonly stops: Unsubscribe[]
  }
  const watched = new Map<ListId, Watched>()
  const warned = new Set<string>()
  let stopped = false

  function emit() {
    if (stopped) return

    const lists: List[] = []
    const tasks: KeptTask[] = []
    const owners = new Map<ListId, string>()
    for (const { share, list, tasks: filed } of watched.values()) {
      owners.set(share.listId, share.owner.id)
      // Its tasks wait for the list itself: a task naming a list not there reads as the Inbox's.
      if (list === null) continue
      lists.push(asSharedWithMe(list, share))
      for (const task of filed) tasks.push({ accountId: share.owner.id, task })
    }
    onShared({ lists, tasks, owners })
  }

  // Taken off the list, or the list deleted, a moment before the share says so:
  // what was shown of it goes, and the share going stops the rest.
  function lost(entry: Watched, error: unknown) {
    console.warn(`Could not load a list ${entry.share.owner.email} shared.`, error)
    entry.list = null
    entry.tasks = []
    emit()
  }

  function watch(share: ListShare): Watched {
    const entry: Watched = { share, list: null, tasks: [], stops: [] }
    entry.stops.push(
      onSnapshot(
        doc(accountCollection(firestore, share.owner.id, 'lists'), share.listId),
        (snapshot) => {
          entry.list = snapshot.exists() ? readList(snapshot.data()) : null
          emit()
        },
        (error) => { lost(entry, error) },
      ),
    )
    if (withTasks) {
      entry.stops.push(
        onSnapshot(
          query(accountCollection(firestore, share.owner.id, 'tasks'), where('task.listId', '==', share.listId)),
          (snapshot) => {
            entry.tasks = readRecords(snapshot.docs, TASK, warned)
            emit()
          },
          (error) => { lost(entry, error) },
        ),
      )
    }
    return entry
  }

  function unwatch(listId: ListId, entry: Watched) {
    for (const stop of entry.stops) stop()
    watched.delete(listId)
  }

  const stopShares = onSnapshot(
    query(sharesCollection(firestore), where('share.members', 'array-contains', email)),
    (snapshot) => {
      const shares = new Map(
        readRecords(snapshot.docs, SHARE)
          .filter((share) => share.owner.id !== accountId)
          .map((share) => [share.listId, share]),
      )
      for (const [listId, entry] of [...watched]) {
        const share = shares.get(listId)
        if (share === undefined || share.owner.id !== entry.share.owner.id) unwatch(listId, entry)
        else entry.share = share
      }
      for (const share of shares.values()) {
        if (!watched.has(share.listId)) watched.set(share.listId, watch(share))
      }
      emit()
    },
    (error) => {
      console.warn('Could not load the lists shared with this account.', error)
    },
  )

  return () => {
    stopped = true
    stopShares()
    for (const [listId, entry] of [...watched]) unwatch(listId, entry)
  }
}

/**
 * An account's lists and tasks with sharing woven in (LST-27): its own lists
 * carry whom each is shared with, the lists others shared with it are among
 * them, and so are their tasks. Every change is written where it belongs
 * (./sharing): a task in someone else's list to their account, whom a list is
 * shared with to its share, and a list left by taking this account off it.
 *
 * `own` are the account's own repositories, which this reads through, so
 * everything they promise — history held back (STORE-55), offline — holds for
 * the account's own tasks as before.
 */
export function createFirestoreSharing(
  firestore: Firestore,
  owner: ListOwner,
  own: { readonly lists: ListRepository; readonly tasks: TaskRepository },
): { lists: ListRepository; tasks: TaskRepository } {
  const email = normalizeEmail(owner.email)
  const shares = sharesCollection(firestore)
  const ownLists = accountCollection(firestore, owner.id, 'lists')

  // What the latest answers said, for the next change to be routed by.
  let ownShares: ReadonlyMap<ListId, ListShare> = new Map()
  let owners: ReadonlyMap<ListId, string> = new Map()
  let keptIn: ReadonlyMap<TaskId, string> = new Map()

  const lists: ListRepository = {
    subscribe(onLists, onError) {
      let mine: List[] | null = null
      let known: ReadonlyMap<ListId, ListShare> | null = null
      let shared = NOTHING_SHARED

      // Not before whom they are shared with is known, or a person added in that
      // moment would be written over everyone the list was shared with already.
      function deliver() {
        if (mine === null || known === null) return
        onLists(withSharing(mine, known, shared))
      }

      const stops = [
        own.lists.subscribe((saved) => {
          mine = saved
          deliver()
        }, onError),
        watchOwnShares(firestore, owner.id, (current) => {
          known = current
          ownShares = current
          deliver()
        }),
        watchSharedWithMe(firestore, owner.id, email, false, (current) => {
          shared = current
          owners = current.owners
          deliver()
        }),
      ]
      return () => {
        for (const stop of stops) stop()
      }
    },

    save(changes) {
      const writes = routeListChanges(changes, owner, ownShares, new Set(owners.keys()))
      return commitInBatches(firestore, [
        ...writes.lists.saved.map((list) => (batch: WriteBatch) => batch.set(doc(ownLists, list.id), toStoredList(list))),
        ...writes.shares.saved.map((share) => (batch: WriteBatch) => batch.set(doc(shares, share.listId), toStoredShare(share))),
        ...writes.shares.removed.map((id) => (batch: WriteBatch) => batch.delete(doc(shares, id))),
        ...writes.lists.removed.map((id) => (batch: WriteBatch) => batch.delete(doc(ownLists, id))),
        ...writes.left.map((id) => (batch: WriteBatch) => batch.update(doc(shares, id), { 'share.members': arrayRemove(email) })),
      ])
    },
  }

  const tasks: TaskRepository = {
    subscribe(start, onTasks, onError) {
      let mine: { tasks: Task[]; heldSince: LocalDay | null } | null = null
      let shared = NOTHING_SHARED

      function deliver() {
        if (mine === null) return
        const merged = mergeTasks(mine.tasks, owner.id, shared)
        keptIn = merged.keptIn
        onTasks(merged.tasks, mine.heldSince)
      }

      const subscription = own.tasks.subscribe(
        start,
        (saved, heldSince) => {
          mine = { tasks: saved, heldSince }
          deliver()
        },
        onError,
      )
      const stopShared = watchSharedWithMe(firestore, owner.id, email, true, (current) => {
        shared = current
        owners = current.owners
        deliver()
      })

      return {
        reachBack(day) {
          subscription.reachBack(day)
        },
        // A shared list's tasks are all held, so none of them is left to count.
        unheld(scope) {
          if (scope.kind === 'list' && scope.listId !== null && shared.owners.has(scope.listId)) return Promise.resolve(0)
          return subscription.unheld(scope)
        },
        stop() {
          subscription.stop()
          stopShared()
        },
      }
    },

    save(changes) {
      const writes: BatchWrite[] = []
      const deletes: BatchWrite[] = []
      for (const [accountId, { saved, removed }] of routeTaskChanges(changes, owner.id, owners, keptIn)) {
        const kept = accountCollection(firestore, accountId, 'tasks')
        writes.push(...saved.map((task) => (batch: WriteBatch) => batch.set(doc(kept, task.id), toStoredTask(task))))
        deletes.push(...removed.map((id) => (batch: WriteBatch) => batch.delete(doc(kept, id))))
      }
      // Written before deleted, so a task moved between accounts is never only deleted.
      return commitInBatches(firestore, [...writes, ...deletes])
    },

    importTasks: (incoming) => own.tasks.importTasks(incoming),
  }

  return { lists, tasks }
}
