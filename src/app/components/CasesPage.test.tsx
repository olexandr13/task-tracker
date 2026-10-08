// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CASES, type CaseSlot, type CaseSource, type CaseSpan, type OpenedCase } from '../../core'
import { describeNextCase } from '../caseLabels'
import { CASE_LEAVE_MS, CASE_LINGER_MS, CASE_RESULT_HOLD_MS, CASE_SETTLED_AT } from '../caseTiming'
import type { Cases as CasesState } from '../useCases'
import { CasesPage } from './CasesPage'

/* Cases' page. CHST ids refer to wiki/cases.md. */

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  Reflect.deleteProperty(window, 'matchMedia')
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
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

/** What the page is handed, wherever the test does not say otherwise. */
function casesFor(over: Partial<CasesState> = {}): CasesState {
  const blocked = over.blocked === undefined ? null : over.blocked
  const jackpot = over.jackpot ?? 20
  const span = (most: number): CaseSpan => ({ least: 1, most })
  return {
    isLoading: false,
    settings: DEFAULT_CASES,
    jackpot,
    spans: { today: span(jackpot), daily: span(jackpot), week: span(jackpot) },
    blocked,
    dayAsked: 2,
    opened: null,
    openings: [],
    lastQuarter: null,
    sound: false,
    setSound: vi.fn(),
    open: vi.fn(() => ({ points: 2, jackpot: 20 })),
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
  }
}

function setup(over: Partial<CasesState> = {}, { practising = false } = {}) {
  const open = vi.fn(() => ({ points: 2, jackpot: 20 }))
  const cases = casesFor({ open, ...over })
  render(<Practising cases={cases} from={practising} />)
  return { user: userEvent.setup(), open, cases }
}

/**
 * The page over a ledger that takes an opening the moment its case is pressed,
 * as the real one does: the row is there before the reel has run (CHST-16).
 */
function Ledgered({ cases }: { cases: CasesState }) {
  const [openings, setOpenings] = useState<readonly OpenedCase[]>(cases.openings)
  const open = (source: CaseSource = 'today') => {
    setOpenings((before) => [...before, { source, points: 2 }])
    return { points: 2, jackpot: 20 }
  }
  return <CasesPage cases={{ ...cases, openings, open }} practising={false} onPractisingChange={() => {}} />
}

