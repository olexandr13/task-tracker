import type { ChestTier } from '../core'

/**
 * What each tier looks like (CHST-15). A chest holds no symbol to read the tier
 * off, so the colour of the light is the whole of how a haul is told from a
 * pinch before the number is read — which makes it worth getting right.
 *
 * Two forms of the one colour: a Tailwind class for what the page draws, and
 * the colour itself for what the canvas and the SVG gradients need, neither of
 * which can read a class. Every class is a literal, light and `dark:` paired, as
 * the habit grid's tones are — a class built by joining strings is a class the
 * stylesheet never finds.
 */
export interface ChestTone {
  /** The colour of the light out of the chest, as a colour. */
  readonly light: string
  /** The same colour a step deeper, for the core of the glow. */
  readonly deep: string
  /** The number once it has finished counting, and the tier's name under it. */
  readonly points: string
}

export const CHEST_TONES: Record<ChestTier, ChestTone> = {
  pinch: {
    light: '#e7e5e4',
    deep: '#a8a29e',
    points: 'text-stone-700 dark:text-stone-200',
  },
  handful: {
    light: '#7dd3fc',
    deep: '#0ea5e9',
    points: 'text-sky-600 dark:text-sky-300',
  },
  haul: {
    light: '#fcd34d',
    deep: '#f59e0b',
    points: 'text-amber-600 dark:text-amber-300',
  },
  jackpot: {
    light: '#f0abfc',
    deep: '#d946ef',
    points: 'text-fuchsia-600 dark:text-fuchsia-300',
  },
}

/** The light along the seam before it has a colour: plain warm lamplight. */
export const CHEST_LAMPLIGHT = '#fde68a'
