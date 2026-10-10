/**
 * The journal: what went well today, what was achieved, and what there is to be
 * grateful for — a few lines of each, written while the day is still fresh
 * (JRN-1).
 *
 * A line belongs to one local day and one of the three sections, written the
 * way a due date is (./day), so the 2nd stays the 2nd wherever it is read. Each
 * section asks for about five lines (`JOURNAL_GOAL`); that is something to aim
 * at, not a limit.
 *
 * The journal is a habit of noticing, not an archive: it keeps today and the
 * week before it, and lets go of the days before that (JRN-8). Which days are
 * kept follows from the day and now, as a task's time in the trash does
 * (./trash), so a page left open past midnight drops a day on its next render
 * and storage catches up the next time it loads.
 */

import { offsetDay, toLocalDay, type LocalDay } from './day'

/** The three things a day is written up by, in the order the page asks for them. */
export const JOURNAL_SECTIONS = ['good', 'achievements', 'gratitude'] as const

export type JournalSection = (typeof JOURNAL_SECTIONS)[number]

export type JournalEntryId = string

export interface JournalEntry {
  readonly id: JournalEntryId
  /** The local day it is written about. */
  readonly day: LocalDay
  readonly section: JournalSection
  /** What was written, on one line: `Coffee with Anna on the terrace`. */
  readonly text: string
  /** ISO 8601: when it was first written, which is its place among its section's lines. */
  readonly writtenAt: string
}

/** How many lines each section asks for (JRN-3): something to aim at, not a limit. */
export const JOURNAL_GOAL = 5

/** As long as a line can be: a sentence or two, not an essay. */
export const MAX_JOURNAL_TEXT_LENGTH = 200

/** How many days before today the journal keeps (JRN-8). */
export const JOURNAL_HISTORY_DAYS = 7

export class InvalidJournalTextError extends Error {
  constructor(text: string) {
    super(
      `"${text}" is not a journal line: it needs something written, of at most ${String(MAX_JOURNAL_TEXT_LENGTH)} characters.`,
    )
    this.name = 'InvalidJournalTextError'
  }
}

export function isJournalSection(value: unknown): value is JournalSection {
  return typeof value === 'string' && (JOURNAL_SECTIONS as readonly string[]).includes(value)
}

/** One line, its spaces — line breaks pasted in included — squeezed to one. */
function squeezed(text: string): string {
  return text.trim().replace(/\s+/gu, ' ')
}

/** Whether `text` can be a line: something other than space, short enough, once squeezed. */
export function isJournalText(text: string): boolean {
  const line = squeezed(text)
  return line.length > 0 && line.length <= MAX_JOURNAL_TEXT_LENGTH
}

/** The stored form of a line: on one line, its spaces squeezed. Throws on one that cannot be a line. */
export function normalizeJournalText(text: string): string {
  if (!isJournalText(text)) throw new InvalidJournalTextError(text)
  return squeezed(text)
}

/** A new line of `section` about `day`, placed after every line written before it. */
export function createJournalEntry(section: JournalSection, text: string, day: LocalDay, now: Date = new Date()): JournalEntry {
  return {
    id: crypto.randomUUID(),
    day,
    section,
    text: normalizeJournalText(text),
    writtenAt: now.toISOString(),
  }
}

/**
 * The line with `text` instead. Its place stays where it was written; the very
 * same line comes back when nothing changed, so storage writes nothing for it.
 */
export function changeJournalText(entry: JournalEntry, text: string): JournalEntry {
  const changed = normalizeJournalText(text)
  return changed === entry.text ? entry : { ...entry, text: changed }
}

/** The lines of one section of one day, in the order they were written. */
export function journalLines(entries: readonly JournalEntry[], day: LocalDay, section: JournalSection): JournalEntry[] {
  return entries
    .filter((entry) => entry.day === day && entry.section === section)
    .sort((a, b) => a.writtenAt.localeCompare(b.writtenAt) || a.id.localeCompare(b.id))
}

/** The earliest day the journal still keeps at `now`: a week before today (JRN-8). */
export function firstKeptJournalDay(now: Date): LocalDay {
  return offsetDay(toLocalDay(now), -JOURNAL_HISTORY_DAYS)
}

/** Whether a line is still kept at `now`, its day not having fallen out of the week (JRN-8). */
export function isJournalEntryKept(entry: JournalEntry, now: Date): boolean {
  return entry.day >= firstKeptJournalDay(now)
}

/** One day gone by, as the history shows it: each section's lines, in the order they were written. */
export interface JournalDay {
  readonly day: LocalDay
  readonly sections: Readonly<Record<JournalSection, readonly JournalEntry[]>>
}

/**
 * The week before today, latest day first (JRN-6): the days with anything
 * written, each with its sections' lines. Today is not in it — it is the page
 * itself — and neither is anything older than the journal keeps.
 */
export function journalHistory(entries: readonly JournalEntry[], now: Date): JournalDay[] {
  const today = toLocalDay(now)
  const days: JournalDay[] = []
  for (let back = 1; back <= JOURNAL_HISTORY_DAYS; back += 1) {
    const day = offsetDay(today, -back)
    const sections = Object.fromEntries(
      JOURNAL_SECTIONS.map((section) => [section, journalLines(entries, day, section)]),
    ) as Record<JournalSection, JournalEntry[]>
    if (JOURNAL_SECTIONS.some((section) => sections[section].length > 0)) days.push({ day, sections })
  }
  return days
}
