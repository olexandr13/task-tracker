/**
 * Notes: text kept for its own sake — an idea, the films to watch, what the
 * dentist said — beside the tasks rather than on any one of them (NOTE-1).
 *
 * A note is one piece of text, written down the way a task's description is:
 * bold, italic and lists carried in it as Markdown (./emphasis,
 * ./descriptionLists), so it stays ordinary text whatever it holds and nothing
 * saved has to change shape for it. It has no title of its own: its first line
 * is what it is known by (`noteFirstLine`), as a note on paper is.
 *
 * Notes are listed newest first, by when each was first written, so changing
 * one never moves it out from under the eye (NOTE-2).
 */

import { parseDescription } from './descriptionLists'

export type NoteId = string

export interface Note {
  readonly id: NoteId
  /** What is written, trimmed at the ends, with its emphasis and lists as Markdown. Never blank. */
  readonly text: string
  /** ISO 8601: when it was first written, which is its place among the notes. */
  readonly createdAt: string
  /** ISO 8601: when what it says last changed — when it was first written, until then. */
  readonly updatedAt: string
}

export class InvalidNoteTextError extends Error {
  constructor() {
    super('A note needs something written in it.')
    this.name = 'InvalidNoteTextError'
  }
}

/**
 * Whether `text` says nothing: no words, whatever markers it holds. A list
 * started and never written in is blank, though its marker is a character —
 * a note of an empty bullet is a note of nothing (NOTE-4).
 */
export function isBlankNoteText(text: string): boolean {
  return parseDescription(text).every((block) => block.lines.every((line) => line.every((span) => span.text.trim() === '')))
}

/** The stored form of what a note says: trimmed at the ends. Throws on one that says nothing. */
export function normalizeNoteText(text: string): string {
  if (isBlankNoteText(text)) throw new InvalidNoteTextError()
  return text.trim()
}

/** A new note saying `text`. */
export function createNote(text: string, now: Date = new Date()): Note {
  const at = now.toISOString()
  return { id: crypto.randomUUID(), text: normalizeNoteText(text), createdAt: at, updatedAt: at }
}

/**
 * The note saying `text` instead, and when it was changed. The very same note
 * comes back when nothing changed, so storage writes nothing for it. Its place
 * among the notes stays where it was (NOTE-2).
 */
export function changeNoteText(note: Note, text: string, now: Date = new Date()): Note {
  const changed = normalizeNoteText(text)
  return changed === note.text ? note : { ...note, text: changed, updatedAt: now.toISOString() }
}

/** The notes in the order they are listed: newest first, by when each was first written (NOTE-2). */
export function sortNotes(notes: readonly Note[]): Note[] {
  return [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
}

/** The first line of a note that has words on it, as plain words: what the note is known by. */
export function noteFirstLine(text: string): string {
  for (const block of parseDescription(text)) {
    for (const line of block.lines) {
      const words = line.map((span) => span.text).join('').trim()
      if (words !== '') return words
    }
  }
  return ''
}
