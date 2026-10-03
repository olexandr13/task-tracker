// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChestOpen, ChestQuarter } from '../../core'
import { CHEST_COUNT_AT, CHEST_COUNT_MS, CHEST_LANDED_AT, CHEST_LATCH_AT, CHEST_POWER_AT, CHEST_REVEAL_AT, CHEST_SETTLED_AT, CHEST_SPIN_AT } from '../chestTiming'
import { Chest } from './Chest'

/* Opening the chest on screen. CHST ids refer to wiki/chest.md. */

/** 14 of a possible 20: the third quarter, amber. */
const OPENING: ChestOpen = { points: 14, jackpot: 20 }

// jsdom draws nothing on a canvas, and says so on the console when asked to:
// the burst is told there is nothing to draw on, as it would be anywhere else.
const getContext = HTMLCanvasElement.prototype.getContext

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof getContext
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  Reflect.deleteProperty(window, 'matchMedia')
  HTMLCanvasElement.prototype.getContext = getContext
})

/** What the device asks for, which jsdom has no answer for of its own. */
function asksFor(lessMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: lessMotion && query.includes('prefers-reduced-motion'), media: query }),
  })
}

function setup({
  blocked = null as 'opened' | 'unclear' | 'tooSmall' | null,
  dayAsked = 2,
  leastTasks = 1,
  openedPoints = null as number | null,
  openedQuarter = null as ChestQuarter | null,
  sound = true,
  skipWait = false,
  band = null as string | null,
  opening = OPENING as ChestOpen | null,
} = {}) {
  const onOpen = vi.fn(() => opening)
  const onSound = vi.fn()
  render(
    <Chest
      blocked={blocked}
      dayAsked={dayAsked}
      leastTasks={leastTasks}
      openedPoints={openedPoints}
      openedQuarter={openedQuarter}
      sound={sound}
      onSound={onSound}
      onOpen={onOpen}
      skipWait={skipWait}
      band={band}
    />,
  )
  return { onOpen, onSound }
}

const lid = () => screen.getByRole('button', { name: /chest/i })

/** The line under the chest, where what came out of it is said rather than only shown. */
const said = () => within(screen.getByRole('status'))

/** What the reel is doing, or undefined while it is not on screen. */
const reelPhase = () => document.querySelector<HTMLElement>('.chest-screen')?.dataset.reelPhase

describe('a chest with no key behind it', () => {
  it('is pressable rather than dimmed, and says what would earn a key (CHST-17)', async () => {
    asksFor(false)
    const { onOpen } = setup({ blocked: 'unclear', opening: null })

    expect(lid().hasAttribute('disabled')).toBe(false)
    await userEvent.setup().click(lid())

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Finish everything in Today to earn a key.')).toBeTruthy()
  })

  it('says how big the day has to be when that is what is wanting (CHST-3)', () => {
    asksFor(false)
    setup({ blocked: 'tooSmall', dayAsked: 2, leastTasks: 3, opening: null })

    expect(screen.getByText('Today asked for 2 tasks; a key needs 3.')).toBeTruthy()
  })

  it('says today’s is open, and what it gave, once it has been (CHST-4)', () => {
    asksFor(false)
    setup({ blocked: 'opened', openedPoints: 9, openedQuarter: 2, opening: null })

    expect(screen.getByText('Today’s chest gave +9.')).toBeTruthy()
    expect(screen.getByText('Today’s chest is open. Come back tomorrow.')).toBeTruthy()
  })

  it('shakes where it was pressed and settles again', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup({ blocked: 'unclear', opening: null })

    fireEvent.click(lid())
    act(() => {
      vi.advanceTimersByTime(20)
    })
    expect(document.querySelector('.chest-refusal-shake')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(document.querySelector('.chest-refusal-shake')).toBeNull()
  })
})

