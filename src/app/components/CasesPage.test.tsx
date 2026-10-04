// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CASES, type CaseSlot, type CaseSpan, type CaseWorking } from '../../core'
import { describeNextCase } from '../caseLabels'
import { CASE_RESULT_HOLD_MS, CASE_SETTLED_AT } from '../caseTiming'
import type { Cases as CasesState } from '../useCases'
import { CasesPage } from './CasesPage'

/* Cases' page. CHST ids refer to wiki/cases.md. */

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  Reflect.deleteProperty(window, 'matchMedia')
})

/** Less motion, so an opening lands in one go and the test need not wait. */
function atOnce() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({ matches: query.includes('prefers-reduced-motion'), media: query }),
  })
}

/** The page with practice held above it, as the screen holds it for Settings (CHST-21). */
function Practising({ cases, from }: { cases: CasesState; from: boolean }) {
  const [practising, setPractising] = useState(from)
  return <CasesPage cases={cases} practising={practising} onPractisingChange={setPractising} />
}

/** Later today, so the countdown is still this day's Drop (CHST-29). */
const LATER = (() => {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return new Date(Math.min(now.getTime() + 3_600_000, end.getTime()))
})()

/** What the page shows when the test does not say: a ready Today case, and a daily one still on its clock. */
function slotsFor(blocked: CasesState['blocked']): readonly CaseSlot[] {
  if (blocked === 'opened') return []
  if (blocked === null) return [
    { source: 'today', state: 'ready', at: null },
    { source: 'daily', state: 'waiting', at: LATER },
  ]
  if (blocked === 'bonusWaiting') return [{ source: 'daily', state: 'waiting', at: LATER }]
  return [
    { source: 'today', state: 'waiting', at: null },
    { source: 'daily', state: 'waiting', at: LATER },
  ]
}

/** A working whose range runs from 1 up to `most`, enough for a page that never opens the i. */
function workingsFor(most: number): Record<CaseWorking['source'], CaseWorking> {
  const span = { least: 1, most }
  return {
    today: { source: 'today', cheapest: 1, earned: most * 2, half: most, span },
    daily: { source: 'daily', earned: most, tasks: 1, share: most, span },
    week: { source: 'week', cheapest: 1, earned: most, tasks: 1, share: most, span },
  }
}

function setup(over: Partial<CasesState> = {}, { practising = false } = {}) {
  const open = vi.fn(() => ({ points: 2, jackpot: 20 }))
  const blocked = over.blocked === undefined ? null : over.blocked
  const jackpot = over.jackpot ?? 20
  const span = (most: number): CaseSpan => ({ least: 1, most })
  const cases: CasesState = {
    isLoading: false,
    settings: DEFAULT_CASES,
    jackpot,
    spans: { today: span(jackpot), daily: span(jackpot), week: span(jackpot) },
    blocked,
    dayAsked: 2,
    opened: null,
    lastQuarter: null,
    sound: false,
    setSound: vi.fn(),
    open,
    setSettings: vi.fn(),
    unannounced: false,
    announce: vi.fn(),
    dailyNotice: false,
    dismissDailyNotice: vi.fn(),
    shareNotice: false,
    announceShare: vi.fn(),
    ...over,
    keyTimer: over.keyTimer ?? { remainingMs: null, way: null, at: null },
    slots: over.slots ?? slotsFor(blocked),
    workings: over.workings ?? workingsFor(jackpot),
  }
  render(<Practising cases={cases} from={practising} />)
  return { user: userEvent.setup(), open, cases }
}

/** One case card. The name also appears in the waiting line, so the card is the list item that holds it. */
function caseCard(name: string): HTMLElement {
  for (const node of screen.getAllByText(name)) {
    const card = node.closest('li')
    if (card !== null) return card
  }
  throw new Error('no case')
}

/** The words on one case card. */
function caseText(name: string): string {
  return caseCard(name).textContent ?? ''
}

