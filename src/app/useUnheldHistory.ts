import { useEffect, useEffectEvent, useState } from 'react'
import type { LocalDay } from '../core'
import type { TaskScope } from '../storage/taskRepository'

/** Whether a view's tasks include history not loaded yet, or that is not known yet. */
export type UnheldHistory = 'some' | 'none' | 'unknown'

/**
 * Whether the tasks a view draws its done spans from (`historyScope`) include
 * history not loaded yet (STORE-55). Only a count is fetched, never the tasks:
 * the server says how many there are in `scope`, and the ones held are taken
 * from it. It is asked again each time more is held, the last answer standing
 * in meanwhile so the headings do not blink; nothing is asked once every task
 * is held, or of a view with no spans to fold.
 */
export function useUnheldHistory(
  scope: TaskScope | null,
  heldSince: LocalDay | null,
  loaded: boolean,
  unheld: (scope: TaskScope) => Promise<number | null>,
): UnheldHistory {
  // The last answer for each scope, with the day held from when it was given.
  const [answers, setAnswers] = useState<ReadonlyMap<string, { since: LocalDay; count: number }>>(() => new Map())
  const key = scope === null ? null : JSON.stringify(scope)
  const answer = key === null ? undefined : answers.get(key)
  const due = key !== null && loaded && heldSince !== null && answer?.since !== heldSince

  // The scope as it stands when the question goes, without asking again each
  // time the screen draws a scope equal to the last.
  const ask = useEffectEvent((since: LocalDay, isCurrent: () => boolean) => {
    if (scope === null || key === null) return

    unheld(scope).then(
      (count) => {
        if (isCurrent() && count !== null) setAnswers((known) => new Map(known).set(key, { since, count }))
      },
      // A count is a nicety: without one the spans still to load stay as they are.
      () => {},
    )
  })

  useEffect(() => {
    if (!due || heldSince === null) return

    let current = true
    ask(heldSince, () => current)
    return () => { current = false }
  }, [due, key, heldSince])

  if (scope === null || heldSince === null) return 'none'
  if (answer === undefined) return 'unknown'
  return answer.count > 0 ? 'some' : 'none'
}
