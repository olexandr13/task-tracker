// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPrize, markBought, type Prize } from '../core'
import type { PrizeChanges, PrizeRepository } from '../storage/prizeRepository'
import { expectConsole } from '../test/consoleGuard'
import type { ReportProblem } from './storageProblem'
import { usePrizes } from './usePrizes'

/*
 * The wishlist on screen, and what happens when the repository will not play
 * along. RWD ids refer to wiki/rewards.md, STORE ids to wiki/storage.md.
 */

const AT = new Date('2026-09-17T09:00:00.000Z')

afterEach(cleanup)

const CHOCOLATE = createPrize('Chocolate', 20, 'prize', AT)
const PHONE = createPrize('A new phone', 5000, 'prize', AT)

/** A prize repository the test drives: it hands prizes over, or fails, on demand. */
function fakePrizeRepository({ saveFails = false } = {}) {
  let onPrizes: (prizes: Prize[]) => void = () => {}
  let onError: (error: unknown) => void = () => {}
  const written: PrizeChanges[] = []

  const repository: PrizeRepository = {
    subscribe(prizes, error) {
      onPrizes = prizes
      onError = error
      return () => {}
    },
    save(changes) {
      written.push(changes)
      return saveFails ? Promise.reject(new Error('insufficient permissions')) : Promise.resolve()
    },
  }

  return {
    repository,
    written,
    arrive: (prizes: Prize[]) => { act(() => { onPrizes(prizes) }) },
    fail: (error: unknown) => { act(() => { onError(error) }) },
  }
}

function setUp(saved: Prize[] = [], options?: { saveFails?: boolean; onProblem?: ReportProblem }) {
  const fake = fakePrizeRepository({ saveFails: options?.saveFails })
  const { result } = renderHook(() => usePrizes(fake.repository, options?.onProblem))
  fake.arrive(saved)
  return { result, ...fake }
}

describe('the wishlist on screen (RWD-33, RWD-35)', () => {
  it('shows what is saved, cheapest first', () => {
    const { result } = setUp([PHONE, CHOCOLATE])

    expect(result.current.prizes.map((prize) => prize.name)).toEqual(['Chocolate', 'A new phone'])
    expect(result.current.isLoading).toBe(false)
  })

  it('adds a prize and saves it', () => {
    const { result, written } = setUp()

    act(() => { expect(result.current.add('Chocolate', 20, 'prize')).toBe(true) })

    expect(result.current.prizes.map((prize) => prize.name)).toEqual(['Chocolate'])
    expect(written).toHaveLength(1)
    expect(written[0].saved[0]).toMatchObject({ name: 'Chocolate', points: 20 })
  })

  it('refuses a second prize of the same name, whatever its case (RWD-33)', () => {
    const { result, written } = setUp([CHOCOLATE])

    act(() => { expect(result.current.add('  chocolate ', 30, 'prize')).toBe(false) })

    expect(result.current.prizes).toHaveLength(1)
    expect(written).toHaveLength(0)
  })

  it('renames and reprices a prize (RWD-34)', () => {
    const { result, written } = setUp([CHOCOLATE])

    act(() => { expect(result.current.rename(CHOCOLATE.id, 'A bar of chocolate')).toBe(true) })
    act(() => { result.current.reprice(CHOCOLATE.id, 25) })

    expect(result.current.prizes[0]).toMatchObject({ name: 'A bar of chocolate', points: 25 })
    expect(written).toHaveLength(2)
  })

  it('refuses a rename onto another prize’s name (RWD-33)', () => {
    const { result } = setUp([CHOCOLATE, PHONE])

    act(() => { expect(result.current.rename(PHONE.id, 'Chocolate')).toBe(false) })

    expect(result.current.prizes.map((prize) => prize.name)).toEqual(['Chocolate', 'A new phone'])
  })

  it('takes a prize off the list (RWD-34)', () => {
    const { result, written } = setUp([CHOCOLATE, PHONE])

    act(() => { result.current.remove(CHOCOLATE.id) })

    expect(result.current.prizes.map((prize) => prize.name)).toEqual(['A new phone'])
    expect(written[0].removed).toEqual([CHOCOLATE.id])
  })

  it('builds each change on the last, not on what was last drawn (STORE-39)', () => {
    const { result } = setUp()

    act(() => {
      result.current.add('Chocolate', 20, 'prize')
      result.current.add('Coffee', 10, 'prize')
    })

    expect(result.current.prizes.map((prize) => prize.name)).toEqual(['Coffee', 'Chocolate'])
  })
})

describe('buying a wish (RWD-40)', () => {
  const PHONE_WISH = createPrize('A new phone', 5000, 'wish', AT)

  it('marks it bought, which takes it off what the points can buy', () => {
    const { result, written } = setUp([PHONE_WISH])

    act(() => { result.current.buy(PHONE_WISH.id) })

    expect(result.current.prizes[0].boughtAt).not.toBeNull()
    expect(written[0].saved[0]).toMatchObject({ id: PHONE_WISH.id })
  })

  it('leaves a prize alone: it comes round again', () => {
    const { result, written } = setUp([CHOCOLATE])

    act(() => { result.current.buy(CHOCOLATE.id) })

    expect(result.current.prizes[0].boughtAt).toBeNull()
    expect(written).toHaveLength(0)
  })

  it('puts a bought wish back, for undoing what bought it (RWD-41)', () => {
    const bought = markBought(PHONE_WISH, AT)
    const { result } = setUp([bought])

    act(() => { result.current.restore(bought.id) })

    expect(result.current.prizes[0].boughtAt).toBeNull()
  })

  it('adds to whichever list it was asked for', () => {
    const { result } = setUp()

    act(() => { result.current.add('A bicycle', 2000, 'wish') })

    expect(result.current.prizes[0]).toMatchObject({ name: 'A bicycle', kind: 'wish' })
  })
})

describe('when the repository refuses (STORE-13)', () => {
  it('says a refused load rather than reading as an empty wishlist', () => {
    expectConsole('Could not load the wishlist.')
    const onProblem = vi.fn()
    const { fail, result } = setUp([], { onProblem })

    fail(new Error('denied'))

    expect(onProblem).toHaveBeenCalledWith('load')
    expect(result.current.isLoading).toBe(false)
  })

  it('says a refused save', async () => {
    expectConsole('Could not save the wishlist.')
    const onProblem = vi.fn()
    const { result } = setUp([], { saveFails: true, onProblem })

    act(() => { result.current.add('Chocolate', 20, 'prize') })
    await act(async () => { await Promise.resolve() })

    expect(onProblem).toHaveBeenCalledWith('save')
  })
})
