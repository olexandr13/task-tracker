import {
  JOURNAL_GOAL,
  JOURNAL_HISTORY_DAYS,
  offsetDay,
  startOfLocalDay,
  toLocalDay,
  type JournalEntry,
  type JournalSection,
  type LocalDay,
} from '../core'

/**
 * How the journal reads (JRN-1). The rules live in ../core/journal; wording is
 * presentation, so it stays here.
 */

export const JOURNAL_HEADING = 'Journal'

/** What the page is for and how it is used, in plain sentences, one thing each (UI-73). */
export const JOURNAL_INTRO = [
  'Write down what went well today, what you achieved, and what you are grateful for.',
  `Aim for ${String(JOURNAL_GOAL)} of each. Fewer is fine, and so is more: a new line is always waiting under the last one.`,
  'Type on a line and press Enter to go on to the next. Clicking away keeps what you typed.',
  'Press a line to change it. Empty it, or press its "×", to delete it.',
  `The journal keeps today and the ${String(JOURNAL_HISTORY_DAYS)} days before it, and deletes older days. Press "Show the last ${String(JOURNAL_HISTORY_DAYS)} days" to read them.`,
] as const

interface SectionLabels {
  /** The card's heading. */
  readonly title: string
  /** Its heading on a day gone by, where "today" would not be true. */
  readonly pastTitle: string
  /** Worn before the heading, as a mode wears its glyph. */
  readonly emoji: string
  /** What one line of it is called, numbered for a screen reader: `Good thing 2`. */
  readonly line: string
  /** The empty line waiting for the next one, as its name and its placeholder. */
  readonly add: string
  readonly placeholder: string
}

export const JOURNAL_SECTION_LABELS: Readonly<Record<JournalSection, SectionLabels>> = {
  good: {
    title: 'Good things today',
    pastTitle: 'Good things',
    emoji: '☀️',
    line: 'Good thing',
    add: 'Add a good thing',
    placeholder: 'Something good that happened',
  },
  achievements: {
    title: 'Achievements',
    pastTitle: 'Achievements',
    emoji: '🏆',
    line: 'Achievement',
    add: 'Add an achievement',
    placeholder: 'Something you got done',
  },
  gratitude: {
    title: 'Gratitude',
    pastTitle: 'Gratitude',
    emoji: '🙏',
    line: 'Gratitude',
    add: 'Add something you’re grateful for',
    placeholder: 'Something you’re grateful for',
  },
}

/** How far a section has come towards its lines (JRN-3), for a screen reader: `3 of 5 written`. */
export function describeGoal(count: number): string {
  return count >= JOURNAL_GOAL
    ? `${String(count)} written, ${String(JOURNAL_GOAL)} reached`
    : `${String(count)} of ${String(JOURNAL_GOAL)} written`
}

const todayFormat = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' })
const dayFormat = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })

/** The day the page is writing about, under its heading: `Saturday, October 10`. */
export function describeToday(now: Date): string {
  return todayFormat.format(now)
}

/** A day of the history (JRN-6): `Yesterday`, `Thu, Oct 8`. */
export function describeJournalDay(day: LocalDay, now: Date): string {
  if (day === offsetDay(toLocalDay(now), -1)) return 'Yesterday'
  return dayFormat.format(startOfLocalDay(day))
}

/** The button that shows the week gone by and puts it away again (JRN-6). */
export const HISTORY_TOGGLE = {
  show: `Show the last ${String(JOURNAL_HISTORY_DAYS)} days`,
  hide: `Hide the last ${String(JOURNAL_HISTORY_DAYS)} days`,
} as const

export const NOTHING_IN_HISTORY = `Nothing written in the last ${String(JOURNAL_HISTORY_DAYS)} days.`

/** As much of a line as a toast has room for. */
const SHORT_LINE = 40

/** What the undo toast says of a line deleted (JRN-5): `Deleted “Coffee with Anna”`. */
export function describeLineDeleted(entry: JournalEntry): string {
  const text = entry.text.length <= SHORT_LINE ? entry.text : `${entry.text.slice(0, SHORT_LINE - 1).trimEnd()}…`
  return `Deleted “${text}”`
}
