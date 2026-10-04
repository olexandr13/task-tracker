import type { CaseQuarter } from '../core'

/**
 * What each quarter of the jackpot looks like (CHST-15). Every card on the reel
 * wears the colour of the quarter its amount falls in — the bar along its foot,
 * the glow behind its emblem, the light it throws once it is out — so a big
 * card is told from a small one at a glance as it runs past, before any number
 * is read. The pips and the emblem say the same for anyone the colour does not
 * reach.
 *
 * The colours are an old enamel sign's rather than a screen's: bone, a 1960s
 * teal, amber, and a hot magenta that will not hold still for the top quarter.
 *
 * Two forms of the one colour: a Tailwind class for what the page draws, and
 * the colour itself for what the canvas, the SVG and the CSS custom properties
 * need, none of which can read a class. Every class is a literal, light and
 * `dark:` paired, as the habit grid's tones are — a class built by joining
 * strings is a class the stylesheet never finds.
 */
export interface CaseTone {
  /** The colour of the light the card throws, as a colour. */
  readonly light: string
  /** The same colour a step deeper, for the emblem's shadowed side. */
  readonly deep: string
  /** The number under Cases once it has finished counting. */
  readonly points: string
}

export const CASE_TONES: Record<CaseQuarter, CaseTone> = {
  1: {
    light: '#d6d3d1',
    deep: '#78716c',
    points: 'text-stone-600 dark:text-stone-300',
  },
  2: {
    light: '#5eead4',
    deep: '#0f766e',
    points: 'text-teal-600 dark:text-teal-300',
  },
  3: {
    light: '#fbbf24',
    deep: '#b45309',
    points: 'text-amber-600 dark:text-amber-300',
  },
  4: {
    light: '#f0abfc',
    deep: '#a21caf',
    points: 'text-fuchsia-600 dark:text-fuchsia-300',
  },
}

/**
 * A card whose colour this device never saw — today's case opened on another
 * one, the ledger keeping the points but not the show (CHST-24). Plain bone,
 * saying nothing it does not know.
 */
export const CASE_UNKNOWN_TONE: CaseTone = {
  light: '#e7e0cf',
  deep: '#8a8270',
  points: 'text-stone-700 dark:text-stone-200',
}
