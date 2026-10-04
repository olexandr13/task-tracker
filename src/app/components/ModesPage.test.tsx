// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeaturesOff } from '../../core'
import { FeaturesContext } from '../features'
import type { ModeState } from '../modes'
import type { ModeView } from '../view'
import { WARM_UP_DISABLE_WARNING } from '../warmUpLabels'
import { ModesPage } from './ModesPage'

/* The page listing the modes. MODE ids refer to wiki/modes.md, FEAT ids to wiki/features.md. */

const OFF = { state: 'Disabled', detail: null } as const

function mode(view: ModeView, over: Partial<ModeState> = {}): ModeState {
  return { view, on: false, status: OFF, blocked: null, toggle: vi.fn(), ...over }
}

function modes(over: Partial<Record<ModeView, ModeState>> = {}): Record<ModeView, ModeState> {
  return {
    'modes/procrastination': mode('modes/procrastination'),
    'modes/warm-up': mode('modes/warm-up'),
    'modes/nudge': mode('modes/nudge'),
    'modes/check-in': mode('modes/check-in'),
    ...over,
  }
}

afterEach(cleanup)

describe('ModesPage', () => {
  it('lists every mode, with what it is for and where it stands (MODE-2, MODE-3)', () => {
    render(
      <ModesPage
        modes={modes({
          'modes/warm-up': mode('modes/warm-up', {
            on: true,
            status: { state: 'Enabled', detail: 'Day 3 of 30 · 27 days left' },
          }),
        })}
        onOpen={vi.fn()}
      />,
    )

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(4)
    expect(rows[0]?.textContent).toContain('Procrastination')
    expect(rows[0]?.textContent).toContain('One task out of Today')
    expect(rows[0]?.textContent).toContain('Disabled')
    expect(rows[1]?.textContent).toContain('Warm-up')
    expect(rows[1]?.textContent).toContain('Enabled')
    expect(rows[1]?.textContent).toContain('Day 3 of 30 · 27 days left')
    expect(rows[2]?.textContent).toContain('Nudge')
    expect(rows[2]?.textContent).toContain('Speaks up when nothing has been finished')
    expect(rows[3]?.textContent).toContain('Check-in')
    expect(rows[3]?.textContent).toContain('Asks at the top of every hour what you did')
  })

  it('turns a mode on and off from the list itself (MODE-3)', async () => {
    const start = vi.fn()
    const end = vi.fn()
    render(
      <ModesPage
        modes={modes({
          'modes/procrastination': mode('modes/procrastination', { toggle: start }),
          'modes/warm-up': mode('modes/warm-up', {
            on: true,
            status: { state: 'Enabled', detail: null },
            toggle: end,
          }),
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

  it('asks before the warm-up is turned off, and leaves it on when cancelled (WARM-9)', async () => {
    const toggle = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <ModesPage
        modes={modes({
          'modes/warm-up': mode('modes/warm-up', {
            on: true,
            status: { state: 'Enabled', detail: 'Day 3 of 30 · 27 days left' },
            confirmOff: WARM_UP_DISABLE_WARNING,
            toggle,
          }),
        })}
        onOpen={vi.fn()}
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

  it('turns the warm-up on without asking (WARM-2)', async () => {
    const toggle = vi.fn()
    const confirm = vi.spyOn(window, 'confirm')
    render(
      <ModesPage
        modes={modes({
          'modes/warm-up': mode('modes/warm-up', { confirmOff: WARM_UP_DISABLE_WARNING, toggle }),
        })}
        onOpen={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('switch', { name: 'Warm-up' }))
    expect(confirm).not.toHaveBeenCalled()
    expect(toggle).toHaveBeenCalledExactlyOnceWith(true)
    confirm.mockRestore()
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
            status: { state: 'Disabled', detail: 'Nothing to do in Today' },
            blocked: 'Nothing to do in Today.',
            toggle,
          }),
        })}
        onOpen={vi.fn()}
      />,
    )

    const control = screen.getByRole('switch', { name: 'Procrastination' })
    expect(control.hasAttribute('disabled')).toBe(true)
    expect(control.getAttribute('title')).toBe('Nothing to do in Today.')

    await userEvent.click(control)
    expect(toggle).not.toHaveBeenCalled()
  })

  it('still opens a blocked mode: what it does is worth reading either way (MODE-6)', async () => {
    const onOpen = vi.fn()
    render(
      <ModesPage
        modes={modes({
          'modes/procrastination': mode('modes/procrastination', { blocked: 'Nothing to do in Today.' }),
        })}
        onOpen={onOpen}
      />,
    )

    await userEvent.click(screen.getByTitle('Open Procrastination for what it does'))
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('modes/procrastination')
  })

  it('leaves out a mode whose feature is switched off (FEAT-9)', () => {
    const off: FeaturesOff = ['habits', 'activity']
    render(
      <FeaturesContext value={off}>
        <ModesPage modes={modes()} onOpen={vi.fn()} />
      </FeaturesContext>,
    )

    expect(screen.getAllByRole('switch').map((toggle) => toggle.getAttribute('aria-label'))).toEqual(['Procrastination', 'Nudge'])
  })
})
