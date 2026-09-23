// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  completeTask,
  createTask,
  dueDay,
  isComplete,
  isOverdue,
  setDueDate,
  setReward,
  BONUS_IDS,
  NO_BONUSES,
  type PeriodBonuses,
  type Repeat,
  type RewardChanges,
  type RewardEntry,
  type Task,
} from '../core'
import type { RewardRepository } from '../storage/rewardRepository'
import type { TaskChanges, TaskRepository } from '../storage/taskRepository'
import { expectConsole } from '../test/consoleGuard'
import { useTasks } from './useTasks'

/*
 * What a change to the tasks earns, as it reaches the reward repository. RWD ids refer to
 * wiki/rewards.md. Only `Date` is faked, so the day a completion is for is known.
 */

const THU_17 = new Date(2026, 8, 17, 9, 0)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(THU_17)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** A task repository whose saved tasks the test hands over, as a snapshot would. */
function fakeTaskRepository() {
  let onTasks: (tasks: Task[]) => void = () => {}
  const repository: TaskRepository = {
    subscribe(callback) {
      onTasks = callback
      return () => {}
    },
    save: () => Promise.resolve(),
    importTasks: () => Promise.resolve(),
  }
  return { repository, arrive: (tasks: Task[]) => { act(() => { onTasks(tasks) }) } }
}

/** A reward repository that keeps every change it is asked to record. */
function fakeRewardRepository() {
  const recorded: RewardChanges[] = []
  const repository: RewardRepository = {
    subscribe: () => () => {},
    save(changes) {
      recorded.push(changes)
      return Promise.resolve()
    },
    redeem: () => Promise.resolve(),
    setBonus: () => Promise.resolve(),
    setPointValue: () => Promise.resolve(),
    importBonus: () => Promise.resolve(),
    importPointValue: () => Promise.resolve(),
    removeRedemption: () => Promise.resolve(),
  }
  return { repository, recorded }
}

function setUp(saved: Task[], bonuses: PeriodBonuses = NO_BONUSES, earned: RewardEntry[] = []) {
  const tasks = fakeTaskRepository()
  const rewards = fakeRewardRepository()
  const { result } = renderHook(() => useTasks(tasks.repository, rewards.repository, undefined, bonuses, earned))
  tasks.arrive(saved)
  return { result, arrive: tasks.arrive, recorded: rewards.recorded }
}

/** A bonus for clearing Today and none for the longer periods. */
const todayWorth = (points: number): PeriodBonuses => ({ ...NO_BONUSES, today: points })

describe('useTasks, recording rewards', () => {
  it('records the reward when a task with one is completed (RWD-9, RWD-10)', () => {
    const task = setReward(createTask('pack'), 5)
    const { result, recorded } = setUp([task])

    act(() => { result.current.complete(task.id) })

    expect(recorded).toEqual([{ earned: [{ taskId: task.id, day: '2026-09-17', points: 5 }], revoked: [] }])
  })

  it('records the reward a task was given before it was completed (RWD-5, RWD-10)', () => {
    const task = createTask('run', { kind: 'daily' })
    const { result, recorded } = setUp([task])

    act(() => { result.current.changeReward(task.id, 3) })
    act(() => { result.current.complete(task.id) })

    expect(recorded).toEqual([{ earned: [{ taskId: task.id, day: '2026-09-17', points: 3 }], revoked: [] }])
  })

  it('takes back what a completion earned when it is unticked (RWD-11)', () => {
    const task = setReward(createTask('pack'), 5)
    const { result, recorded } = setUp([task])

    act(() => { result.current.complete(task.id) })
    act(() => { result.current.uncomplete(task.id) })

    expect(recorded[1]).toEqual({ earned: [], revoked: [{ taskId: task.id, day: '2026-09-17' }] })
  })

  it('records nothing for a task without a reward, or for a change that is not a completion (RWD-10, RWD-13)', () => {
    const plain = createTask('read')
    const rewarded = setReward(createTask('pack'), 5)
    const { result, recorded } = setUp([plain, rewarded])

    act(() => { result.current.complete(plain.id) })
    act(() => { result.current.changeReward(rewarded.id, 7) })
    act(() => { result.current.rename(rewarded.id, 'pack the bag') })

    expect(recorded).toEqual([])
  })

  it('records nothing for a completion arriving from another device, which recorded it itself', () => {
    const task = setReward(createTask('pack'), 5)
    const { arrive, recorded } = setUp([task])

    arrive([completeTask(task)])

    expect(recorded).toEqual([])
  })
})

