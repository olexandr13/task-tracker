import { useEffect, useId, useRef, useState } from 'react'
import {
  activityByDay,
  activityKinds,
  activityPeriodDays,
  activityTotals,
  daysLoggedInFull,
  defaultLogSlot,
  fullyLoggedStreak,
  hoursOfDay,
  knownActivities,
  loggedHours,
  shiftActivityPeriod,
  toLocalDay,
  type ActivityChange,
  type ActivityEntry,
  type ActivityPeriod,
  type HourSlot,
  type HoursWindow,
  type LocalDay,
} from '../../core'
import {
  ACTIVITY_HEADING,
  ACTIVITY_INTRO,
  describeDaysInFull,
  describeLoggedHours,
  describeNothingLogged,
  describePeriodInSentence,
  describePeriodTitle,
  describeStreak,
  isCurrentPeriod,
  PERIOD_CHOICES,
} from '../activityLabels'
import { activityColors, activityPieces } from '../activityPieces'
import type { ModeState } from '../modes'
import { ActivityForm } from './ActivityForm'
import { ActivityHours } from './ActivityHours'
import { ChevronIcon } from './ChevronIcon'
import { DayColumnsChart } from './DayColumnsChart'
import { InfoButton } from './InfoButton'
import { ModeRow } from './ModesPage'
import { TimeSplitChart } from './TimeSplitChart'

const card = 'rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
const stepper =
  'flex size-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:size-7 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

/** A segment of the period control; its radio is the one it wears the focus ring for (as on Balance). */
const segment =
  'flex min-h-10 cursor-pointer items-center justify-center rounded-md px-3 text-sm text-neutral-500 transition-colors outline-offset-2 hover:text-neutral-900 has-checked:bg-white has-checked:font-medium has-checked:text-neutral-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-blue-500 md:min-h-8 dark:text-neutral-400 dark:hover:text-neutral-100 dark:has-checked:bg-neutral-700 dark:has-checked:text-neutral-100'

/** What the day-by-day chart says before a day is pointed at, where pressing one opens it (ACT-14). */
const OPEN_DAY_HINT = 'Point at a day to see how its time divided, or press it to open it.'

interface ActivityPageProps {
  entries: readonly ActivityEntry[]
  /** The hours meant to be logged — the check-in's, whether or not it is on (ACT-17). */
  window: HoursWindow
  now: Date
  /** The check-in, as the Modes pages read it, for its row at the head of the page (ACT-19). */
  checkIn: ModeState
  /** The hour to open on — the one a check-in asked about — or null for today as it stands. */
  initialSlot: HourSlot | null
  onAdd: (activity: string, seconds: number, slot: HourSlot) => void
  onChange: (id: string, change: ActivityChange) => void
  onRemove: (entry: ActivityEntry) => void
  onOpenCheckIn: () => void
}

/**
 * The activity log (ACT-1): what was done, hour by hour, and what it adds up to
 * over a day, a week or a month. The day is the log itself — the hours and what
 * is logged under each, and the form to add to them; a week or a month is its
 * totals and its days side by side, a day's column opening that day.
 *
 * Which period is shown is not kept: the page opens on today, the day being
 * logged (ACT-12).
 */
