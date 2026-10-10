// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { changeJournalText, createJournalEntry, type JournalEntry } from '../../core'
import { JournalPage } from './JournalPage'

/* The journal page. JRN ids refer to wiki/journal.md. */

afterEach(cleanup)

// Saturday 10 October 2026, nine in the evening.
const NOW = new Date(2026, 9, 10, 21, 0)
const TODAY = '2026-10-10'

/** The page over a journal of its own, the rules applied as the screen would apply them. */
function Journal({ initial = [], onRemove = vi.fn() }: { initial?: JournalEntry[]; onRemove?: (entry: JournalEntry) => void }) {
  const [entries, setEntries] = useState(initial)
  return (
    <JournalPage
      entries={entries}
      now={NOW}
      onAdd={(section, text, day) => { setEntries((current) => [...current, createJournalEntry(section, text, day, new Date())]) }}
      onChange={(id, text) => { setEntries((current) => current.map((entry) => (entry.id === id ? changeJournalText(entry, text) : entry))) }}
      onRemove={(entry) => {
        onRemove(entry)
        setEntries((current) => current.filter((other) => other.id !== entry.id))
      }}
    />
  )
}

function section(name: string) {
  return within(screen.getByRole('region', { name: new RegExp(name, 'u') }))
}

describe('JournalPage', () => {
  it('asks for good things, achievements and gratitude, five of each (JRN-1, JRN-3)', () => {
    render(<Journal />)

    for (const name of ['Good things today', 'Achievements', 'Gratitude']) {
      expect(section(name).getByRole('img', { name: '0 of 5 written' })).toBeDefined()
    }
    expect(section('Good things today').getByRole('textbox', { name: 'Add a good thing' })).toBeDefined()
  })

  it('writes a line on Enter and leaves the caret waiting for the next (JRN-2)', async () => {
    const user = userEvent.setup()
    render(<Journal />)

    const waiting = section('Achievements').getByRole('textbox', { name: 'Add an achievement' })
    await user.click(waiting)
    await user.keyboard('Ran 5 km{Enter}Fixed the bike{Enter}')

    expect(section('Achievements').getByRole('textbox', { name: 'Achievement 1' })).toHaveProperty('value', 'Ran 5 km')
    expect(section('Achievements').getByRole('textbox', { name: 'Achievement 2' })).toHaveProperty('value', 'Fixed the bike')
    expect(document.activeElement).toBe(waiting)
    expect(section('Achievements').getByRole('img', { name: '2 of 5 written' })).toBeDefined()
  })

  it('keeps going past five, and says the goal is reached (JRN-3)', async () => {
    const lines = ['a', 'b', 'c', 'd', 'e'].map((text) => createJournalEntry('gratitude', text, TODAY, NOW))
    const user = userEvent.setup()
    render(<Journal initial={lines} />)

    await user.click(section('Gratitude').getByRole('textbox', { name: 'Add something you’re grateful for' }))
    await user.keyboard('f{Enter}')

    expect(section('Gratitude').getByRole('img', { name: '6 written, 5 reached' })).toBeDefined()
  })

  it('changes a line in place, keeping it on leaving and putting it back on Escape (JRN-4)', async () => {
    const sunny = createJournalEntry('good', 'Sun came out', TODAY, NOW)
    const user = userEvent.setup()
    render(<Journal initial={[sunny]} />)

    const line = section('Good things today').getByRole('textbox', { name: 'Good thing 1' })
    await user.click(line)
    await user.keyboard(' again{Escape}')
    expect(line).toHaveProperty('value', 'Sun came out')

    await user.click(line)
    await user.keyboard(' again{Enter}')
    expect(section('Good things today').getByRole('textbox', { name: 'Good thing 1' })).toHaveProperty('value', 'Sun came out again')
  })

  it('deletes a line emptied, or by its ×, saying which (JRN-5)', async () => {
    const sunny = createJournalEntry('good', 'Sun came out', TODAY, NOW)
    const coffee = createJournalEntry('good', 'Coffee', TODAY, new Date(NOW.getTime() + 1000))
    const onRemove = vi.fn()
    const user = userEvent.setup()
    render(<Journal initial={[sunny, coffee]} onRemove={onRemove} />)

    await user.click(screen.getByRole('button', { name: 'Delete “Coffee”' }))
    expect(onRemove).toHaveBeenLastCalledWith(coffee)

    await user.tripleClick(section('Good things today').getByRole('textbox', { name: 'Good thing 1' }))
    await user.keyboard('{Backspace}{Enter}')
    expect(onRemove).toHaveBeenLastCalledWith(sunny)
    expect(section('Good things today').queryByRole('textbox', { name: 'Good thing 1' })).toBeNull()
  })

  it('keeps the week gone by out of sight until asked for, latest day first (JRN-6)', async () => {
    const yesterday = createJournalEntry('achievements', 'Ran 5 km', '2026-10-09', NOW)
    const earlier = createJournalEntry('gratitude', 'A friend called', '2026-10-06', NOW)
    const user = userEvent.setup()
    render(<Journal initial={[earlier, yesterday]} />)

    expect(screen.queryByText('Ran 5 km')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Show the last 7 days' }))
    const days = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(days.slice(-2)).toEqual(['Yesterday', 'Tue, Oct 6'])
    expect(screen.getByText('Ran 5 km')).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Hide the last 7 days' }))
    expect(screen.queryByText('Ran 5 km')).toBeNull()
  })

  it('says so when nothing was written in the week gone by (JRN-6)', async () => {
    const user = userEvent.setup()
    render(<Journal />)

    await user.click(screen.getByRole('button', { name: 'Show the last 7 days' }))
    expect(screen.getByText('Nothing written in the last 7 days.')).toBeDefined()
  })
})
