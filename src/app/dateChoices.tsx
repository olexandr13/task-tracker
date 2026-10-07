import type { ReactNode } from 'react'
import {
  dueAgainOn,
  isComplete,
  isPickable,
  isSkippedToday,
  nextWeekDueDay,
  offsetDay,
  repeatsEveryDay,
  toLocalDay,
  type LocalDay,
  type PickableDays,
  type Repeat,
  type Task,
} from '../core'
import { CalendarPickIcon } from './components/CalendarPickIcon'
import { CalendarRemoveIcon } from './components/CalendarRemoveIcon'
import { NextWeekIcon } from './components/NextWeekIcon'
import { SkipIcon } from './components/SkipIcon'
import { SunIcon } from './components/SunIcon'
import { SunriseIcon } from './components/SunriseIcon'
import { describeShortDate } from './dueLabels'

/** A quick date choice, drawn as an icon: its label is its name, and its tooltip unless it has a hint. */
export interface DateChoice {
  label: string
  icon: ReactNode
  /** The tooltip, where the label alone does not say which day the choice leads to. */
  hint?: string
  /** For a day to set: whether it is the day already set. For the skip, whether today is skipped. Left out for an action. */
  checked?: boolean
  onSelect: () => void
}

/** Skipping a repeating task's occurrence: the day that moves it on to, and doing it. */
export interface SkipChoice {
  to: LocalDay
  onSkip: () => void
}

interface DateChoicesOptions {
  /**
   * The day the task is due — a one-off's date, or the day a repeating task's
   * rule gives it (`dueDay`) — which is the one marked as chosen. A skip moves
   * the task on to the rule's next day (RPT-34), so the mark moves with it.
   */
  due: LocalDay | null
  /**
   * A one-off's own date, which **Remove date** takes away; null where there is
   * none to take. A repeating task's day comes from its rule, so it has nothing
   * here to remove.
   */
  scheduled: LocalDay | null
  now: Date
  /** The task's rule, or null for a one-off: what a day picked does to it, which each day's tooltip says. */
  rule: Repeat | null
  /** The days that can be picked (`pickableDays`), or null where none can (DUE-27). */
  pickable: PickableDays | null
  /** Left out where there is no occurrence to skip. */
  skip?: SkipChoice
  /** Taking back a habit's rest today (HAB-31): the skip, drawn as pressed. Left out unless today is a rest. */
  unskip?: () => void
  onChange: (day: LocalDay | null) => void
  /** Asking for any other day than the quick ones. Left out where a calendar is on show already. */
  onSelectDate?: () => void
}

/**
 * What picking a day does to a habit whose first day has yet to go by: it is
 * the day its rule starts on (DUE-18). Said in the tooltip of every day there is
 * to pick — these choices and the calendar's own days (DUE-12).
 */
export const STARTS_REPEAT = 'Starts the repeat'

/**
 * What picking a day does to any other repeating task: the occurrence in play
 * is due on it instead of its own day, and the rule carries on after it (DUE-18).
 */
export const THIS_TIME_ONLY = 'This time only'

/** What a day picked does beyond setting it, said in each day's tooltip; nothing for a one-off. */
export function dayHint(rule: Repeat | null): string | undefined {
  if (rule === null) return undefined
  return repeatsEveryDay(rule) ? STARTS_REPEAT : THIS_TIME_ONLY
}

/**
 * The quick date choices, the same wherever a day is set — a task's menu and the
 * date panel: today, tomorrow, next week, skipping a repeating task's occurrence,
 * any other day where there is no calendar beside them, and taking the day away.
 * A tooltip is a few words: the day is spelled out only where the name does not
 * already say it, and on a repeating task every day says what it does to the
 * rule, since the menu and the row's strip have no panel note to say it once.
 *
 * A day is offered only where it can be picked (DUE-27), so nothing here is a
 * button that does nothing: a habit that has begun offers its skip alone, and a
 * repeating task done for now offers nothing at all.
 *
 * The day marked is the one the task is due on, so it says the same as the
 * schedule button does.
 */
