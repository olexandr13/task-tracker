// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { changeNoteText, createNote, sortNotes, type Note } from '../../core'
import { NotesPage } from './NotesPage'

/* The notes page. NOTE ids refer to wiki/notes.md. */

// Sunday 11 October 2026, a quarter to ten in the morning.
const NOW = new Date(2026, 9, 11, 9, 45)
const FILMS = createNote('Films to watch\n- *Heat*\n- **Alien**', new Date(2026, 9, 11, 9, 41))
const DENTIST = createNote('Dentist in May', new Date(2026, 9, 8, 18, 0))

/**
 * jsdom edits nothing itself: of the browser's editing commands, bold is given
 * the least of what a browser does — the selection wrapped in `<strong>` — and
 * every command asked for is kept, to say which the buttons asked for.
 */
let commands: string[] = []
beforeEach(() => {
  commands = []
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value(command: string) {
      commands.push(command)
      if (command !== 'bold') return false
      const range = window.getSelection()?.getRangeAt(0)
      if (range === undefined) return false
      range.surroundContents(document.createElement('strong'))
      return true
    },
  })
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(document, 'execCommand')
})

/** The page over notes of its own, the rules applied as the screen would apply them. */
function Notes({ initial = [], onRemove = vi.fn() }: { initial?: Note[]; onRemove?: (note: Note) => void }) {
  const [notes, setNotes] = useState(() => sortNotes(initial))
  return (
    <NotesPage
      notes={notes}
      now={NOW}
      onAdd={(text) => { setNotes((current) => sortNotes([...current, createNote(text, NOW)])) }}
      onChange={(id, text) => { setNotes((current) => current.map((note) => (note.id === id ? changeNoteText(note, text, NOW) : note))) }}
      onRemove={(note) => {
        onRemove(note)
        setNotes((current) => current.filter((other) => other.id !== note.id))
      }}
    />
  )
}

const cards = () => within(screen.getByRole('list', { name: 'Notes' })).getAllByRole('article')
const newNote = () => screen.getByRole('button', { name: 'New note' })

describe('NotesPage', () => {
  it('says there are none yet, and how to write one (NOTE-1)', () => {
    render(<Notes />)

    expect(screen.getByText('No notes yet. Press "New note" to write your first one.')).toBeDefined()
    expect(screen.queryByRole('list', { name: 'Notes' })).toBeNull()
  })

  it('lists the notes newest first, each reading as written, with when it last changed (NOTE-2, NOTE-8)', () => {
    render(<Notes initial={[DENTIST, FILMS]} />)

    const [films, dentist] = cards()
    expect(within(films).getByRole('button', { name: 'Edit the note “Films to watch”' })).toBeDefined()
    expect(films.querySelector('ul em')?.textContent).toBe('Heat')
    expect(films.querySelector('ul strong')?.textContent).toBe('Alien')
    expect(films.textContent).not.toContain('*')
    expect(films.textContent).toContain('9:41 AM')
    expect(dentist.textContent).toContain('Oct 8')
  })

  it('writes a new note, kept on Done, at the top of the list (NOTE-3)', async () => {
    const user = userEvent.setup()
    render(<Notes initial={[DENTIST]} />)

    await user.click(newNote())
    const box = screen.getByRole('textbox', { name: 'New note' })
    expect(document.activeElement).toBe(box)

    await user.keyboard('Call the bank')
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(cards().map((card) => card.textContent)).toEqual([
      expect.stringContaining('Call the bank'),
      expect.stringContaining('Dentist in May'),
    ])
  })

  it('makes nothing of a new note left with nothing in it (NOTE-4)', async () => {
    const user = userEvent.setup()
    render(<Notes />)

    await user.click(newNote())
    await user.keyboard('   ')
    await user.click(document.body)

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByText('No notes yet. Press "New note" to write your first one.')).toBeDefined()
  })

  it('changes a note in place, kept on clicking away or Cmd/Ctrl+Enter (NOTE-5)', async () => {
    const user = userEvent.setup()
    render(<Notes initial={[DENTIST]} />)

    await user.click(screen.getByRole('button', { name: 'Edit the note “Dentist in May”' }))
    await user.keyboard(', 10:00')
    await user.click(document.body)
    expect(cards()[0].textContent).toContain('Dentist in May, 10:00')

    await user.click(screen.getByRole('button', { name: 'Edit the note “Dentist in May, 10:00”' }))
    await user.keyboard(' sharp{Control>}{Enter}{/Control}')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(cards()[0].textContent).toContain('Dentist in May, 10:00 sharp')
  })

  it('drops the change on Escape (NOTE-5)', async () => {
    const user = userEvent.setup()
    render(<Notes initial={[DENTIST]} />)

    await user.click(screen.getByRole('button', { name: 'Edit the note “Dentist in May”' }))
    await user.keyboard(' or June{Escape}')

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(cards()[0].textContent).toContain('Dentist in May')
    expect(cards()[0].textContent).not.toContain('June')
  })

  it('deletes a note by its × or by emptying it (NOTE-6)', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<Notes initial={[DENTIST, FILMS]} onRemove={onRemove} />)

    await user.click(screen.getByRole('button', { name: 'Delete the note “Films to watch”' }))
    expect(onRemove).toHaveBeenLastCalledWith(FILMS)

    await user.click(screen.getByRole('button', { name: 'Edit the note “Dentist in May”' }))
    const box = screen.getByRole('textbox', { name: 'Note “Dentist in May”' })
    box.replaceChildren()
    box.dispatchEvent(new InputEvent('input', { bubbles: true }))
    await user.click(document.body)

    expect(onRemove).toHaveBeenLastCalledWith(DENTIST)
    expect(screen.queryByRole('list', { name: 'Notes' })).toBeNull()
  })

  it('makes the selected words bold from its button, without leaving the note (NOTE-7)', async () => {
    const user = userEvent.setup()
    render(<Notes initial={[DENTIST]} />)

    await user.click(screen.getByRole('button', { name: 'Edit the note “Dentist in May”' }))
    const box = screen.getByRole('textbox', { name: 'Note “Dentist in May”' })
    const words = box.firstChild?.firstChild as Text
    window.getSelection()?.setBaseAndExtent(words, 0, words, 'Dentist'.length)

    await user.click(screen.getByRole('button', { name: 'Bold' }))
    expect(commands).toEqual(['bold'])
    expect(document.activeElement).toBe(box)

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(cards()[0].querySelector('strong')?.textContent).toBe('Dentist')
  })

  it('asks the browser for lists and italic from their buttons (NOTE-7)', async () => {
    const user = userEvent.setup()
    render(<Notes />)

    await user.click(newNote())
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' })
    await user.click(within(toolbar).getByRole('button', { name: 'Bulleted list' }))
    await user.click(within(toolbar).getByRole('button', { name: 'Numbered list' }))
    await user.click(within(toolbar).getByRole('button', { name: 'Italic' }))

    expect(commands).toEqual(['insertUnorderedList', 'insertOrderedList', 'italic'])
    expect(screen.getByRole('textbox', { name: 'New note' })).toBeDefined()
  })

  it('keeps one note open at a time: opening another keeps the first (NOTE-5)', async () => {
    const user = userEvent.setup()
    render(<Notes initial={[DENTIST, FILMS]} />)

    await user.click(screen.getByRole('button', { name: 'Edit the note “Dentist in May”' }))
    await user.keyboard('!')
    await user.click(screen.getByRole('button', { name: 'Edit the note “Films to watch”' }))

    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(screen.getByRole('textbox', { name: 'Note “Films to watch”' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Edit the note “Dentist in May!”' })).toBeDefined()
  })
})
