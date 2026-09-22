// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Redemption, RewardChanges, RewardEntry } from '../core'
import type { PointsLedger, RewardRepository } from '../storage/rewardRepository'
import { expectConsole } from '../test/consoleGuard'
import { useRewards } from './useRewards'

/* Removing and restoring ledger rows. RWD ids refer to wiki/rewards.md. */

const RUN: RewardEntry = { taskId: 'run', day: '2026-09-17', points: 5 }
const COFFEE: Redemption = {
  id: 'coffee',
  points: 3,
  note: 'coffee',
  redeemedAt: '2026-09-17T09:00:00.000Z',
}

afterEach(() => {
  cleanup()
})

function fakeRewardRepository(initial: PointsLedger) {
  let onLedger: (ledger: PointsLedger) => void = () => {}
  const saved: RewardChanges[] = []
  const redeemed: Redemption[] = []
  const removed: string[] = []

  const repository: RewardRepository = {
    subscribe(callback) {
      onLedger = callback
      return () => {}
    },
    save(changes) {
      saved.push(changes)
      return Promise.resolve()
    },
    redeem(redemption) {
      redeemed.push(redemption)
      return Promise.resolve()
    },
    removeRedemption(id) {
      removed.push(id)
      return Promise.resolve()
    },
  }

  return {
    repository,
    saved,
    redeemed,
    removed,
    arrive: (ledger: PointsLedger) => {
      act(() => {
        onLedger(ledger)
      })
    },
    initial,
  }
}

function setUp(ledger: PointsLedger) {
  const fake = fakeRewardRepository(ledger)
  const { result } = renderHook(() => useRewards(fake.repository))
  fake.arrive(ledger)
  return { result, ...fake }
}

describe('useRewards, removing ledger rows', () => {
  it('removes an earning at once and hands it back to undo (RWD-23)', () => {
    const { result, saved } = setUp({ entries: [RUN], redemptions: [] })

    let removed: RewardEntry | null = null
    act(() => {
      removed = result.current.removeEarning({ taskId: 'run', day: '2026-09-17' })
    })

    expect(removed).toEqual(RUN)
    expect(saved).toEqual([{ earned: [], revoked: [{ taskId: 'run', day: '2026-09-17' }] }])
  })

  it('restores a deleted earning (RWD-23)', () => {
    const { result, saved } = setUp({ entries: [], redemptions: [] })

    act(() => {
      result.current.saveEarning(RUN)
    })

    expect(saved).toEqual([{ earned: [RUN], revoked: [] }])
  })

  it('removes a redemption at once and hands it back to undo (RWD-18)', () => {
    const { result, removed } = setUp({ entries: [], redemptions: [COFFEE] })

    let deleted: Redemption | null = null
    act(() => {
      deleted = result.current.removeRedemption('coffee')
    })

    expect(deleted).toEqual(COFFEE)
    expect(removed).toEqual(['coffee'])
  })

  it('restores a deleted redemption with the same id and day (RWD-18)', () => {
    const { result, redeemed } = setUp({ entries: [], redemptions: [] })

    act(() => {
      result.current.restoreRedemption(COFFEE)
    })

    expect(redeemed).toEqual([COFFEE])
  })
})

describe('when the repository refuses', () => {
  it('reports a write it refused (STORE-13)', async () => {
    expectConsole('Could not delete the redemption.')
    const onProblem = vi.fn()
    const fake = fakeRewardRepository({ entries: [RUN], redemptions: [COFFEE] })
    const repository: RewardRepository = { ...fake.repository, removeRedemption: () => Promise.reject(new Error('denied')) }
    const { result } = renderHook(() => useRewards(repository, onProblem))
    fake.arrive({ entries: [RUN], redemptions: [COFFEE] })

    await act(async () => {
      result.current.removeRedemption(COFFEE.id)
      await Promise.resolve()
    })

    expect(onProblem).toHaveBeenCalledWith('save')
  })
})
