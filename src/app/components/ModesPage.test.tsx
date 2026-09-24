// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ModeState } from '../modes'
import type { ModeView } from '../view'
import { ModesPage } from './ModesPage'

/* The page listing the modes. MODE ids refer to wiki/modes.md. */

function mode(view: ModeView, over: Partial<ModeState> = {}): ModeState {
  return { view, on: false, status: 'Off', blocked: null, toggle: vi.fn(), ...over }
}

function modes(over: Partial<Record<ModeView, ModeState>> = {}): Record<ModeView, ModeState> {
  return {
    'modes/procrastination': mode('modes/procrastination'),
    'modes/warm-up': mode('modes/warm-up'),
    ...over,
  }
}

afterEach(cleanup)

describe('ModesPage', () => {
  it('lists every mode, with what it is for and where it stands (MODE-2, MODE-3)', () => {
    render(
      <ModesPage
        modes={modes({
          'modes/warm-up': mode('modes/warm-up', { on: true, status: 'On · Day 3 of 30 · 27 days left' }),
        })}
        onOpen={vi.fn()}
      />,
    )

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]?.textContent).toContain('Procrastination')
    expect(rows[0]?.textContent).toContain('One task out of Today')
    expect(rows[0]?.textContent).toContain('Off')
    expect(rows[1]?.textContent).toContain('Warm-up')
    expect(rows[1]?.textContent).toContain('On · Day 3 of 30 · 27 days left')
  })

  it('turns a mode on and off from the list itself (MODE-3)', async () => {
    const start = vi.fn()
    const end = vi.fn()
    render(
      <ModesPage
        modes={modes({
          'modes/procrastination': mode('modes/procrastination', { toggle: start }),
          'modes/warm-up': mode('modes/warm-up', { on: true, status: 'On', toggle: end }),
        })}
        onOpen={vi.fn()}
      />,
    )

    const procrastination = screen.getByRole('switch', { name: 'Procrastination' })
    expect(procrastination.getAttribute('aria-checked')).toBe('false')
    await userEvent.click(procrastination)
    expect(start).toHaveBeenCalledExactlyOnceWith(true)

    const warmUp = screen.getByRole('switch', { name: 'Warm-up' })
    expect(warmUp.getAttribute('aria-checked')).toBe('true')
    await userEvent.click(warmUp)
    expect(end).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('opens a mode on a click on the row, saying so in a tooltip (MODE-4, MODE-5)', async () => {
    const onOpen = vi.fn()
    render(<ModesPage modes={modes()} onOpen={onOpen} />)

    const row = screen.getByTitle('Open Warm-up for what it does')
    await userEvent.click(row)
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('modes/warm-up')
  })

  it('will not turn on a mode with nothing to do, and says why (MODE-6)', async () => {
    const toggle = vi.fn()
    render(
      <ModesPage
        modes={modes({
          'modes/procrastination': mode('modes/procrastination', {
            status: 'Off · nothing to do in Today',
            blocked: 'There is nothing to do in Today.',
            toggle,
          }),
        })}
        onOpen={vi.fn()}
      />,
    )

    const control = screen.getByRole('switch', { name: 'Procrastination' })
    expect(control.hasAttribute('disabled')).toBe(true)
    expect(control.getAttribute('title')).toBe('There is nothing to do in Today.')

    await userEvent.click(control)
    expect(toggle).not.toHaveBeenCalled()
  })

  it('still opens a blocked mode: what it does is worth reading either way (MODE-6)', async () => {
    const onOpen = vi.fn()
    render(
      <ModesPage
        modes={modes({
          'modes/procrastination': mode('modes/procrastination', { blocked: 'There is nothing to do in Today.' }),
        })}
        onOpen={onOpen}
      />,
    )

    await userEvent.click(screen.getByTitle('Open Procrastination for what it does'))
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('modes/procrastination')
  })
})
