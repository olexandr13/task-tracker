import { noteFirstLine, offsetDay, toLocalDay, type Note } from '../core'

/**
 * How the notes read (NOTE-1). The rules live in ../core/note; wording is
 * presentation, so it stays here.
 */

export const NOTES_HEADING = 'Notes'

/** What the page is for and how it is used, in plain sentences, one thing each (UI-73). */
export const NOTES_INTRO = [
  'Write down anything you want to keep: ideas, lists, things to remember.',
  'Press "New note" to start one. Click away from it, or press "Done", to save it.',
  'Press a note to change it. Press "Esc" while writing to drop the changes.',
  'Use the "B" and "I" buttons for bold and italic, and the list buttons for bullets and numbers.',
  'You can also type "- " or "1. " at the start of a line to start a list.',
  'Press a note’s "×", or empty it, to delete it. You can undo that for a few seconds.',
] as const

export const NEW_NOTE = 'New note'

export const NO_NOTES = 'No notes yet. Press "New note" to write your first one.'

/** The box a new note is written in, as its name and its placeholder. */
export const NEW_NOTE_BOX = 'New note'
export const NOTE_PLACEHOLDER = 'Write something…'

export const NOTE_DONE = 'Done'

/** How a note is named where it has to be named — a button, a box, the undo toast. */
export function describeNote(note: Note): string {
  const line = noteFirstLine(note.text)
  return line.length <= SHORT_LINE ? line : `${line.slice(0, SHORT_LINE - 1).trimEnd()}…`
}

/** As much of a note's first line as a toast or a button's name has room for. */
const SHORT_LINE = 40

/** Pressing a note at rest, which opens it to be changed (NOTE-5). */
export function describeEditNote(note: Note): string {
  return `Edit the note “${describeNote(note)}”`
}

/** The box a note is changed in. */
export function describeNoteBox(note: Note): string {
  return `Note “${describeNote(note)}”`
}

/** A note's ×. */
export function describeDeleteNote(note: Note): string {
  return `Delete the note “${describeNote(note)}”`
}

/** What the undo toast says of a note deleted (NOTE-6): `Deleted the note “Films to watch”`. */
export function describeNoteDeleted(note: Note): string {
  return `Deleted the note “${describeNote(note)}”`
}

const timeFormat = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })
const yearFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })

/**
 * When a note last changed, at the foot of its card (NOTE-2): the time for
 * today — `9:41 AM` — `Yesterday`, the day this year — `Oct 8` — and the year
 * as well before that.
 */
export function describeNoteTime(updatedAt: string, now: Date): string {
  const at = new Date(updatedAt)
  const day = toLocalDay(at)
  const today = toLocalDay(now)
  if (day === today) return timeFormat.format(at)
  if (day === offsetDay(today, -1)) return 'Yesterday'
  return at.getFullYear() === now.getFullYear() ? dayFormat.format(at) : yearFormat.format(at)
}

/** The formatting buttons over a note being written (NOTE-7): their names, with the key that does the same where there is one. */
export const FORMAT_LABELS = {
  bold: 'Bold',
  italic: 'Italic',
  bullets: 'Bulleted list',
  numbers: 'Numbered list',
} as const

export type FormatCommand = keyof typeof FORMAT_LABELS

/** The shortcut beside a button's name, as the keyboard it is pressed on spells it: `⌘B` on a Mac, `Ctrl+B` elsewhere. */
export function describeShortcut(key: string, mac: boolean): string {
  return mac ? `⌘${key}` : `Ctrl+${key}`
}
