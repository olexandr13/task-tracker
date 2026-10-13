// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createList, type FeaturesOff, type List } from '../../core'
import { FeaturesContext } from '../features'
import { oneListView, type SectionView, type View } from '../view'
import { SectionNav } from './SectionNav'

/* The strip across a section's pages. UI ids refer to wiki/interface.md, RWD ids to wiki/rewards.md,
   MODE ids to wiki/modes.md, CHST ids to wiki/cases.md, FEAT ids to wiki/features.md. */

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const WORK = createList('Work', new Date('2026-09-01T00:00:00.000Z'))
const HOME = createList('Home', new Date('2026-09-02T00:00:00.000Z'))

function setup(
  section: SectionView,
  view: View,
  { lists = [], off = [], keyWaiting = false }: { lists?: readonly List[]; off?: FeaturesOff; keyWaiting?: boolean } = {},
) {
  const onChange = vi.fn()
  render(
    <FeaturesContext value={off}>
      <SectionNav section={section} view={view} lists={lists} keyWaiting={keyWaiting} onChange={onChange} />
    </FeaturesContext>,
  )
  return { user: userEvent.setup(), onChange }
}

const pills = () => screen.getAllByRole('button').map((button) => button.textContent.replace(/\p{Extended_Pictographic}/gu, ''))
const marked = () => screen.getAllByRole('button').filter((button) => button.getAttribute('aria-current') === 'page')

describe('SectionNav (UI-84)', () => {
  it('lists every rewards page, the one you are on marked (RWD-30)', () => {
    setup('rewards', 'rewards/wishlist')

    expect(pills()).toEqual(['Rewards', 'Cases', 'History', 'Prizes', 'Wishlist', 'Rules'])
    expect(marked().map((button) => button.textContent)).toEqual(['Wishlist'])
  })

  it('lists Modes and each mode, in the order the page lists them (MODE-2, MODE-7)', () => {
    setup('modes', 'modes/nudge')

    expect(screen.getByRole('navigation', { name: 'Modes' })).toBeDefined()
    expect(pills()).toEqual(['Modes', 'Procrastination', 'Warm-up', 'Nudge', 'Check-in'])
    expect(screen.getByRole('button', { name: 'Nudge' }).getAttribute('aria-current')).toBe('page')
  })

  it('lists Organize with Tags and the notes, and no Modes (UI-81)', () => {
    setup('organize', 'notes')

    expect(pills()).toEqual(['Organize', 'Tags', 'Notes'])
    expect(marked().map((button) => button.textContent)).toEqual(['Notes'])
  })

  it('lists Reflect with Balance, the activity log and the journal (UI-83)', () => {
    setup('reflect', 'reflect')

    expect(pills()).toEqual(['Reflect', 'Balance', 'Activity log', 'Journal'])
    expect(marked().map((button) => button.textContent)).toEqual(['Reflect'])
  })

  it('lists Lists with the Inbox and every list in the sidebar\'s order, by name (LST-13)', () => {
    setup('lists', oneListView(HOME.id), { lists: [HOME, WORK] })

    expect(pills()).toEqual(['Lists', 'Inbox', 'Work', 'Home'])
    expect(marked().map((button) => button.textContent)).toEqual(['Home'])
  })

  it('goes to another page of the section', async () => {
    const { user, onChange } = setup('lists', 'inbox', { lists: [WORK] })

    await user.click(screen.getByRole('button', { name: 'Work' }))
    await user.click(screen.getByRole('button', { name: 'Lists' }))

    expect(onChange.mock.calls).toEqual([[oneListView(WORK.id)], ['lists']])
  })

  it('marks Cases while a key is waiting (CHST-22)', () => {
    setup('rewards', 'rewards', { keyWaiting: true })

    expect(screen.getByRole('button', { name: /^Cases/ }).textContent).toContain('a key is waiting')
  })

  it('has no pill for a page switched off (FEAT-2)', () => {
    setup('reflect', 'balance', { off: ['journal'] })

    expect(pills()).toEqual(['Reflect', 'Balance', 'Activity log'])
  })

  it('draws nothing when nothing under the section is left to go to (FEAT-2)', () => {
    // Balance goes with the tags it divides time by (FEAT-4): Reflect alone would be one pill going nowhere.
    setup('reflect', 'reflect', { off: ['tags', 'activity', 'journal'] })

    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('stays on a wide screen, beside the sidebar (UI-30)', () => {
    setup('rewards', 'rewards')

    const classes = screen.getByRole('navigation', { name: 'Rewards' }).className.split(' ')
    expect(classes).not.toContain('hidden')
    expect(classes).not.toContain('md:hidden')
  })

  it('brings the pill of the page you are on into the strip, past the edge of a phone (UI-84)', () => {
    // jsdom lays nothing out: the strip is 300 wide, and Check-in's pill drawn past its right edge.
    const rect = (left: number, right: number) => ({ left, right }) as DOMRect
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'NAV' ? rect(0, 300) : rect(380, 460)
    })
    setup('modes', 'modes/check-in')

    expect(screen.getByRole('navigation', { name: 'Modes' }).scrollLeft).toBe(460 - 300 + 16)
  })

  it('leaves the strip where it is when the pill is in sight already (UI-84)', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return (this.tagName === 'NAV' ? { left: 0, right: 300 } : { left: 20, right: 90 }) as DOMRect
    })
    setup('modes', 'modes')

    expect(screen.getByRole('navigation', { name: 'Modes' }).scrollLeft).toBe(0)
  })

  it('cuts a long list name short rather than widening its pill (UI-84)', () => {
    const long = createList('A list with a rather long name for tests', new Date('2026-09-03T00:00:00.000Z'))
    setup('lists', 'lists', { lists: [long] })

    const name = screen.getByText(long.name)
    expect(name.className).toContain('truncate')
  })
})
