import type { Repeat, Weekday } from '../core'

/**
 * What the repeat picker holds while the owner is still choosing. It keeps the
 * weekday and month-day choices alive even when "Once" is selected, so flipping
 * between kinds doesn't lose them; ../core only ever sees the finished rule.
 */

export type RepeatKind = 'once' | 'daily' | 'weekly' | 'monthly'

export interface RepeatDraft {
  readonly kind: RepeatKind
  readonly weekdays: readonly Weekday[]
  readonly monthDay: number
}

/** A fresh draft repeats on whatever day it is being written on. */
export function emptyDraft(now: Date = new Date()): RepeatDraft {
  return { kind: 'once', weekdays: [now.getDay() as Weekday], monthDay: now.getDate() }
}

/** The rule a draft describes, or null when the task happens once. */
export function toRepeat(draft: RepeatDraft): Repeat | null {
  switch (draft.kind) {
    case 'once':
      return null
    case 'daily':
      return { kind: 'daily' }
    case 'weekly':
      return { kind: 'weekly', weekdays: [...draft.weekdays].sort((a, b) => a - b) }
    case 'monthly':
      return { kind: 'monthly', day: draft.monthDay }
  }
}

/** The draft that would produce this rule: how an existing task opens for editing. */
export function toDraft(repeat: Repeat | null, now: Date = new Date()): RepeatDraft {
  const blank = emptyDraft(now)
  if (repeat === null) return blank

  switch (repeat.kind) {
    case 'daily':
      return { ...blank, kind: 'daily' }
    case 'weekly':
      return { ...blank, kind: 'weekly', weekdays: repeat.weekdays }
    case 'monthly':
      return { ...blank, kind: 'monthly', monthDay: repeat.day }
  }
}
