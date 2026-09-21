// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createList, type List } from '../../core'
import { LONG_PRESS_MS } from '../useLongPress'
import type { View } from '../view'
import { BottomNav } from './BottomNav'

/* A phone's navigation bar. UI ids refer to wiki/interface.md. */

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const NOW = new Date('2026-09-15T10:00:00.000Z')
// Made one after the other, so they are shown in that order.
const LISTS = [createList('Work', NOW), createList('Home', new Date(NOW.getTime() + 1000))]

/** The bar over a view that follows it, as the screen holding it does. */
function Harness({ initial, lists, onChange }: { initial: View; lists: readonly List[]; onChange: (view: View) => void }) {
  const [view, setView] = useState(initial)
  return (
    <BottomNav
      view={view}
      lists={lists}
      onChange={(next) => {
        onChange(next)
        setView(next)
      }}
    />
  )
}

function setup(initial: View = 'today', lists: readonly List[] = []) {
  // Advancing on its own as well, so Testing Library's own waits still end.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const user = userEvent.setup({ advanceTimers: (ms) => { vi.advanceTimersByTime(ms) } })
  const onChange = vi.fn()
  render(<Harness initial={initial} lists={lists} onChange={onChange} />)
  return { user, onChange }
}

const tabs = () => screen.getAllByRole('button')
const periodTab = () => tabs()[0]
const menu = () => screen.queryByRole('menu', { name: 'Period' })
const tasksTab = () => screen.getByRole('button', { name: 'Tasks' })
const tasksMenu = () => screen.queryByRole('menu', { name: 'Tasks' })
const moreTab = () => screen.getByRole('button', { name: 'More' })

async function hold(user: ReturnType<typeof userEvent.setup>, target: HTMLElement, ms: number) {
  await user.pointer({ keys: '[TouchA>]', target })
  act(() => { vi.advanceTimersByTime(ms) })
  await user.pointer({ keys: '[/TouchA]', target })
}

