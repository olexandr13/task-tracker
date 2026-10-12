import { useCallback, useEffect, useRef, useState } from 'react'
import { changeNoteText, createNote, isBlankNoteText, sortNotes, type Note, type NoteId } from '../core'
import type { NoteChanges, NoteRepository } from '../storage/noteRepository'
import { changesBetween, hasChanges } from '../storage/recordChanges'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function persist(repository: NoteRepository, changes: NoteChanges, onProblem: ReportProblem): void {
  if (!hasChanges(changes)) return

  repository.save(changes).catch((error: unknown) => {
    console.error('Could not save the notes.', error)
    onProblem('save')
  })
}

/**
 * Holds the notes on screen and keeps them and the repository in step both
 * ways, as usePrizes does for the wishlist: a change made here is saved, and
 * one saved elsewhere — another tab, another device — comes back through the
 * subscription. The rules themselves live in ../core/note; this only wires
 * them to React.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useNotes(repository: NoteRepository, onProblem: ReportProblem = ignoreProblems) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // The notes as the last change left them, so changes made in one go build on
  // each other rather than on the ones last drawn (STORE-39).
  const latest = useRef<Note[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = sortNotes(saved)
        setNotes(latest.current)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load the notes.', error)
        setIsLoading(false)
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: Note[]) => Note[]) => {
      const before = latest.current
      const next = sortNotes(change(before))
      latest.current = next
      setNotes(next)
      persist(repository, changesBetween(before, next), onProblem)
    },
    [repository, onProblem],
  )

  /** Writes a new note (NOTE-3). Nothing is made of a note that says nothing (NOTE-4): null then. */
  const add = useCallback(
    (text: string): Note | null => {
      if (isBlankNoteText(text)) return null

      const made = createNote(text, new Date())
      apply((current) => [...current, made])
      return made
    },
    [apply],
  )

  /**
   * Changes what a note says (NOTE-5). Emptying a note is deleting it, which
   * the page asks for itself so it can be undone (NOTE-6); a blank change is
   * passed over here.
   */
  const change = useCallback(
    (id: NoteId, text: string) => {
      if (isBlankNoteText(text)) return

      const now = new Date()
      apply((current) => current.map((note) => (note.id === id ? changeNoteText(note, text, now) : note)))
    },
    [apply],
  )

  /** Deletes a note (NOTE-6). */
  const remove = useCallback(
    (id: NoteId) => {
      apply((current) => current.filter((note) => note.id !== id))
    },
    [apply],
  )

  /** Puts a note just deleted back as it was, for the undo offered (NOTE-6). */
  const restore = useCallback(
    (note: Note) => {
      apply((current) => [...current.filter((other) => other.id !== note.id), note])
    },
    [apply],
  )

  return { notes, isLoading, add, change, remove, restore }
}
