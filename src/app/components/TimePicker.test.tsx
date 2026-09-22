// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimePicker } from './TimePicker'

afterEach(cleanup)

describe('TimePicker timer', () => {
  it('starts and stops a timer from the panel', async () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    const user = userEvent.setup()

    render(
      <TimePicker
        goal={60}
        sessions={[]}
        now={new Date(2026, 8, 21, 10, 0)}
        onLog={vi.fn()}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
        timer={{
          running: false,
          startedAt: null,
          clock: new Date(2026, 8, 21, 10, 0),
          onStart,
          onStop,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Time:/ }))
    await user.click(screen.getByRole('button', { name: 'Start timer' }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('shows Stop and the live clock while running', async () => {
    const onStop = vi.fn()
    const user = userEvent.setup()

    render(
      <TimePicker
        goal={60}
        sessions={[]}
        now={new Date(2026, 8, 21, 10, 0)}
        onLog={vi.fn()}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
        timer={{
          running: true,
          startedAt: '2026-09-21T10:00:00.000Z',
          clock: new Date('2026-09-21T10:01:30.000Z'),
          onStart: vi.fn(),
          onStop,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /timer running/i }))
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()
    expect(screen.getByText('1:30')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})

describe('TimePicker panel', () => {
  const NOW = new Date(2026, 8, 21, 10, 0)
  const logged = [{ id: 'a', seconds: 20 * 60, loggedAt: NOW.toISOString() }]

  function renderPicker(goal: number | null, onLog = vi.fn()) {
    const user = userEvent.setup()
    render(
      <TimePicker
        goal={goal}
        sessions={logged}
        now={NOW}
        onLog={onLog}
        onRemove={vi.fn()}
        onChangeGoal={vi.fn()}
      />,
    )
    return user
  }

  it('says how the time stands and what is left (TIME-21)', async () => {
    const user = renderPicker(60)
    await user.click(screen.getByRole('button', { name: /Time:/ }))
    expect(screen.getByText('40m left')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Toward the goal' }).getAttribute('aria-valuenow')).toBe('20')
  })

  it('says the goal is reached once the time is in (TIME-5)', async () => {
    const user = renderPicker(20)
    await user.click(screen.getByRole('button', { name: /Time:/ }))
    expect(screen.getByText(/Goal reached/)).toBeTruthy()
    expect(screen.queryByText(/left$/)).toBeNull()
  })

  it('logs a typed length from Log as well as Enter (TIME-3)', async () => {
    const onLog = vi.fn()
    const user = renderPicker(null, onLog)
    await user.click(screen.getByRole('button', { name: /Time:/ }))

    const log = screen.getByRole('button', { name: 'Log' })
    expect(log.hasAttribute('disabled')).toBe(true)

    await user.type(screen.getByRole('textbox', { name: 'Time to log' }), '25m')
    await user.click(log)
    expect(onLog).toHaveBeenCalledWith(25)
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Time to log' }).value).toBe('')
  })

  it('says what would do when a typed length cannot be read (TIME-11)', async () => {
    const onLog = vi.fn()
    const user = renderPicker(null, onLog)
    await user.click(screen.getByRole('button', { name: /Time:/ }))

    const box = screen.getByRole('textbox', { name: 'Time to log' })
    await user.type(box, 'soon')
    await user.click(screen.getByRole('button', { name: 'Log' }))
    expect(onLog).not.toHaveBeenCalled()
    expect(box.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText(/Try 25m/)).toBeTruthy()

    await user.type(box, 'x')
    expect(screen.queryByText(/Try 25m/)).toBeNull()
  })
})
