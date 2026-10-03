// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHEST } from '../../core'
import type { Chest as ChestState } from '../useChest'
import { ChestPage } from './ChestPage'

/* The chest's page. CHST ids refer to wiki/chest.md. */

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(window, 'matchMedia')
})

/** Less motion, so an opening lands in one go and the test need not wait. */
function atOnce() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: query.includes('prefers-reduced-motion'), media: query }),
  })
}

function setup(over: Partial<ChestState> = {}) {
  const open = vi.fn(() => ({ points: 2, jackpot: 20 }))
  const chest: ChestState = {
    isLoading: false,
    settings: DEFAULT_CHEST,
    jackpot: 20,
    blocked: null,
    dayAsked: 2,
    opened: null,
    lastQuarter: null,
    sound: false,
    setSound: vi.fn(),
    open,
    setSettings: vi.fn(),
    unannounced: false,
    announce: vi.fn(),
    ...over,
  }
  render(<ChestPage chest={chest} />)
  return { user: userEvent.setup(), open, chest }
}

/** The least and the most, as the page sets them out. */
function range() {
  const ends = within(screen.getByRole('region', { name: 'What a chest can give' }))
  return {
    least: ends.getByText('At least').nextElementSibling?.textContent,
    most: ends.getByText('Up to').nextElementSibling?.textContent,
  }
}

describe('what the page says', () => {
  it('says what a cleared day earns (CHST-2)', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'About The chest' }))
    expect(screen.getByText(/Clear everything in Today and a key is yours/)).toBeTruthy()
  })

  it('says the least and the most a chest can give: 1 point, up to everything earned today (CHST-26)', () => {
    setup({ jackpot: 25 })

    expect(range()).toEqual({ least: '1point', most: '25points' })
    expect(screen.getByText('The most is everything you earned today.')).toBeTruthy()
  })

  it('says what to do while nothing finished today has earned anything, the most being the least (CHST-26)', () => {
    setup({ jackpot: 1 })

    expect(range()).toEqual({ least: '1point', most: '1point' })
    expect(screen.getByText(/Nothing finished today has earned points yet/)).toBeTruthy()
  })

  it('lists no table of chances, only the two ends', () => {
    setup()

    expect(screen.queryByText('What a chest can hold')).toBeNull()
    expect(screen.queryByText('JACKPOT')).toBeNull()
  })
})

describe('practice', () => {
  it('is off to begin with, so it can never be left on without being noticed (CHST-21)', () => {
    setup()

    expect(screen.getByRole('switch', { name: 'Practice' }).getAttribute('aria-checked')).toBe('false')
    expect(screen.queryByText('Practice — nothing is earned')).toBeNull()
  })

  it('opens the chest as often as you like and earns nothing (CHST-21)', async () => {
    atOnce()
    const { user, open } = setup({ blocked: 'unclear' })

    await user.click(screen.getByRole('switch', { name: 'Practice' }))
    expect(screen.getByText('Practice — nothing is earned')).toBeTruthy()

    const lid = screen.getByRole('button', { name: /open.*chest/i })
    await user.click(lid)
    await user.click(lid)
    await user.click(lid)

    // Nothing reached the ledger: a practice opening is drawn and written nowhere.
    expect(open).not.toHaveBeenCalled()
    expect(screen.getByText(/^3 openings, [\d.]+ points each on average\.$/)).toBeTruthy()
  })

  it('leaves a practice opening behind when practice goes off (CHST-21)', async () => {
    atOnce()
    const { user } = setup()
    const practice = screen.getByRole('switch', { name: 'Practice' })

    await user.click(practice)
    await user.click(screen.getByRole('button', { name: /open.*chest/i }))
    expect(within(screen.getByRole('status')).getByText(/^\+\d+$/)).toBeTruthy()

    await user.click(practice)

    expect(screen.queryByText(/^\+\d+$/)).toBeNull()
    expect(screen.queryByText('Practice — nothing is earned')).toBeNull()
  })

  it('counts the openings by quarter of the jackpot, so the odds can be eyed (CHST-21)', async () => {
    atOnce()
    const { user } = setup()

    await user.click(screen.getByRole('switch', { name: 'Practice' }))
    await user.click(screen.getByRole('button', { name: /open.*chest/i }))

    const counted = screen
      .getAllByRole('listitem')
      .map((line) => line.textContent)
      .filter((text) => text?.includes(': '))

    expect(counted).toHaveLength(4)
    expect(counted.join(' ')).toMatch(/: 1/)
  })

  it('offers a bigger jackpot to try, the real one being too small to tell the quarters apart', async () => {
    atOnce()
    const { user } = setup()

    await user.click(screen.getByRole('switch', { name: 'Practice' }))
    const box = screen.getByRole('spinbutton')
    await user.clear(box)
    await user.type(box, '400')

    expect(range().most).toBe('400points')
    // No sentence about it: the most is the number just typed.
    expect(screen.queryByText(/^The most is/)).toBeNull()
  })

  it('offers to skip the wait, so thirty openings do not cost three minutes of reels', async () => {
    atOnce()
    const { user } = setup()

    await user.click(screen.getByRole('switch', { name: 'Practice' }))

    expect(screen.getByRole('checkbox', { name: 'Skip the wait' })).toBeTruthy()
  })
})

describe('how the points read', () => {
  it('says one point rather than one points', () => {
    setup({ jackpot: 1 })

    expect(document.body.textContent).not.toContain('1 points')
    expect(document.body.textContent).not.toContain('1points')
  })
})

