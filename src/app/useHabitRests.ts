import { useCallback, useEffect, useRef, useState } from 'react'
import { toLocalDay, type HabitRests } from '../core'
import type { HabitSettingsRepository } from '../storage/habitSettingsRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

export interface HabitRestSetting {
  /** The limit, the account's (STORE-63); null while it is off, and while still loading. */
  readonly rests: HabitRests
  /** Whether it is still on its way from the account. */
  readonly isLoading: boolean
  /** Switches the limit on from today, or off (HAB-36). */
  readonly turn: (on: boolean) => void
}

/**
 * The limit on habits' rests (HAB-36), heard from the account as it changes
 * here or anywhere else.
 *
 * Until it arrives the limit reads as off — every skip a rest, as the app was
 * — so nothing is turned down and no streak broken on a guess.
 */
export function useHabitRests(
  repository: HabitSettingsRepository,
  onProblem: ReportProblem = ignoreProblems,
): HabitRestSetting {
  // Boxed, there being nothing to tell the limit off from not knowing yet.
  const [saved, setSaved] = useState<{ of: HabitRests } | null>(null)
  // The limit as it stands, so switching it twice in a row builds on the first (STORE-39).
  const latest = useRef<HabitRests>(null)

  useEffect(() => {
    return repository.subscribe(
      (rests) => {
        latest.current = rests
        setSaved({ of: rests })
      },
      (error) => {
        console.error('Could not load the limit on rests.', error)
        setSaved({ of: latest.current })
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const turn = useCallback(
    (on: boolean) => {
      // Switched on again while on, it keeps the day it began: skips since then
      // were made against it.
      const next = on ? (latest.current ?? { since: toLocalDay(new Date()) }) : null
      if (next === latest.current) return
      latest.current = next
      setSaved({ of: next })
      repository.save(next).catch((error: unknown) => {
        console.error('Could not save the limit on rests.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  return { rests: saved?.of ?? null, isLoading: saved === null, turn }
}
