// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeaturesOff } from '../../core'
import { FeaturesContext } from '../features'
import { MorePage } from './MorePage'

/* More's page. UI ids refer to wiki/interface.md, FEAT ids to wiki/features.md. */

afterEach(cleanup)

describe('MorePage', () => {
  it('links to Lists, Organize, Reflect and Notifications, in the sidebar\'s order (UI-30, UI-45, UI-81, UI-83, LST-24, NOTIF-1)', () => {
    render(<MorePage onOpen={vi.fn()} />)

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual([
      'Lists',
      'Organize',
      'Reflect',
      'Notifications',
    ])
  })

  it('says how many notices are waiting on the Notifications row (NOTIF-6)', async () => {
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} notices={3} />)

    await userEvent.click(screen.getByRole('button', { name: 'Notifications, 3 waiting' }))
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('notifications')
  })

  it('says nothing on the Notifications row with nothing waiting (NOTIF-6)', () => {
    render(<MorePage onOpen={vi.fn()} notices={0} />)

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy()
  })

  it('opens Organize, where Tags, the notes and Modes are (UI-81)', async () => {
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    await userEvent.click(screen.getByRole('button', { name: 'Organize' }))
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('organize')
    for (const name of ['Tags', 'Notes', 'Modes']) expect(screen.queryByRole('button', { name })).toBeNull()
  })

  it('opens Reflect, where Balance, the activity log and the journal are (UI-83)', async () => {
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    await userEvent.click(screen.getByRole('button', { name: 'Reflect' }))
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('reflect')
    for (const name of ['Balance', 'Activity log', 'Journal']) expect(screen.queryByRole('button', { name })).toBeNull()
  })

  it('opens the lists, which a phone reaches nowhere else without a hold (LST-24)', async () => {
    const onOpen = vi.fn()
    render(<MorePage onOpen={onOpen} />)

    const lists = screen.getByRole('button', { name: 'Lists' })
    expect(lists.className).toContain('min-h-14')

    await userEvent.click(lists)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('lists')
  })

  it('lists each page as a link large enough for a finger (UI-45, UI-49)', () => {
    render(<MorePage onOpen={vi.fn()} />)

    const organize = screen.getByRole('button', { name: 'Organize' })
    expect(organize.className).toContain('min-h-14')
    expect(organize.className).toContain('text-lg')
  })

  it('has no entry for the rewards: they have a tab and a sidebar entry of their own (RWD-19)', () => {
    render(<MorePage onOpen={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Rewards' })).toBeNull()
  })

  it('lists no page switched off, nor Organize or Reflect once all it holds is (FEAT-2, UI-81, UI-83)', () => {
    // Balance goes with the tags it divides time by (FEAT-4).
    const off: FeaturesOff = ['tags', 'notes', 'modes', 'activity', 'journal', 'notifications']
    render(
      <FeaturesContext value={off}>
        <MorePage onOpen={vi.fn()} />
      </FeaturesContext>,
    )

    expect(screen.getAllByRole('button').map((link) => link.textContent)).toEqual(['Lists'])
  })

  it('keeps Organize while any of what it holds is on (FEAT-2, UI-81)', () => {
    render(
      <FeaturesContext value={['tags', 'notes']}>
        <MorePage onOpen={vi.fn()} />
      </FeaturesContext>,
    )

    expect(screen.getByRole('button', { name: 'Organize' })).toBeDefined()
  })

  it('keeps Reflect while any of what it holds is on (FEAT-2, UI-83)', () => {
    render(
      <FeaturesContext value={['balance', 'activity']}>
        <MorePage onOpen={vi.fn()} />
      </FeaturesContext>,
    )

    expect(screen.getByRole('button', { name: 'Reflect' })).toBeDefined()
  })
})
