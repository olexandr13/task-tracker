// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RunningTimerChip } from './RunningTimerChip'

/* The chip naming a running timer. TIME ids refer to wiki/time-goals.md. */

afterEach(cleanup)

function setup() {
  const user = userEvent.setup()
  const onOpen = vi.fn()
  const onStop = vi.fn()
  render(
    <RunningTimerChip
      title="stretch"
      startedAt="2026-09-16T09:00:00.000Z"
      clock={new Date('2026-09-16T09:01:05.000Z')}
      onOpen={onOpen}
      onStop={onStop}
    />,
  )
  return { user, onOpen, onStop }
}

describe('RunningTimerChip', () => {
  it('names the task and the live clock (TIME-18)', () => {
    setup()

    expect(screen.getByRole('status').textContent).toContain('Timer on “stretch” · 1:05')
  })

  it('goes to the task on a tap on its title, and only stops from Stop (TIME-20, TIME-18)', async () => {
    const { user, onOpen, onStop } = setup()

    await user.click(screen.getByRole('button', { name: /^Timer on “stretch”/ }))
    expect(onOpen).toHaveBeenCalledOnce()
    expect(onStop).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(onStop).toHaveBeenCalledOnce()
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
