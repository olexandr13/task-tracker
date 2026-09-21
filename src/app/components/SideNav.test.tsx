// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createList, type List } from '../../core'
import type { View } from '../view'
import { SideNav } from './SideNav'

/* The sidebar. UI ids refer to wiki/interface.md, TAG ids to wiki/tags.md, RWD ids to
   wiki/rewards.md, LST ids to wiki/lists.md. */

afterEach(cleanup)

const WORK = createList('Work', new Date('2026-09-01T00:00:00.000Z'))
const HOME = createList('Home', new Date('2026-09-02T00:00:00.000Z'))

function setup(view: View, lists: readonly List[] = [], listsOpen = true) {
  const onChange = vi.fn()
  const onListsOpenChange = vi.fn()
  render(
    <SideNav view={view} lists={lists} listsOpen={listsOpen} onChange={onChange} onListsOpenChange={onListsOpenChange} />,
  )
  return { user: userEvent.setup(), onChange, onListsOpenChange }
}

const foldButton = () => screen.getByRole('button', { name: 'Show lists' })

const marked = () => screen.getAllByRole('button').filter((button) => button.getAttribute('aria-current') === 'page')

describe('SideNav', () => {
  it('opens with the app\'s mark above the views (UI-52)', () => {
    setup('today')

    expect(screen.getByText('PickMe')).toBeTruthy()
  })

  it('carries Lists, Rewards and Tags beside Tasks and Habits, and no entry for any one tag (UI-30, TAG-18, RWD-19, LST-13)', () => {
    setup('today')

    const entries = screen.getAllByRole('button').filter((button) => button !== foldButton())
    expect(entries.map((button) => button.textContent)).toEqual([
      'Today',
      'Week',
      'Month',
      'Tasks',
      'Lists',
      'Inbox',
      'Habits',
      'Rewards',
      'Tags',
      'Trash',
      'Settings',
    ])
  })

  it('goes to the Lists page (LST-13)', async () => {
    const { user, onChange } = setup('today')

    await user.click(screen.getByRole('button', { name: 'Lists' }))

    expect(onChange).toHaveBeenCalledWith('lists')
  })

  it('goes to the Tags page (TAG-18)', async () => {
    const { user, onChange } = setup('today')

    await user.click(screen.getByRole('button', { name: 'Tags' }))

    expect(onChange).toHaveBeenCalledWith('tags')
  })

  it('goes to the Rewards page (RWD-19)', async () => {
    const { user, onChange } = setup('today')

    await user.click(screen.getByRole('button', { name: 'Rewards' }))

    expect(onChange).toHaveBeenCalledWith('rewards')
  })

  it('keeps Tags marked while a tag\'s tasks are open (UI-8, TAG-13)', () => {
    setup('tag/work')

    expect(marked().map((button) => button.textContent)).toEqual(['Tags'])
  })

  it('keeps Lists open, with the Inbox and then every list under it (LST-13)', () => {
    setup('today', [HOME, WORK])

    const under = within(screen.getByRole('list', { name: 'Lists' }))
    expect(under.getAllByRole('button').map((button) => button.textContent)).toEqual(['Inbox', 'Work', 'Home'])
  })

  it('goes to a list\'s view, and to the Inbox, from its entry (LST-8, LST-11)', async () => {
    const { user, onChange } = setup('today', [WORK])

    await user.click(screen.getByRole('button', { name: 'Work' }))
    await user.click(screen.getByRole('button', { name: 'Inbox' }))

    expect(onChange.mock.calls).toEqual([[`list/${WORK.id}`], ['inbox']])
  })

  it('marks the list whose view is open, rather than Lists (UI-8, LST-8)', () => {
    setup(`list/${WORK.id}`, [WORK, HOME])

    expect(marked().map((button) => button.textContent)).toEqual(['Work'])
  })

  it('marks the Inbox while it is open (UI-8, LST-11)', () => {
    setup('inbox', [WORK])

    expect(marked().map((button) => button.textContent)).toEqual(['Inbox'])
  })

  it('marks Lists on the Lists page (UI-8, LST-13)', () => {
    setup('lists', [WORK])

    expect(marked().map((button) => button.textContent)).toEqual(['Lists'])
  })

  it('shows the lists as open when they are (LST-26)', () => {
    setup('today', [WORK])

    expect(foldButton().getAttribute('aria-expanded')).toBe('true')
    expect(foldButton().getAttribute('aria-controls')).toBe(screen.getByRole('list', { name: 'Lists' }).id)
  })

  it('folds the lists away without leaving the view (LST-26)', async () => {
    const { user, onChange, onListsOpenChange } = setup('today', [WORK])

    await user.click(foldButton())

    expect(onListsOpenChange).toHaveBeenCalledWith(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('opens folded lists again (LST-26)', async () => {
    const { user, onListsOpenChange } = setup('today', [WORK], false)

    await user.click(foldButton())

    expect(onListsOpenChange).toHaveBeenCalledWith(true)
  })

  it('leaves the Inbox and the lists out while folded, and Lists still goes to its page (LST-26)', async () => {
    const { user, onChange } = setup('today', [WORK], false)

    expect(foldButton().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('list', { name: 'Lists' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Inbox' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Work' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Lists' }))

    expect(onChange).toHaveBeenCalledWith('lists')
  })

  it('marks Lists while a list\'s view or the Inbox is open and the lists are folded (UI-8, LST-26)', () => {
    setup(`list/${WORK.id}`, [WORK], false)
    expect(marked().map((button) => button.textContent)).toEqual(['Lists'])
    cleanup()

    setup('inbox', [WORK], false)
    expect(marked().map((button) => button.textContent)).toEqual(['Lists'])
  })
})