/*
 * The reported case, through the same callbacks a row's checkbox calls: a weekly task whose
 * Monday went by undone reads red, and taking the tick back off it must not put it back there.
 */
describe('useTasks, recording the period bonuses', () => {
  /** A task due today, which Today asks for until it is done. */
  const dueToday = (title: string) => setDueDate(createTask(title), '2026-09-17')

  it('records the bonus once the last of Today is done (RWD-25)', () => {
    const pack = dueToday('pack')
    const post = dueToday('post')
    const { result, recorded } = setUp([pack, post], todayWorth(10))

    act(() => { result.current.complete(pack.id) })
    act(() => { result.current.complete(post.id) })

    expect(recorded).toEqual([
      { earned: [{ taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 }], revoked: [] },
    ])
  })

  it('takes it back when Today stops being clear (RWD-26)', () => {
    const pack = dueToday('pack')
    // The ledger holds what the day was given, which is what taking it back reaches for.
    const given: RewardEntry[] = [{ taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 }]
    const { result, recorded } = setUp([pack], todayWorth(10), given)

    act(() => { result.current.complete(pack.id) })
    act(() => { result.current.uncomplete(pack.id) })

    // The task's own completion goes back with it, whether it earned or not.
    expect(recorded[1]).toEqual({
      earned: [],
      revoked: [
        { taskId: pack.id, day: '2026-09-17' },
        { taskId: BONUS_IDS.today, day: '2026-09-17' },
      ],
    })
  })

  it('records it beside what the task itself earned (RWD-25)', () => {
    const pack = setReward(dueToday('pack'), 5)
    const { result, recorded } = setUp([pack], todayWorth(10))

    act(() => { result.current.complete(pack.id) })

    expect(recorded).toEqual([
      {
        earned: [
          { taskId: pack.id, day: '2026-09-17', points: 5 },
          { taskId: BONUS_IDS.today, day: '2026-09-17', points: 10 },
        ],
        revoked: [],
      },
    ])
  })

  it('records no bonus at all while none is set (RWD-27)', () => {
    const pack = dueToday('pack')
    const { result, recorded } = setUp([pack])


    act(() => { result.current.complete(pack.id) })
    act(() => { result.current.uncomplete(pack.id) })

    const mentioned = recorded.flatMap((change) => [...change.earned, ...change.revoked])
    expect(mentioned.some((entry) => entry.taskId === BONUS_IDS.today)).toBe(false)
  })
})