/** The rows of what today's cases gave, as they read, or null while there is no list. */
function openedToday(): (string | null)[] | null {
  const list = screen.queryByRole('region', { name: 'Opened today' })
  if (list === null) return null
  return within(list).getAllByRole('listitem').map((row) => row.textContent)
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
  it('says how each case is worked out behind the i, in general (CHST-22)', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'About Cases' }))
    const sheet = screen.getByRole('dialog', { name: 'How much each case pays' })
    expect(within(sheet).getByRole('heading', { name: 'How much each case pays' })).toBeTruthy()
    // A card for each case, its least and most beside "Min" and "Max".
    const rule = (name: string) => {
      const card = within(sheet).getByRole('region', { name })
      expect(within(card).getByRole('heading', { name })).toBeTruthy()
      const terms = within(card).getAllByRole('term').map((term) => term.textContent)
      const values = within(card).getAllByRole('definition').map((value) => value.textContent)
      return terms.map((term, index) => `${term ?? ''}: ${values[index] ?? ''}`)
    }
    expect(rule('Payday')).toEqual([
      'Min: Cheapest task finished today',
      'Max: Half of points earned today + number of unrewarded tasks done',
    ])
    expect(rule('Drop')).toEqual([
      'Min: 0',
      'Max: Yesterday’s average task value + number of tasks done',
    ])
    expect(rule('Weekly')).toEqual([
      'Min: Cheapest task finished last week',
      'Max: Last week’s average task value + number of tasks done',
    ])
    // Nothing follows the three cases.
    expect(within(sheet).queryByText(/The average counts/)).toBeNull()
    expect(within(sheet).queryByText(/Only tasks with points/)).toBeNull()
    // What a waiting case says under it is not said again here.
    expect(within(sheet).queryByText('Arrives once a day, at a random time.')).toBeNull()
  })

  it('names only tasks with points while tasks without them are not counted (CHST-32)', async () => {
    const { user } = setup({
      settings: { ...DEFAULT_CASES, countUnpaid: false },
      slots: [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'ready', at: null },
        { source: 'week', state: 'ready', at: null },
      ],
    })

    expect(caseText('Payday')).toContain('From the cheapest task today, up to half of today’s rewards.')
    expect(caseText('Drop')).toContain('Earn more points today to get a bigger reward tomorrow.')
    expect(caseText('Weekly')).toContain(
      'From the cheapest task last week, up to last week’s average task plus last week’s tasks with points.',
    )

    await user.click(screen.getByRole('button', { name: 'About Cases' }))
    const sheet = screen.getByRole('dialog', { name: 'How much each case pays' })
    const max = (name: string) => within(within(sheet).getByRole('region', { name })).getAllByRole('definition')[1]?.textContent
    expect(max('Payday')).toBe('Half of points earned today')
    expect(max('Drop')).toBe('Yesterday’s average task value + number of rewarded tasks done')
    expect(max('Weekly')).toBe('Last week’s average task value + number of rewarded tasks done')
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
    expect(caseText('Payday')).toContain('From the cheapest task today, up to half of today’s rewards plus today’s tasks without points.')
    expect(caseText('Drop')).not.toContain('1–7')
    expect(screen.getAllByText('Possible win')).toHaveLength(1)
    const today = caseCard('Payday')
    const daily = caseCard('Drop')
    expect(today?.className).toContain('row-span-3')
    expect(daily?.className).toContain('row-span-3')
    const win = today?.querySelector('.case-card-win')
    expect(win?.textContent).toContain('Possible win')
    expect(win?.closest('.case-card-plate')).toBe(today?.querySelector('.case-card-plate'))
    expect(win?.closest('.case-card-head')).toBe(today?.querySelector('.case-card-head'))
    expect(daily?.querySelector('.case-card-head')).toBeTruthy()
    expect(daily?.querySelector('.case-card-win')).toBeNull()
    expect(caseText('Drop')).toContain(
      'Arrives once a day, at a random time. Reward depends on number of points earned yesterday.',
    )
    const timer = screen.getByRole('timer', { name: 'Time until the Drop' })
    expect(timer.closest('.case-card-tag')).toBe(daily?.querySelector('.case-card-tag'))
    expect(timer.closest('.opacity-50, .opacity-40')).toBeNull()
    // The ready case keeps its colour; the planned one beside it does not.
    expect(today?.querySelector('.grayscale')).toBeNull()
    expect(today?.querySelector('.case-card-tag')).toBeNull()
    expect(daily?.querySelector('.grayscale')).toBeTruthy()
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
    expect(document.querySelector('.case-card-head')).toBeNull()
    expect(caseCard('Payday').className).toContain('row-span-3')
    expect(caseText('Payday')).toContain(
      'Finish everything in Today to get this case. Reward depends on number of points earned today.',
    )
    expect(caseText('Drop')).toContain('Reward depends on number of points earned yesterday.')
    const today = caseCard('Payday')
    expect(today.querySelector('button')).toBeNull()
    expect(today.querySelector('.opacity-50')).toBeTruthy()
    expect(within(today).getByText('Today', { selector: 'strong' }).className).toContain('font-semibold')
  })

  it('says on a planned Payday how many tasks are left before it is ready, on its padlock (CHST-31)', () => {
    setup({
      slots: [
        { source: 'today', state: 'waiting', at: null, tasksLeft: 3 },
        { source: 'daily', state: 'waiting', at: LATER },
      ],
    })

    const today = caseCard('Payday')
    const lock = today.querySelector('.case-card-tag')
    expect(lock?.textContent).toContain('3 tasks left')
    expect(lock?.closest('.case-card-plate')).toBe(today.querySelector('.case-card-plate'))
    // The crate under it is grey and faded; the padlock stays solid.
    expect(today.querySelector('.grayscale')?.querySelector('svg')).toBeTruthy()
    expect(lock?.closest('.opacity-50, .opacity-40')).toBeNull()
    expect(within(today).queryByRole('timer')).toBeNull()
    cleanup()

    setup({ slots: [{ source: 'today', state: 'waiting', at: null, tasksLeft: 1 }] })
    expect(caseText('Payday')).toContain('1 task left')
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

  it('brings the cabinet into view when a case is pressed, below the fold on a phone (CHST-13)', async () => {
    atOnce()
    const scrolled = vi.fn<(this: HTMLElement, options?: ScrollIntoViewOptions) => void>(function (this: HTMLElement) {})
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrolled })
    const { user } = setup()

    expect(scrolled).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Open the Payday case/ }))

    expect(scrolled).toHaveBeenCalledOnce()
    expect(scrolled.mock.contexts[0].querySelector('.case-stage')).toBeTruthy()
    expect(scrolled.mock.calls[0][0]).toEqual({ block: 'nearest', behavior: 'auto' })
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

  it('keeps an opened case until the day ends, dimmed, with the lid open, tagged Opened, and says when the next one appears (CHST-25, CHST-28)', () => {
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
    expect(within(caseCard('Payday')).getByText('Opened')).toBeTruthy()
    expect(within(caseCard('Drop')).getByText('Opened')).toBeTruthy()
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
    expect(document.querySelector('.case-off')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    // Switching off, and still there until it has.
    expect(document.querySelector('.case-stage.case-off')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(CASE_LEAVE_MS)
    })
    expect(document.querySelector('.case-stage')).toBeNull()
  })

  it('starts a fresh show for a case pressed while the last cabinet is going (CHST-25)', () => {
    atOnce()
    vi.useFakeTimers()
    setup({
      slots: [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'ready', at: null },
      ],
    })

    fireEvent.click(screen.getByRole('button', { name: /Open the Payday case/ }))
    act(() => {
      vi.advanceTimersByTime(CASE_RESULT_HOLD_MS)
    })
    expect(document.querySelector('.case-off')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Open the Drop case/ }))
    expect(document.querySelector('.case-stage')).toBeTruthy()
    expect(document.querySelector('.case-off')).toBeNull()
    expect(document.querySelector('.case-closing')).toBeNull()

    // The last one's going never takes the new one with it.
    act(() => {
      vi.advanceTimersByTime(CASE_LEAVE_MS)
    })
    expect(document.querySelector('.case-stage')).toBeTruthy()
    expect(document.querySelector('.case-off')).toBeNull()
  })

  it('takes the cabinet away a moment after the opening has settled (CHST-25)', () => {
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
        vi.advanceTimersByTime(CASE_SETTLED_AT + CASE_LINGER_MS - 1)
      })
      // The number stays up a moment more to be read.
      expect(document.querySelector('.case-stage')).toBeTruthy()
      expect(document.querySelector('.case-off')).toBeNull()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(document.querySelector('.case-stage.case-off')).toBeTruthy()
      expect(document.querySelector('.case-closing')).toBeTruthy()

      act(() => {
        vi.advanceTimersByTime(CASE_LEAVE_MS)
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

  it('lists what each case opened today gave, under the cases (CHST-33)', () => {
    setup({
      blocked: 'opened',
      openings: [
        { source: 'today', points: 9 },
        { source: 'daily', points: 0 },
      ],
      slots: [
        { source: 'today', state: 'opened', at: null },
        { source: 'daily', state: 'opened', at: null },
        { source: 'week', state: 'waiting', at: LATER },
      ],
    })

    const list = screen.getByRole('region', { name: 'Opened today' })
    expect(within(list).getByRole('heading', { name: 'Opened today' })).toBeTruthy()
    // Nothing gained has no sign.
    expect(openedToday()).toEqual(['Payday+9 points', 'Drop0 points'])
    // Only to read: deleting an earning is History's (RWD-44).
    expect(within(list).queryByRole('button')).toBeNull()
  })

  it('lists nothing while no case has been opened today (CHST-33)', () => {
    setup()

    expect(openedToday()).toBeNull()
  })

  it('lists what a case gave once its reel has stopped, not while it runs (CHST-16, CHST-33)', () => {
    vi.useFakeTimers()
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof getContext
    try {
      const cases = casesFor({
        openings: [{ source: 'today', points: 9 }],
        slots: [
          { source: 'today', state: 'opened', at: null },
          { source: 'daily', state: 'ready', at: null },
        ],
      })
      render(<Ledgered cases={cases} />)
      expect(openedToday()).toEqual(['Payday+9 points'])

      fireEvent.click(screen.getByRole('button', { name: /Open the Drop case/ }))
      // Written already, and still not said: the reel is running.
      expect(openedToday()).toEqual(['Payday+9 points'])

      act(() => {
        vi.advanceTimersByTime(CASE_SETTLED_AT)
      })
      expect(openedToday()).toEqual(['Payday+9 points', 'Drop+2 points'])
    } finally {
      HTMLCanvasElement.prototype.getContext = getContext
    }
  })

  it('lists no table of chances, only what each case can give', () => {
    setup()

    expect(screen.queryByText('What a case can hold')).toBeNull()
    expect(screen.queryByText('JACKPOT')).toBeNull()
  })
})

