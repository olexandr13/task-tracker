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

function setup(view: View, lists: readonly List[] = [], listsOpen = true, dimmed = false, rewardsOpen = true) {
  const onChange = vi.fn()
  const onListsOpenChange = vi.fn()
  const onRewardsOpenChange = vi.fn()
  render(
    <SideNav
      view={view}
      lists={lists}
      listsOpen={listsOpen}
      rewardsOpen={rewardsOpen}
      dimmed={dimmed}
      onChange={onChange}
      onListsOpenChange={onListsOpenChange}
      onRewardsOpenChange={onRewardsOpenChange}
    />,
  )
  return { user: userEvent.setup(), onChange, onListsOpenChange, onRewardsOpenChange }
}

const foldButton = () => screen.getByRole('button', { name: 'Show lists' })
const rewardsFoldButton = () => screen.getByRole('button', { name: 'Show rewards pages' })

const marked = () => screen.getAllByRole('button').filter((button) => button.getAttribute('aria-current') === 'page')

describe('SideNav', () => {
  it('opens with the app\'s mark above the views (UI-52)', () => {
    setup('today')

    expect(screen.getByText('PickMe')).toBeTruthy()
  })

  it('carries Lists, Rewards and More beside Tasks and Habits, and no entry for Tags or any one tag (UI-30, UI-45, TAG-18, RWD-19, LST-13)', () => {
    setup('today')

    const entries = screen
      .getAllByRole('button')
      .filter((button) => button !== foldButton() && button !== rewardsFoldButton())
    expect(entries.map((button) => button.textContent)).toEqual([
      'Today',
      'Week',
      'Month',
      'Tasks',
      'Habits',
      'Lists',
      'Inbox',
      'Rewards',
      'History',
      'Prizes',
      'Wishlist',
      'Rules',
      'More',
      'Trash',
      'Settings',
    ])
  })

  it('goes to the Lists page (LST-13)', async () => {
    const { user, onChange } = setup('today')

    await user.click(screen.getByRole('button', { name: 'Lists' }))

    expect(onChange).toHaveBeenCalledWith('lists')
  })

  it('goes to More (UI-45)', async () => {
    const { user, onChange } = setup('today')

    await user.click(screen.getByRole('button', { name: 'More' }))

    expect(onChange).toHaveBeenCalledWith('more')
  })

  it('goes to Rewards from its own entry (RWD-19)', async () => {
    const { user, onChange } = setup('today')

    await user.click(screen.getByRole('button', { name: 'Rewards' }))

    expect(onChange).toHaveBeenCalledWith('rewards')
  })

  it('keeps More marked while Tags or a tag\'s tasks are open (UI-8, UI-45, TAG-17)', () => {
    setup('tags')
    expect(marked().map((button) => button.textContent)).toEqual(['More'])
    cleanup()

    setup('tag/work')
    expect(marked().map((button) => button.textContent)).toEqual(['More'])
  })

  it('keeps More marked while the Modes page or one mode\'s is open (UI-8, UI-45, MODE-1)', () => {
    for (const view of ['modes', 'modes/procrastination', 'modes/warm-up'] as const) {
      setup(view)
      expect(marked().map((button) => button.textContent)).toEqual(['More'])
      cleanup()
    }
  })

  it('marks Rewards itself, and not More, while the Rewards page is open (UI-8, UI-30, RWD-19)', () => {
    setup('rewards')

    expect(marked().map((button) => button.textContent)).toEqual(['Rewards'])
  })

  it('folds the rewards pages away and opens them again, without leaving the view (RWD-19)', async () => {
    const { user, onChange, onRewardsOpenChange } = setup('today')

    expect(rewardsFoldButton().getAttribute('aria-expanded')).toBe('true')
    expect(rewardsFoldButton().getAttribute('aria-controls')).toBe(screen.getByRole('list', { name: 'Rewards' }).id)

    await user.click(rewardsFoldButton())

    expect(onRewardsOpenChange).toHaveBeenCalledWith(false)
    expect(onChange).not.toHaveBeenCalled()

    cleanup()
    const folded = setup('today', [], true, false, false)
    await folded.user.click(rewardsFoldButton())

    expect(folded.onRewardsOpenChange).toHaveBeenCalledWith(true)
  })

  it('leaves the rewards pages out while folded, and Rewards still goes to its page (RWD-19)', async () => {
    const { user, onChange } = setup('today', [], true, false, false)

    expect(rewardsFoldButton().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('list', { name: 'Rewards' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Wishlist' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Rewards' }))

    expect(onChange).toHaveBeenCalledWith('rewards')
  })

  it('marks Rewards while one of its pages is open and they are folded (UI-8, RWD-19)', () => {
    setup('rewards/wishlist', [], true, false, false)

    expect(marked().map((button) => button.textContent)).toEqual(['Rewards'])
  })

  it('keeps the rewards pages under Rewards, each marked on its own (UI-30, RWD-30)', async () => {
    const { user, onChange } = setup('rewards/wishlist')

    const under = within(screen.getByRole('list', { name: 'Rewards' }))
    expect(under.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'History',
      'Prizes',
      'Wishlist',
      'Rules',
    ])
    // The page itself is marked, not Rewards above it.
    expect(marked().map((button) => button.textContent)).toEqual(['Wishlist'])

    await user.click(under.getByRole('button', { name: 'History' }))

    expect(onChange).toHaveBeenCalledWith('rewards/history')
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

  it('dims while Procrastination mode is on (JUST-5)', () => {
    setup('today', [], true, true)

    expect(screen.getByRole('navigation', { name: 'Views' }).className).toMatch(/opacity-25/)
  })
})
