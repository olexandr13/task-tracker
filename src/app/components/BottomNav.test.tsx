// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LONG_PRESS_MS } from '../useLongPress'
import type { View } from '../view'
import { BottomNav } from './BottomNav'

/* A phone's navigation bar. UI ids refer to wiki/interface.md. */

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** The bar over a view that follows it, as the screen holding it does. */
function Harness({ initial, onChange }: { initial: View; onChange: (view: View) => void }) {
  const [view, setView] = useState(initial)
  return (
    <BottomNav
      view={view}
      onChange={(next) => {
        onChange(next)
        setView(next)
      }}
    />
  )
}

function setup(initial: View = 'today') {
  // Advancing on its own as well, so Testing Library's own waits still end.
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const user = userEvent.setup({ advanceTimers: (ms) => { vi.advanceTimersByTime(ms) } })
  const onChange = vi.fn()
  render(<Harness initial={initial} onChange={onChange} />)
  return { user, onChange }
}

const tabs = () => screen.getAllByRole('button')
const periodTab = () => tabs()[0]
const menu = () => screen.queryByRole('menu', { name: 'Period' })

async function hold(user: ReturnType<typeof userEvent.setup>, target: HTMLElement, ms: number) {
  await user.pointer({ keys: '[TouchA>]', target })
  act(() => { vi.advanceTimersByTime(ms) })
  await user.pointer({ keys: '[/TouchA]', target })
}

describe('BottomNav', () => {
  it('has four tabs — the period, Habits, Tasks and Settings — and marks the one you are on (UI-32, UI-8)', () => {
    setup('habits')

    expect(tabs().map((tab) => tab.textContent)).toEqual(['Today', 'Habits', 'Tasks', 'Settings'])
    expect(screen.getByRole('button', { name: 'Habits' }).getAttribute('aria-current')).toBe('page')
    expect(periodTab().getAttribute('aria-current')).toBeNull()
  })

  it('keeps Tasks marked while the trash is open (UI-34)', () => {
    setup('trash')

    expect(screen.getByRole('button', { name: 'Tasks' }).getAttribute('aria-current')).toBe('page')
  })

  it('has no tab for the rewards, and keeps Tasks marked while they are open (UI-34, RWD-19)', () => {
    setup('rewards')

    expect(screen.queryByRole('button', { name: 'Rewards' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Tasks' }).getAttribute('aria-current')).toBe('page')
  })

  it('keeps Tasks marked while the tags, or a tag\'s list, are open (UI-34, TAG-17)', () => {
    for (const view of ['tags', 'tag/work'] as const) {
      setup(view)
      expect(screen.getByRole('button', { name: 'Tasks' }).getAttribute('aria-current')).toBe('page')
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
})
