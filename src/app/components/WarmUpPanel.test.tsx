// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WarmUpProgress } from '../../core'
import { WarmUpPanel } from './WarmUpPanel'

/* The warm-up at the head of Habits. WARM ids refer to wiki/warm-up.md, MODE ids to wiki/modes.md. */

afterEach(cleanup)

function progress(changes: Partial<WarmUpProgress> = {}): WarmUpProgress {
  return { day: 3, daysLeft: 27, allowed: 3, used: 2, remaining: 1, ...changes }
}

describe('WarmUpPanel', () => {
  it('says which day it is on and how much of it is taken, in one line (WARM-6)', () => {
    render(<WarmUpPanel progress={progress()} onMoreInfo={vi.fn()} />)

    const said = screen.getByRole('status').textContent ?? ''
    expect(said).toContain('Day 3 of 30')
    expect(said).toContain('2 habits · 3 allowed today')
    // What today leaves is for the warm-up's own page, not the banner.
    expect(said).not.toMatch(/more habit|No new habit/)
  })

  it('counts every habit, even past what the day allows (WARM-4, WARM-7)', () => {
    render(<WarmUpPanel progress={progress({ used: 7, remaining: 0 })} onMoreInfo={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain('7 habits · 3 allowed today')
  })

  it('offers no way out: the warm-up is ended from its own page (WARM-9)', () => {
    render(<WarmUpPanel progress={progress()} onMoreInfo={vi.fn()} />)

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['More info'])
  })

  it('opens the warm-up’s own page for what it does (MODE-10)', async () => {
    const onMoreInfo = vi.fn()
    render(<WarmUpPanel progress={progress()} onMoreInfo={onMoreInfo} />)

    await userEvent.click(screen.getByRole('button', { name: 'More info' }))
    expect(onMoreInfo).toHaveBeenCalledOnce()
  })

  it('draws nothing while no warm-up is under way (WARM-2)', () => {
    render(<WarmUpPanel progress={null} onMoreInfo={vi.fn()} />)

    expect(screen.queryByRole('status')).toBeNull()
  })
})
