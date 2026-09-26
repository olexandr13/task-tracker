// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WarmUpProgress } from '../../core'
import { WarmUpPanel } from './WarmUpPanel'

/* The warm-up at the head of Habits. WARM ids refer to wiki/warm-up.md. */

afterEach(cleanup)

function progress(changes: Partial<WarmUpProgress> = {}): WarmUpProgress {
  return { day: 3, daysLeft: 27, allowed: 3, used: 2, remaining: 1, ...changes }
}

describe('WarmUpPanel', () => {
  it('says which day it is on and how much of it is taken (WARM-6)', () => {
    render(<WarmUpPanel progress={progress()} onMoreInfo={vi.fn()} onEnd={vi.fn()} />)

    const said = screen.getByRole('status').textContent ?? ''
    expect(said).toContain('Day 3 of 30')
    expect(said).toContain('2 habits · 3 allowed today')
    expect(said).toContain('One more habit can be taken on today.')
  })

  it('says what happens next once the day’s habits are in (WARM-6)', () => {
    render(<WarmUpPanel progress={progress({ used: 3, remaining: 0 })} onMoreInfo={vi.fn()} onEnd={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain(
      'No new habit today. The warm-up allows one new habit a day, so tomorrow allows one more.',
    )
  })

  it('promises no tomorrow on the last day, the warm-up being over then (WARM-10)', () => {
    render(<WarmUpPanel progress={progress({ day: 30, daysLeft: 0, allowed: 30, used: 30, remaining: 0 })} onMoreInfo={vi.fn()} onEnd={vi.fn()} />)

    const said = screen.getByRole('status').textContent ?? ''
    expect(said).toContain('Day 30 of 30')
    expect(said).toContain('No new habit today. From tomorrow there is no limit.')
  })

  it('counts every habit, even past what the day allows (WARM-4, WARM-7)', () => {
    render(<WarmUpPanel progress={progress({ used: 7, remaining: 0 })} onMoreInfo={vi.fn()} onEnd={vi.fn()} />)

    const said = screen.getByRole('status').textContent ?? ''
    expect(said).toContain('7 habits · 3 allowed today')
    expect(said).toContain('You have more habits than today allows, so no new one today.')
    expect(said).toContain('None of the habits you have is removed.')
  })

  it('ends the warm-up at once, with nothing to confirm (WARM-9)', async () => {
    const onEnd = vi.fn()
    render(<WarmUpPanel progress={progress()} onMoreInfo={vi.fn()} onEnd={onEnd} />)

    await userEvent.click(screen.getByRole('button', { name: 'End warm-up' }))
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('opens the warm-up’s own page for what it does (MODE-10)', async () => {
    const onMoreInfo = vi.fn()
    render(<WarmUpPanel progress={progress()} onMoreInfo={onMoreInfo} onEnd={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'More info' }))
    expect(onMoreInfo).toHaveBeenCalledOnce()
  })

  it('draws nothing while no warm-up is under way (WARM-2)', () => {
    render(<WarmUpPanel progress={null} onMoreInfo={vi.fn()} onEnd={vi.fn()} />)

    expect(screen.queryByRole('status')).toBeNull()
  })
})
