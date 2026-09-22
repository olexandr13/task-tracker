import { useCallback, useEffect, useRef, useState } from 'react'
import {
  appendList,
  createList,
  isNameTaken,
  renameList,
  sortLists,
  type List,
  type ListId,
} from '../core'
import type { ListChanges, ListRepository } from '../storage/listRepository'
import { changesBetween, hasChanges } from '../storage/recordChanges'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function persist(repository: ListRepository, changes: ListChanges, onProblem: ReportProblem): void {
  if (!hasChanges(changes)) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save lists.', error)
    onProblem('save')
  })
}

/**
 * Holds the lists on screen and keeps them and the repository in step both ways,
 * as useTasks does for the tasks: a change made here is saved, and one saved
 * elsewhere — another tab, another device — comes back through the subscription.
 * The rules themselves live in ../core/list; this only wires them to React.
 *
 * The lists are all this holds. What is *in* a list is the tasks' own business —
 * a task names its list by id — so filing a task, and emptying a list of them,
 * are changes to the tasks (useTasks) rather than to anything here.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useLists(repository: ListRepository, onProblem: ReportProblem = ignoreProblems) {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // The lists as the last change left them, so changes made in one go build on
  // each other rather than on the lists last drawn (as in useTasks).
  const latest = useRef<List[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = sortLists(saved)
        setLists(latest.current)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load lists.', error)
        setIsLoading(false)
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: List[]) => List[]) => {
      const before = latest.current
      const next = sortLists(change(before))
      latest.current = next
      setLists(next)
      persist(repository, changesBetween(before, next), onProblem)
    },
    [repository, onProblem],
  )

  /**
   * Makes a list and hands it back, so the caller can open it at once. Null when
   * the name will not do — nothing, or one another list has already — which the
   * page that asked says out loud rather than making a second Work.
   */
  const add = useCallback(
    (name: string): List | null => {
      if (isNameTaken(latest.current, name)) return null

      const made = createList(name)
      apply((current) => appendList(current, made))
      return latest.current.find((list) => list.id === made.id) ?? null
    },
    [apply],
  )

  /** Renames a list, unless another list is called that already. Says whether it happened. */
  const rename = useCallback(
    (id: ListId, name: string): boolean => {
      if (isNameTaken(latest.current, name, id)) return false

      apply((current) => current.map((list) => (list.id === id ? renameList(list, name) : list)))
      return true
    },
    [apply],
  )

  /**
   * Deletes the list itself. The tasks filed under it are the caller's to empty
   * first (`clearListEverywhere` in useTasks); a task left naming a list that is
   * gone still reads as being in the Inbox, so neither order loses a task.
   */
  const remove = useCallback(
    (id: ListId) => {
      apply((current) => current.filter((list) => list.id !== id))
    },
    [apply],
  )

  return { lists, isLoading, add, rename, remove }
}
