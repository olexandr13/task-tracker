// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendList, createList, type List } from '../core'
import type { ListChanges, ListRepository } from '../storage/listRepository'
import { consoleOutput, expectConsole } from '../test/consoleGuard'
import type { ReportProblem } from './storageProblem'
import { useLists } from './useLists'

/*
 * The lists on screen, and what happens when the repository will not play along.
 * LST ids refer to wiki/lists.md, STORE ids to wiki/storage.md.
 */

const AT = new Date('2026-09-17T09:00:00.000Z')

afterEach(cleanup)

const LISTS = appendList(appendList([], createList('Work', AT)), createList('Home', AT))
const [WORK, HOME] = LISTS

/** A list repository the test drives: it hands lists over, or fails, on demand. */
function fakeListRepository({ saveFails = false } = {}) {
  let onLists: (lists: List[]) => void = () => {}
  let onError: (error: unknown) => void = () => {}
  const written: ListChanges[] = []

  const repository: ListRepository = {
    subscribe(lists, error) {
      onLists = lists
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
    arrive: (lists: List[]) => { act(() => { onLists(lists) }) },
    fail: (error: unknown) => { act(() => { onError(error) }) },
  }
}

function setUp(options?: { saveFails?: boolean; onProblem?: ReportProblem }) {
  const lists = fakeListRepository(options)
  const { result } = renderHook(() => useLists(lists.repository, options?.onProblem))
  return { result, ...lists }
}

describe('the lists on screen', () => {
  it('waits for the repository before saying there are none', () => {
    const { result } = setUp()

    expect(result.current.isLoading).toBe(true)
    expect(result.current.lists).toEqual([])
  })

  it('shows the lists that arrive, in the order they are shown (LST-13)', () => {
    const { result, arrive } = setUp()

    arrive([HOME, WORK])

    expect(result.current.isLoading).toBe(false)
    expect(result.current.lists.map((list) => list.name)).toEqual(['Work', 'Home'])
  })
})

describe('when the repository will not play along', () => {
  /*
   * The case this covers for real: the database refusing to read the lists —
   * `firestore.rules` not yet deployed, say — which arrives as an error on the
   * subscription rather than as an empty set.
   */
  it('says so once and carries on when the lists cannot be loaded (STORE-13)', () => {
    expectConsole('Could not load lists.')
    const onProblem = vi.fn()
    const { result, fail } = setUp({ onProblem })

    fail(new Error('Missing or insufficient permissions.'))
    expect(onProblem).toHaveBeenCalledWith('load')

    // The page stops waiting rather than showing "Loading…" for ever, and the
    // rest of the app — the tasks, which load separately — is untouched.
    expect(result.current.isLoading).toBe(false)
    expect(result.current.lists).toEqual([])

    const said = consoleOutput()
    expect(said).toHaveLength(1)
    expect(said[0].level).toBe('error')
    expect(said[0].text).toContain('Missing or insufficient permissions.')
  })

  it('says so when a change cannot be saved (STORE-13)', async () => {
    expectConsole('Could not save lists.')
    const onProblem = vi.fn()
    const { result, arrive } = setUp({ saveFails: true, onProblem })
    arrive([])

    await act(async () => {
      result.current.add('Work')
      await Promise.resolve()
    })

    expect(onProblem).toHaveBeenCalledWith('save')

    expect(consoleOutput()).toHaveLength(1)
    expect(consoleOutput()[0].text).toContain('Could not save lists.')
  })

  it('still shows a list it could not save: the repository has the last word', () => {
    const { result, arrive } = setUp()
    arrive([])

    act(() => { result.current.add('Work') })

    expect(result.current.lists.map((list) => list.name)).toEqual(['Work'])
  })
})

describe('changing the lists', () => {
  it('writes only the list a change touched (STORE-28)', () => {
    const { result, arrive, written } = setUp()
    arrive(LISTS)

    act(() => { result.current.rename(WORK.id, 'Day job') })

    expect(written).toHaveLength(1)
    expect(written[0].saved.map((list) => list.name)).toEqual(['Day job'])
    expect(written[0].removed).toEqual([])
  })

  it('hands back the list it made, so it can be opened at once (LST-21)', () => {
    const { result, arrive } = setUp()
    arrive([])

    const made: { list: List | null } = { list: null }
    act(() => { made.list = result.current.add('Side projects') })

    expect(made.list?.name).toBe('Side projects')
  })

  it('makes nothing, and writes nothing, for a name another list has (LST-5)', () => {
    const { result, arrive, written } = setUp()
    arrive(LISTS)

    const made: { list: List | null } = { list: null }
    act(() => { made.list = result.current.add('  work ') })

    expect(made.list).toBeNull()
    expect(written).toEqual([])
    expect(result.current.lists).toHaveLength(2)
  })

  it('refuses a rename onto another list\'s name, and writes nothing (LST-5)', () => {
    const { result, arrive, written } = setUp()
    arrive(LISTS)

    const done: { ok: boolean | null } = { ok: null }
    act(() => { done.ok = result.current.rename(WORK.id, 'home') })

    expect(done.ok).toBe(false)
    expect(written).toEqual([])
  })

  it('takes a list to be called what it is called already (LST-5)', () => {
    const { result, arrive } = setUp()
    arrive(LISTS)

    const done: { ok: boolean | null } = { ok: null }
    act(() => { done.ok = result.current.rename(WORK.id, 'Work') })

    expect(done.ok).toBe(true)
  })

  it('removes a deleted list, and writes that it is gone (LST-19)', () => {
    const { result, arrive, written } = setUp()
    arrive(LISTS)

    act(() => { result.current.remove(HOME.id) })

    expect(result.current.lists.map((list) => list.name)).toEqual(['Work'])
    expect(written[0].removed).toEqual([HOME.id])
    expect(written[0].saved).toEqual([])
  })
})

describe('changes made in one go', () => {
  it('keeps both of two lists made before the screen redraws (STORE-39)', () => {
    const { result, arrive } = setUp()
    arrive([])

    act(() => {
      result.current.add('Work')
      result.current.add('Home')
    })

    expect(result.current.lists.map((list) => list.name)).toEqual(['Work', 'Home'])
  })

  it('refuses a second list of the same name made in the same go (LST-5)', () => {
    const { result, arrive } = setUp()
    arrive([])

    let second: List | null = null
    act(() => {
      result.current.add('Work')
      second = result.current.add('work')
    })

    expect(second).toBeNull()
    expect(result.current.lists).toHaveLength(1)
  })
})
