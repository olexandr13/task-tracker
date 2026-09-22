import { useCallback, useEffect, useRef, useState } from 'react'
import { createTag, isTagSaved, sameTag, unsavedTags, type Tag, type Task } from '../core'
import { changesBetween, hasChanges } from '../storage/recordChanges'
import type { TagChanges, TagRepository } from '../storage/tagRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function persist(repository: TagRepository, changes: TagChanges, onProblem: ReportProblem): void {
  if (!hasChanges(changes)) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save tags.', error)
    onProblem('save')
  })
}

/**
 * Holds the kept tags and keeps them and the repository in step both ways, as
 * useLists does for the lists. The rules themselves live in ../core/tag.
 *
 * `tasks` — every one, the trash too, or null until they have loaded — is what
 * keeps a tag from going with its last task: whatever tag a task carries and no
 * record keeps yet is kept here as soon as both are known. However the tag got
 * there — the tag panel, `#` in a description, another device — it stays once
 * no task carries it, until it is deleted.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useTags(repository: TagRepository, tasks: readonly Task[] | null, onProblem: ReportProblem = ignoreProblems) {
  const [tags, setTags] = useState<Tag[]>([])
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')
  // The tags as the last change left them, so changes made in one go build on
  // each other rather than on the tags last drawn (as in useTasks).
  const latest = useRef<Tag[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = saved
        setTags(saved)
        setStatus('loaded')
      },
      (error) => {
        console.error('Could not load tags.', error)
        setStatus('failed')
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: Tag[]) => Tag[]) => {
      const before = latest.current
      const next = change(before)
      latest.current = next
      setTags(next)
      persist(repository, changesBetween(before, next), onProblem)
    },
    [repository, onProblem],
  )

  // Tags written to be kept and not back from the repository yet, by name in
  // lower case, so none is written twice while it is on its way.
  const asked = useRef(new Set<string>())

  useEffect(() => {
    // Only once both have loaded: a tag not arrived yet, or that could not be
    // read, is not a tag missing — keeping it again would only make a second record.
    if (status !== 'loaded' || tasks === null) return

    for (const name of asked.current) {
      if (isTagSaved(tags, name)) asked.current.delete(name)
    }
    const missing = unsavedTags(tags, tasks).filter((name) => !asked.current.has(name.toLowerCase()))
    if (missing.length === 0) return

    for (const name of missing) asked.current.add(name.toLowerCase())
    // Written straight to the repository: what it keeps comes back through the
    // subscription, and until then the tasks carrying the tag show it anyway (`allTags`).
    persist(repository, { saved: missing.map((name) => createTag(name)), removed: [] }, onProblem)
  }, [status, tasks, tags, repository, onProblem])

  /**
   * Keeps a tag no task has to carry, and hands it back. Null when a tag of that
   * name is kept already, whatever its case, which the page that asked says out
   * loud rather than making a second one. The name has to be one a tag can have
   * (`isTagName`, once its `#` is off).
   */
  const add = useCallback(
    (name: string): Tag | null => {
      const made = createTag(name)
      if (isTagSaved(latest.current, made.name)) return null

      apply((current) => [...current, made])
      return made
    },
    [apply],
  )

  /**
   * Stops keeping a tag: every record of that name, whatever its case. Taking it
   * off the tasks is the caller's to do first (`removeTagEverywhere` in
   * useTasks), or the next change would keep it again.
   */
  const remove = useCallback(
    (name: string) => {
      apply((current) => current.filter((tag) => !sameTag(tag.name, name)))
    },
    [apply],
  )

  return { tags, isLoading: status === 'loading', add, remove }
}
