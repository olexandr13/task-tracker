import { useCallback, useEffect, useRef, useState } from 'react'
import {
  changeActivityEntry,
  createActivityEntry,
  knownActivities,
  sessionActivityEntries,
  withoutSession,
  withSessionResized,
  type ActivityChange,
  type ActivityEntry,
  type ActivityEntryId,
  type HourSlot,
  type LoggedSession,
  type TimeEntryId,
} from '../core'
import { activityChangesBetween, hasActivityChanges, type ActivityRepository } from '../storage/activityRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

/**
 * Holds the activity log on screen and keeps it and the repository in step
 * both ways, as useCategories does for the Balance categories: a change made
 * here is saved, and one saved elsewhere — another tab, another device — comes
 * back through the subscription. The rules themselves live in ../core/activity;
 * this only wires them to React.
 *
 * A load or a save the repository refuses is told to `onProblem` (STORE-13).
 */
export function useActivities(repository: ActivityRepository, onProblem: ReportProblem = ignoreProblems) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // The log as the last change left it, so changes made in one go build on
  // each other rather than on the ones last drawn (STORE-39).
  const latest = useRef<ActivityEntry[]>([])

  useEffect(() => {
    return repository.subscribe(
      (saved) => {
        latest.current = saved
        setEntries(saved)
        setIsLoading(false)
      },
      (error) => {
        console.error('Could not load the activity log.', error)
        setIsLoading(false)
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const apply = useCallback(
    (change: (current: ActivityEntry[]) => ActivityEntry[]) => {
      const before = latest.current
      const next = change(before)
      latest.current = next
      setEntries(next)

      const changes = activityChangesBetween(before, next)
      if (!hasActivityChanges(changes)) return
      repository.save(changes).catch((error: unknown) => {
        console.error('Could not save the activity log.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  /** Logs `seconds` of `activity` under the slot, spelled as it already is where it is known (ACT-2, ACT-4). */
  const add = useCallback(
    (activity: string, seconds: number, slot: HourSlot): ActivityEntry => {
      const made = createActivityEntry(activity, seconds, slot, new Date(), knownActivities(latest.current))
      apply((current) => [...current, made])
      return made
    },
    [apply],
  )

  /** Writes the time sessions logged on tasks took up, under their tasks' titles (ACT-21). */
  const addSessions = useCallback(
    (sessions: readonly LoggedSession[]) => {
      const now = new Date()
      const known = knownActivities(latest.current, now)
      const made = sessions.flatMap(({ task, entry }) => sessionActivityEntries(task.title, task.id, entry, now, known))
      if (made.length === 0) return
      apply((current) => [...current, ...made])
    },
    [apply],
  )

  /**
   * Writes the records sessions made again for the lengths they were changed to
   * (TIME-24, ACT-21); a session whose records were all deleted here stays out.
   */
  const resizeSessions = useCallback(
    (sessions: readonly LoggedSession[]) => {
      const now = new Date()
      const known = knownActivities(latest.current, now)
      apply((current) =>
        sessions.reduce(
          (log, { task, entry }) => withSessionResized(log, task.title, task.id, entry, now, known),
          current,
        ),
      )
    },
    [apply],
  )

  /** Takes out the records a session made, as the session is taken back (ACT-21). */
  const removeSession = useCallback(
    (entryId: TimeEntryId) => {
      apply((current) => withoutSession(current, entryId))
    },
    [apply],
  )

  /** Changes what a record says, how long it is, or the hour of its day it is under (ACT-10). */
  const change = useCallback(
    (id: ActivityEntryId, changed: ActivityChange) => {
      const known = knownActivities(latest.current)
      apply((current) =>
        current.map((entry) => (entry.id === id ? changeActivityEntry(entry, changed, new Date(), known) : entry)),
      )
    },
    [apply],
  )

  /** Takes a record out of the log (ACT-11). */
  const remove = useCallback(
    (id: ActivityEntryId) => {
      apply((current) => current.filter((entry) => entry.id !== id))
    },
    [apply],
  )

  /** Puts a record just taken out back as it was, for the undo offered (ACT-11). */
  const restore = useCallback(
    (entry: ActivityEntry) => {
      apply((current) => [...current.filter((other) => other.id !== entry.id), entry])
    },
    [apply],
  )

  return { entries, isLoading, add, addSessions, resizeSessions, removeSession, change, remove, restore }
}
