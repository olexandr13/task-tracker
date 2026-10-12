import type { Note } from '../core'
import { createLocalCollection } from './localCollection'
import type { NoteRepository } from './noteRepository'
import { readNote, toStoredNote } from './noteSchema'

const STORAGE_KEY = 'task-tracker/guest/notes'

const collection = createLocalCollection<Note>({
  key: STORAGE_KEY,
  read: readNote,
  write: toStoredNote,
  idOf: (note) => note.id,
})

/** The guest's notes in this browser — never leave the device. */
export function createLocalNoteRepository(): NoteRepository {
  return {
    subscribe(onNotes, onError) {
      return collection.subscribe(onNotes, onError)
    },

    async save({ saved, removed }) {
      collection.apply(saved, removed)
    },
  }
}

export function loadGuestNotes(): Note[] {
  return collection.load()
}

export function clearGuestNotes(): void {
  collection.clear()
}
