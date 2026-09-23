// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPointValue,
  NO_BONUSES,
  type Period,
  type PointValue,
  type Redemption,
  type RewardChanges,
  type RewardEntry,
} from '../core'
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

const EMPTY_LEDGER: PointsLedger = { entries: [], redemptions: [], bonuses: NO_BONUSES, pointValue: null }

afterEach(() => {
  cleanup()
})

function fakeRewardRepository(initial: PointsLedger) {
  let onLedger: (ledger: PointsLedger) => void = () => {}
  const saved: RewardChanges[] = []
  const redeemed: Redemption[] = []
  const removed: string[] = []
  const bonuses: { period: Period; points: number | null }[] = []
  const values: (PointValue | null)[] = []

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
    setBonus(period, points) {
      bonuses.push({ period, points })
      return Promise.resolve()
    },
    setPointValue(value) {
      values.push(value)
      return Promise.resolve()
    },
    importBonus: () => Promise.resolve(),
    importPointValue: () => Promise.resolve(),
  }

  return {
    repository,
    saved,
    redeemed,
    removed,
    bonuses,
    values,
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

describe('useRewards, the period bonuses (RWD-27, RWD-29)', () => {
  it('saves what clearing each period is worth', () => {
    const { result, bonuses } = setUp(EMPTY_LEDGER)

    act(() => { result.current.setBonus('today', 10) })
    act(() => { result.current.setBonus('month', 100) })

    expect(bonuses).toEqual([
      { period: 'today', points: 10 },
      { period: 'month', points: 100 },
    ])
  })

  it('takes a bonus away with null, leaving the others', () => {
    const { result, bonuses } = setUp({ ...EMPTY_LEDGER, bonuses: { today: 10, week: 40, month: null } })

    expect(result.current.bonuses).toEqual({ today: 10, week: 40, month: null })

    act(() => { result.current.setBonus('today', null) })

    expect(bonuses).toEqual([{ period: 'today', points: null }])
  })
})

describe('useRewards, what a point is worth (RWD-31)', () => {
  it('saves the rate, and forgets it with null', () => {
    const rate = createPointValue(2.5)
    const { result, values } = setUp(EMPTY_LEDGER)

    act(() => { result.current.setPointValue(rate) })
    act(() => { result.current.setPointValue(null) })

    expect(values).toEqual([rate, null])
  })

  it('reads back what is saved', () => {
    const rate = createPointValue(2.5)
    const { result } = setUp({ ...EMPTY_LEDGER, pointValue: rate })

    expect(result.current.pointValue).toEqual(rate)
  })
})

describe('useRewards, removing ledger rows', () => {
  it('removes an earning at once and hands it back to undo (RWD-23)', () => {
    const { result, saved } = setUp({ entries: [RUN], redemptions: [], bonuses: NO_BONUSES, pointValue: null })

    let removed: RewardEntry | null = null
    act(() => {
      removed = result.current.removeEarning({ taskId: 'run', day: '2026-09-17' })
    })

    expect(removed).toEqual(RUN)
    expect(saved).toEqual([{ earned: [], revoked: [{ taskId: 'run', day: '2026-09-17' }] }])
  })

  it('restores a deleted earning (RWD-23)', () => {
    const { result, saved } = setUp({ entries: [], redemptions: [], bonuses: NO_BONUSES, pointValue: null })

    act(() => {
      result.current.saveEarning(RUN)
    })

    expect(saved).toEqual([{ earned: [RUN], revoked: [] }])
  })

  it('removes a redemption at once and hands it back to undo (RWD-18)', () => {
    const { result, removed } = setUp({ entries: [], redemptions: [COFFEE], bonuses: NO_BONUSES, pointValue: null })

    let deleted: Redemption | null = null
    act(() => {
      deleted = result.current.removeRedemption('coffee')
    })

    expect(deleted).toEqual(COFFEE)
    expect(removed).toEqual(['coffee'])
  })

  it('restores a deleted redemption with the same id and day (RWD-18)', () => {
    const { result, redeemed } = setUp({ entries: [], redemptions: [], bonuses: NO_BONUSES, pointValue: null })

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
    const fake = fakeRewardRepository({ entries: [RUN], redemptions: [COFFEE], bonuses: NO_BONUSES, pointValue: null })
    const repository: RewardRepository = { ...fake.repository, removeRedemption: () => Promise.reject(new Error('denied')) }
    const { result } = renderHook(() => useRewards(repository, onProblem))
    fake.arrive({ entries: [RUN], redemptions: [COFFEE], bonuses: NO_BONUSES, pointValue: null })

    await act(async () => {
      result.current.removeRedemption(COFFEE.id)
      await Promise.resolve()
    })

    expect(onProblem).toHaveBeenCalledWith('save')
  })

  it('says a refused load rather than reading as an empty ledger (RWD-22, STORE-13)', () => {
    expectConsole('Could not load rewards.')
    const onProblem = vi.fn()
    let refuse: (error: unknown) => void = () => {}
    const repository: RewardRepository = {
      ...fakeRewardRepository({ entries: [], redemptions: [], bonuses: NO_BONUSES, pointValue: null }).repository,
      subscribe(_onLedger, onError) {
        refuse = onError
        return () => {}
      },
    }
    const { result } = renderHook(() => useRewards(repository, onProblem))

    act(() => { refuse(new Error('denied')) })

    expect(result.current.loadFailed).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(onProblem).toHaveBeenCalledWith('load')
  })
})
