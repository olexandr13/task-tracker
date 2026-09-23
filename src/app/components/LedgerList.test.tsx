// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BONUS_IDS, ledgerHistory, type Redemption, type RewardEntry, type TaskId } from '../../core'
import { LedgerList } from './LedgerList'

/* What happened to the points. RWD ids refer to wiki/rewards.md. */

const NOW = new Date(2026, 8, 17, 15, 0)

const RUN: RewardEntry = { taskId: 'run', day: '2026-09-17', points: 5 }
const READ: RewardEntry = { taskId: 'read', day: '2026-09-02', points: 2 }
const GONE: RewardEntry = { taskId: 'gone', day: '2026-09-16', points: 1 }
const BONUS: RewardEntry = { taskId: BONUS_IDS.week, day: '2026-09-16', points: 40 }
const COFFEE: Redemption = { id: 'coffee', points: 3, note: 'Coffee', redeemedAt: '2026-09-17T09:00:00.000Z' }

afterEach(cleanup)

function titles(...pairs: readonly [TaskId, string][]): Map<TaskId, string> {
  return new Map(pairs)
}

function setup(
  entries: readonly RewardEntry[],
  redemptions: readonly Redemption[] = [],
  taskTitles = titles(['run', 'Morning run'], ['read', 'Read']),
) {
  const onRemoveEarning = vi.fn()
  const onRemoveRedemption = vi.fn()
  render(
    <LedgerList
      rows={ledgerHistory(entries, redemptions)}
      taskTitles={taskTitles}
      now={NOW}
      onRemoveEarning={onRemoveEarning}
      onRemoveRedemption={onRemoveRedemption}
    />,
  )
  return { user: userEvent.setup(), onRemoveEarning, onRemoveRedemption }
}

describe('LedgerList (RWD-38)', () => {
  it('shows both sides in one run, most recent first, each signed', () => {
    setup([RUN, READ], [COFFEE])

    const rows = screen.getAllByRole('listitem').map((row) => row.textContent)
    expect(rows[0]).toContain('Coffee')
    expect(rows[0]).toContain('−3')
    expect(rows[1]).toContain('Morning run')
    expect(rows[1]).toContain('+5')
    expect(rows[2]).toContain('Read')
  })

  it('tells the two apart by tint as well as by sign', () => {
    setup([RUN], [COFFEE])

    expect(screen.getByLabelText('5 points earned').className).toMatch(/emerald/)
    expect(screen.getByLabelText('3 points redeemed').className).toMatch(/rose/)
  })

  it('names a period’s bonus for what it cleared (RWD-28)', () => {
    setup([BONUS], [], titles())

    expect(screen.getByText('All of this week done')).toBeTruthy()
  })

  it('shows a purged task as deleted — earned stays earned (RWD-13)', () => {
    setup([GONE])

    expect(screen.getByText('Deleted task')).toBeTruthy()
  })

  it('says how it starts while nothing has happened', () => {
    setup([], [])

    expect(screen.getByText(/Nothing yet/)).toBeTruthy()
  })

  it('deletes either side from its own row (RWD-18, RWD-23)', async () => {
    const { user, onRemoveEarning, onRemoveRedemption } = setup([RUN], [COFFEE])

    await user.click(screen.getByRole('button', { name: 'Delete the earning "Morning run"' }))
    expect(onRemoveEarning).toHaveBeenCalledWith({ taskId: 'run', day: '2026-09-17' })

    await user.click(screen.getByRole('button', { name: 'Delete the redemption "Coffee"' }))
    expect(onRemoveRedemption).toHaveBeenCalledWith('coffee')
  })
})
