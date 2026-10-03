import { describe, expect, it } from 'vitest'
import { addTag, createTask, renameTask } from '../core'
import { createHeldTasks } from './heldTasks'

/* What a device holds of the tasks, put together from several answers. STORE ids refer
   to wiki/storage.md. */

const START = '2026-09-28'
const MADE = new Date(2026, 5, 1, 9, 0)

/** Answers every question asked from the start, with nothing unless given. */
function answerStart(held: ReturnType<typeof createHeldTasks>, given: Record<string, ReturnType<typeof createTask>[]> = {}) {
  for (const query of held.startQueries) held.receive(query.key, given[query.key] ?? [], true)
}

describe('createHeldTasks', () => {
  it('holds nothing until every question asked from the start is answered (STORE-55)', () => {
    const held = createHeldTasks(START)
    const [first, ...rest] = held.startQueries

    held.receive(first.key, [createTask('open', null, MADE)], true)
    expect(held.current()).toBeNull()

    for (const query of rest) held.receive(query.key, [], true)
    expect(held.current()?.tasks.map((task) => task.title)).toEqual(['open'])
  })

  it('holds a task more than one answer has once, as it was last heard of (STORE-55)', () => {
    const held = createHeldTasks(START)
    const habit = createTask('stretch', { kind: 'daily' }, MADE)
    answerStart(held, { repeating: [habit], finished: [habit] })

    held.receive('finished', [renameTask(habit, 'yoga')], true)

    expect(held.current()?.tasks.map((task) => task.title)).toEqual(['yoga'])
  })

  it('lets go of a task no answer has any more (STORE-55)', () => {
    const held = createHeldTasks(START)
    const open = createTask('open', null, MADE)
    answerStart(held, { 'to do': [open] })

    held.receive('to do', [], true)

    expect(held.current()?.tasks).toEqual([])
  })

  it('gives the tasks in order of id, however they were asked for (STORE-55)', () => {
    const held = createHeldTasks(START)
    const tasks = [createTask('a', null, MADE), createTask('b', null, MADE), createTask('c', null, MADE)]
    answerStart(held, { 'to do': [tasks[2], tasks[0]], due: [tasks[1]] })

    expect(held.current()?.tasks.map((task) => task.id)).toEqual(tasks.map((task) => task.id).sort())
  })

  it('reaches back a range at a time, and not again over what was asked for (STORE-55)', () => {
    const held = createHeldTasks(START)

    expect(held.reachBack('2026-09-30')).toEqual([])
    expect(held.reachBack('2026-09-26').map((query) => query.key)).toEqual(['finished 2026-09-26 to 2026-09-28'])
    expect(held.reachBack('2026-09-27')).toEqual([])
    expect(held.reachBack('2026-09-03').map((query) => query.key)).toEqual(['finished 2026-09-03 to 2026-09-26'])
    expect(held.reachBack(null).map((query) => query.key)).toEqual(['finished before 2026-09-03', 'never stamped'])
    expect(held.reachBack(null)).toEqual([])
  })

  it('holds history from a day only once every range up to it is answered by the server (STORE-55)', () => {
    const held = createHeldTasks(START)
    answerStart(held)
    const [week] = held.reachBack('2026-09-26')
    const [month] = held.reachBack('2026-09-03')

    expect(held.current()?.heldSince).toBe(START)

    // The month answered first, and the week only from the browser's copy: neither counts yet.
    held.receive(month.key, [], true)
    held.receive(week.key, [], false)
    expect(held.current()?.heldSince).toBe(START)

    held.receive(week.key, [], true)
    expect(held.current()?.heldSince).toBe('2026-09-03')
  })

  it('holds every task once everything reached back to is answered (STORE-55)', () => {
    const held = createHeldTasks(START)
    answerStart(held)
    const everything = held.reachBack(null)

    for (const query of everything) held.receive(query.key, [], true)

    expect(held.current()?.heldSince).toBeNull()
  })

  it('counts the tasks held in a scope, as the server would (STORE-55)', () => {
    const held = createHeldTasks(START)
    const rest = addTag(createTask('walk', null, MADE), 'rest')
    answerStart(held, { 'to do': [rest, createTask('call', null, MADE)] })

    expect(held.count({ kind: 'all' })).toBe(2)
    expect(held.count({ kind: 'tag', tag: 'rest' })).toBe(1)
    expect(held.count({ kind: 'list', listId: null })).toBe(2)
  })
})
