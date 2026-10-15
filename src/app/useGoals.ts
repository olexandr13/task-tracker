import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendGoal,
  createGoal,
  isGoalNameTaken,
  renameGoal,
  sortGoals,
  type Goal,
  type GoalId,
} from '../core'
import type { GoalChanges, GoalRepository } from '../storage/goalRepository'
import { changesBetween, hasChanges } from '../storage/recordChanges'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function persist(repository: GoalRepository, changes: GoalChanges, onProblem: ReportProblem): void {
  if (!hasChanges(changes)) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save goals.', error)
    onProblem('save')
  })
}

/**
 * Holds the goals on screen and keeps them and the repository in step both ways,
 * as useLists does for the lists: a change made here is saved, and one saved
 * elsewhere — another tab, another device — comes back through the subscription.
 * The rules themselves live in ../core/goal; this only wires them to React.
 *
 * The goals are all this holds. Which tasks serve a goal is the tasks' own
 * business — a task names its goal by id — so linking a task, and unlinking
 * every task from a goal, are changes to the tasks (useTasks).
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useGoals(repository: GoalRepository, onProblem: ReportProblem = ignoreProblems) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // The goals as the last change left them, so changes made in one go build on
  // each other rather than on the goals last drawn (STORE-39).
  const latest = useRef<Goal[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = sortGoals(saved)
        setGoals(latest.current)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load goals.', error)
        setIsLoading(false)
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: Goal[]) => Goal[]) => {
      const before = latest.current
      const next = sortGoals(change(before))
      latest.current = next
      setGoals(next)
      persist(repository, changesBetween(before, next), onProblem)
    },
    [repository, onProblem],
  )

  /**
   * Makes a goal and hands it back, so the caller can open it at once. Null when
   * another goal is called that already (GOAL-4), which the page says out loud.
   */
  const add = useCallback(
    (name: string): Goal | null => {
      if (isGoalNameTaken(latest.current, name)) return null

      const made = createGoal(name)
      apply((current) => appendGoal(current, made))
      return latest.current.find((goal) => goal.id === made.id) ?? null
    },
    [apply],
  )

  /** Renames a goal, unless another goal is called that already. Says whether it happened. */
  const rename = useCallback(
    (id: GoalId, name: string): boolean => {
      if (isGoalNameTaken(latest.current, name, id)) return false

      apply((current) => current.map((goal) => (goal.id === id ? renameGoal(goal, name) : goal)))
      return true
    },
    [apply],
  )

  /**
   * Deletes the goal itself. The tasks serving it are the caller's to unlink
   * first (`clearGoalEverywhere` in useTasks); a task left naming a goal that is
   * gone serves none all the same (GOAL-6), so neither order loses anything.
   */
  const remove = useCallback(
    (id: GoalId) => {
      apply((current) => current.filter((goal) => goal.id !== id))
    },
    [apply],
  )

  return { goals, isLoading, add, rename, remove }
}
