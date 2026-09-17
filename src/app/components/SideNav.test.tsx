// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { View } from '../view'
import { SideNav } from './SideNav'

/* The sidebar. UI ids refer to wiki/interface.md, TAG ids to wiki/tags.md, RWD ids to wiki/rewards.md. */

afterEach(cleanup)

function setup(view: View) {
  const onChange = vi.fn()
  render(<SideNav view={view} onChange={onChange} />)
  return { user: userEvent.setup(), onChange }
}

const marked = () => screen.getAllByRole('button').filter((button) => button.getAttribute('aria-current') === 'page')

describe('SideNav', () => {
  it('carries Rewards and Tags beside Tasks and Habits, and no entry for any one tag (UI-30, TAG-18, RWD-19)', () => {
    setup('today')

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Today',
      'Week',
      'Month',
      'Tasks',
      'Habits',
      'Rewards',
      'Tags',
      'Trash',
      'Settings',
    ])
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

  it('keeps Tags marked while a tag\'s list is open (UI-8, TAG-13)', () => {
    setup('tag/work')

    expect(marked().map((button) => button.textContent)).toEqual(['Tags'])
  })
})
