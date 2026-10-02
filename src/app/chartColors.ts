/**
 * The colours of the charts of time spent — the Balance page's (BAL-6, BAL-13)
 * and the activity log's (ACT-16): one per piece, given out in a fixed order,
 * and grey for Other.
 *
 * Eight hues in a fixed order, each with its own step for the dark theme, so
 * that pieces side by side stay apart for colour-blind eyes as well; the order
 * is part of that, and is checked as a set rather than one colour at a time.
 * Three of the light steps are faint against a white card, which is why every
 * piece is also named, with its time, in the legend.
 *
 * A share written inside a piece takes white or near-black, whichever reads
 * better on that fill in that theme.
 */
export interface ChartColor {
  /** The fill of a piece of the bar, or of a day's column. */
  readonly fill: string
  /** Text set inside the fill. */
  readonly ink: string
}

export const CHART_COLORS: readonly ChartColor[] = [
  { fill: 'bg-[#2a78d6] dark:bg-[#3987e5]', ink: 'text-white dark:text-neutral-950' },
  { fill: 'bg-[#eb6834] dark:bg-[#d95926]', ink: 'text-neutral-950' },
  { fill: 'bg-[#1baf7a] dark:bg-[#199e70]', ink: 'text-neutral-950' },
  { fill: 'bg-[#eda100] dark:bg-[#c98500]', ink: 'text-neutral-950' },
  { fill: 'bg-[#e87ba4] dark:bg-[#d55181]', ink: 'text-neutral-950' },
  { fill: 'bg-[#008300] dark:bg-[#008300]', ink: 'text-white' },
  { fill: 'bg-[#4a3aa7] dark:bg-[#9085e9]', ink: 'text-white dark:text-neutral-950' },
  { fill: 'bg-[#e34948] dark:bg-[#e66767]', ink: 'text-neutral-950' },
]

/** Time in nothing the chart names: grey, being nothing in particular (BAL-5). */
export const OTHER_COLOR: ChartColor = {
  fill: 'bg-neutral-400 dark:bg-neutral-500',
  ink: 'text-neutral-950 dark:text-white',
}

/**
 * The colour of the piece at `index` in the order a chart gives them out —
 * the order its categories were made, or its activities first logged — so the
 * colour follows the piece, not its size or the period shown. Past the eighth,
 * the colours come round again; the legend names every piece either way.
 */
export function chartColor(index: number): ChartColor {
  if (index < 0) return OTHER_COLOR
  return CHART_COLORS[index % CHART_COLORS.length]
}
