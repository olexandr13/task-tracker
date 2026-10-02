import { MAX_CATEGORIES } from '../core'

/**
 * The colours of the Balance charts (BAL-6, BAL-13): one per category, in the
 * order the categories were made, and grey for Other.
 *
 * Eight hues in a fixed order, each with its own step for the dark theme, so
 * that pieces side by side stay apart for colour-blind eyes as well; the order
 * is part of that, and is checked as a set rather than one colour at a time.
 * There are as many as there can be categories (MAX_CATEGORIES), so none is
 * ever reused or made up. Three of the light steps are faint against a white
 * card, which is why every piece is also named, with its time, in the legend.
 *
 * A share written inside a piece takes white or near-black, whichever reads
 * better on that fill in that theme.
 */
export interface BalanceColor {
  /** The fill of a piece of the bar, or of a day's column. */
  readonly fill: string
  /** Text set inside the fill. */
  readonly ink: string
}

export const CATEGORY_COLORS: readonly BalanceColor[] = [
  { fill: 'bg-[#2a78d6] dark:bg-[#3987e5]', ink: 'text-white dark:text-neutral-950' },
  { fill: 'bg-[#eb6834] dark:bg-[#d95926]', ink: 'text-neutral-950' },
  { fill: 'bg-[#1baf7a] dark:bg-[#199e70]', ink: 'text-neutral-950' },
  { fill: 'bg-[#eda100] dark:bg-[#c98500]', ink: 'text-neutral-950' },
  { fill: 'bg-[#e87ba4] dark:bg-[#d55181]', ink: 'text-neutral-950' },
  { fill: 'bg-[#008300] dark:bg-[#008300]', ink: 'text-white' },
  { fill: 'bg-[#4a3aa7] dark:bg-[#9085e9]', ink: 'text-white dark:text-neutral-950' },
  { fill: 'bg-[#e34948] dark:bg-[#e66767]', ink: 'text-neutral-950' },
]

/** Time on tasks bound to no category: grey, being no category (BAL-5). */
export const OTHER_COLOR: BalanceColor = {
  fill: 'bg-neutral-400 dark:bg-neutral-500',
  ink: 'text-neutral-950 dark:text-white',
}

/**
 * The colour of the category at `index` among them all, in the order they were
 * made: the colour follows the category, not its size or the period shown.
 */
export function categoryColor(index: number): BalanceColor {
  if (index < 0 || index >= MAX_CATEGORIES) return OTHER_COLOR
  return CATEGORY_COLORS[index]
}
