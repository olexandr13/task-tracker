import { startOfLocalDay, type LocalDay } from '../core'
import type { TaskScope } from './taskRepository'

/**
 * The questions asked of an account's saved tasks, written down as plain data
 * so what they come to can be checked without the database (`taskQueries.test.ts`).
 * A saved task is `{ version, task }` (./taskSchema), so each field is under `task`.
 *
 * Each question is one filter, or two on the same field: the indexes Firestore
 * keeps on every field by itself answer those, so nothing has to be set up for
 * them. A field a saved task lacks — one saved before the field existed —
 * matches no filter, which is what its missing value means each time here.
 */

/** One condition on a field of a saved task. */
export type TaskFilter = readonly [
  field: string,
  op: '==' | '!=' | '>=' | '<' | 'array-contains',
  value: string | null,
]

/** The saved tasks every one of `filters` matches, named among the others asked at once. */
export interface TaskQuery {
  readonly key: string
  readonly filters: readonly TaskFilter[]
}

/**
 * Every task but the history as of `start` (`isHistory`). No one filter says
 * "not history", so it is five, each holding a part of the rest — still to do,
 * repeating, in the trash, finished from `start` on, due from `start` on —
 * overlapping wherever a task is more than one of those.
 */
export function heldFromStart(start: LocalDay): TaskQuery[] {
  return [
    { key: 'to do', filters: [['task.status', '==', 'todo']] },
    { key: 'repeating', filters: [['task.repeat', '!=', null]] },
    { key: 'trash', filters: [['task.deletedAt', '!=', null]] },
    { key: 'finished', filters: [['task.completedAt', '>=', instantOf(start)]] },
    { key: 'due', filters: [['task.dueDate', '>=', start]] },
  ]
}

/**
 * The history finished from `since` up to `until`, the day held from already —
 * or with null, everything finished before `until`, and with it what was marked
 * done before anything said when. No filter on its own says "done and never
 * stamped", so that one also matches every task still to do, held already.
 */
export function historyFrom(since: LocalDay | null, until: LocalDay): TaskQuery[] {
  if (since !== null) {
    return [
      {
        key: `finished ${since} to ${until}`,
        filters: [
          ['task.completedAt', '>=', instantOf(since)],
          ['task.completedAt', '<', instantOf(until)],
        ],
      },
    ]
  }

  return [
    { key: `finished before ${until}`, filters: [['task.completedAt', '<', instantOf(until)]] },
    { key: 'never stamped', filters: [['task.completedAt', '==', null]] },
  ]
}

/** The tasks in `scope` (`inScope`), held or not. */
export function scopeFilters(scope: TaskScope): TaskFilter[] {
  switch (scope.kind) {
    case 'all':
      return []
    case 'list':
      return [['task.listId', '==', scope.listId]]
    case 'tag':
      return [['task.tags', 'array-contains', scope.tag]]
  }
}

/** The moment a local day starts, as completion times are saved: ISO 8601 in UTC, which sorts as text. */
function instantOf(day: LocalDay): string {
  return startOfLocalDay(day).toISOString()
}
