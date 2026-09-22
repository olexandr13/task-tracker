import { describe, expect, it } from 'vitest'
import {
  pickJustOne,
  pinFocusedFirst,
  PROCRASTINATION_OFF,
  recentDoneCount,
  settleProcrastination,
  type ProcrastinationState,
} from './justOne'
import { appendTask } from './order'
import { setReward } from './reward'
import type { Repeat } from './repeat'
import { addSubtask, completeTask, createTask, type Task } from './task'
import { setTimeGoal } from './timeLog'

/*
 * JUST ids refer to wiki/just-one.md. Local dates on purpose: recent momentum
 * counts calendar days. September 2026: Mon 14 … Wed 16.
 */

const WED_16 = new Date(2026, 8, 16, 9, 0)
const DAILY: Repeat = { kind: 'daily' }

function withOrder(tasks: Task[]): Task[] {
  return tasks.reduce<Task[]>((list, task) => appendTask(list, task), [])
}

describe('pickJustOne', () => {
  it('returns null when every task is done or the list is empty', () => {
    expect(pickJustOne([], WED_16)).toBeNull()
    const done = { ...createTask('done', null, WED_16), status: 'done' as const, completedAt: WED_16.toISOString() }
    expect(pickJustOne([done], WED_16)).toBeNull()
  })

  it('prefers fewer open checklist items (JUST-4)', () => {
    const heavy = addSubtask(addSubtask(createTask('pack', null, WED_16), 'a', WED_16), 'b', WED_16)
    const light = addSubtask(createTask('call', null, WED_16), 'one', WED_16)
    expect(pickJustOne(withOrder([heavy, light]), WED_16)?.title).toBe('call')
  })

  it('prefers a shorter time goal over an unset one (JUST-4)', () => {
    const unknown = createTask('figure it out', null, WED_16)
    const short = setTimeGoal(createTask('five minutes', null, WED_16), 5)
    expect(pickJustOne(withOrder([unknown, short]), WED_16)?.title).toBe('five minutes')
  })

  it('prefers a lower reward (JUST-4)', () => {
    const hard = setReward(createTask('hard', null, WED_16), 5)
    const easy = setReward(createTask('easy', null, WED_16), 1)
    expect(pickJustOne(withOrder([hard, easy]), WED_16)?.title).toBe('easy')
  })

  it('prefers a habit over a one-off when effort matches (JUST-4)', () => {
    const once = createTask('buy milk', null, WED_16)
    const habit = createTask('stretch', DAILY, WED_16)
    expect(pickJustOne(withOrder([once, habit]), WED_16)?.title).toBe('stretch')
  })

  it('prefers more done days in the rolling last seven (JUST-4)', () => {
    const rare = { ...createTask('rare', DAILY, WED_16), doneDays: ['2026-09-15'] as const }
    const often = {
      ...createTask('often', DAILY, WED_16),
      doneDays: ['2026-09-10', '2026-09-12', '2026-09-14', '2026-09-15'] as const,
    }
    expect(pickJustOne(withOrder([rare, often]), WED_16)?.title).toBe('often')
  })

  it('ignores done days outside the rolling window', () => {
    expect(recentDoneCount({ ...createTask('old', DAILY, WED_16), doneDays: ['2026-09-01'] }, WED_16)).toBe(0)
    expect(
      recentDoneCount(
        { ...createTask('recent', DAILY, WED_16), doneDays: ['2026-09-10', '2026-09-16'] },
        WED_16,
      ),
    ).toBe(2)
  })

  it('skips excludeId when another open task exists (JUST-6)', () => {
    const first = createTask('first', null, WED_16)
    const second = createTask('second', null, WED_16)
    const tasks = withOrder([first, second])
    const picked = pickJustOne(tasks, WED_16)
    expect(picked).not.toBeNull()
    expect(pickJustOne(tasks, WED_16, picked!.id)?.id).not.toBe(picked!.id)
  })

  it('keeps the only open task even when it is excluded', () => {
    const only = createTask('only', null, WED_16)
    expect(pickJustOne([only], WED_16, only.id)?.id).toBe(only.id)
  })

  it('breaks ties with list order', () => {
    const a = createTask('a', null, WED_16)
    const b = createTask('b', null, WED_16)
    expect(pickJustOne(withOrder([a, b]), WED_16)?.title).toBe('a')
  })
})

describe('pinFocusedFirst (JUST-5)', () => {
  it('puts the focused task first, even when it is done', () => {
    const open = createTask('open', null, WED_16)
    const done = { ...createTask('done', null, WED_16), status: 'done' as const, completedAt: WED_16.toISOString() }
    const tasks = withOrder([open, done])
    expect(pinFocusedFirst(tasks, done.id).map((task) => task.title)).toEqual(['done', 'open'])
  })

  it('leaves the list alone when nothing is focused', () => {
    const tasks = withOrder([createTask('a', null, WED_16), createTask('b', null, WED_16)])
    expect(pinFocusedFirst(tasks, null).map((task) => task.title)).toEqual(['a', 'b'])
  })
})

describe('settleProcrastination', () => {
  const TODAY = '2026-09-16'
  const task = createTask('a', null, WED_16)
  const focus: ProcrastinationState = { phase: 'focus', taskId: task.id, day: TODAY }

  it('turns a mode from an earlier day off (JUST-10)', () => {
    expect(settleProcrastination({ phase: 'idle', day: '2026-09-15' }, [task], WED_16)).toEqual(PROCRASTINATION_OFF)
  })

  it('checks only the day while the tasks are still loading (JUST-10)', () => {
    expect(settleProcrastination(focus, null, WED_16)).toBe(focus)
  })

  it('makes a focused task that is done a win (JUST-7)', () => {
    expect(settleProcrastination(focus, [completeTask(task, WED_16)], WED_16)).toEqual({
      phase: 'won',
      taskId: task.id,
      day: TODAY,
    })
  })

  it('rests when the focused or won task is no longer on Today (JUST-7)', () => {
    const won: ProcrastinationState = { ...focus, phase: 'won' }
    expect(settleProcrastination(focus, [], WED_16)).toEqual({ phase: 'idle', day: TODAY })
    expect(settleProcrastination(won, [], WED_16)).toEqual({ phase: 'idle', day: TODAY })
  })

  it('hands back the very same state when nothing changes', () => {
    const idle: ProcrastinationState = { phase: 'idle', day: TODAY }
    expect(settleProcrastination(focus, [task], WED_16)).toBe(focus)
    expect(settleProcrastination(idle, [], WED_16)).toBe(idle)
    expect(settleProcrastination(PROCRASTINATION_OFF, [], WED_16)).toBe(PROCRASTINATION_OFF)
  })
})
