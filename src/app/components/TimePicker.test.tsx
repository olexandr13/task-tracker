// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimePicker } from './TimePicker'

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