export function ActivityPage({
  entries,
  window,
  now,
  checkIn,
  initialSlot,
  onAdd,
  onChange,
  onRemove,
  onOpenCheckIn,
}: ActivityPageProps) {
  const today = toLocalDay(now)
  const [period, setPeriod] = useState<ActivityPeriod>('day')
  const [anchor, setAnchor] = useState<LocalDay>(initialSlot?.day ?? today)
  const [pickedHour, setPickedHour] = useState<number | null>(initialSlot?.hour ?? null)
  const [editing, setEditing] = useState<ActivityEntry | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const [pointed, setPointed] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const form = useRef<HTMLDivElement>(null)
  const headingId = useId()
  // Asks for the form to be brought into view with the caret in it — once the
  // render that points it at its hour or record is on screen, since a record
  // being changed starts a form of its own.
  const [focusAsked, setFocusAsked] = useState(0)

  useEffect(() => {
    if (focusAsked === 0) return
    const element = form.current
    if (element !== null && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
    input.current?.focus()
  }, [focusAsked])

  const kinds = activityKinds(entries)
  const colors = activityColors(kinds)
  const days = activityPeriodDays(period, anchor)
  const totals = activityTotals(entries, kinds, days[0], days[days.length - 1])
  const pieces = activityPieces(totals, colors)
  const wanted = pointed ?? pinned
  const active = pieces.some((piece) => piece.key === wanted) ? wanted : null
  const streak = fullyLoggedStreak(entries, window, now)

  // A record being changed that is gone — deleted here or on another device — is no longer being changed.
  const changing = editing === null ? null : (entries.find((entry) => entry.id === editing.id) ?? null)
  // The hour picked in the list — while a record is changed, the one it is moved to (ACT-10).
  const hour = pickedHour ?? changing?.hour ?? defaultLogSlot(entries, window, anchor, now).hour
  const hours = [...new Set([...hoursOfDay(entries, window, anchor, now), hour])].sort((a, b) => a - b)

  function show(nextPeriod: ActivityPeriod, nextAnchor: LocalDay) {
    setPeriod(nextPeriod)
    if (nextAnchor !== anchor) {
      setAnchor(nextAnchor)
      setPickedHour(null)
      setEditing(null)
    }
  }

  /**
   * Points the form at the hour, and brings it into view with the caret in it.
   * While a record is being changed, it is moved there instead (ACT-10).
   */
  function pickHour(next: number) {
    setPickedHour(next)
    setFocusAsked((asked) => asked + 1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5">
        <h2 className="text-lg leading-6 text-neutral-900 dark:text-neutral-100">{ACTIVITY_HEADING}</h2>
        <InfoButton label={ACTIVITY_HEADING}>
          {ACTIVITY_INTRO.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </InfoButton>
      </div>

      <ModeRow mode={checkIn} onOpen={onOpenCheckIn} />

      <section aria-labelledby={headingId} className={`${card} flex flex-col gap-3 px-4 py-3.5`}>
        <h2 id={headingId} className="sr-only">
          Time spent
        </h2>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div
            role="radiogroup"
            aria-label="Period"
            className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-100 p-1 md:w-72 dark:bg-neutral-800"
          >
            {PERIOD_CHOICES.map((choice) => (
              <label key={choice.period} className={segment}>
                <input
                  type="radio"
                  name="activity-period"
                  value={choice.period}
                  checked={period === choice.period}
                  onChange={() => { show(choice.period, anchor) }}
                  className="sr-only"
                />
                {choice.label}
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between gap-1 md:justify-end">
            <button
              type="button"
              onClick={() => { show(period, shiftActivityPeriod(period, anchor, -1)) }}
              aria-label={`The ${period} before`}
              title={`The ${period} before`}
              className={stepper}
            >
              <ChevronIcon className="size-4 rotate-90" />
            </button>
            <span aria-live="polite" className="min-w-36 text-center text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {describePeriodTitle(period, anchor, now)}
            </span>
            {/* Nothing is logged ahead of today, so there is no further to go once there. */}
            <button
              type="button"
              onClick={() => { show(period, shiftActivityPeriod(period, anchor, 1)) }}
              aria-label={`The ${period} after`}
              title={`The ${period} after`}
              className={`${stepper}${isCurrentPeriod(period, anchor, now) ? ' invisible' : ''}`}
            >
              <ChevronIcon className="size-4 -rotate-90" />
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {period === 'day'
            ? describeLoggedHours(loggedHours(entries, window, anchor, now))
            : describeDaysInFull(daysLoggedInFull(entries, window, days, now))}
          {' · '}
          {describeStreak(streak)}
        </p>

        {totals.total === 0 ? (
          <p className="py-2 text-sm text-neutral-500 dark:text-neutral-400">{describeNothingLogged(period, anchor, now)}</p>
        ) : (
          <>
            <TimeSplitChart
              pieces={pieces}
              total={totals.total}
              when={describePeriodInSentence(period, anchor, now)}
              active={active}
              pinned={pinned}
              onPin={(key) => { setPinned(pinned === key ? null : key) }}
              onPreview={setPointed}
            />

            {period !== 'day' && (
              <DayColumnsChart
                // Keyed by the period shown, so a day chosen in one is not looked for in another.
                key={`${period}-${days[0]}`}
                columns={activityByDay(entries, kinds, days).map((day) => ({
                  day: day.day,
                  total: day.total,
                  pieces: activityPieces(day, colors),
                }))}
                period={period}
                today={today}
                active={active}
                hint={OPEN_DAY_HINT}
                onOpenDay={(day) => { show('day', day) }}
              />
            )}
          </>
        )}
      </section>

      {period === 'day' && (
        <section aria-label="The day, hour by hour" className={`${card} flex flex-col gap-3 px-3 py-3 md:px-4`}>
          <div ref={form}>
            <ActivityForm
              // Keyed by the record being changed, so the boxes start from it — or empty for a new one.
              key={changing?.id ?? `new-${anchor}`}
              day={anchor}
              hour={hour}
              now={now}
              known={knownActivities(entries, now)}
              editing={changing}
              onAdd={(activity, seconds, at) => { onAdd(activity, seconds, { day: anchor, hour: at }) }}
              onSave={(id, change) => {
                onChange(id, change)
                setPickedHour(change.hour)
                setEditing(null)
              }}
              onDelete={(entry) => {
                setEditing(null)
                onRemove(entry)
              }}
              onCancel={() => { setEditing(null) }}
              inputRef={input}
            />
          </div>

          <ActivityHours
            day={anchor}
            hours={hours}
            entries={entries}
            window={window}
            now={now}
            colors={colors}
            pickedHour={hour}
            editingId={changing?.id ?? null}
            onPickHour={pickHour}
            onEdit={(entry) => {
              setEditing(entry)
              setPickedHour(entry.hour)
              setFocusAsked((asked) => asked + 1)
            }}
            onRemove={(entry) => {
              if (editing?.id === entry.id) setEditing(null)
              onRemove(entry)
            }}
          />
        </section>
      )}
    </div>
  )
}
