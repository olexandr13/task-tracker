// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MODE_POINTS } from '../modeLabels'
import type { ModeState } from '../modes'
import type { ModeView } from '../view'
import { ModePage } from './ModePage'

/* One mode's own page. MODE ids refer to wiki/modes.md. */

function mode(view: ModeView, over: Partial<ModeState> = {}): ModeState {
  return { view, on: false, status: 'Off', blocked: null, toggle: vi.fn(), ...over }
}

afterEach(cleanup)

describe('ModePage', () => {
  it('says what the mode does, a thing at a time (MODE-5)', () => {
    render(<ModePage mode={mode('modes/warm-up')} />)

    const points = screen.getByRole('list')
    expect(points.children).toHaveLength(MODE_POINTS['modes/warm-up'].length)
    expect(points.textContent).toContain('Holds back new habits only')
  })

  it('carries the mode, where it stands and its switch (MODE-5)', () => {
    render(<ModePage mode={mode('modes/procrastination', { on: true, status: 'On · resting' })} />)

    expect(screen.getByText('Procrastination')).toBeDefined()
    expect(screen.getByText('On · resting')).toBeDefined()
    expect(screen.getByRole('switch', { name: 'Procrastination' }).getAttribute('aria-checked')).toBe('true')
  })

  it('turns the mode on from its own page (MODE-5)', async () => {
    const toggle = vi.fn()
    render(<ModePage mode={mode('modes/warm-up', { toggle })} />)

    await userEvent.click(screen.getByRole('switch', { name: 'Warm-up' }))
    expect(toggle).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('reads even while the mode cannot be turned on (MODE-6)', () => {
    render(<ModePage mode={mode('modes/procrastination', { blocked: 'There is nothing to do in Today.' })} />)

    expect(screen.getByRole('switch', { name: 'Procrastination' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('list').textContent).toContain('the easiest win it can find')
  })
})
