// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindTag, createCategory, type Category } from '../core'
import type { CategoryChanges, CategoryRepository } from '../storage/categoryRepository'
import { expectConsole } from '../test/consoleGuard'
import type { ReportProblem } from './storageProblem'
import { useCategories } from './useCategories'

/*
 * The Balance categories on screen, and what happens when the repository will
 * not play along. BAL ids refer to wiki/balance.md, STORE ids to wiki/storage.md.
 */

const AT = new Date('2026-09-17T09:00:00.000Z')
const LATER = new Date('2026-09-18T09:00:00.000Z')

afterEach(cleanup)

const WORK = bindTag(createCategory('Work', AT), 'job')
const REST = bindTag(bindTag(createCategory('Rest', LATER), 'walk'), 'chill')

/** A category repository the test drives: it hands categories over, or fails, on demand. */
function fakeCategoryRepository({ saveFails = false } = {}) {
  let onCategories: (categories: Category[]) => void = () => {}
  let onError: (error: unknown) => void = () => {}
  const written: CategoryChanges[] = []

  const repository: CategoryRepository = {
    subscribe(categories, error) {
      onCategories = categories
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
    arrive: (categories: Category[]) => { act(() => { onCategories(categories) }) },
    fail: (error: unknown) => { act(() => { onError(error) }) },
  }
}

function setUp(saved: Category[] = [], options?: { saveFails?: boolean; onProblem?: ReportProblem }) {
  const fake = fakeCategoryRepository({ saveFails: options?.saveFails })
  const { result } = renderHook(() => useCategories(fake.repository, options?.onProblem))
  fake.arrive(saved)
  return { result, ...fake }
}

const names = (categories: readonly Category[]) => categories.map((category) => category.name)

describe('the categories on screen (BAL-7 to BAL-10)', () => {
  it('is loading until the repository answers, then shows what is saved in the order it was made', () => {
    const fake = fakeCategoryRepository()
    const { result } = renderHook(() => useCategories(fake.repository))
    expect(result.current.isLoading).toBe(true)

    fake.arrive([REST, WORK])

    expect(names(result.current.categories)).toEqual(['Work', 'Rest'])
    expect(result.current.isLoading).toBe(false)
  })

  it('adds a category and saves it alone', () => {
    const { result, written } = setUp([WORK])

    act(() => { expect(result.current.add('Chores')).toBe(true) })

    expect(names(result.current.categories)).toEqual(['Work', 'Chores'])
    expect(written).toHaveLength(1)
    expect(written[0].saved.map((category) => category.name)).toEqual(['Chores'])
  })

  it('refuses a ninth category, one for each colour being all there are', () => {
    const eight = Array.from({ length: 8 }, (_, index) => createCategory(`C${String(index)}`, AT))
    const { result, written } = setUp(eight)

    act(() => { expect(result.current.add('Ninth')).toBe(false) })

    expect(result.current.categories).toHaveLength(8)
    expect(written).toHaveLength(0)
  })

  it('refuses a second category of the same name, whatever its case', () => {
    const { result, written } = setUp([WORK])

    act(() => { expect(result.current.add(' work ')).toBe(false) })

    expect(result.current.categories).toHaveLength(1)
    expect(written).toHaveLength(0)
  })

  it('renames, refusing another category’s name', () => {
    const { result, written } = setUp([WORK, REST])

    act(() => { expect(result.current.rename(WORK.id, 'rest')).toBe(false) })
    expect(written).toHaveLength(0)

    act(() => { expect(result.current.rename(WORK.id, 'Deep work')).toBe(true) })
    expect(names(result.current.categories)).toEqual(['Deep work', 'Rest'])
    expect(written[0]).toEqual({ saved: [{ ...WORK, name: 'Deep work' }], removed: [] })
  })

  it('binds and unbinds a tag, saving only the category changed', () => {
    const { result, written } = setUp([WORK, REST])

    act(() => { result.current.bind(REST.id, 'nap', ['Nap']) })
    act(() => { result.current.unbind(REST.id, 'walk') })

    expect(result.current.categories.find((category) => category.id === REST.id)?.tags).toEqual(['chill', 'Nap'])
    expect(written.map((changes) => changes.saved.map((category) => category.id))).toEqual([[REST.id], [REST.id]])
  })

  it('deletes a category, and puts it back as it was', () => {
    const { result, written } = setUp([WORK, REST])

    act(() => { result.current.remove(REST.id) })
    expect(names(result.current.categories)).toEqual(['Work'])
    expect(written[0]).toEqual({ saved: [], removed: [REST.id] })

    act(() => { result.current.restore(REST) })
    expect(result.current.categories).toEqual([WORK, REST])
    expect(written[1]).toEqual({ saved: [REST], removed: [] })
  })

  it('follows a tag renamed or deleted, saving only the categories bound to it (BAL-11)', () => {
    const { result, written } = setUp([WORK, REST])

    act(() => { result.current.renameTag('walk', 'stroll') })
    act(() => { result.current.removeTag('job') })

    expect(result.current.categories.map((category) => category.tags)).toEqual([[], ['chill', 'stroll']])
    expect(written.map((changes) => changes.saved.map((category) => category.name))).toEqual([['Rest'], ['Work']])
  })

  it('builds each change on the last, not on what was last drawn (STORE-39)', () => {
    vi.useFakeTimers({ now: AT })
    const { result } = setUp([])

    act(() => {
      result.current.add('Work')
      vi.setSystemTime(LATER)
      result.current.add('Rest')
    })

    expect(names(result.current.categories)).toEqual(['Work', 'Rest'])
    vi.useRealTimers()
  })
})

describe('when the repository refuses (STORE-13)', () => {
  it('says a refused load rather than reading as no categories', () => {
    expectConsole('Could not load the Balance categories.')
    const onProblem = vi.fn()
    const { fail, result } = setUp([], { onProblem })

    fail(new Error('denied'))

    expect(onProblem).toHaveBeenCalledWith('load')
    expect(result.current.isLoading).toBe(false)
  })

  it('says a refused save', async () => {
    expectConsole('Could not save the Balance categories.')
    const onProblem = vi.fn()
    const { result } = setUp([], { saveFails: true, onProblem })

    act(() => { result.current.add('Work') })
    await act(async () => { await Promise.resolve() })

    expect(onProblem).toHaveBeenCalledWith('save')
  })
})
