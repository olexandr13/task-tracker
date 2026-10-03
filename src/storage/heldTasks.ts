import type { LocalDay, Task, TaskId } from '../core'
import { heldFromStart, historyFrom, type TaskQuery } from './taskQueries'
import { inScope, type TaskScope } from './taskRepository'

/** The tasks held, and the day from which every finished task is — null once every task is. */
export interface Held {
  readonly tasks: Task[]
  readonly heldSince: LocalDay | null
}

/**
 * What a device holds of an account's tasks, put together from the questions it
 * asks at once (./taskQueries): the ones asked from the start, and the history
 * reached back to since, a range of days at a time. A task more than one of them
 * matches is held once, as it was last heard of.
 */
export interface HeldTasks {
  /** The questions asked from the start. */
  readonly startQueries: readonly TaskQuery[]
  /**
   * The questions to ask so that every task finished on or after `day` is held —
   * every task at all with null — or none when that is held or asked for already.
   */
  reachBack(day: LocalDay | null): TaskQuery[]
  /**
   * What one question matches now. `answered` says the answer can be trusted
   * whole: a question asked from the start is answered by its first answer, even
   * from the browser's own copy, as the tasks always have been; history only
   * once the server has said, since the copy may never have held it.
   */
  receive(key: string, tasks: readonly Task[], answered: boolean): void
  /** What is held, in order of id — or null until every question asked from the start has its answer. */
  current(): Held | null
  /** How many of the tasks held are in `scope`. */
  count(scope: TaskScope): number
}

export function createHeldTasks(start: LocalDay): HeldTasks {
  const startQueries = heldFromStart(start)
  const answers = new Map<string, readonly Task[]>()
  const answered = new Set<string>()
  // Each task as it was last heard of, from whichever question.
  const latest = new Map<TaskId, Task>()
  // The history reached back to, in the order asked: each from its own `since`
  // to the `since` of the one before it, the first to `start`.
  const ranges: { readonly since: LocalDay | null; readonly keys: readonly string[] }[] = []
  // How far back has been asked for: `start` at first, null once it is everything.
  let asked: LocalDay | null = start

  function heldTasks(): Task[] {
    const ids = new Set<TaskId>()
    for (const tasks of answers.values()) {
      for (const task of tasks) ids.add(task.id)
    }
    // In order of id, as the whole collection used to arrive: nothing that keeps
    // the order it is given sees another order for being asked in parts.
    return [...ids]
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .flatMap((id) => latest.get(id) ?? [])
  }

  function heldSince(): LocalDay | null {
    let since: LocalDay | null = start
    for (const range of ranges) {
      if (!range.keys.every((key) => answered.has(key))) break
      since = range.since
    }
    return since
  }

  return {
    startQueries,

    reachBack(day) {
      if (asked === null || (day !== null && day >= asked)) return []

      const queries = historyFrom(day, asked)
      ranges.push({ since: day, keys: queries.map((query) => query.key) })
      asked = day
      return queries
    },

    receive(key, tasks, isAnswered) {
      answers.set(key, tasks)
      for (const task of tasks) latest.set(task.id, task)
      if (isAnswered) answered.add(key)
    },

    current() {
      if (!startQueries.every((query) => answered.has(query.key))) return null
      return { tasks: heldTasks(), heldSince: heldSince() }
    },

    count(scope) {
      return heldTasks().filter((task) => inScope(task, scope)).length
    },
  }
}
