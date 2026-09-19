import type { ReactNode } from 'react'
import { nextWeekDueDay, offsetDay, toLocalDay, type LocalDay } from '../core'
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
  /** For a day to set: whether it is the day already set. Left out for an action. */
  checked?: boolean
  onSelect: () => void
}

/** Skipping a repeating task's occurrence: the day that moves it on to, and doing it. */
export interface SkipChoice {
  to: LocalDay
  onSkip: () => void
}

interface DateChoicesOptions {
  /** The task's own day, or on a repeating task the day its rule gives it. */
  dueDate: LocalDay | null
  now: Date
  /**
   * Whether the task repeats: its day is the rule's, so none is marked as chosen,
   * there is no taking it away, and picking one ends the rule.
   */
  repeats: boolean
  /** Left out where there is no occurrence to skip. */
  skip?: SkipChoice
  onChange: (dueDate: LocalDay | null) => void
  /** Asking for any other day than the quick ones. Left out where a calendar is on show already. */
  onSelectDate?: () => void
}

/**
 * The quick date choices, the same wherever a day is set — a task's menu and the
 * date panel: today, tomorrow, next week, skipping a repeating task's occurrence,
 * any other day where there is no calendar beside them, and taking a one-off's
 * day away. A tooltip is a few words: the day is spelled out only where the name
 * does not already say it, and that a day ends a rule is left to the panel's note.
 */
export function dateChoices({ dueDate, now, repeats, skip, onChange, onSelectDate }: DateChoicesOptions): DateChoice[] {
  const today = toLocalDay(now)
  const day = (label: string, icon: ReactNode, choice: LocalDay, hint?: string): DateChoice => ({
    label,
    icon,
    hint,
    checked: !repeats && choice === dueDate,
    onSelect: () => { onChange(choice) },
  })
  const nextWeek = nextWeekDueDay(now)

  return [
    day('Today', <SunIcon />, today),
    day('Tomorrow', <SunriseIcon />, offsetDay(today, 1)),
    day('Next week', <NextWeekIcon />, nextWeek, `Next week · ${describeShortDate(nextWeek, now)}`),
    ...(skip === undefined
      ? []
      : [
          {
            label: 'Skip occurrence',
            icon: <SkipIcon />,
            hint: `Skip to ${describeShortDate(skip.to, now)}`,
            onSelect: skip.onSkip,
          },
        ]),
    ...(onSelectDate === undefined
      ? []
      : [{ label: 'Select date', icon: <CalendarPickIcon />, onSelect: onSelectDate }]),
    ...(repeats || dueDate === null
      ? []
      : [{ label: 'Remove date', icon: <CalendarRemoveIcon />, onSelect: () => { onChange(null) } }]),
  ]
}