describe('what the page says', () => {
  it('says the rules, and how each reward is worked out, behind the i (CHST-22)', async () => {
    const { user } = setup({
      workings: {
        today: { source: 'today', cheapest: 4, earned: 41, half: 20, span: { least: 4, most: 20 } },
        daily: { source: 'daily', earned: 37, tasks: 2, share: 18, span: { least: 1, most: 18 } },
        week: { source: 'week', cheapest: 4, earned: 28, tasks: 3, share: 9, span: { least: 4, most: 9 } },
      },
    })

    await user.click(screen.getByRole('button', { name: 'About Cases' }))
    const sheet = screen.getByRole('dialog', { name: 'Cases' })
    expect(within(sheet).getByRole('heading', { name: 'Payday' })).toBeTruthy()
    expect(within(sheet).getByText(/depends on what you finish today/)).toBeTruthy()
    expect(within(sheet).getByText('The cheapest task finished today is 4 points. Everything earned today is 41 points, so half is 20 points. Payday pays 4 to 20 points.')).toBeTruthy()
    expect(within(sheet).getByRole('heading', { name: 'Drop' })).toBeTruthy()
    expect(within(sheet).getByText(/depends on yesterday/)).toBeTruthy()
    expect(within(sheet).getByText('Yesterday earned 37 points across 2 tasks, which comes to 18 points. The Drop pays 1 to 18 points.')).toBeTruthy()
    expect(within(sheet).getByRole('heading', { name: 'Weekly' })).toBeTruthy()
    expect(within(sheet).getByText(/depends on last week/)).toBeTruthy()
    expect(within(sheet).getByText('The cheapest task finished last week is 4 points. Last week earned 28 points across 3 tasks, which comes to 9 points. Weekly pays 4 to 9 points.')).toBeTruthy()
    expect(within(sheet).getByText(/as likely as any other/)).toBeTruthy()
  })

  it('shows a possible win only on a case that can be opened (CHST-26, CHST-28)', () => {
    setup({
      jackpot: 40,
      spans: {
        today: { least: 4, most: 20 },
        daily: { least: 1, most: 7 },
        week: { least: 3, most: 8 },
      },
    })

    expect(caseText('Payday')).toContain('4–20')
    expect(caseText('Payday')).toContain('From the cheapest task today, up to half of today’s rewards.')
    expect(caseText('Drop')).not.toContain('1–7')
    expect(screen.getAllByText('Possible win')).toHaveLength(1)
    const today = caseCard('Payday')
    const daily = caseCard('Drop')
    expect(today?.className).toContain('row-span-4')
    expect(daily?.className).toContain('row-span-4')
    expect(today?.querySelector('.case-card-win')?.textContent).toContain('Possible win')
    expect(daily?.querySelector('.case-card-win')?.textContent).toBe('')
    expect(caseText('Drop')).toContain(
      'Arrives once a day, at a random time. Reward depends on yesterday: from 1 point, up to yesterday’s rewards divided by yesterday’s tasks.',
    )
    const timer = screen.getByRole('timer', { name: 'Time until the Drop' })
    expect(timer.closest('.aspect-\\[5\\/4\\]')).toBeTruthy()
    expect(timer.closest('.opacity-50')).toBeNull()
    expect(screen.queryByText('The most is everything you earned today.')).toBeNull()
  })

  it('says 1 point on a ready case when nothing has been earned (CHST-26)', () => {
    setup({ jackpot: 1 })

    expect(caseText('Payday')).toContain('1point')
    expect(caseText('Payday')).not.toContain('1points')
  })

  it('shows a planned case dimmed, with no possible win, while it is not available (CHST-28)', () => {
    setup({ blocked: 'unclear', jackpot: 1 })

    expect(screen.queryByText('Possible win')).toBeNull()
    expect(document.querySelector('.case-card-win')).toBeNull()
    expect(caseCard('Payday').className).toContain('row-span-3')
    expect(caseText('Payday')).toContain(
      'Finish everything in Today and a case is yours. Reward depends on the cheapest task today, up to half of today’s rewards.',
    )
    expect(caseText('Drop')).toContain('Reward depends on yesterday: from 1 point, up to yesterday’s rewards divided by yesterday’s tasks.')
    const today = caseCard('Payday')
    expect(today.querySelector('button')).toBeNull()
    expect(today.querySelector('.opacity-50')).toBeTruthy()
    expect(within(today).getByText('Today', { selector: 'strong' }).className).toContain('font-semibold')
  })

  it('keeps the cabinet off the page until a case is opened (CHST-13)', () => {
    setup({ jackpot: 25 })

    expect(document.querySelector('.case-stage')).toBeNull()
    expect(screen.queryByText('Press to open')).toBeNull()
  })

  it('opens the case that is pressed, with no frame around it (CHST-13, CHST-28)', async () => {
    atOnce()
    const { user, open } = setup({
      jackpot: 25,
      slots: [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'ready', at: null },
      ],
    })
    const daily = screen.getByRole('button', { name: /Open the Drop case/ })

    expect(daily.getAttribute('aria-pressed')).toBeNull()
    expect(daily.className).not.toContain('ring-2')
    expect(document.querySelector('.case-stage')).toBeNull()

    await user.click(daily)

    expect(open).toHaveBeenCalledExactlyOnceWith('daily')
    expect(document.querySelector('.case-stage')).toBeTruthy()
    expect(within(screen.getByRole('status')).getByText('+2')).toBeTruthy()
  })

  it('opens one case at a time while the cabinet is still opening (CHST-16)', () => {
    const { open } = setup({
      slots: [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'ready', at: null },
      ],
    })

    fireEvent.click(screen.getByRole('button', { name: /Open the Payday case/ }))
    fireEvent.click(screen.getByRole('button', { name: /Open the Drop case/ }))

    expect(open).toHaveBeenCalledExactlyOnceWith('today')
    expect(screen.getByRole('button', { name: /Open the Drop case/ }).getAttribute('aria-disabled')).toBe('true')
  })

  it('keeps an opened case until the day ends, dimmed, with the lid open, and says when the next one appears (CHST-25, CHST-28)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 4, 15, 0))
    setup({
      blocked: 'opened',
      opened: { taskId: 'case-today', day: '2026-10-04', points: 9 },
      lastQuarter: 2,
      slots: [
        { source: 'today', state: 'opened', at: null },
        { source: 'daily', state: 'opened', at: null },
      ],
    })

    expect(document.querySelector('.case-stage')).toBeNull()
    expect(screen.queryByText('Payday gave +9.')).toBeNull()
    expect(screen.queryByRole('button', { name: /Open the Payday case/ })).toBeNull()
    expect(screen.queryByText('Possible win')).toBeNull()
    expect(screen.queryByText('Opened.')).toBeNull()

    const today = screen.getByText('Payday').closest('li')
    expect(caseText('Payday')).toContain('Take the next one tomorrow after completing all planned tasks.')
    expect(today?.querySelector('.opacity-40')).toBeTruthy()
    expect(today?.querySelector('.case-lid-open')).toBeTruthy()
    expect(today?.querySelector('button')).toBeNull()
    expect(caseText('Drop')).toContain(describeNextCase('daily'))
    expect(caseText('Drop')).toContain('Earn more points today to increase reward.')
    expect(caseText('Payday')).not.toContain('Earn more points today')
    expect(caseText('Drop')).not.toContain('Opened')
  })

  it('takes the cabinet away once a show with no reel has been read (CHST-18, CHST-25)', () => {
    atOnce()
    vi.useFakeTimers()
    setup({
      slots: [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'ready', at: null },
      ],
    })

    fireEvent.click(screen.getByRole('button', { name: /Open the Payday case/ }))
    expect(document.querySelector('.case-stage')).toBeTruthy()
    expect(within(screen.getByRole('status')).getByText('+2')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(CASE_RESULT_HOLD_MS - 1)
    })
    expect(document.querySelector('.case-stage')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(document.querySelector('.case-stage')).toBeNull()
  })

  it('takes the cabinet away when the opening has settled (CHST-25)', () => {
    vi.useFakeTimers()
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof getContext
    try {
      setup({
        slots: [
          { source: 'today', state: 'ready', at: null },
          { source: 'daily', state: 'ready', at: null },
        ],
      })

      fireEvent.click(screen.getByRole('button', { name: /Open the Drop case/ }))
      expect(document.querySelector('.case-stage')).toBeTruthy()

      act(() => {
        vi.advanceTimersByTime(CASE_SETTLED_AT)
      })
      expect(document.querySelector('.case-stage')).toBeNull()
    } finally {
      HTMLCanvasElement.prototype.getContext = getContext
    }
  })

  it('leaves the cabinet off the page while a case is still ready, even after one was opened (CHST-13)', () => {
    setup({
      opened: { taskId: 'cases', day: '2026-10-04', points: 9 },
      slots: [{ source: 'daily', state: 'ready', at: null }],
    })

    expect(document.querySelector('.case-stage')).toBeNull()
    expect(screen.queryByText('Payday gave +9.')).toBeNull()
  })

  it('lists no table of chances, only what each case can give', () => {
    setup()

    expect(screen.queryByText('What a case can hold')).toBeNull()
    expect(screen.queryByText('JACKPOT')).toBeNull()
  })
})

