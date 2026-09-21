// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RewardEntry, TaskId } from '../../core'
import { EarningList } from './EarningList'

/* What completions earned. RWD ids refer to wiki/rewards.md, UI ids to wiki/interface.md. */

const NOW = new Date(2026, 8, 17, 15, 0)

const RUN: RewardEntry = { taskId: 'run', day: '2026-09-17', points: 5 }
const READ: RewardEntry = { taskId: 'read', day: '2026-09-02', points: 2 }
const GONE: RewardEntry = { taskId: 'gone', day: '2026-09-16', points: 1 }

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function titles(...pairs: readonly [TaskId, string][]): Map<TaskId, string> {
  return new Map(pairs)
}

function setup(entries: readonly RewardEntry[], taskTitles = titles(['run', 'Morning run'], ['read', 'Read'])) {
  const user = userEvent.setup()
  const onRemove = vi.fn()
  render(<EarningList entries={entries} taskTitles={taskTitles} now={NOW} onRemove={onRemove} />)
  return { user, onRemove }
}

describe('EarningList', () => {
  it('shows each earning: its day, the task and its points (RWD-23)', () => {
    setup([RUN, READ])
    const rows = screen.getAllByRole('listitem')

    expect(within(rows[0]).getByText('Today')).toBeDefined()
    expect(within(rows[0]).getByText('Morning run')).toBeDefined()
    expect(within(rows[0]).getByLabelText('5 points earned')).toBeDefined()
    expect(within(rows[1]).getByText('Sep 2')).toBeDefined()
    expect(within(rows[1]).getByText('Read')).toBeDefined()
  })

  it('names a purged task as deleted rather than hiding it (RWD-13, RWD-23)', () => {
    setup([GONE], titles())

    expect(screen.getByText('Deleted task')).toBeDefined()
    expect(screen.getByLabelText('1 point earned')).toBeDefined()
  })

  it('says when nothing has been earned', () => {
    setup([])

    expect(screen.getByText('Nothing earned yet.')).toBeDefined()
  })

  it('deletes an earning at once (RWD-23, UI-38)', async () => {
    const { user, onRemove } = setup([RUN])
    const remove = screen.getByRole('button', { name: 'Delete the earning for "Morning run"' })

    await user.click(remove)
    expect(onRemove).toHaveBeenCalledWith({ taskId: 'run', day: '2026-09-17' })
  })
})