describe('BottomNav', () => {
  it('has five tabs — the period, Habits, Tasks, More and Settings — and marks the one you are on (UI-32, UI-8)', () => {
    setup('habits')

    expect(tabs().map((tab) => tab.textContent)).toEqual(['Today', 'Habits', 'Tasks', 'More', 'Settings'])
    expect(screen.getByRole('button', { name: 'Habits' }).getAttribute('aria-current')).toBe('page')
    expect(periodTab().getAttribute('aria-current')).toBeNull()
  })

  it('keeps Tasks marked while the trash is open (UI-34)', () => {
    setup('trash')

    expect(screen.getByRole('button', { name: 'Tasks' }).getAttribute('aria-current')).toBe('page')
  })

  it('has no tab for the rewards, and keeps More marked while they are open (UI-45, RWD-19)', () => {
    setup('rewards')

    expect(screen.queryByRole('button', { name: 'Rewards' })).toBeNull()
    expect(moreTab().getAttribute('aria-current')).toBe('page')
    expect(tasksTab().getAttribute('aria-current')).toBeNull()
  })

  it('keeps More marked while the tags, or a tag\'s list, are open (UI-45, TAG-17)', () => {
    for (const view of ['tags', 'tag/work'] as const) {
      setup(view)
      expect(moreTab().getAttribute('aria-current')).toBe('page')
      expect(tasksTab().getAttribute('aria-current')).toBeNull()
      cleanup()
    }
  })

  it('goes back to the period last on screen on a tap (UI-33)', async () => {
    const { user, onChange } = setup('week')

    await user.click(screen.getByRole('button', { name: 'Habits' }))

    expect(periodTab().textContent).toBe('Week')

    await user.click(periodTab())

    expect(onChange).toHaveBeenLastCalledWith('week')
    expect(periodTab().getAttribute('aria-current')).toBe('page')
  })

  it('opens the period menu when held, without also going to the tab (UI-33)', async () => {
    const { user, onChange } = setup('habits')

    await hold(user, periodTab(), LONG_PRESS_MS)

    expect(within(menu() as HTMLElement).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Today',
      'Week',
      'Month',
    ])
    expect(onChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole('menuitem', { name: 'Month' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith('month')
    expect(menu()).toBeNull()
    expect(periodTab().textContent).toBe('Month')
  })

  it('treats a press let go early as a tap (UI-33)', async () => {
    const { user, onChange } = setup('habits')

    await hold(user, periodTab(), LONG_PRESS_MS - 100)

    expect(menu()).toBeNull()
    expect(onChange).toHaveBeenCalledExactlyOnceWith('today')
  })

  it('opens the period menu on a right-click too (UI-33)', async () => {
    const { user } = setup()

    await user.pointer({ keys: '[MouseRight]', target: periodTab() })

    expect(menu()).not.toBeNull()
  })

  it('opened from the keyboard, starts on its first item and gives focus back on Escape (UI-33, UI-10)', async () => {
    const { user } = setup()

    periodTab().focus()
    // The context-menu key: a contextmenu event with no button pressed.
    fireEvent.contextMenu(periodTab())

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Today' }))

    await user.keyboard('{Escape}')

    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(periodTab())
  })

  it('lets Enter go to the tab after a right-click left the menu unused (UI-33)', async () => {
    const { user, onChange } = setup('settings')

    await user.pointer({ keys: '[MouseRight]', target: periodTab() })
    await user.keyboard('{Escape}')
    periodTab().focus()
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledExactlyOnceWith('today')
  })

  it('opens the period menu on a tap once a period is on screen, rather than going nowhere (UI-33)', async () => {
    const { user, onChange } = setup('week')

    await user.click(periodTab())

    expect(menu()).not.toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('closes the period menu on a tap on its tab, rather than opening it again (UI-33)', async () => {
    const { user, onChange } = setup('week')

    await user.click(periodTab())
    await user.click(periodTab())

    expect(menu()).toBeNull()
    expect(onChange).not.toHaveBeenCalled()

    await user.click(periodTab())

    expect(menu()).not.toBeNull()
  })

  it('opens the period menu on a double tap from anywhere else: the first goes to the period (UI-33)', async () => {
    const { user, onChange } = setup('habits')

    await user.dblClick(periodTab())

    expect(onChange).toHaveBeenCalledExactlyOnceWith('today')
    expect(menu()).not.toBeNull()
  })

  it('opens the period menu from the keyboard on its first item when Enter is pressed on it again (UI-33)', async () => {
    const { user } = setup('today')

    periodTab().focus()
    await user.keyboard('{Enter}')

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Today' }))
  })
})

describe('the Tasks tab', () => {
  it('goes to Tasks on a tap from anywhere else, a list\'s view too (UI-43)', async () => {
    for (const view of ['today', 'list/any'] as const) {
      const { user, onChange } = setup(view)
      await user.click(tasksTab())
      expect(onChange).toHaveBeenCalledExactlyOnceWith('tasks')
      expect(tasksMenu()).toBeNull()
      cleanup()
    }
  })

  it('opens its menu on a tap once Tasks is on screen: Lists with the Inbox and every list under it, then Trash (UI-43)', async () => {
    const { user, onChange } = setup('tasks', LISTS)

    await user.click(tasksTab())

    const items = within(tasksMenu() as HTMLElement).getAllByRole('menuitem').map((item) => item.textContent)
    expect(items).toEqual(['Lists', 'Inbox', 'Work', 'Home', 'Trash'])
    const under = within(tasksMenu() as HTMLElement).getByRole('group', { name: 'Lists' })
    expect(within(under).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Lists',
      'Inbox',
      'Work',
      'Home',
    ])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('makes its menu items large enough for a finger, the lists under Lists included (UI-49)', async () => {
    const { user } = setup('tasks', LISTS)

    await user.click(tasksTab())

    const lists = screen.getByRole('menuitem', { name: 'Lists' })
    const inbox = screen.getByRole('menuitem', { name: 'Inbox' })
    expect(lists.className).toContain('min-h-14')
    expect(lists.className).toContain('text-lg')
    expect(inbox.className).toContain('min-h-14')
    expect(inbox.className).toContain('pl-[3.125rem]')
  })

  it('closes its menu on a tap on Tasks, from anywhere it was opened (UI-43)', async () => {
    const { user, onChange } = setup('habits')

    await hold(user, tasksTab(), LONG_PRESS_MS)
    await user.click(tasksTab())

    expect(tasksMenu()).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('opens its menu on a tap on Tasks while the period menu is open, closing that one (UI-43)', async () => {
    const { user } = setup('tasks')

    await hold(user, periodTab(), LONG_PRESS_MS)
    await user.click(tasksTab())

    expect(menu()).toBeNull()
    expect(tasksMenu()).not.toBeNull()
  })

  it('opens its menu when held, from anywhere, without also going to Tasks (UI-43)', async () => {
    const { user, onChange } = setup('habits')

    await hold(user, tasksTab(), LONG_PRESS_MS)

    expect(tasksMenu()).not.toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('goes where the menu says and closes it (UI-43)', async () => {
    const { user, onChange } = setup('tasks', LISTS)

    await user.click(tasksTab())
    await user.click(screen.getByRole('menuitem', { name: 'Work' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(`list/${LISTS[0].id}`)
    expect(tasksMenu()).toBeNull()

    await hold(user, tasksTab(), LONG_PRESS_MS)
    await user.click(screen.getByRole('menuitem', { name: 'Trash' }))

    expect(onChange).toHaveBeenLastCalledWith('trash')
  })
})

describe('the More tab', () => {
  it('goes to More on a tap from anywhere, Tags and Rewards included (UI-45)', async () => {
    for (const view of ['today', 'tags', 'rewards'] as const) {
      const { user, onChange } = setup(view)
      await user.click(moreTab())
      expect(onChange).toHaveBeenCalledExactlyOnceWith('more')
      cleanup()
    }
  })

  it('keeps More marked while its own page is open (UI-45)', () => {
    setup('more')

    expect(moreTab().getAttribute('aria-current')).toBe('page')
  })
})
