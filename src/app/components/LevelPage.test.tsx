// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { levelOf } from '../../core'
import type { XpStanding } from '../useXp'
import { LevelPage } from './LevelPage'

/* The Level page. LVL ids refer to wiki/levels.md. */

afterEach(cleanup)

// Thursday 17 September 2026, nine in the morning.
const NOW = new Date(2026, 8, 17, 9, 0)

function standing(total: number): XpStanding {
  return { total, level: levelOf(total) }
}

function page(given: XpStanding | null, failed = false) {
  render(<LevelPage standing={given} failed={failed} startedOn="2026-09-15" now={NOW} />)
}

describe('LevelPage', () => {
  it('shows the level, how far into it, and the XP in all (LVL-10)', () => {
    page(standing(130))

    const level = within(screen.getByRole('region', { name: 'Your level' }))
    expect(level.getByText('Level 1')).toBeDefined()
    expect(level.getByText('130 XP in all')).toBeDefined()
    const bar = level.getByRole('progressbar', { name: 'Progress to level 2' })
    expect(bar.getAttribute('aria-valuetext')).toBe('30 / 110 XP to level 2')
  })

  it('starts at level 0', () => {
    page(standing(0))
    expect(screen.getByText('Level 0')).toBeDefined()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('0 / 100 XP to level 1')
  })

  it('keeps no history to show', () => {
    page(standing(130))
    expect(screen.queryByRole('region', { name: 'XP history' })).toBeNull()
  })

  it('explains behind its i what gives XP and what takes it away, and how much (LVL-15)', async () => {
    const user = userEvent.setup()
    page(standing(0))

    await user.click(screen.getByRole('button', { name: 'About Level' }))

    const sheet = within(screen.getByRole('dialog', { name: 'How XP works' }))
    const gains = within(sheet.getByRole('table', { name: 'What gives XP' }))
    expect(gains.getByRole('row', { name: 'Clear everything this month +100' })).toBeDefined()
    expect(gains.getByRole('row', { name: 'Add a task (the first 10 a day count) +1' })).toBeDefined()
    const losses = within(sheet.getByRole('table', { name: 'What takes XP away' }))
    expect(losses.getByRole('row', { name: 'A day ends with no task finished −10' })).toBeDefined()
    expect(sheet.getByText('Spending points on prizes never costs XP.')).toBeDefined()
    expect(sheet.getByText(/Everyone starts at level 0\. Level 1 takes 100 XP/u)).toBeDefined()
    expect(sheet.getByText('XP counts from Sep 15, the day levels began.')).toBeDefined()
  })

  it('says it is loading until everything has, and says so when the XP could not be read (STORE-13)', () => {
    page(null)
    expect(screen.getByText('Loading…')).toBeDefined()
    cleanup()

    page(null, true)
    expect(screen.getByText('Couldn’t load your XP. Reload to try again.')).toBeDefined()
  })
})
