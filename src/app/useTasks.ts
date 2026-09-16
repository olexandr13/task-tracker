import { useCallback, useEffect, useState } from 'react'
import {
  appendTask,
  completeTask,
  createTask,
  deleteTask,
  insertSubtask,
  isDeleted,
  liveTasks,
  moveTask,
  purgeExpired,
  removeSubtask,
  renameSubtask,
  renameTask,
  restoreTask,
  setDescription,
  setDueDate,
  setRepeat,
  setSubtaskDone,
  uncompleteTask,
  type LocalDay,
  type Placement,
  type Repeat,
  type SubtaskId,
  type Task,
  type TaskId,
} from '../core'
import type { TaskRepository } from '../storage/taskRepository'

function persist(repository: TaskRepository, tasks: Task[]): void {
  repository.save(tasks).catch((error: unknown) => {
    console.error('Could not save tasks.', error)
  })
}

/**
 * Holds the task list on screen and keeps the repository in step with it.
 * The rules themselves live in ../core; this only wires them to React.
 */
export function useTasks(repository: TaskRepository) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    repository
      .load()
      .then((saved) => {
        if (cancelled) return

        // Anything whose time in the trash ran out while the app was closed goes
        // now, and is written back so storage stops carrying it around.
        const kept = purgeExpired(saved)
        setTasks(kept)
        setIsLoading(false)
        if (kept.length !== saved.length) {
          persist(repository, kept)
        }
      })
      .catch((error: unknown) => {
        console.error('Could not load tasks.', error)
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [repository])

  const apply = useCallback(
    (change: (current: Task[]) => Task[]) => {
      // Expiry is a matter of elapsed time, so any moment the list is touched is
      // a fair one to take the trash out too.
      const next = purgeExpired(change(tasks))
      setTasks(next)
      persist(repository, next)
    },
    [tasks, repository],
  )

  const addTask = useCallback(
    (title: string, repeat: Repeat | null = null, dueDate: LocalDay | null = null) => {
      apply((current) => appendTask(current, setDueDate(createTask(title, repeat), dueDate)))
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
    addChecklistItem,
    setChecklistItemDone,
    renameChecklistItem,
    removeChecklistItem,
    remove,
    restore,
    purge,
    emptyTrash,
  }
}
