import { useEffect, useEffectEvent, useState } from 'react'
import type { GoalId, LocalDay } from '../core'
import type { TaskScope } from '../storage/taskRepository'

/** No history anywhere: what every goal has once every task is held. */
const NONE: ReadonlyMap<GoalId, number> = new Map()

/**
 * How many tasks serving each goal are history not loaded on this device
 * (STORE-55) — every one of them done — so a goal's progress counts the work
 * finished long ago as well as this month's (GOAL-9). Only a count is fetched,
 * never the tasks, as for a view's folded spans (useUnheldHistory).
 *
 * Asked of `goals` — the ones on screen, or null while none is — once each,
 * and again each time more is held. The last answer stands in meanwhile, so a
 * bar does not dip while it is asked again; a goal not answered yet has none
 * counted. Once every task is held there is nothing to ask.
 */
export function useGoalHistory(
  goals: readonly GoalId[] | null,
  heldSince: LocalDay | null,
  loaded: boolean,
  unheld: (scope: TaskScope) => Promise<number | null>,
): ReadonlyMap<GoalId, number> {
  // The last answer for each goal, with the day held from when it was given.
  const [answers, setAnswers] = useState<ReadonlyMap<GoalId, { since: LocalDay; count: number }>>(() => new Map())
  const key = goals === null ? null : goals.join(' ')

  const ask = useEffectEvent((since: LocalDay, isCurrent: () => boolean) => {
    for (const goalId of goals ?? []) {
      if (answers.get(goalId)?.since === since) continue

      unheld({ kind: 'goal', goalId }).then(
        (count) => {
          if (isCurrent() && count !== null) setAnswers((known) => new Map(known).set(goalId, { since, count }))
        },
        // A count is a nicety: without one the goal counts what is held.
        () => {},
      )
    }
  })

  useEffect(() => {
    if (key === null || !loaded || heldSince === null) return

    let current = true
    ask(heldSince, () => current)
    return () => { current = false }
  }, [key, loaded, heldSince])

  if (heldSince === null) return NONE
  return new Map([...answers].map(([goalId, { count }]) => [goalId, count]))
}
