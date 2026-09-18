import { useCallback, useEffect, useState } from 'react'
import {
  addTag,
  appendTask,
  clearList,
  completeTask,
  createTask,
  deleteTag,
  deleteTask,
  duplicateTask,
  hasRewardChanges,
  insertSubtask,
  insertTask,
  isDeleted,
  liveTasks,
  logTime,
  moveTask,
  moveToList,
  purgeExpired,
  removeSubtask,
  removeTag,
  removeTimeEntry,
  renameSubtask,
  renameTask,
  restoreTask,
  rewardChanges,
  setDescription,
  setDoneOnDay,
  setDueDate,
  setRepeat,
  setReward,
  setSubtaskDone,
  setTimeGoal,
  tagsInUse,
  uncompleteTask,
  type ListId,
  type LocalDay,
  type Placement,
  type Repeat,
  type RewardChanges,
  type SubtaskId,
  type Task,
  type TaskId,
  type TimeEntryId,
} from '../core'
import type { RewardRepository } from '../storage/rewardRepository'
import { changesBetween, type TaskChanges, type TaskRepository } from '../storage/taskRepository'

function persist(repository: TaskRepository, changes: TaskChanges): void {
  if (changes.saved.length === 0 && changes.removed.length === 0) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save tasks.', error)
  })
}

function record(rewards: RewardRepository, changes: RewardChanges): void {
  if (!hasRewardChanges(changes)) return

  rewards.save(changes).catch((error: unknown) => {
    console.error('Could not save rewards.', error)
  })
}

/**
 * Holds the task list on screen and keeps it and the repository in step both
 * ways: a change made here is saved, and one saved elsewhere — another tab,
 * another device — comes back through the subscription and is shown.
 * The rules themselves live in ../core; this only wires them to React.
 *
 * What a change here earns or takes back is recorded in `rewards` alongside it.
 * A change arriving from elsewhere is not: the device that made it recorded it.
 */