describe('opening it', () => {
  it('shows what it gave, and says out of how much (CHST-14)', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    fireEvent.click(lid())

    // The lid has not gone yet, so the number is not out either.
    expect(screen.queryByText('14 of a possible 20')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_REVEAL_AT + 10)
    })
    expect(screen.getByText('14 of a possible 20')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(CHEST_COUNT_AT + CHEST_COUNT_MS[3])
    })
    expect(said().getByText('+14')).toBeTruthy()
  })

  it('unlocks the crate, turns the screen on and runs the reel before the card comes out (CHST-14)', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    fireEvent.click(lid())
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(document.querySelector('.chest-dial-turned')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_LATCH_AT - 200 + 10)
    })
    expect(document.querySelector('.chest-latch-left')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_POWER_AT - CHEST_LATCH_AT)
    })
    expect(reelPhase()).toBe('power')
    expect(document.querySelector('.chest-crate-away')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_SPIN_AT - CHEST_POWER_AT)
    })
    expect(reelPhase()).toBe('spinning')
    expect(document.querySelector('.chest-object')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_LANDED_AT - CHEST_SPIN_AT)
    })
    expect(reelPhase()).toBe('landed')
    // Stopped on the card, and still nothing said.
    expect(screen.queryByText('14 of a possible 20')).toBeNull()
  })

  it('stops the reel on the card the opening drew (CHST-16)', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    fireEvent.click(lid())
    act(() => {
      vi.advanceTimersByTime(CHEST_LANDED_AT + 10)
    })

    const winner = document.querySelector('[data-reel-winner]')
    expect(winner?.textContent).toBe('+14')

    const strip = document.querySelector<HTMLElement>('.chest-reel')
    const cards = document.querySelectorAll('.chest-reel-slot')
    const stopsAt = Number(strip?.style.getPropertyValue('--reel-to'))
    expect(cards[Math.floor(stopsAt)]).toBe(winner)
  })

  it('flicks the marker each time a card crosses it', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    fireEvent.click(lid())
    act(() => {
      vi.advanceTimersByTime(CHEST_SPIN_AT + 200)
    })

    expect(document.querySelector('.chest-marker-tick')).not.toBeNull()
  })

  it('opens at once, with no wait at all, where less motion is asked for (CHST-18)', async () => {
    asksFor(true)
    setup()

    await userEvent.setup().click(lid())

    expect(screen.getByText('14 of a possible 20')).toBeTruthy()
    expect(said().getByText('+14')).toBeTruthy()
  })

  it('throws nothing and flashes nothing where less motion is asked for (CHST-18)', async () => {
    asksFor(true)
    setup()

    await userEvent.setup().click(lid())

    expect(document.querySelector('[data-chest-burst]')).toBeNull()
    expect(document.querySelector('.chest-flash')).toBeNull()
  })

  it('flashes, sends a ring out and throws sparks as the card comes out (CHST-14)', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    fireEvent.click(lid())
    expect(document.querySelector('.chest-flash')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_REVEAL_AT + 10)
    })

    expect(document.querySelector('.chest-flash')).not.toBeNull()
    expect(document.querySelector('.chest-shockwave')).not.toBeNull()
    expect(document.querySelector('[data-chest-burst]')).not.toBeNull()
  })

  it('clears what the last opening threw out the moment the next is pressed', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    fireEvent.click(lid())
    act(() => {
      vi.advanceTimersByTime(CHEST_SETTLED_AT + 10)
    })
    expect(document.querySelector('[data-chest-burst]')).not.toBeNull()

    fireEvent.click(lid())

    expect(document.querySelector('[data-chest-burst]')).toBeNull()
    expect(document.querySelector('.chest-flash')).toBeNull()
  })

  it('squashes as it is pressed, and brings the card out of the screen once it has landed (CHST-14)', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    fireEvent.click(lid())
    expect(document.querySelector('.chest-press')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_SPIN_AT + 100)
    })
    expect(document.querySelector('.chest-vignette-on')).not.toBeNull()
    expect(document.querySelector('.chest-spot')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(CHEST_REVEAL_AT - CHEST_SPIN_AT)
    })
    expect(document.querySelector('.chest-spot-arriving')).not.toBeNull()
    expect(reelPhase()).toBe('off')
    expect(document.querySelector('.chest-vignette-on')).toBeNull()
  })

  it('breathes while a key is waiting, and keeps still while there is none (CHST-22)', () => {
    asksFor(false)
    setup()
    expect(document.querySelector('.chest-breathe')).not.toBeNull()

    cleanup()
    setup({ blocked: 'unclear', opening: null })
    expect(document.querySelector('.chest-breathe')).toBeNull()
  })

  it('shows the card it gave, with nothing flying, when coming back to one opened earlier', () => {
    asksFor(false)
    setup({ blocked: 'opened', openedPoints: 9, openedQuarter: 2, opening: null })

    expect(document.querySelector('.chest-spot-still')?.textContent).toContain('+9')
    expect(document.querySelector('.chest-spot-arriving')).toBeNull()
    expect(document.querySelector('.chest-screen')).toBeNull()
    expect(document.querySelector('.chest-flash')).toBeNull()
  })

  it('shows a plain card where this device never saw which colour it was (CHST-24)', () => {
    asksFor(false)
    setup({ blocked: 'opened', openedPoints: 9, openedQuarter: null, opening: null })

    const card = document.querySelector('.chest-spot-still .chest-card')
    expect(card?.textContent).toContain('+9')
    expect(card?.querySelectorAll('.chest-card-pip-on')).toHaveLength(0)
  })

  it('opens with Enter and with Space, the chest being a button', async () => {
    asksFor(true)
    const { onOpen } = setup()
    const user = userEvent.setup()

    lid().focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('takes one press at a time while it is still opening (CHST-4)', () => {
    asksFor(false)
    vi.useFakeTimers()
    const { onOpen } = setup()

    fireEvent.click(lid())
    fireEvent.click(lid())

    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('takes no press until the show is over, the card long out but the sparks still flying (CHST-16)', () => {
    asksFor(false)
    vi.useFakeTimers()
    const { onOpen } = setup()

    fireEvent.click(lid())
    let now = 0
    for (const at of [CHEST_REVEAL_AT + 10, CHEST_COUNT_AT + 200, CHEST_SETTLED_AT - 50]) {
      act(() => {
        vi.advanceTimersByTime(at - now)
      })
      now = at
      fireEvent.click(lid())
    }
    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
    // Nothing at all, not even a refusal: the press is not wrong, only early.
    expect(document.querySelector('.chest-refusal-shake')).toBeNull()
  })

  it('says it is busy while the show runs, and takes a press again once it is over (CHST-16)', () => {
    asksFor(false)
    vi.useFakeTimers()
    const { onOpen } = setup()

    expect(lid().getAttribute('aria-disabled')).toBeNull()
    fireEvent.click(lid())
    expect(lid().getAttribute('aria-disabled')).toBe('true')

    act(() => {
      vi.advanceTimersByTime(CHEST_SETTLED_AT + 10)
    })
    expect(lid().getAttribute('aria-disabled')).toBeNull()

    fireEvent.click(lid())
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it('keeps the keyboard on the chest through the show, being busy rather than disabled', () => {
    asksFor(false)
    vi.useFakeTimers()
    setup()

    lid().focus()
    fireEvent.click(lid())
    act(() => {
      vi.advanceTimersByTime(CHEST_REVEAL_AT + 10)
    })

    expect(lid().hasAttribute('disabled')).toBe(false)
    expect(document.activeElement).toBe(lid())
  })

  it('lets the sound be turned off in the middle of the show', () => {
    asksFor(false)
    vi.useFakeTimers()
    const { onSound } = setup({ sound: true })

    fireEvent.click(lid())
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Turn the sound off' }))

    expect(onSound).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('wears the practice band while nothing is being earned (CHST-21)', () => {
    asksFor(true)
    setup({ band: 'Practice — nothing is earned' })

    expect(screen.getByText('Practice — nothing is earned')).toBeTruthy()
  })
})

describe('the noise', () => {
  it('is turned off and on beside the chest, which says which it will do (CHST-19)', async () => {
    asksFor(true)
    const { onSound } = setup({ sound: true })

    const speaker = screen.getByRole('button', { name: 'Turn the sound off' })
    expect(speaker.getAttribute('aria-pressed')).toBe('true')

    await userEvent.setup().click(speaker)

    expect(onSound).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('offers to turn it on again once it is off', () => {
    asksFor(true)
    setup({ sound: false })

    expect(screen.getByRole('button', { name: 'Turn the sound on' })).toBeTruthy()
  })
})
