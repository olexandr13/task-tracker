import { useCallback, useEffect, useState } from 'react'
import { completeTask, createTask, type Task, type TaskId } from '../core'
import type { TaskRepository } from '../storage/taskRepository'

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
        setTasks(saved)
        setIsLoading(false)
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
      const next = change(tasks)
      setTasks(next)
      repository.save(next).catch((error: unknown) => {
        console.error('Could not save tasks.', error)
      })
    },
    [tasks, repository],
  )

  const addTask = useCallback(
    (title: string) => {
      apply((current) => [...current, createTask(title)])
    },
    [apply],
  )

  const complete = useCallback(
    (id: TaskId) => {
      apply((current) => current.map((task) => (task.id === id ? completeTask(task) : task)))
    },
    [apply],
  )

  const remove = useCallback(
    (id: TaskId) => {
      apply((current) => current.filter((task) => task.id !== id))
    },
    [apply],
  )

  return { tasks, isLoading, addTask, complete, remove }
}
