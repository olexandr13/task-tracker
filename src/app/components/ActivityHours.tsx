import { useEffect, useRef } from 'react'
import {
  activityKey,
  entriesInSlot,
  isExpectedSlot,
  slotAt,
  sameSlot,
  type ActivityEntry,
  type HoursWindow,
  type LocalDay,
} from '../../core'
import { describeEntry, NOT_LOGGED } from '../activityLabels'
import type { ChartColor } from '../chartColors'
import { describeChartTime } from '../chartLabels'
import { describeHour, describeSlot } from '../checkInLabels'
import { deleteControl } from '../rowControls'
import { PlusIcon } from './PlusIcon'

const HOUR_SECONDS = 3600

const row = 'flex items-start gap-2 rounded-xl px-1.5 py-1.5 transition-colors'
const rowPicked = 'bg-blue-50 ring-1 ring-blue-300 ring-inset dark:bg-blue-500/10 dark:ring-blue-500/40'
const hourButton =
  'flex h-8 w-14 shrink-0 flex-col items-start justify-center rounded-lg px-1.5 text-left text-sm tabular-nums text-neutral-700 transition-colors hover:bg-neutral-100 active:bg-neutral-100 md:h-7 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:active:bg-neutral-800'
const chip =
  'flex max-w-full min-w-0 items-center rounded-full bg-neutral-100 text-sm text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
const chipEditing = 'ring-2 ring-blue-400 dark:ring-blue-500'
const chipText =
  'min-w-0 truncate rounded-full py-1 pr-1 pl-2.5 text-left transition-colors hover:text-neutral-950 md:py-0.5 dark:hover:text-white'
const addButton =
  'flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:h-7 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

interface ActivityHoursProps {
  /** For the button that lists more hours to name what it opens (ACT-20). */
  id: string
  day: LocalDay
  /** The hours listed, in clock order (`hoursOfDay`, with the one picked, and today's others so far on asking). */
  hours: readonly number[]
  /** The whole log; the day's records are read from it. */
  entries: readonly ActivityEntry[]
  window: HoursWindow
  now: Date
  /** Each activity's colour (ACT-16). */
  colors: ReadonlyMap<string, ChartColor>
  /** The hour the form is pointed at. */
  pickedHour: number
  /** The record being changed, marked where it is listed. */
  editingId: string | null
  onPickHour: (hour: number) => void
  onEdit: (entry: ActivityEntry) => void
  onRemove: (entry: ActivityEntry) => void
}

/**
 * The day hour by hour (ACT-7 to ACT-9): each hour with a bar of what filled it
 * — a full bar is the whole hour, and more than an hour says how much more —
 * the records logged under it, and its total. An hour meant to be logged with
 * nothing under it says so, and a press on its hour, or on its +, points the
 * form at it.
 *
 * A long day scrolls inside its own box rather than pushing the page down, and
 * the hour picked is kept in view in it — scrolled within the box alone, so the
 * page itself never moves for it.
 */
