import type { ListId, LocalDay, Repeat, SubtaskId, TaskId, TimeEntryId } from '../core'

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
  readonly changeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  /** Passes over a repeating task's occurrence, so it is due on the rule's next day. */
  readonly skip: (id: TaskId) => void
  readonly changeRepeat: (id: TaskId, repeat: Repeat | null) => void
  readonly changeReward: (id: TaskId, reward: number | null) => void
  readonly changeUrgent: (id: TaskId, urgent: boolean) => void
  readonly changeTimeGoal: (id: TaskId, minutes: number | null) => void
  readonly logTime: (id: TaskId, minutes: number) => void
  readonly removeTimeEntry: (id: TaskId, entryId: TimeEntryId) => void
  /** Files the task under a list, or in no list — the Inbox — with null. */
  readonly changeList: (id: TaskId, listId: ListId | null) => void
  readonly addTag: (id: TaskId, name: string) => void
  readonly removeTag: (id: TaskId, name: string) => void
  readonly remove: (id: TaskId) => void
  readonly duplicate: (id: TaskId) => void
  readonly addSubtask: (id: TaskId, index: number, title: string) => void
  readonly setSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  readonly renameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  readonly removeSubtask: (id: TaskId, subtaskId: SubtaskId) => void
}
