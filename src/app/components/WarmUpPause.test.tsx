// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WarmUpPause } from './WarmUpPause'

/* Pausing the warm-up from its own page. WARM ids refer to wiki/warm-up.md. */

afterEach(cleanup)

describe('WarmUpPause', () => {
  it('pauses and resumes from its switch (WARM-11)', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<WarmUpPause paused={false} onChange={onChange} />)

    const pause = screen.getByRole('switch', { name: 'Pause' })
    expect(pause.getAttribute('aria-checked')).toBe('false')
    expect(pause.textContent).toContain('Days on pause add no habit')
    expect(pause.textContent).toContain('The habits you have stay')

    await userEvent.click(pause)
    expect(onChange).toHaveBeenCalledExactlyOnceWith(true)

    rerender(<WarmUpPause paused onChange={onChange} />)
    expect(screen.getByRole('switch', { name: 'Pause' }).getAttribute('aria-checked')).toBe('true')

    await userEvent.click(screen.getByRole('switch', { name: 'Pause' }))
    expect(onChange).toHaveBeenLastCalledWith(false)
  })
})
