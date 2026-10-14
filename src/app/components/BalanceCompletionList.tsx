import { useId } from 'react'
import type { BalanceCompletion, LocalDay } from '../../core'
import { describeCompletedOn, describeCompletionsHeading, describeSharedCompletion } from '../balanceLabels'
import { describeCount } from '../chartLabels'
import type { ChartPiece } from '../chartPieces'

interface BalanceCompletionListProps {
  /** The piece pressed in the tasks legend, whose completions these are. */
  piece: ChartPiece
  /** Its completions in the period, in the order they are shown. */
  completions: readonly BalanceCompletion[]
  /** The period in a sentence: `today`, `this week`. */
  when: string
  /** Today, which a completion made on it is called. */
  today: LocalDay
}

/**
 * The tasks completed behind the piece pressed in the tasks legend (BAL-19),
 * under the tasks charts: each with the day it was completed on, what else it
 * was split with, and the part of it counted here. Only to read: a task is
 * ticked off or reopened in its list. A long list scrolls inside its own box.
 */
export function BalanceCompletionList({ piece, completions, when, today }: BalanceCompletionListProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
    >
      <h3 id={headingId} className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-[3px] ${piece.color.fill}`} />
        {describeCompletionsHeading(piece.label, when)}
      </h3>

      <ul
        aria-labelledby={headingId}
        className="-mx-2 flex max-h-80 flex-col overflow-y-auto overscroll-contain md:max-h-72"
      >
        {completions.map(({ task, day, amount, sharedWith }) => {
          const on = describeCompletedOn(day, today)
          const meta = sharedWith.length === 0 ? on : describeSharedCompletion(on, sharedWith.map(({ name }) => name))

          return (
            <li key={`${task.id}-${day}`} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-neutral-800 dark:text-neutral-200">{task.title}</span>
                <span className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">{meta}</span>
              </span>
              <span className="shrink-0 tabular-nums text-neutral-900 dark:text-neutral-100">{describeCount(amount)}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