export function ActivityHours({
  id,
  day,
  hours,
  entries,
  window,
  now,
  colors,
  pickedHour,
  editingId,
  onPickHour,
  onEdit,
  onRemove,
}: ActivityHoursProps) {
  const current = slotAt(now)
  const list = useRef<HTMLUListElement>(null)

  // Kept in view as it is picked, and as hours listed above it come and go (ACT-20).
  useEffect(() => {
    const box = list.current
    const row = box?.querySelector<HTMLElement>('[data-picked="true"]')
    if (box === null || row === null || row === undefined) return
    // Offsets are from the list itself, which is what it is positioned against.
    if (row.offsetTop < box.scrollTop) box.scrollTop = row.offsetTop
    else if (row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = row.offsetTop + row.offsetHeight - box.clientHeight
    }
  }, [day, pickedHour, hours.length])

  return (
    <ul
      ref={list}
      id={id}
      aria-label="Hours"
      className="relative -mx-1 flex max-h-[min(26rem,60dvh)] flex-col gap-0.5 overflow-y-auto overscroll-y-contain px-1 py-0.5"
    >
      {hours.map((hour) => {
        const slot = { day, hour }
        const logged = entriesInSlot(entries, slot)
        const seconds = logged.reduce((sum, entry) => sum + entry.seconds, 0)
        const over = seconds - HOUR_SECONDS
        const picked = hour === pickedHour
        const isNow = sameSlot(slot, current)

        return (
          <li key={hour} data-picked={picked} className={`${row}${picked ? ` ${rowPicked}` : ''}`}>
            <button
              type="button"
              onClick={() => { onPickHour(hour) }}
              aria-pressed={picked}
              aria-label={`Log into ${describeSlot(slot)}`}
              title={`Log into ${describeSlot(slot)}`}
              className={hourButton}
            >
              <span className="leading-4">{describeHour(hour)}</span>
              {isNow && <span className="text-[10px] leading-3 font-medium text-blue-600 dark:text-blue-400">now</span>}
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1.5">
              <HourBar entries={logged} colors={colors} />

              {logged.length === 0 ? (
                <div className="flex min-h-7 items-center justify-between gap-2">
                  <span className="text-sm text-neutral-400 dark:text-neutral-500">
                    {isExpectedSlot(window, slot) ? NOT_LOGGED : 'nothing logged'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { onPickHour(hour) }}
                    aria-label={`Log into ${describeSlot(slot)}`}
                    className={addButton}
                  >
                    <PlusIcon className="size-3.5" />
                    Log
                  </button>
                </div>
              ) : (
                <ul aria-label={`Logged ${describeSlot(slot)}`} className="flex flex-wrap gap-1">
                  {logged.map((entry) => (
                    <li key={entry.id} className={`${chip}${entry.id === editingId ? ` ${chipEditing}` : ''}`}>
                      <span
                        aria-hidden="true"
                        className={`ml-2 size-2 shrink-0 rounded-[2px] ${colors.get(activityKey(entry.activity))?.fill ?? ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => { onEdit(entry) }}
                        aria-label={`Change “${describeEntry(entry)}”`}
                        title="Change it"
                        className={chipText}
                      >
                        {describeEntry(entry)}
                      </button>
                      <button
                        type="button"
                        onClick={() => { onRemove(entry) }}
                        aria-label={`Delete “${describeEntry(entry)}”`}
                        title="Delete it"
                        className={`mr-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-base leading-none md:size-5 ${deleteControl}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <span className="w-14 shrink-0 pt-1.5 text-right text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
              {seconds === 0 ? '' : describeChartTime(seconds)}
              {over > 0 && (
                <span className="block text-[11px] leading-3 text-amber-700 dark:text-amber-400">
                  +{describeChartTime(over)}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** What filled an hour, as a bar the hour long: each record its own piece, in its activity's colour (ACT-8). */
function HourBar({ entries, colors }: { entries: readonly ActivityEntry[]; colors: ReadonlyMap<string, ChartColor> }) {
  // Each record as much of the hour as is left once those before it are drawn.
  const pieces = entries.reduce<{ entry: ActivityEntry; shown: number }[]>((drawn, entry) => {
    const before = drawn.reduce((sum, piece) => sum + piece.shown, 0)
    return [...drawn, { entry, shown: Math.max(0, Math.min(entry.seconds, HOUR_SECONDS - before)) }]
  }, [])

  return (
    <div aria-hidden="true" className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
      {pieces
        .filter(({ shown }) => shown > 0)
        .map(({ entry, shown }) => (
          <span
            key={entry.id}
            className={`h-full ${colors.get(activityKey(entry.activity))?.fill ?? ''}`}
            style={{ width: `${String((shown / HOUR_SECONDS) * 100)}%` }}
          />
        ))}
    </div>
  )
}
