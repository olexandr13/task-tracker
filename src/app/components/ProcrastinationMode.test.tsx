// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTask } from '../../core'
import { ProcrastinationPanel } from './ProcrastinationMode'

afterEach(cleanup)

const panel = {
  wonTask: null,
  canPick: true,
  hasOtherTask: true,
  pointsEarned: 0,
  onOtherTask: vi.fn(),
  onCreateTask: vi.fn(),
  onEnd: vi.fn(),
  onRest: vi.fn(),
  onGetOneMore: vi.fn(),
  onGrantPoints: vi.fn(),
}

describe('ProcrastinationPanel', () => {
  it('explains the mode and offers Other task while focused (JUST-5, JUST-6)', () => {
    render(<ProcrastinationPanel phase="focus" {...panel} />)

    expect(screen.getByText('Procrastination mode')).toBeDefined()
    expect(screen.getByText('Some functionality dimmed to prevent distraction. Do just one highlighted task')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Other task' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'End mode' })).toBeDefined()
  })

  it('offers Create task when only one open task is left (JUST-6)', async () => {
    const onCreateTask = vi.fn()
    render(
      <ProcrastinationPanel
        phase="focus"
        {...panel}
        hasOtherTask={false}
        onCreateTask={onCreateTask}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Other task' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Create new task' }))
    expect(onCreateTask).toHaveBeenCalledOnce()
  })

  it('offers a quiet rest after a win, with an optional next task (JUST-9)', () => {
    render(<ProcrastinationPanel phase="idle" {...panel} />)

    expect(screen.getByText('Resting')).toBeDefined()
    expect(screen.getByText(/No rush/)).toBeDefined()
    expect(screen.queryByText('Some functionality dimmed to prevent distraction. Do just one highlighted task')).toBeNull()
    expect(screen.getByRole('button', { name: 'Choose another task' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'End mode' })).toBeDefined()
  })

  it('End mode on the banner turns the mode off (JUST-8)', async () => {
    const onEnd = vi.fn()
    render(<ProcrastinationPanel phase="focus" {...panel} onEnd={onEnd} />)

    await userEvent.click(screen.getByRole('button', { name: 'End mode' }))
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('praises a win with Reward +1 and Get one more task (JUST-9)', async () => {
    const task = createTask('stretch', null, new Date(2026, 8, 16, 9, 0))
    const onGrantPoints = vi.fn()
    const onGetOneMore = vi.fn()
    const onEnd = vi.fn()
    render(
      <ProcrastinationPanel
        phase="won"
        {...panel}
        wonTask={task}
        pointsEarned={2}
        onGrantPoints={onGrantPoints}
        onGetOneMore={onGetOneMore}
        onEnd={onEnd}
      />,
    )

    expect(screen.getByText('Well done!')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Rest' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Get one more task' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'End mode' })).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Reward +1, 2 points so far' }),
    ).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Reward +1, 2 points so far' }))
    expect(onGrantPoints).toHaveBeenCalledExactlyOnceWith(3)
    expect(screen.getByText('+3')).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Get one more task' }))
    expect(onGetOneMore).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'End mode' }))
    expect(onEnd).toHaveBeenCalledOnce()
  })
})
