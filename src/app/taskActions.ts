import type {
  GoalId,
  ListId,
  LocalDay,
  LocalTime,
  Placement,
  Repeat,
  SubtaskId,
  TaskId,
  TimeEntryChange,
  TimeEntryId,
} from '../core'

/**
 * What a skip came to: the occurrence passed over (or nothing there to pass
 * over), or turned down because the habit has no rest left to spend on it
 * (HAB-38) — which the control that was pressed says in place.
 */
export type SkipOutcome = 'skipped' | 'noRest'

/**
 * Everything a task's row, card or sheet can do to it, handed down as one object
 * rather than a prop apiece. A new way of changing a task is added here and where
 * the screen puts the object together (TasksScreen); the lists and rows between
 * only pass it on.
 */
export interface TaskActions {
  readonly complete: (id: TaskId) => void
  readonly uncomplete: (id: TaskId) => void
  readonly rename: (id: TaskId, title: string) => void
  readonly changeDescription: (id: TaskId, description: string) => void
  /**
   * The day picked for the task, or taken away: a one-off is due on it, a
   * repeating task starts its rule there (DUE-12).
   */
  readonly changeDay: (id: TaskId, day: LocalDay | null) => void
  /**
   * The hour picked for the task, or taken away: it is due at that hour on the
   * day it already falls on (DUE-19). The day is untouched.
   */
  readonly changeTime: (id: TaskId, time: LocalTime | null) => void
  /**
   * Passes over a repeating task's occurrence, so it is due on the rule's next
   * day — unless it is a habit with no rest left while rests are limited
   * (HAB-38), when nothing changes and `'noRest'` says why.
   */
  readonly skip: (id: TaskId) => SkipOutcome
  /** Takes back a skip of today, so the task is due today again — a habit card's way back from its skip (HAB-31). */
  readonly unskip: (id: TaskId) => void
  readonly changeRepeat: (id: TaskId, repeat: Repeat | null) => void
  readonly changeReward: (id: TaskId, reward: number | null) => void
  readonly changeUrgent: (id: TaskId, urgent: boolean) => void
  readonly changeTimeGoal: (id: TaskId, minutes: number | null) => void
  /** Logs a session, with what it went on or null for nothing said (TIME-23). */
  readonly logTime: (id: TaskId, minutes: number, comment: string | null) => void
  readonly removeTimeEntry: (id: TaskId, entryId: TimeEntryId) => void
  /** Changes how long a session was and what it went on (TIME-24). */
  readonly changeTimeEntry: (id: TaskId, entryId: TimeEntryId, change: TimeEntryChange) => void
  /** Files the task under a list, or in no list — the Inbox — with null. */
  readonly changeList: (id: TaskId, listId: ListId | null) => void
  /** Links the task to a goal, or to none with null (GOAL-2). */
  readonly changeGoal: (id: TaskId, goalId: GoalId | null) => void
  readonly addTag: (id: TaskId, name: string) => void
  readonly removeTag: (id: TaskId, name: string) => void
  readonly remove: (id: TaskId) => void
  readonly duplicate: (id: TaskId) => void
  readonly addSubtask: (id: TaskId, index: number, title: string) => void
  readonly setSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  readonly renameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  readonly removeSubtask: (id: TaskId, subtaskId: SubtaskId) => void
  /** Puts a checklist item just before or just after another on the same task. */
  readonly moveSubtask: (id: TaskId, subtaskId: SubtaskId, targetId: SubtaskId, placement: Placement) => void
  /**
   * Brings the task's own row into view and opens it, as going to it from the
   * timer's chip does (TIME-20): where a row standing for a day it was done on
   * before leads (TASK-75). Nothing about the task changes.
   */
  readonly goTo: (id: TaskId) => void
}
