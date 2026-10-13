import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  changeJournalText,
  createJournalEntry,
  firstKeptJournalDay,
  journalXp,
  type JournalEntry,
  type JournalEntryId,
  type JournalSection,
  type LocalDay,
  type XpDelta,
} from '../core'
import { hasJournalChanges, journalChangesBetween, type JournalRepository } from '../storage/journalRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

function ignoreXp(): void {}

/**
 * Holds the journal on screen and keeps it and the repository in step both
 * ways, as useActivities does for the activity log: a change made here is
 * saved, and one saved elsewhere — another tab, another device — comes back
 * through the subscription. The rules themselves live in ../core/journal; this
 * only wires them to React.
 *
 * Once loaded, and again on each new day it stays open, it lets go of the days
 * the journal no longer keeps (JRN-8). A load or a save the repository refuses
 * is told to `onProblem` (STORE-13).
 *
 * What a day written in gives and takes in XP is told to `onXp` after every
 * change to it (LVL-8). Letting go of the days no longer kept takes nothing.
 */
export function useJournal(
  repository: JournalRepository,
  onProblem: ReportProblem = ignoreProblems,
  onXp: (delta: XpDelta) => void = ignoreXp,
) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // The journal as the last change left it, so changes made in one go build on
  // each other rather than on the ones last drawn (STORE-39).
  const latest = useRef<JournalEntry[]>([])
  const xpTo = useRef(onXp)
  useLayoutEffect(() => {
    xpTo.current = onXp
  })

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = saved
        setEntries(saved)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load the journal.', error)
        setIsLoading(false)
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const firstKept = firstKeptJournalDay(new Date())
  useEffect(() => {
    if (isLoading) return
    repository.forgetBefore(firstKept).catch((error: unknown) => {
      console.error('Could not let go of the journal’s older days.', error)
      onProblem('save')
    })
  }, [repository, onProblem, isLoading, firstKept])

  const apply = useCallback(
    (change: (current: JournalEntry[]) => JournalEntry[]) => {
      const before = latest.current
      const next = change(before)
      latest.current = next
      setEntries(next)

      const changes = journalChangesBetween(before, next)
      if (!hasJournalChanges(changes)) return
      const days = [...changes.saved, ...changes.removed].map((entry) => entry.day)
      const xp = journalXp(before, next, days)
      if (xp !== 0) xpTo.current({ xp, addedToday: 0 })
      repository.save(changes).catch((error: unknown) => {
        console.error('Could not save the journal.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  /** Writes a line at the foot of a section of `day` (JRN-2). */
  const add = useCallback(
    (section: JournalSection, text: string, day: LocalDay): JournalEntry => {
      const made = createJournalEntry(section, text, day, new Date())
      apply((current) => [...current, made])
      return made
    },
    [apply],
  )

  /** Changes what a line says, keeping its place (JRN-4). */
  const change = useCallback(
    (id: JournalEntryId, text: string) => {
      apply((current) => current.map((entry) => (entry.id === id ? changeJournalText(entry, text) : entry)))
    },
    [apply],
  )

  /** Takes a line out of the journal (JRN-5). */
  const remove = useCallback(
    (id: JournalEntryId) => {
      apply((current) => current.filter((entry) => entry.id !== id))
    },
    [apply],
  )

  /** Puts a line just taken out back as it was, for the undo offered (JRN-5). */
  const restore = useCallback(
    (entry: JournalEntry) => {
      apply((current) => [...current.filter((other) => other.id !== entry.id), entry])
    },
    [apply],
  )

  return { entries, isLoading, add, change, remove, restore }
}