export function useTasks(repository: TaskRepository, rewards: RewardRepository) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        // Anything whose time in the trash ran out, while the app was closed or on
        // another device, goes now, and is written back so storage stops carrying it.
        const kept = purgeExpired(saved)
        setTasks(kept)
        setIsLoading(false)
        persist(repository, changesBetween(saved, kept))
      },
      (error) => {
        console.error('Could not load tasks.', error)
        setIsLoading(false)
      },
    )
  }, [repository])

  const apply = useCallback(
    (change: (current: Task[]) => Task[]) => {
      // Expiry is a matter of elapsed time, so any moment the list is touched is
      // a fair one to take the trash out too. Only the tasks the change touched are
      // written, so nothing another device changed meanwhile is written back over.
      const next = purgeExpired(change(tasks))
      setTasks(next)
      persist(repository, changesBetween(tasks, next))
      record(rewards, rewardChanges(tasks, next))
    },
    [tasks, repository, rewards],
  )

  const addTask = useCallback(
    (
      title: string,
      repeat: Repeat | null = null,
      dueDate: LocalDay | null = null,
      tags: readonly string[] = [],
      listId: ListId | null = null,
    ) => {
      apply((current) => {
        const known = tagsInUse(liveTasks(current))
        const started = moveToList(setDueDate(createTask(title, repeat), dueDate), listId)
        const task = tags.reduce((tagged, tag) => addTag(tagged, tag, known), started)
        return appendTask(current, task)
      })
    },
    [apply],
  )

  /** Puts a task just before or just after another — what a drag and drop asks for. */
  const move = useCallback(
    (id: TaskId, targetId: TaskId, placement: Placement) => {
      apply((current) => moveTask(current, id, targetId, placement))
    },
    [apply],
  )

  const complete = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? completeTask(task) : task)))
    },
    [apply],
  )

  const uncomplete = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? uncompleteTask(task) : task)))
    },
    [apply],
  )

  const rename = useCallback(
    (id: TaskId, title: string) => {
      apply((current) => current.map((task) => (task.id === id ? renameTask(task, title) : task)))
    },
    [apply],
  )

  const changeDescription = useCallback(
    (id: TaskId, description: string) => {
      apply((current) => current.map((task) => (task.id === id ? setDescription(task, description) : task)))
    },
    [apply],
  )

  const changeDueDate = useCallback(
    (id: TaskId, dueDate: LocalDay | null) => {
      apply((current) => current.map((task) => (task.id === id ? setDueDate(task, dueDate) : task)))
    },
    [apply],
  )

  const changeRepeat = useCallback(
    (id: TaskId, repeat: Repeat | null) => {
      apply((current) => current.map((task) => (task.id === id ? setRepeat(task, repeat) : task)))
    },
    [apply],
  )

  /** Gives a task a reward, changes it, or takes it away with null. Later completions earn it. */
  const changeReward = useCallback(
    (id: TaskId, reward: number | null) => {
      apply((current) => current.map((task) => (task.id === id ? setReward(task, reward) : task)))
    },
    [apply],
  )

  /** Gives a task a time goal, changes it, or takes it away with null. */
  const changeTimeGoal = useCallback(
    (id: TaskId, minutes: number | null) => {
      apply((current) => current.map((task) => (task.id === id ? setTimeGoal(task, minutes) : task)))
    },
    [apply],
  )

  /** Logs a session of time spent on a task. Whether the task is done is left to its box. */
  const logTaskTime = useCallback(
    (id: TaskId, minutes: number) => {
      apply((current) => current.map((task) => (task.id === id ? logTime(task, minutes) : task)))
    },
    [apply],
  )

  const removeTaskTime = useCallback(
    (id: TaskId, entryId: TimeEntryId) => {
      apply((current) => current.map((task) => (task.id === id ? removeTimeEntry(task, entryId) : task)))
    },
    [apply],
  )

  /**
   * Puts a tag on a task, spelled the way the tag already is wherever another
   * live task carries it, so one tag is never written two ways.
   */
  const tag = useCallback(
    (id: TaskId, name: string) => {
      apply((current) => {
        const known = tagsInUse(liveTasks(current))
        return current.map((task) => (task.id === id ? addTag(task, name, known) : task))
      })
    },
    [apply],
  )

  const untag = useCallback(
    (id: TaskId, name: string) => {
      apply((current) => current.map((task) => (task.id === id ? removeTag(task, name) : task)))
    },
    [apply],
  )

  /** Deletes a tag: off every task that carries it, the tasks themselves staying. */
  const removeTagEverywhere = useCallback(
    (name: string) => {
      apply((current) => deleteTag(current, name))
    },
    [apply],
  )

  /** Files a task under a list, or in no list — the Inbox — with null. */
  const changeList = useCallback(
    (id: TaskId, listId: ListId | null) => {
      apply((current) => current.map((task) => (task.id === id ? moveToList(task, listId) : task)))
    },
    [apply],
  )

  /**
   * Empties a list: every task in it goes back to the Inbox, the tasks themselves
   * staying. The list record is deleted separately (useLists).
   */
  const clearListEverywhere = useCallback(
    (listId: ListId) => {
      apply((current) => clearList(current, listId))
    },
    [apply],
  )

  /** Marks a habit done on a day up to today, or not done. */
  const setHabitDay = useCallback(
    (id: TaskId, day: LocalDay, done: boolean) => {
      apply((current) => current.map((task) => (task.id === id ? setDoneOnDay(task, day, done) : task)))
    },
    [apply],
  )

  /**
   * The four ways a checklist changes. Each one is a rule in ../core that also
   * settles whether the task itself is done, so there is nothing to decide here.
   */
  const addChecklistItem = useCallback(
    (id: TaskId, index: number, title: string) => {
      apply((current) => current.map((task) => (task.id === id ? insertSubtask(task, index, title) : task)))
    },
    [apply],
  )

  const setChecklistItemDone = useCallback(
    (id: TaskId, subtaskId: SubtaskId, done: boolean) => {
      apply((current) => current.map((task) => (task.id === id ? setSubtaskDone(task, subtaskId, done) : task)))
    },
    [apply],
  )

  const renameChecklistItem = useCallback(
    (id: TaskId, subtaskId: SubtaskId, title: string) => {
      apply((current) => current.map((task) => (task.id === id ? renameSubtask(task, subtaskId, title) : task)))
    },
    [apply],
  )

  const removeChecklistItem = useCallback(
    (id: TaskId, subtaskId: SubtaskId) => {
      apply((current) => current.map((task) => (task.id === id ? removeSubtask(task, subtaskId) : task)))
    },
    [apply],
  )

  /**
   * Moves the task to the trash, and hands back the task it was so the caller
   * can offer to undo it. Null when there was nothing there to delete.
   */
  const remove = useCallback(
    (id: TaskId): Task | null => {
      const target = tasks.find((task) => task.id === id)
      if (target === undefined || isDeleted(target)) {
        return null
      }

      apply((current) => current.map((task) => (task.id === id ? deleteTask(task) : task)))
      return target
    },
    [tasks, apply],
  )

  /** Puts a fresh copy of the task just below it. */
  const duplicate = useCallback(
    (id: TaskId) => {
      apply((current) => {
        const original = current.find((task) => task.id === id)
        return original === undefined ? current : insertTask(current, duplicateTask(original), id, 'after')
      })
    },
    [apply],
  )

  const restore = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? restoreTask(task) : task)))
    },
    [apply],
  )

  /** The end of the line: gone from storage, with nothing left to restore. */
  const purge = useCallback(
    (id: TaskId) => {
      apply((current) => current.filter((task) => task.id !== id))
    },
    [apply],
  )

  const emptyTrash = useCallback(() => {
    apply(liveTasks)
  }, [apply])

  return {
    tasks,
    isLoading,
    addTask,
    move,
    complete,
    uncomplete,
    rename,
    changeDescription,
    changeDueDate,
    changeRepeat,
    changeReward,
    changeTimeGoal,
    logTaskTime,
    removeTaskTime,
    tag,
    untag,
    removeTagEverywhere,
    changeList,
    clearListEverywhere,
    setHabitDay,
    addChecklistItem,
    setChecklistItemDone,
    renameChecklistItem,
    removeChecklistItem,
    remove,
    duplicate,
    restore,
    purge,
    emptyTrash,
  }
}