describe('practice', () => {
  it('lists none of the day’s openings, every case being ready afresh (CHST-21, CHST-33)', () => {
    setup({ openings: [{ source: 'today', points: 9 }] }, { practising: true })

    expect(openedToday()).toBeNull()
  })

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
    expect(caseText('Drop')).toContain('Earn more points today to get a bigger reward tomorrow.')
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

  it('shows Weekly planned and dimmed until Monday, counting down to it, with no possible win (CHST-28, CHST-30)', () => {
    // Two days and five hours away, and half a minute, so the count cannot tip over mid-test.
    const monday = new Date(Date.now() + (2 * 24 + 5) * 3_600_000 + 30_000)
    setup({
      slots: [
        { source: 'today', state: 'ready', at: null },
        { source: 'daily', state: 'waiting', at: LATER },
        { source: 'week', state: 'waiting', at: monday },
      ],
    })

    const weekly = caseCard('Weekly')
    expect(caseText('Weekly')).toContain(
      'Appears weekly on Monday. Reward depends on number of points earned last week.',
    )
    expect(weekly.querySelector('button')).toBeNull()
    expect(weekly.querySelector('.opacity-50')).toBeTruthy()
    expect(caseText('Weekly')).not.toContain('Possible win')
    const timer = within(weekly).getByRole('timer', { name: 'Time until Weekly' })
    expect(timer.textContent).toContain('2d 5h')
    expect(timer.closest('.opacity-50')).toBeNull()
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
    expect(caseText('Weekly')).toContain('From the cheapest task last week, up to last week’s average task plus last week’s tasks.')
    expect(screen.getByRole('button', { name: /Open the Weekly case/ })).toBeTruthy()
    expect(caseCard('Weekly').querySelector('.opacity-50')).toBeNull()
  })
})

