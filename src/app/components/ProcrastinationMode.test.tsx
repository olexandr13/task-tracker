// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTask } from '../../core'
import { ProcrastinationEntryButton, ProcrastinationPanel } from './ProcrastinationMode'

afterEach(cleanup)

const panel = {
  confirmingLeave: false,
  wonTask: null,
  canPick: true,
  pointsEarned: 0,
  onOtherTask: vi.fn(),
  onCancelLeave: vi.fn(),
  onWalkAway: vi.fn(),
  onRest: vi.fn(),
  onGetOneMore: vi.fn(),
  onGrantPoints: vi.fn(),
}

describe('ProcrastinationEntryButton', () => {
  it('starts mode from the melting-face control (JUST-1)', async () => {
    const onStart = vi.fn()
    render(
      <ProcrastinationEntryButton phase="off" onStart={onStart} onRequestLeave={vi.fn()} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Procrastination mode' }))
    expect(onStart).toHaveBeenCalledOnce()
  })

  it('asks to leave when pressed again while focused (JUST-8)', async () => {
    const onRequestLeave = vi.fn()
    render(
      <ProcrastinationEntryButton
        phase="focus"
        onStart={vi.fn()}
        onRequestLeave={onRequestLeave}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Procrastination mode on' }))
    expect(onRequestLeave).toHaveBeenCalledOnce()
  })
})

describe('ProcrastinationPanel', () => {
  it('explains the mode and offers Other task while focused (JUST-5, JUST-6)', () => {
    render(<ProcrastinationPanel phase="focus" {...panel} />)

    expect(screen.getByText('Procrastination mode')).toBeDefined()
    expect(screen.getByText('Some functionality dimmed to prevent distraction. Do just one highlighted task')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Other task' })).toBeDefined()
  })

  it('offers a quiet rest after a win, with an optional next task (JUST-9)', () => {
    render(<ProcrastinationPanel phase="idle" {...panel} />)

    expect(screen.getByText('Resting')).toBeDefined()
    expect(screen.getByText(/No rush/)).toBeDefined()
    expect(screen.queryByText('Some functionality dimmed to prevent distraction. Do just one highlighted task')).toBeNull()
    expect(screen.getByRole('button', { name: 'Choose another task' })).toBeDefined()
  })

  it('asks clearly to end the mode (JUST-8)', async () => {
    const onWalkAway = vi.fn()
    render(
      <ProcrastinationPanel phase="focus" {...panel} confirmingLeave onWalkAway={onWalkAway} />,
    )

    expect(screen.getByText('End Procrastination mode?')).toBeDefined()
    expect(screen.getByText(/Tasks go back to normal/)).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'End mode' }))
    expect(onWalkAway).toHaveBeenCalledOnce()
  })

  it('praises a win with Reward +1 and Get one more task (JUST-9)', async () => {
    const task = createTask('stretch', null, new Date(2026, 8, 16, 9, 0))
    const onGrantPoints = vi.fn()
    const onGetOneMore = vi.fn()
    render(
      <ProcrastinationPanel
        phase="won"
        {...panel}
        wonTask={task}
        pointsEarned={2}
        onGrantPoints={onGrantPoints}
        onGetOneMore={onGetOneMore}
      />,
    )

    expect(screen.getByText('Well done!')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Rest' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Get one more task' })).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Reward +1, 2 points so far' }),
    ).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Reward +1, 2 points so far' }))
    expect(onGrantPoints).toHaveBeenCalledExactlyOnceWith(3)
    expect(screen.getByText('+3')).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Get one more task' }))
    expect(onGetOneMore).toHaveBeenCalledOnce()
  })
})
