import { useCallback, useEffect, useState } from 'react'
import {
  appendList,
  createList,
  isNameTaken,
  renameList,
  sortLists,
  type List,
  type ListId,
} from '../core'
import { listChangesBetween, type ListChanges, type ListRepository } from '../storage/listRepository'

function persist(repository: ListRepository, changes: ListChanges): void {
  if (changes.saved.length === 0 && changes.removed.length === 0) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save lists.', error)
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
 */
export function useLists(repository: ListRepository) {
  const [lists, setLists] = useState<List[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        setLists(sortLists(saved))
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load lists.', error)
        setIsLoading(false)
      },
    )
  }, [repository])

  const apply = useCallback(
    (change: (current: List[]) => List[]) => {
      const next = change(lists)
      setLists(sortLists(next))
      persist(repository, listChangesBetween(lists, next))
    },
    [lists, repository],
  )

  /**
   * Makes a list and hands it back, so the caller can open it at once. Null when
   * the name will not do — nothing, or one another list has already — which the
   * page that asked says out loud rather than making a second Work.
   */
  const add = useCallback(
    (name: string): List | null => {
      if (isNameTaken(lists, name)) return null

      let made: List | null = null
      apply((current) => {
        const next = appendList(current, createList(name))
        made = next[next.length - 1]
        return next
      })
      return made
    },
    [lists, apply],
  )

  /** Renames a list, unless another list is called that already. Says whether it happened. */
  const rename = useCallback(
    (id: ListId, name: string): boolean => {
      if (isNameTaken(lists, name, id)) return false

      apply((current) => current.map((list) => (list.id === id ? renameList(list, name) : list)))
      return true
    },
    [lists, apply],
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
