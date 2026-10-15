import { createContext, useContext } from 'react'
import type { Goal } from '../core'

/**
 * Every goal there is (GOAL-1), for whatever is drawn deep inside a row, a card
 * or a sheet — the goal picker, the Goal group of a task's menu — to offer
 * without every list between handing it down, as the features switched off are
 * (./features). The screen provides it; drawn on its own, as in a test, there
 * are none.
 */
export const GoalsContext = createContext<readonly Goal[]>([])

/** Every goal there is, as the screen it is drawn on has them. */
export function useKnownGoals(): readonly Goal[] {
  return useContext(GoalsContext)
}
