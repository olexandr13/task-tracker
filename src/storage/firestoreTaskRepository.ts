import {
  doc,
  getDocsFromServer,
  onSnapshot,
  type DocumentData,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore'
import type { Task } from '../core'
import { accountCollection } from './firestoreAccount'
import { commitInBatches } from './firestoreBatches'
import { migrateTasks, SCHEMA_VERSION } from './taskSchema'
import type { TaskRepository } from './taskRepository'

/** One task, under the version of the shape it was saved in. */
interface StoredTask {
  version: number
  task: Task
}

function toStored(task: Task): StoredTask {
  return { version: SCHEMA_VERSION, task }
}

/** The task in today's shape, or nothing when it can't be trusted — which is left unread, not deleted. */
function fromStored(id: string, data: DocumentData): Task[] {
  const tasks = migrateTasks(data.version, [data.task])
  if (tasks === null) {
    console.warn(`Ignoring saved task ${id}: unexpected shape (version ${String(data.version)}).`)
    return []
  }
  return tasks
}

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
    subscribe(onTasks, onError) {
      return onSnapshot(
        tasks,
        (snapshot) => {
          onTasks(snapshot.docs.flatMap((saved) => fromStored(saved.id, saved.data())))
        },
        onError,
      )
    },

    save({ saved, removed }) {
      return commitInBatches(firestore, [
        ...saved.map((task) => (batch: WriteBatch) => batch.set(doc(tasks, task.id), toStored(task))),
        ...removed.map((id) => (batch: WriteBatch) => batch.delete(doc(tasks, id))),
      ])
    },

    // Asks the server rather than the copy in the browser, which on a device new
    // to the account is empty and would let an import overwrite newer work.
    async importTasks(incoming) {
      const existing = await getDocsFromServer(tasks)
      const known = new Set(existing.docs.map((saved) => saved.id))

      await commitInBatches(
        firestore,
        incoming
          .filter((task) => !known.has(task.id))
          .map((task) => (batch: WriteBatch) => batch.set(doc(tasks, task.id), toStored(task))),
      )
    },
  }
}
