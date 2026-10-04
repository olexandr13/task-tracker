import { useCallback, useEffect, useRef, useState } from 'react'
import { ALL_FEATURES_ON, switchFeature, type Feature, type FeaturesOff } from '../core'
import type { FeatureRepository } from '../storage/featureRepository'
import { ignoreProblems, type ReportProblem } from './storageProblem'

export interface FeatureSwitches {
  /** The features switched off, the account's (STORE-56); none while still loading. */
  readonly off: FeaturesOff
  /** Whether the switches are still on their way from the account (FEAT-8). */
  readonly isLoading: boolean
  /** Turns one feature on or off at once, with no confirm (FEAT-1). */
  readonly turn: (feature: Feature, on: boolean) => void
}

/**
 * The switches on Settings (FEAT-1): which features the account has turned
 * off, heard from the account as they change here or anywhere else.
 *
 * Until they arrive everything reads as on. A page switched off then shows for
 * a moment, but nothing is hidden on a guess, and an address of a page that is
 * on is never sent elsewhere before the account has said it is off (FEAT-2).
 */
export function useFeatures(repository: FeatureRepository, onProblem: ReportProblem = ignoreProblems): FeatureSwitches {
  // Boxed, there being nothing to tell everything on from not knowing yet.
  const [saved, setSaved] = useState<{ of: FeaturesOff } | null>(null)
  // The switches as they stand, so two turned in a row both count (STORE-39).
  const latest = useRef<FeaturesOff>(ALL_FEATURES_ON)

  useEffect(() => {
    return repository.subscribe(
      (off) => {
        latest.current = off ?? ALL_FEATURES_ON
        setSaved({ of: latest.current })
      },
      (error) => {
        console.error('Could not load the feature switches.', error)
        setSaved({ of: latest.current })
        onProblem('load')
      },
    )
  }, [repository, onProblem])

  const isLoading = saved === null
  const off = saved?.of ?? ALL_FEATURES_ON

  const turn = useCallback(
    (feature: Feature, on: boolean) => {
      const next = switchFeature(latest.current, feature, on)
      latest.current = next
      setSaved({ of: next })
      repository.save(next).catch((error: unknown) => {
        console.error('Could not save the feature switches.', error)
        onProblem('save')
      })
    },
    [repository, onProblem],
  )

  return { off, isLoading, turn }
}
