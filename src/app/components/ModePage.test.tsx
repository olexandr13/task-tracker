// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MODE_POINTS } from '../modeLabels'
import type { ModeState } from '../modes'
import type { ModeView } from '../view'
import { WARM_UP_DISABLE_WARNING } from '../warmUpLabels'
import { ModePage } from './ModePage'

/* One mode's own page. MODE ids refer to wiki/modes.md. */

const OFF = { state: 'Disabled', detail: null } as const
const ON = { state: 'Enabled', detail: null } as const

function mode(view: ModeView, over: Partial<ModeState> = {}): ModeState {
  return { view, on: false, status: OFF, blocked: null, toggle: vi.fn(), ...over }
}

afterEach(cleanup)

describe('ModePage', () => {
  it('says what the mode does, a thing at a time (MODE-5)', async () => {
    render(<ModePage mode={mode('modes/warm-up')} />)

    await userEvent.click(screen.getByRole('button', { name: 'About What it does' }))

    const points = screen.getByRole('list')
    expect(points.children).toHaveLength(MODE_POINTS['modes/warm-up'].length)
    expect(points.textContent).toContain('Allows only one new habit a day')
    expect(points.textContent).toContain('Pause')
  })

  it('carries the mode, where it stands and its switch (MODE-5)', () => {
    render(
      <ModePage
        mode={mode('modes/procrastination', { on: true, status: { state: 'Enabled', detail: 'Resting' } })}
      />,
    )

    expect(screen.getByText('Procrastination')).toBeDefined()
    // Which way the switch is, under the switch; the rest of it beside the mode (MODE-3).
    expect(screen.getByText('Enabled')).toBeDefined()
    expect(screen.getByText('Resting')).toBeDefined()
    expect(screen.getByRole('switch', { name: 'Procrastination' }).getAttribute('aria-checked')).toBe('true')
  })

  it('turns the mode on from its own page (MODE-5)', async () => {
    const toggle = vi.fn()
    render(<ModePage mode={mode('modes/warm-up', { toggle })} />)

    await userEvent.click(screen.getByRole('switch', { name: 'Warm-up' }))
    expect(toggle).toHaveBeenCalledExactlyOnceWith(true)
  })

  it('asks before the warm-up is turned off, and leaves it on when cancelled (WARM-9)', async () => {
    const toggle = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <ModePage
        mode={mode('modes/warm-up', {
          on: true,
          status: ON,
          confirmOff: WARM_UP_DISABLE_WARNING,
          toggle,
        })}
      />,
    )

    await userEvent.click(screen.getByRole('switch', { name: 'Warm-up' }))
    expect(confirm.mock.calls[0]?.[0]).toBe(WARM_UP_DISABLE_WARNING)
    expect(toggle).not.toHaveBeenCalled()

    confirm.mockReturnValue(true)
    await userEvent.click(screen.getByRole('switch', { name: 'Warm-up' }))
    expect(toggle).toHaveBeenCalledExactlyOnceWith(false)
    confirm.mockRestore()
  })

  it('wears the face the mode puts you in (MODE-11)', () => {
    const { container, rerender } = render(<ModePage mode={mode('modes/procrastination')} />)

    // Off, the mode's own melting face, as wherever else it is listed (MODE-2).
    expect(container.textContent).toContain('🫠')

    rerender(<ModePage mode={mode('modes/procrastination', { on: true, status: ON })} />)
    expect(container.textContent).toContain('😌')
    expect(container.textContent).not.toContain('🫠')

    // A mode with one face keeps it either way.
    rerender(<ModePage mode={mode('modes/warm-up')} />)
    expect(container.textContent).toContain('🌱')
    rerender(<ModePage mode={mode('modes/warm-up', { on: true, status: ON })} />)
    expect(container.textContent).toContain('🌱')
  })

  it('carries a mode’s own settings under what it does (MODE-12)', () => {
    render(
      <ModePage
        mode={mode('modes/nudge', { on: true, status: ON })}
        settings={<p>After this long with nothing finished</p>}
      />,
    )

    const sections = screen.getAllByRole('region').map((section) => section.getAttribute('aria-label'))
    expect(sections).toEqual(['Settings'])
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeDefined()
    expect(screen.getByText('After this long with nothing finished')).toBeDefined()
  })

  it('carries them while the mode is off as well, being what is set before it is on (MODE-12)', () => {
    render(<ModePage mode={mode('modes/nudge')} settings={<p>After this long with nothing finished</p>} />)

    expect(screen.getByRole('region', { name: 'Settings' })).toBeDefined()
    expect(screen.getByText('After this long with nothing finished')).toBeDefined()
  })

  it('says how the nudge arrives in one sentence, not the line above it again (MODE-5)', async () => {
    render(<ModePage mode={mode('modes/nudge')} />)

    await userEvent.click(screen.getByRole('button', { name: 'About What it does' }))

    const points = screen.getByRole('list')
    expect(points.children).toHaveLength(1)
    expect(points.textContent).toContain('only while the app is open')
    // What it watches for is the line the mode is summed up in, right above it.
    expect(points.textContent).not.toContain('names the task to pick up')
  })

  it('shows no Settings for a mode with nothing to set (MODE-12)', () => {
    render(<ModePage mode={mode('modes/warm-up')} />)

    expect(screen.queryByRole('region', { name: 'Settings' })).toBeNull()
  })

  it('reads even while the mode cannot be turned on (MODE-6)', async () => {
    render(<ModePage mode={mode('modes/procrastination', { blocked: 'Nothing to do in Today.' })} />)

    expect(screen.getByRole('switch', { name: 'Procrastination' }).hasAttribute('disabled')).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: 'About What it does' }))
    expect(screen.getByRole('list').textContent).toContain('Dims everything else')
  })
})