describe('practice', () => {
  it('has no switch on the page, and says nothing of practice while it is off (CHST-21)', () => {
    setup()

    expect(screen.queryByRole('switch', { name: 'Practice mode' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Practice mode' })).toBeNull()
    expect(screen.queryByText('Practice — nothing is earned')).toBeNull()
  })

  it('opens Cases as often as you like and earns nothing (CHST-21)', async () => {
    atOnce()
    const { user, open } = setup({ blocked: 'unclear' }, { practising: true })

    expect(screen.queryByText('Practice — nothing is earned')).toBeNull()

    const today = screen.getByRole('button', { name: /Open the Payday case/ })
    await user.click(today)
    expect(screen.getByText('Practice — nothing is earned')).toBeTruthy()
    await user.click(today)
    await user.click(today)

    // Nothing reached the ledger: a practice opening is drawn and written nowhere.
    expect(open).not.toHaveBeenCalled()
    expect(screen.getByText(/^3 openings, [\d.]+ points each on average\.$/)).toBeTruthy()
  })

  it('can be turned off on the page, leaving a practice opening behind (CHST-21)', async () => {
    atOnce()
    const { user } = setup({}, { practising: true })

    await user.click(screen.getByRole('button', { name: /Open the Payday case/ }))
    expect(within(screen.getByRole('status')).getByText(/^\+\d+$/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Turn practice off' }))

    expect(screen.queryByText(/^\+\d+$/)).toBeNull()
    expect(screen.queryByText('Practice — nothing is earned')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Practice mode' })).toBeNull()
  })

  it('counts the openings by quarter of the jackpot, so the odds can be eyed (CHST-21)', async () => {
    atOnce()
    const { user } = setup({}, { practising: true })

    await user.click(screen.getByRole('button', { name: /Open the Payday case/ }))

    const counted = screen
      .getAllByRole('listitem')
      .map((line) => line.textContent)
      .filter((text) => text?.includes(': '))

    expect(counted).toHaveLength(4)
    expect(counted.join(' ')).toMatch(/: 1/)
  })

  it('offers a bigger jackpot to try, the real one being too small to tell the quarters apart', async () => {
    atOnce()
    const { user } = setup({}, { practising: true })

    const box = screen.getByRole('spinbutton')
    await user.clear(box)
    await user.type(box, '400')

    expect(caseText('Payday')).toContain('1–400')
    expect(caseText('Drop')).toContain('1–400')
    expect(caseText('Weekly')).toContain('1–400')
    expect(caseText('Drop')).toContain('From 1 point, up to yesterday’s rewards divided by yesterday’s tasks.')
  })

  it('offers to skip the wait, so thirty openings do not cost three minutes of reels', () => {
    setup({}, { practising: true })

    expect(screen.getByRole('checkbox', { name: 'Skip the wait' })).toBeTruthy()
  })
})

describe('how the points read', () => {
  it('says one point rather than one points', () => {
    setup({ jackpot: 1 })

    expect(document.body.textContent).not.toContain('1 points')
    expect(document.body.textContent).not.toContain('1points')
  })

  it('shows every case ready in practice, even while the day is not clear (CHST-21, CHST-26)', () => {
    setup({ blocked: 'unclear', jackpot: 25 }, { practising: true })

    expect(screen.getAllByText('Possible win')).toHaveLength(3)
    expect(screen.getByRole('button', { name: /Open the Weekly case/ })).toBeTruthy()
    expect(screen.queryByRole('timer')).toBeNull()
  })

  it('shows Weekly planned and dimmed until Monday, with no timer and no possible win (CHST-28, CHST-30)', () => {
    setup({
      slots: [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'waiting', at: LATER },
        { source: 'week', state: 'waiting', at: null },
      ],
    })

    const weekly = caseCard('Weekly')
    expect(caseText('Weekly')).toContain(
      'Arrives on Monday. Reward depends on last week: from the cheapest task last week, up to last week’s rewards divided by last week’s tasks.',
    )
    expect(weekly.querySelector('button')).toBeNull()
    expect(weekly.querySelector('.opacity-50')).toBeTruthy()
    expect(caseText('Weekly')).not.toContain('Possible win')
    expect(within(weekly).queryByRole('timer')).toBeNull()
  })

  it('shows Weekly ready on Monday, with last week’s range (CHST-30)', () => {
    setup({
      slots: [
        { source: 'today', state: 'waiting', at: null },
        { source: 'daily', state: 'waiting', at: LATER },
        { source: 'week', state: 'ready', at: null },
      ],
      spans: {
        today: { least: 1, most: 1 },
        daily: { least: 1, most: 1 },
        week: { least: 3, most: 8 },
      },
    })

    expect(caseText('Weekly')).toContain('3–8')
    expect(caseText('Weekly')).toContain('From the cheapest task last week, up to last week’s rewards divided by last week’s tasks.')
    expect(screen.getByRole('button', { name: /Open the Weekly case/ })).toBeTruthy()
    expect(caseCard('Weekly').querySelector('.opacity-50')).toBeNull()
  })
})