export function dateChoices({
  due,
  scheduled,
  now,
  rule,
  pickable,
  skip,
  unskip,
  onChange,
  onSelectDate,
}: DateChoicesOptions): DateChoice[] {
  const today = toLocalDay(now)
  const suffix = dayHint(rule)
  const day = (label: string, icon: ReactNode, choice: LocalDay, hint?: string): DateChoice[] =>
    isPickable(pickable, choice)
      ? [
          {
            label,
            icon,
            // Only a day says what it does to the rule: skipping moves the task on
            // inside it, and Select date opens the panel rather than choosing yet.
            hint: suffix === undefined ? hint : `${hint ?? label} · ${suffix}`,
            checked: choice === due,
            onSelect: () => { onChange(choice) },
          },
        ]
      : []
  const nextWeek = nextWeekDueDay(now)

  return [
    ...day('Today', <SunIcon />, today),
    ...day('Tomorrow', <SunriseIcon />, offsetDay(today, 1)),
    ...day('Next week', <NextWeekIcon />, nextWeek, `Next week · ${describeShortDate(nextWeek, now)}`),
    ...(unskip !== undefined
      ? [{ label: 'Skipped', icon: <SkipIcon />, hint: 'Skipped today · Take it back', checked: true, onSelect: unskip }]
      : skip !== undefined
        ? [
            {
              label: 'Skip occurrence',
              icon: <SkipIcon />,
              hint: `Skip to ${describeShortDate(skip.to, now)}`,
              onSelect: skip.onSkip,
            },
          ]
        : []),
    ...(onSelectDate === undefined || pickable === null
      ? []
      : [{ label: 'Select date', icon: <CalendarPickIcon />, onSelect: onSelectDate }]),
    ...(scheduled === null || rule !== null
      ? []
      : [{ label: 'Remove date', icon: <CalendarRemoveIcon />, onSelect: () => { onChange(null) } }]),
  ]
}

/**
 * Whether a habit is resting today (HAB-31): its Date row then offers the skip
 * pressed, which takes the rest back, rather than a day — picking one would
 * start it again and wipe its record (DUE-27). A rule with gaps takes today
 * back by picking it (DUE-26), so this is a habit's alone.
 */
export function restsToday(task: Task, now: Date): boolean {
  return task.repeat !== null && repeatsEveryDay(task.repeat) && !isComplete(task, now) && isSkippedToday(task, now)
}

/**
 * What the schedule says in place of a calendar where a repeating task has no
 * day to pick (DUE-27): why, and what there is to do instead. Nothing where a
 * day can be picked.
 */
export function noDayNote(task: Task, pickable: PickableDays | null, now: Date): string | undefined {
  if (pickable !== null || task.repeat === null) return undefined

  if (repeatsEveryDay(task.repeat)) {
    if (isComplete(task, now)) return 'Done for today. A habit is due every day, so there is no other day to move it to.'
    if (isSkippedToday(task, now)) return 'Today is a rest. A habit is due every day, so press "Skipped" to take the rest back.'
    return 'A habit is due every day, so there is no other day to move it to. Use "Skip" to rest today.'
  }

  const again = dueAgainOn(task, now)
  if (again === null) return 'Done for now.'
  const when = again === offsetDay(toLocalDay(now), 1) ? 'tomorrow' : `on ${describeShortDate(again, now)}`
  return `Done for now. It is due again ${when}, and can be moved once it is to do.`
}

/**
 * What the calendar says when a day it shows cannot be picked (DUE-27): a day
 * gone by, or one past the day before the rule comes round again — pointing to
 * the skip where there is one to press, which the add row has not.
 */
export function refusedDayNote(pickable: PickableDays | null, day: LocalDay, now: Date, canSkip: boolean): string {
  if (pickable?.first != null && day < pickable.first) {
    return 'Pick today or a later day. A repeating task cannot be due on a day that has gone by.'
  }

  const next = pickable?.last == null ? null : offsetDay(pickable.last, 1)
  if (next === null) return 'This day cannot be picked.'

  const before = `The next one is due on ${describeShortDate(next, now)}, so pick a day before then.`
  return canSkip ? `${before} To pass this one over, use "Skip".` : before
}
