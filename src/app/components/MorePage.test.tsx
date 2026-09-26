// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MorePage } from './MorePage'

/* More's page. UI ids refer to wiki/interface.md, MODE ids to wiki/modes.md. */

afterEach(cleanup)

describe('MorePage', () => {
  it('links to Lists, Tags and Modes, in that order (UI-45, LST-24)', () => {
    render(<MorePage onOpen={vi.fn()} />)

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Lists', 'Tags', 'Modes'])
  })

  it('opens the lists, which a phone reaches nowhere else without a hold (LST-24)', async () => {
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    const lists = screen.getByRole('button', { name: 'Lists' })
    expect(lists.className).toContain('min-h-14')

    await userEvent.click(lists)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('lists')
  })

  it('lists Tags as a link large enough for a finger (UI-45, UI-49)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    const tags = screen.getByRole('button', { name: 'Tags' })
    expect(tags.className).toContain('min-h-14')
    expect(tags.className).toContain('text-lg')

    await user.click(tags)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('tags')
  })

  it('has no entry for the rewards: they have a tab and a sidebar entry of their own (RWD-19)', () => {
    render(<MorePage onOpen={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Rewards' })).toBeNull()
  })

  it('opens Modes, and says nothing of the modes while none is on (MODE-1)', async () => {
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    const modes = screen.getByRole('button', { name: 'Modes' })
    expect(modes.textContent).not.toContain('on')

    await userEvent.click(modes)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('modes')
  })

  it('says how many modes are on, without being opened (MODE-1)', () => {
    render(<MorePage onOpen={vi.fn()} modesOn={2} />)

    expect(screen.getByRole('button', { name: 'Modes, 2 on' }).textContent).toContain('2 on')
  })

  it('switches no mode itself: the modes are a page now (MODE-1)', () => {
    render(<MorePage onOpen={vi.fn()} modesOn={1} />)

    expect(screen.queryByRole('switch')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Procrastination' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Warm-up' })).toBeNull()
  })
})
