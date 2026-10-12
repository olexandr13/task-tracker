import { createContext, useContext } from 'react'
import type { HabitRests } from '../core'

/**
 * The limit on habits' rests as it applies (HAB-36), for whatever reads a
 * habit's record or offers its skip deep inside a card, a row or a sheet —
 * the grid, a folded card's week, the sheet's Skip — to ask without every list
 * between handing it down. The screen provides it: null while the limit is
 * off, or while Habits is switched off and the limit with it (FEAT-3). Drawn
 * on its own, as in a test, it is off.
 */
export const HabitRestsContext = createContext<HabitRests>(null)

/** The limit on rests, as the screen it is drawn on has it; null while every skip is a rest. */
export function useRestLimit(): HabitRests {
  return useContext(HabitRestsContext)
}
