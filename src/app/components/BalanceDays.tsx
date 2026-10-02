import { useId, useState } from 'react'
import type { DayBalance, LocalDay, Period } from '../../core'
import {
  BY_DAY_HEADING,
  chartCeiling,
  DAY_READOUT_HINT,
  dayAxisLabel,
  describeBalanceTime,
  describeDay,
  describeDayBalance,
  describeGridline,
} from '../balanceLabels'
import { balancePieces, type PieceKey } from '../balancePieces'

const gridline = 'absolute inset-x-0 border-t border-neutral-200 dark:border-neutral-800'
const tick = 'absolute right-0 -translate-y-1/2 text-[10px] leading-none tabular-nums text-neutral-400 dark:text-neutral-500'

interface BalanceDaysProps {
  days: readonly DayBalance[]
  period: Period
  /** Today, whose label is marked. */
  today: LocalDay
  /** The piece picked out in the chart above, the rest faded here too, or null for none. */
  active: PieceKey | null
}

/**
 * The week or the month day by day (BAL-13): a column for each day, divided
 * between the categories as the bar above is, against two gridlines in round
 * hours, so a day with no rest in it shows as one. Pointing at a day, or
 * focusing it, says how its time divided in the line above the columns, and
 * pressing it keeps it said.
 */
export function BalanceDays({ days, period, today, active }: BalanceDaysProps) {
  const headingId = useId()
  const [pressed, setPressed] = useState<LocalDay | null>(null)
  const [pointed, setPointed] = useState<LocalDay | null>(null)

  const ceiling = chartCeiling(Math.max(...days.map((day) => day.total)))
  const columns = { gridTemplateColumns: `repeat(${String(days.length)}, minmax(0, 1fr))` }
  const shown = days.find((day) => day.day === (pointed ?? pressed)) ?? null
  const shownPieces = shown === null ? [] : balancePieces(shown)

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
        {BY_DAY_HEADING}
      </h3>

      <p aria-live="polite" className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
        {shown === null ? (
          DAY_READOUT_HINT
        ) : shown.total === 0 ? (
          describeDayBalance(shown, shownPieces)
        ) : (
          <>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              {describeDay(shown.day)} · {describeBalanceTime(shown.total)}
            </span>
            {shownPieces.map((piece) => (
              <span key={piece.key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-[2px] ${piece.color.fill}`} />
                {piece.label} {describeBalanceTime(piece.seconds)}
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

          <div className="absolute inset-0 grid gap-0.5" style={columns}>
            {days.map((day) => {
              const pieces = balancePieces(day)
              const height = Math.min(100, (day.total / ceiling) * 100)

              return (
                <button
                  key={day.day}
                  type="button"
                  aria-pressed={pressed === day.day}
                  aria-label={describeDayBalance(day, pieces)}
                  onClick={() => { setPressed(pressed === day.day ? null : day.day) }}
                  onPointerEnter={() => { setPointed(day.day) }}
                  onPointerLeave={() => { setPointed(null) }}
                  onFocus={() => { setPointed(day.day) }}
                  onBlur={() => { setPointed(null) }}
                  className={`flex h-full min-w-0 items-end justify-center rounded-t-md transition-colors ${
                    pressed === day.day ? 'bg-neutral-100 dark:bg-neutral-800/60' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  {day.total > 0 && (
                    <span
                      className="flex w-full max-w-6 min-h-[3px] flex-col-reverse gap-0.5 overflow-hidden rounded-t-[4px]"
                      style={{ height: `${String(height)}%` }}
                    >
                      {pieces.map((piece) => (
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

      <div aria-hidden="true" className="grid gap-0.5 pr-10" style={columns}>
        {days.map((day) => (
          <span
            key={day.day}
            className={`overflow-visible text-center text-[10px] whitespace-nowrap tabular-nums ${
              day.day === today ? 'font-medium text-neutral-800 dark:text-neutral-200' : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {dayAxisLabel(day.day, period)}
          </span>
        ))}
      </div>
    </section>
  )
}
