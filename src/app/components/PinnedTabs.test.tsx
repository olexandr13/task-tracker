// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createList, type FeaturesOff } from '../../core'
import { FeaturesContext } from '../features'
import { oneListView, tagView, type View } from '../view'
import { PinnedTabs } from './PinnedTabs'

/* The tabs pinned across the top of a wide screen. UI ids refer to wiki/interface.md,
   FEAT ids to wiki/features.md, JUST ids to wiki/just-one.md, CHST ids to wiki/cases.md. */

afterEach(cleanup)

const WORK = createList('Work', new Date('2026-09-01T00:00:00.000Z'))

function setup(
  view: View,
  pinned: View[],
  { off = [], dimmed = false, keyWaiting = false }: { off?: FeaturesOff; dimmed?: boolean; keyWaiting?: boolean } = {},
) {
  const onChange = vi.fn()
  const onPin = vi.fn()
  const onUnpin = vi.fn()
  const onMove = vi.fn()
  render(
    <FeaturesContext value={off}>
      <input name="task-title" aria-label="Add task" />
      <PinnedTabs
        view={view}
        pinned={pinned}
        lists={[WORK]}
        tags={['reading']}
        keyWaiting={keyWaiting}
        dimmed={dimmed}
        onChange={onChange}
        onPin={onPin}
        onUnpin={onUnpin}
        onMove={onMove}
      />
    </FeaturesContext>,
  )
  return { user: userEvent.setup(), onChange, onPin, onUnpin, onMove }
}

const strip = () => screen.getByRole('navigation', { name: 'Pinned tabs' })
/** Each tab's name, in the strip's order. */
const tabNames = () =>
  within(strip())
    .getAllByRole('listitem')
    .map((tab) => tab.querySelector('button')?.textContent)
const marked = () =>
  within(strip())
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-current') === 'page')
    .map((button) => button.textContent)

describe('PinnedTabs', () => {
  it('draws the pinned tabs in order, named as the sidebar names them, and marks the page open (UI-75, UI-8)', () => {
    setup('habits', ['today', oneListView(WORK.id), 'habits', tagView('reading')])

    expect(tabNames()).toEqual(['Today', 'Work', 'Habits', 'reading'])
    expect(marked()).toEqual(['Habits'])
  })

  it('draws the page open after them, with a pin, when it is not pinned (UI-75, UI-76)', () => {
    setup('rewards/history', ['today', 'rewards'])

    expect(tabNames()).toEqual(['Today', 'Rewards', 'History'])
    expect(marked()).toEqual(['History'])
    expect(screen.getByRole('button', { name: 'Pin History' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Pin Today' })).toBeNull()
  })

  it('opens a tab\'s page on a click (UI-75)', async () => {
    const { user, onChange } = setup('today', ['today', 'habits'])

    await user.click(within(strip()).getByRole('button', { name: 'Habits' }))

    expect(onChange).toHaveBeenCalledWith('habits')
  })

  it('pins the page open, and unpins a tab from its cross (UI-76)', async () => {
    const { user, onPin, onUnpin } = setup('tasks', ['today', 'habits'])

    await user.click(screen.getByRole('button', { name: 'Pin Tasks' }))
    expect(onPin).toHaveBeenCalledWith('tasks')

    await user.click(screen.getByRole('button', { name: 'Unpin Habits' }))
    expect(onUnpin).toHaveBeenCalledWith('habits')
  })

  it('leaves out a tab whose page is switched off (UI-77, FEAT-2)', () => {
    setup('today', ['today', 'habits', 'balance'], { off: ['habits'] })

    expect(tabNames()).toEqual(['Today', 'Balance'])
  })

  it('opens the nth tab on 1 to 9, the page open counted when it is not pinned (UI-79)', async () => {
    const { user, onChange } = setup('settings', ['today', 'habits'])

    await user.keyboard('2')
    expect(onChange).toHaveBeenLastCalledWith('habits')

    await user.keyboard('3')
    expect(onChange).toHaveBeenLastCalledWith('settings')

    onChange.mockClear()
    await user.keyboard('4')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('leaves 1 to 9 alone while typing in a box or with a modifier held (UI-79)', async () => {
    const { user, onChange } = setup('today', ['today', 'habits'])

    await user.click(screen.getByRole('textbox', { name: 'Add task' }))
    await user.keyboard('2')
    fireEvent.keyDown(window, { key: '2', ctrlKey: true })
    fireEvent.keyDown(window, { key: '2', altKey: true })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Add task' }).value).toBe('2')
  })

  it('softens every tab but Today\'s while Procrastination mode is on (UI-77, JUST-5)', () => {
    setup('today', ['habits', 'today', 'tasks'], { dimmed: true })

    const softened = within(strip())
      .getAllByRole('listitem')
      .map((tab) => tab.className.includes('opacity-25'))
    expect(softened).toEqual([true, false, true])
  })

  it('marks a Cases tab while a key is waiting (UI-77, CHST-22)', () => {
    setup('today', ['today', 'rewards/cases'], { keyWaiting: true })

    expect(within(strip()).getByRole('button', { name: /^Cases/ }).textContent).toContain('a key is waiting')
  })
})