describe('useTasks, reopening a missed occurrence', () => {
  const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }
  /** Written the Monday before, so the occurrence it missed is one it existed for (DUE-11). */
  const MON_7 = new Date(2026, 8, 7, 9, 0)

  it('passes the missed occurrence over instead of dropping the task back on it (RPT-38)', () => {
    const task = createTask('weekly review', MONDAYS, MON_7)
    const { result } = setUp([task])

    expect(dueDay(result.current.tasks[0])).toBe('2026-09-14')
    expect(isOverdue(result.current.tasks[0])).toBe(true)

    act(() => { result.current.complete(task.id) })
    expect(isComplete(result.current.tasks[0])).toBe(true)
    expect(isOverdue(result.current.tasks[0])).toBe(false)

    act(() => { result.current.uncomplete(task.id) })

    expect(isComplete(result.current.tasks[0])).toBe(false)
    expect(isOverdue(result.current.tasks[0])).toBe(false)
    expect(dueDay(result.current.tasks[0])).toBe('2026-09-21')
  })

  it('leaves a daily task on today, which is not a day gone by (RPT-38)', () => {
    const task = createTask('stretch', { kind: 'daily' }, MON_7)
    const { result } = setUp([task])

    act(() => { result.current.complete(task.id) })
    act(() => { result.current.uncomplete(task.id) })

    expect(result.current.tasks[0].skippedDays).toEqual([])
    expect(dueDay(result.current.tasks[0])).toBe('2026-09-17')
  })

  it('still takes back what the missed occurrence earned (RWD-11)', () => {
    const task = setReward(createTask('weekly review', MONDAYS, MON_7), 5)
    const { result, recorded } = setUp([task])

    act(() => { result.current.complete(task.id) })
    act(() => { result.current.uncomplete(task.id) })

    expect(recorded).toEqual([
      { earned: [{ taskId: task.id, day: '2026-09-17', points: 5 }], revoked: [] },
      { earned: [], revoked: [{ taskId: task.id, day: '2026-09-17' }] },
    ])
  })
})

describe('useTasks, changes made in one go', () => {
  it('keeps both of two changes to one task made before the screen redraws (STORE-39)', () => {
    const task = createTask('stretch')
    const written: TaskChanges[] = []
    let onTasks: (tasks: Task[]) => void = () => {}
    const repository: TaskRepository = {
      subscribe(callback) {
        onTasks = callback
        return () => {}
      },
      save(changes) {
        written.push(changes)
        return Promise.resolve()
      },
      importTasks: () => Promise.resolve(),
    }
    const { result } = renderHook(() => useTasks(repository, fakeRewardRepository().repository))
    act(() => { onTasks([task]) })

    act(() => {
      result.current.rename(task.id, 'walk')
      result.current.changeDescription(task.id, 'round the park')
    })

    expect(result.current.tasks).toMatchObject([{ title: 'walk', description: 'round the park' }])
    expect(written.at(-1)?.saved).toMatchObject([{ title: 'walk', description: 'round the park' }])
  })

  it('hands back the task a deletion took, even straight after another change', () => {
    const task = createTask('stretch')
    const { result } = setUp([task])

    let deleted: Task | null = null
    act(() => {
      result.current.rename(task.id, 'walk')
      deleted = result.current.remove(task.id)
    })

    expect(deleted).toMatchObject({ title: 'walk' })
  })
})

describe('useTasks, when the repository refuses', () => {
  it('says a load it refused is not an empty list, and reports it (STORE-13)', () => {
    expectConsole('Could not load tasks.')
    const onProblem = vi.fn()
    let fail: (error: unknown) => void = () => {}
    const repository: TaskRepository = {
      subscribe(_onTasks, onError) {
        fail = onError
        return () => {}
      },
      save: () => Promise.resolve(),
      importTasks: () => Promise.resolve(),
    }
    const { result } = renderHook(() => useTasks(repository, fakeRewardRepository().repository, onProblem))

    act(() => { fail(new Error('Missing or insufficient permissions.')) })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.loadFailed).toBe(true)
    expect(onProblem).toHaveBeenCalledWith('load')
  })

  it('reports a save it refused (STORE-13)', async () => {
    expectConsole('Could not save tasks.')
    const onProblem = vi.fn()
    const task = createTask('stretch')
    let onTasks: (tasks: Task[]) => void = () => {}
    const repository: TaskRepository = {
      subscribe(callback) {
        onTasks = callback
        return () => {}
      },
      save: () => Promise.reject(new Error('quota exceeded')),
      importTasks: () => Promise.resolve(),
    }
    const { result } = renderHook(() => useTasks(repository, fakeRewardRepository().repository, onProblem))
    act(() => { onTasks([task]) })

    await act(async () => {
      result.current.rename(task.id, 'walk')
      await Promise.resolve()
    })

    expect(onProblem).toHaveBeenCalledWith('save')
  })
})
