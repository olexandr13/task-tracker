import { getDocsFromServer, type Firestore } from 'firebase/firestore'
import type { Task } from '../core'
import { accountCollection } from './firestoreAccount'
import { saveRecords, subscribeToRecords, type RecordKind } from './firestoreRecords'
import type { TaskRepository } from './taskRepository'
import { readStoredTask, toStoredTask } from './taskSchema'

const TASK: RecordKind<Task> = { noun: 'task', read: readStoredTask, write: toStoredTask }

/**
 * An account's tasks in Firestore: one document per task, filed under the
 * account at `users/{accountId}/tasks/{taskId}`, and readable by that account
 * alone (`firestore.rules`).
 *
 * Firestore keeps a copy in the browser (`firebaseApp.ts`), so the tasks open
 * offline and changes made offline are sent once there is a connection. When two
 * devices change the same task, the later write wins.
 */
export function createFirestoreTaskRepository(firestore: Firestore, accountId: string): TaskRepository {
  const tasks = accountCollection(firestore, accountId, 'tasks')

  return {
    subscribe: (onTasks, onError) => subscribeToRecords(tasks, TASK, onTasks, onError),
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
