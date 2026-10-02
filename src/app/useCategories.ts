import { useCallback, useEffect, useRef, useState } from 'react'
import {
  bindTag,
  createCategory,
  isCategoryLimitReached,
  isCategoryNameTaken,
  removeTagFromCategories,
  renameCategory,
  renameTagInCategories,
  sortCategories,
  unbindTag,
  type Category,
  type CategoryId,
} from '../core'
import type { CategoryChanges, CategoryRepository } from '../storage/categoryRepository'
import { changesBetween, hasChanges } from '../storage/recordChanges'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function persist(repository: CategoryRepository, changes: CategoryChanges, onProblem: ReportProblem): void {
  if (!hasChanges(changes)) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save the Balance categories.', error)
    onProblem('save')
  })
}

/**
 * Holds the Balance page's categories on screen and keeps them and the
 * repository in step both ways, as usePrizes does for the wishlist: a change
 * made here is saved, and one saved elsewhere — another tab, another device —
 * comes back through the subscription. The rules themselves live in
 * ../core/balance; this only wires them to React.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useCategories(repository: CategoryRepository, onProblem: ReportProblem = ignoreProblems) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // The categories as the last change left them, so changes made in one go
  // build on each other rather than on the ones last drawn (STORE-39).
  const latest = useRef<Category[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = sortCategories(saved)
        setCategories(latest.current)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load the Balance categories.', error)
        setIsLoading(false)
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: Category[]) => Category[]) => {
      const before = latest.current
      const next = sortCategories(change(before))
      latest.current = next
      setCategories(next)
      persist(repository, changesBetween(before, next), onProblem)
    },
    [repository, onProblem],
  )

  /**
   * Makes a category bound to no tag yet. False when another is called that
   * already, or there are as many as there can be (BAL-7).
   */
  const add = useCallback(
    (name: string): boolean => {
      if (isCategoryNameTaken(latest.current, name) || isCategoryLimitReached(latest.current)) return false

      const made = createCategory(name)
      apply((current) => [...current, made])
      return true
    },
    [apply],
  )

  /** Renames a category, unless another is called that already. Says whether it happened (BAL-8). */
  const rename = useCallback(
    (id: CategoryId, name: string): boolean => {
      if (isCategoryNameTaken(latest.current, name, id)) return false

      apply((current) => current.map((category) => (category.id === id ? renameCategory(category, name) : category)))
      return true
    },
    [apply],
  )

  /** Binds a tag to a category, spelled as `known` has it (BAL-9). */
  const bind = useCallback(
    (id: CategoryId, tag: string, known: readonly string[]) => {
      apply((current) => current.map((category) => (category.id === id ? bindTag(category, tag, known) : category)))
    },
    [apply],
  )

  /** Unbinds a tag from a category (BAL-9). */
  const unbind = useCallback(
    (id: CategoryId, tag: string) => {
      apply((current) => current.map((category) => (category.id === id ? unbindTag(category, tag) : category)))
    },
    [apply],
  )

  /** Deletes a category. The tags and the time logged stay as they are (BAL-10). */
  const remove = useCallback(
    (id: CategoryId) => {
      apply((current) => current.filter((category) => category.id !== id))
    },
    [apply],
  )

  /** Puts a category just deleted back as it was, for the undo offered (BAL-10). */
  const restore = useCallback(
    (category: Category) => {
      apply((current) => [...current.filter((other) => other.id !== category.id), category])
    },
    [apply],
  )

  /** A tag renamed on the Tags page, written through to the categories bound to it (BAL-11). */
  const renameTag = useCallback(
    (from: string, to: string) => {
      apply((current) => renameTagInCategories(current, from, to))
    },
    [apply],
  )

  /** A tag deleted, unbound from every category (BAL-11). */
  const removeTag = useCallback(
    (name: string) => {
      apply((current) => removeTagFromCategories(current, name))
    },
    [apply],
  )

  return { categories, isLoading, add, rename, bind, unbind, remove, restore, renameTag, removeTag }
}
