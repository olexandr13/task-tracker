import { useId, useState } from 'react'
import type { LocalDay } from '../../core'
import {
  BY_DAY_HEADING,
  chartCeiling,
  DAY_READOUT_HINT,
  dayAxisLabel,
  describeChartTime,
  describeDay,
  describeDayColumn,
  describeGridline,
} from '../chartLabels'
import type { DayColumn } from '../chartPieces'

const gridline = 'absolute inset-x-0 border-t border-neutral-200 dark:border-neutral-800'
const tick = 'absolute right-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-neutral-400 dark:text-neutral-500'

interface DayColumnsChartProps {
  columns: readonly DayColumn[]
  period: 'week' | 'month'
  /** Today, whose label is marked. */
  today: LocalDay
  /** The piece picked out in the chart above, the rest faded here too, or null for none. */
  active: string | null
  /**
   * What pressing a day does, where it opens the day (ACT-14). Without it, a
   * press keeps the day's readout said until pressed again (BAL-13).
   */
  onOpenDay?: (day: LocalDay) => void
  /** What the readout says before a day is pointed at. */
  hint?: string
}

/**
 * A week or a month day by day (BAL-13, ACT-14): a column for each day, divided
 * between the pieces as the bar above is, against two gridlines in round hours,
 * so a day with no rest in it — or nothing logged — shows as one. Pointing at a
 * day, or focusing it, says how its time divided in the line above the columns;
 * pressing it keeps that said, or opens the day where there is one to open.
 */
export function DayColumnsChart({ columns, period, today, active, onOpenDay, hint = DAY_READOUT_HINT }: DayColumnsChartProps) {
  const headingId = useId()
  const [pressed, setPressed] = useState<LocalDay | null>(null)
  const [pointed, setPointed] = useState<LocalDay | null>(null)

  const ceiling = chartCeiling(Math.max(...columns.map((column) => column.total)))
  const grid = { gridTemplateColumns: `repeat(${String(columns.length)}, minmax(0, 1fr))` }
  const shown = columns.find((column) => column.day === (pointed ?? pressed)) ?? null

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {BY_DAY_HEADING}
      </h3>

      <p aria-live="polite" className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
        {shown === null ? (
          hint
        ) : shown.total === 0 ? (
          describeDayColumn(shown)
        ) : (
          <>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              {describeDay(shown.day)} · {describeChartTime(shown.total)}
            </span>
            {shown.pieces.map((piece) => (
              <span key={piece.key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-[2px] ${piece.color.fill}`} />
                {piece.label} {describeChartTime(piece.seconds)}
              </span>
            ))}
          </>
        )}
      </p>

      <div className="flex gap-2">
        <div className="relative h-32 min-w-0 flex-1">
          <div aria-hidden="true" className={`${gridline} top-0`} />
          <div aria-hidden="true" className={`${gridline} top-1/2`} />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 border-t border-neutral-300 dark:border-neutral-700" />

          <div className="absolute inset-0 grid gap-0.5" style={grid}>
            {columns.map((column) => {
              const height = Math.min(100, (column.total / ceiling) * 100)

              return (
                <button
                  key={column.day}
                  type="button"
                  aria-pressed={onOpenDay === undefined ? pressed === column.day : undefined}
                  aria-label={describeDayColumn(column)}
                  onClick={() => {
                    if (onOpenDay !== undefined) onOpenDay(column.day)
                    else setPressed(pressed === column.day ? null : column.day)
                  }}
                  onPointerEnter={() => { setPointed(column.day) }}
                  onPointerLeave={() => { setPointed(null) }}
                  onFocus={() => { setPointed(column.day) }}
                  onBlur={() => { setPointed(null) }}
                  className={`flex h-full min-w-0 items-end justify-center rounded-t-md transition-colors ${
                    pressed === column.day ? 'bg-neutral-100 dark:bg-neutral-800/60' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  {column.total > 0 && (
                    <span
                      className="flex w-full max-w-6 min-h-[3px] flex-col-reverse gap-0.5 overflow-hidden rounded-t-[4px]"
                      style={{ height: `${String(height)}%` }}
                    >
                      {column.pieces.map((piece) => (
                        <span
                          key={piece.key}
                          className={`min-h-px transition-opacity ${piece.color.fill}${active !== null && piece.key !== active ? ' opacity-25' : ''}`}
                          style={{ flexGrow: piece.seconds, flexBasis: 0 }}
                          data-piece={piece.key}
                        />
                      ))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div aria-hidden="true" className="relative h-32 w-8 shrink-0">
          <span className={`${tick} top-0`}>{describeGridline(ceiling)}</span>
          <span className={`${tick} top-1/2`}>{describeGridline(ceiling / 2)}</span>
        </div>
      </div>

      <div aria-hidden="true" className="grid gap-0.5 pr-10" style={grid}>
        {columns.map((column) => (
          <span
            key={column.day}
            className={`overflow-visible text-center text-[10px] whitespace-nowrap tabular-nums ${
              column.day === today ? 'font-medium text-neutral-800 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {dayAxisLabel(column.day, period)}
          </span>
        ))}
      </div>
    </section>
  )
}
