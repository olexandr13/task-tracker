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
  it('says which day it is on and how many habits there are over what it allows (WARM-6)', () => {
    render(<WarmUpPanel progress={progress()} onMoreInfo={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain('Warm-up · Day 3/30 · 2/3 habits')
  })

  it('says nothing more — no word on what today leaves, and no way out (WARM-6, WARM-9)', () => {
    render(<WarmUpPanel progress={progress({ used: 3, remaining: 0 })} onMoreInfo={vi.fn()} />)

    // The seedling, the line and the one button: nothing else.
    expect(screen.getByRole('status').textContent).toBe('🌱Warm-up · Day 3/30 · 3/3 habitsMore info')
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['More info'])
  })

  it('counts every habit, even past what the day allows (WARM-4, WARM-7)', () => {
    render(<WarmUpPanel progress={progress({ used: 7, remaining: 0 })} onMoreInfo={vi.fn()} />)

    expect(screen.getByRole('status').textContent).toContain('7/3 habits')
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
