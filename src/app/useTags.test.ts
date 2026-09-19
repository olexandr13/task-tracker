// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { addTag, createTag, createTask, type Tag, type Task } from '../core'
import type { TagChanges, TagRepository } from '../storage/tagRepository'
import { consoleOutput, expectConsole } from '../test/consoleGuard'
import { useTags } from './useTags'

/*
 * The kept tags, and keeping the ones tasks carry. TAG ids refer to
 * wiki/tags.md, STORE ids to wiki/storage.md.
 */

const AT = new Date('2026-09-17T09:00:00.000Z')

afterEach(cleanup)

const WORK = createTag('Work', AT)
const HOME = createTag('home', AT)

function tagged(...tags: string[]): Task {
  return tags.reduce((task, tag) => addTag(task, tag), createTask('pack', null, AT))
}

/** A tag repository the test drives: it hands tags over, or fails, on demand. */
function fakeTagRepository() {
  let onTags: (tags: Tag[]) => void = () => {}
  let onError: (error: unknown) => void = () => {}
  const written: TagChanges[] = []

  const repository: TagRepository = {
    subscribe(tags, error) {
      onTags = tags
      onError = error
      return () => {}
    },
    save(changes) {
      written.push(changes)
      return Promise.resolve()
    },
  }

  return {
    repository,
    written,
    arrive: (tags: Tag[]) => { act(() => { onTags(tags) }) },
    fail: (error: unknown) => { act(() => { onError(error) }) },
  }
}

function setUp(tasks: readonly Task[] | null = []) {
  const tags = fakeTagRepository()
  const hook = renderHook(({ current }) => useTags(tags.repository, current), { initialProps: { current: tasks } })
  return { ...hook, ...tags }
}

describe('the kept tags', () => {
  it('waits for the repository before saying there are none', () => {
    const { result } = setUp()

    expect(result.current.isLoading).toBe(true)
    expect(result.current.tags).toEqual([])
  })

  it('says so once and carries on when the tags cannot be loaded (STORE-13)', () => {
    expectConsole('Could not load tags.')
    const { result, fail } = setUp()

    fail(new Error('Missing or insufficient permissions.'))

    expect(result.current.isLoading).toBe(false)
    expect(consoleOutput()).toHaveLength(1)
  })

  it('keeps nothing when the tags could not be loaded: they may well be kept already', () => {
    expectConsole('Could not load tags.')
    const { fail, written } = setUp([tagged('work')])

    fail(new Error('Missing or insufficient permissions.'))

    expect(written).toEqual([])
  })
})

describe('keeping the tags tasks carry', () => {
  it('keeps a tag a task carries, so it stays once no task does (TAG-6)', () => {
    const { arrive, written } = setUp([tagged('errands', 'work')])

    arrive([WORK])

    expect(written).toHaveLength(1)
    expect(written[0].saved.map((tag) => tag.name)).toEqual(['errands'])
  })

  it('writes a tag once while it is on its way, and again only once it has gone', () => {
    const { result, arrive, written, rerender } = setUp([tagged('errands')])
    arrive([])
    expect(written).toHaveLength(1)

    // The tasks change again before the kept tag has come back: nothing more is written.
    rerender({ current: [tagged('errands'), tagged('errands')] })
    expect(written).toHaveLength(1)

    // Back, then deleted — off the tasks first — then carried again: it is kept afresh.
    arrive([...written[0].saved])
    rerender({ current: [tagged()] })
    act(() => { result.current.remove('errands') })
    expect(written).toHaveLength(2)
    rerender({ current: [tagged('errands')] })
    expect(written.map((changes) => changes.saved.map((tag) => tag.name))).toEqual([['errands'], [], ['errands']])
  })

  it('writes nothing until both the tags and the tasks have loaded', () => {
    const { arrive, written, rerender } = setUp(null)

    arrive([])
    expect(written).toEqual([])

    rerender({ current: [tagged('work')] })
    expect(written).toHaveLength(1)
  })

  it('writes nothing when every tag a task carries is kept already', () => {
    const { arrive, written } = setUp([tagged('work', 'home')])

    arrive([WORK, HOME])

    expect(written).toEqual([])
  })
})

describe('changing the kept tags', () => {
  it('makes a tag no task carries, from its name (TAG-23)', () => {
    const { result, arrive, written } = setUp()
    arrive([])

    const made: { tag: Tag | null } = { tag: null }
    act(() => { made.tag = result.current.add('#reading') })

    expect(made.tag?.name).toBe('reading')
    expect(written[0].saved).toEqual([made.tag])
  })

  it('makes nothing, and writes nothing, for a tag there is already in any case (TAG-4, TAG-23)', () => {
    const { result, arrive, written } = setUp()
    arrive([WORK])

    const made: { tag: Tag | null } = { tag: null }
    act(() => { made.tag = result.current.add('work') })

    expect(made.tag).toBeNull()
    expect(written).toEqual([])
  })

  it('stops keeping every record of a deleted tag, in any case (TAG-22)', () => {
    const twice = createTag('work', AT)
    const { result, arrive, written } = setUp()
    arrive([WORK, HOME, twice])

    act(() => { result.current.remove('WORK') })

    expect(result.current.tags).toEqual([HOME])
    expect(written[0].removed).toEqual([WORK.id, twice.id])
  })
})
