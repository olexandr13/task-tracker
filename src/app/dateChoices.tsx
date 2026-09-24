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
  /**
   * The day the task carries itself: a one-off's date, or the day a repeating
   * task's rule starts on — `scheduledDay`. It is the one marked as chosen, and
   * the one **Remove date** (**Remove start date** on a repeating task) takes away.
   */
  chosen: LocalDay | null
  now: Date
  /**
   * Whether the task repeats: a day picked is the day its rule starts on rather
   * than a date of its own, which each day's tooltip says.
   */
  repeats: boolean
  /** Left out where there is no occurrence to skip. */
  skip?: SkipChoice
  onChange: (day: LocalDay | null) => void
  /** Asking for any other day than the quick ones. Left out where a calendar is on show already. */
  onSelectDate?: () => void
}

/**
 * What picking a day does to a repeating task, said in the tooltip of every day
 * there is to pick — these choices and the calendar's own days (DUE-12).
 */
export const STARTS_REPEAT = 'Starts the repeat'

/**
 * The quick date choices, the same wherever a day is set — a task's menu and the
 * date panel: today, tomorrow, next week, skipping a repeating task's occurrence,
 * any other day where there is no calendar beside them, and taking the day away.
 * A tooltip is a few words: the day is spelled out only where the name does not
 * already say it, and on a repeating task every day says that it starts the rule,
 * since the menu and the row's strip have no panel note to say it once.
 */
export function dateChoices({ chosen, now, repeats, skip, onChange, onSelectDate }: DateChoicesOptions): DateChoice[] {
  const today = toLocalDay(now)
  const day = (label: string, icon: ReactNode, choice: LocalDay, hint?: string): DateChoice => ({
    label,
    icon,
    // Only a day starts the rule: skipping moves the task on inside it, and
    // Select date opens the panel, whose note says it, rather than choosing yet.
    hint: repeats ? `${hint ?? label} · ${STARTS_REPEAT}` : hint,
    checked: choice === chosen,
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
    // On a repeating task what goes is the day its rule was told to start on —
    // the rule stays and runs from the day the task was written, as it did
    // before a day was picked — so the choice says which date it takes away.
    ...(chosen === null
      ? []
      : [
          {
            label: repeats ? 'Remove start date' : 'Remove date',
            icon: <CalendarRemoveIcon />,
            onSelect: () => { onChange(null) },
          },
        ]),
  ]
}
