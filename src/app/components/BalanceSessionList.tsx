import { useId } from 'react'
import type { BalanceSession } from '../../core'
import { describeSessionsHeading, describeSharedSession, STRAIGHT_SESSION } from '../balanceLabels'
import type { ChartPiece } from '../chartPieces'
import { describeLoggedAt, describeSessionLength } from '../durationLabels'

interface BalanceSessionListProps {
  /** The piece pressed in the legend, whose sessions these are. */
  piece: ChartPiece
  /** Its sessions in the period, in the order they are shown. */
  sessions: readonly BalanceSession[]
  /** The period in a sentence: `today`, `this week`. */
  when: string
  /** The moment they are read for, to say when each was logged. */
  now: Date
}

/**
 * The sessions behind the piece pressed in the legend (BAL-16), under the
 * charts: each with the task it was logged on, or that it was logged straight
 * to the category; when it was logged, and what else it was split with; its
 * comment; and the part of it counted here. Only to read: a session is taken
 * back where it was logged. A long list scrolls inside its own box.
 */
export function BalanceSessionList({ piece, sessions, when, now }: BalanceSessionListProps) {
  const headingId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
    >
      <h3 id={headingId} className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-[3px] ${piece.color.fill}`} />
        {describeSessionsHeading(piece.label, when)}
      </h3>

      <ul
        aria-labelledby={headingId}
        className="-mx-2 flex max-h-80 flex-col overflow-y-auto overscroll-contain md:max-h-72"
      >
        {sessions.map(({ entry, task, seconds, sharedWith }) => {
          const at = describeLoggedAt(entry.loggedAt, now)
          const meta =
            sharedWith.length === 0
              ? at
              : `${at} · ${describeSharedSession(describeSessionLength(entry.seconds), sharedWith.map(({ name }) => name))}`

          return (
            <li key={`${task?.id ?? 'straight'}-${entry.id}`} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-neutral-800 dark:text-neutral-200">{task?.title ?? STRAIGHT_SESSION}</span>
                <span className="text-xs text-neutral-500 tabular-nums dark:text-neutral-400">{meta}</span>
                {entry.comment !== null && (
                  <span className="text-xs break-words text-neutral-700 dark:text-neutral-300">{entry.comment}</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-neutral-900 dark:text-neutral-100">
                {describeSessionLength(seconds)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
