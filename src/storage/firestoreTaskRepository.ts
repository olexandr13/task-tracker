import {
  FirestoreError,
  getCountFromServer,
  getDocsFromServer,
  onSnapshot,
  query,
  where,
  type CollectionReference,
  type Firestore,
  type Query,
} from 'firebase/firestore'
import type { Task } from '../core'
import { accountCollection } from './firestoreAccount'
import { readRecords, saveRecords, type RecordKind } from './firestoreRecords'
import { createHeldTasks } from './heldTasks'
import { scopeFilters, type TaskFilter, type TaskQuery } from './taskQueries'
import type { TaskRepository } from './taskRepository'
import { readStoredTask, toStoredTask } from './taskSchema'

const TASK: RecordKind<Task> = { noun: 'task', read: readStoredTask, write: toStoredTask }

/** The saved tasks every filter matches. */
function asked(tasks: CollectionReference, filters: readonly TaskFilter[]): Query {
  return query(tasks, ...filters.map(([field, op, value]) => where(field, op, value)))
}

/**
 * An account's tasks in Firestore: one document per task, filed under the
 * account at `users/{accountId}/tasks/{taskId}`, and readable by that account
 * alone (`firestore.rules`).
 *
 * Not every task is read as the app opens: history, done work finished before
 * this week and this month began, is left behind until a span reaching back to
 * it is opened (STORE-55). What is held is the answer to several questions
 * asked at once (./taskQueries), put together in ./heldTasks.
 *
 * Firestore keeps a copy in the browser (`firebaseApp.ts`), so the tasks open
 * offline and changes made offline are sent once there is a connection. When two
 * devices change the same task, the later write wins.
 */
export function createFirestoreTaskRepository(firestore: Firestore, accountId: string): TaskRepository {
  const tasks = accountCollection(firestore, accountId, 'tasks')

  return {
    subscribe(start, onTasks, onError) {
      const held = createHeldTasks(start)
      const warned = new Set<string>()
      const stops: (() => void)[] = []
      let stopped = false

      function deliver() {
        const now = held.current()
        if (now !== null) onTasks(now.tasks, now.heldSince)
      }

      // A question asked from the start is answered by its first answer, even from
      // the browser's copy, as the tasks always have been. History is answered once
      // the server has said, so its answers are heard again when that changes.
      function listen(asking: TaskQuery, history: boolean) {
        stops.push(
          onSnapshot(
            asked(tasks, asking.filters),
            { includeMetadataChanges: history },
            (snapshot) => {
              held.receive(asking.key, readRecords(snapshot.docs, TASK, warned), !history || !snapshot.metadata.fromCache)
              deliver()
            },
            onError,
          ),
        )
      }

      for (const asking of held.startQueries) listen(asking, false)

      return {
        reachBack(day) {
          if (stopped) return
          for (const asking of held.reachBack(day)) listen(asking, true)
        },

        async unheld(scope) {
          if (held.current() === null) return null
          try {
            const total = await getCountFromServer(asked(tasks, scopeFilters(scope)))
            return Math.max(0, total.data().count - held.count(scope))
          } catch (error) {
            // No connection is the everyday reason, and says nothing new.
            if (!(error instanceof FirestoreError && error.code === 'unavailable')) {
              console.warn('Could not count tasks.', error)
            }
            return null
          }
        },

        stop() {
          stopped = true
          for (const stop of stops.splice(0)) stop()
        },
      }
    },

    save: (changes) => saveRecords(firestore, tasks, TASK, changes),

    // Asks the server rather than the copy in the browser, which on a device new
    // to the account is empty and would let an import overwrite newer work.
    async importTasks(incoming) {
      const existing = await getDocsFromServer(tasks)
      const known = new Set(existing.docs.map((saved) => saved.id))
      await saveRecords(firestore, tasks, TASK, { saved: incoming.filter((task) => !known.has(task.id)), removed: [] })
    },
  }
}
