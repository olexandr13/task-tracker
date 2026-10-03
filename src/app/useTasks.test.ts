// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addTag,
  completeTask,
  createTask,
  dueDay,
  habitTasks,
  isComplete,
  isOverdue,
  logTime,
  setDueDate,
  setReward,
  setStartDay,
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
    subscribe(_start, callback) {
      onTasks = (tasks) => { callback(tasks, null) }
      return { reachBack() {}, unheld: () => Promise.resolve(0), stop() {} }
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
    setChestSettings: () => Promise.resolve(),
    importBonus: () => Promise.resolve(),
    importPointValue: () => Promise.resolve(),
    importChestSettings: () => Promise.resolve(),
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

describe('useTasks, a day picked for a task (DUE-18)', () => {
  /** A week before, so there is an occurrence gone by to have logged time against. */
  const THU_10 = new Date(2026, 8, 10, 9, 0)

  it('starts a repeating task’s rule on the day, keeping the rule', () => {
    const task = logTime(createTask('stretch', { kind: 'daily' }, THU_10), 30, THU_10)
    const { result } = setUp([task])

    act(() => { result.current.changeDay(task.id, '2026-09-25') })

    expect(result.current.tasks[0].repeat).toEqual({ kind: 'daily' })
    expect(result.current.tasks[0].startDay).toBe('2026-09-25')
    expect(result.current.tasks[0].dueDate).toBeNull()
    // Nothing was let go of with the rule, because no rule ended (TIME-7).
    expect(result.current.tasks[0].timeLog).toHaveLength(1)
  })

  it('gives a one-off the day it is due', () => {
    const oneOff = setDueDate(createTask('call mum', null, THU_10), '2026-09-18')
    const { result } = setUp([oneOff])

    act(() => { result.current.changeDay(oneOff.id, '2026-09-25') })

    expect(result.current.tasks[0].dueDate).toBe('2026-09-25')
    expect(result.current.tasks[0].startDay).toBeNull()
  })

  it('takes the day away again, whichever day the task carried', () => {
    const oneOff = setDueDate(createTask('call mum', null, THU_10), '2026-09-18')
    const repeating = setStartDay(createTask('stretch', { kind: 'daily' }, THU_10), '2026-09-25')
    const { result } = setUp([oneOff, repeating])

    act(() => { result.current.changeDay(oneOff.id, null) })
    act(() => { result.current.changeDay(repeating.id, null) })

    expect(result.current.tasks[0].dueDate).toBeNull()
    expect(result.current.tasks[1].startDay).toBeNull()
    expect(result.current.tasks[1].repeat).toEqual({ kind: 'daily' })
  })
})

describe('useTasks, a task taken on as a habit (HAB-30)', () => {
  const DAILY: Repeat = { kind: 'daily' }

  /** A one-off ahead of two habits, which is where a task written before them sits. */
  function saved() {
    const oneOff = { ...createTask('call the bank'), order: 0 }
    const stretch = { ...createTask('stretch', DAILY), order: 1024 }
    const read = { ...createTask('read', DAILY), order: 2048 }
    return { oneOff, stretch, read, tasks: [oneOff, stretch, read] }
  }

  /** The live habits as the Habits page reads them, in the order of the list. */
  function habits(tasks: readonly Task[]) {
    return habitTasks(tasks).map((task) => task.title)
  }

  it('puts it after the habits already kept, wherever it sat', () => {
    const { oneOff, tasks } = saved()
    const { result } = setUp(tasks)

    act(() => { result.current.changeRepeat(oneOff.id, DAILY) })

    expect(habits(result.current.tasks)).toEqual(['stretch', 'read', 'call the bank'])
  })

  it('leaves a habit where it is when its rule changes and it stays a habit', () => {
    const { stretch, tasks } = saved()
    const { result } = setUp(tasks)

    act(() => { result.current.changeRepeat(stretch.id, { kind: 'weekly', weekdays: [0, 1, 2, 3, 4, 5, 6] }) })

    expect(habits(result.current.tasks)).toEqual(['stretch', 'read'])
  })

  it('leaves the order alone when a task is given a rule that is not a habit’s', () => {
    const { oneOff, tasks } = saved()
    const { result } = setUp(tasks)

    act(() => { result.current.changeRepeat(oneOff.id, { kind: 'weekly', weekdays: [1, 3] }) })

    expect(result.current.tasks.map((task) => task.order)).toEqual([0, 1024, 2048])
  })
})

describe('useTasks, changes made in one go', () => {
  it('keeps both of two changes to one task made before the screen redraws (STORE-39)', () => {
    const task = createTask('stretch')
    const written: TaskChanges[] = []
    let onTasks: (tasks: Task[]) => void = () => {}
    const repository: TaskRepository = {
      subscribe(_start, callback) {
        onTasks = (tasks) => { callback(tasks, null) }
        return { reachBack() {}, unheld: () => Promise.resolve(0), stop() {} }
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

  it('renames a tag on every task carrying it, in any case, and on nothing else (TAG-24)', () => {
    const work = addTag(createTask('email'), 'Work')
    const home = addTag(createTask('sweep'), 'home')
    const { result } = setUp([work, home])

    act(() => { result.current.renameTagEverywhere('work', 'office') })

    expect(result.current.tasks.map((task) => task.tags)).toEqual([['office'], ['home']])
    expect(result.current.tasks[1]).toBe(home)
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
      subscribe(_start, _onTasks, onError) {
        fail = onError
        return { reachBack() {}, unheld: () => Promise.resolve(null), stop() {} }
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
      subscribe(_start, callback) {
        onTasks = (tasks) => { callback(tasks, null) }
        return { reachBack() {}, unheld: () => Promise.resolve(0), stop() {} }
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

describe('useTasks, holding history', () => {
  /** A task repository that says how much it holds, and records what it was asked to hold. */
  function partialRepository() {
    let onTasks: (tasks: Task[], heldSince: string | null) => void = () => {}
    const asked: { start: string | null; reachedBack: (string | null)[] } = { start: null, reachedBack: [] }
    const repository: TaskRepository = {
      subscribe(start, callback) {
        asked.start = start
        onTasks = callback
        return {
          reachBack(day) { asked.reachedBack.push(day) },
          unheld: () => Promise.resolve(3),
          stop() {},
        }
      },
      save: () => Promise.resolve(),
      importTasks: () => Promise.resolve(),
    }
    const arrive = (tasks: Task[], heldSince: string | null) => { act(() => { onTasks(tasks, heldSince) }) }
    return { repository, asked, arrive }
  }

  function setUpPartial(saved: Task[], heldSince: string | null) {
    const tasks = partialRepository()
    const { result } = renderHook(() => useTasks(tasks.repository, fakeRewardRepository().repository))
    tasks.arrive(saved, heldSince)
    return { result, ...tasks }
  }

  it('holds the tasks from the first day of this week or month, whichever comes first (STORE-55)', () => {
    // Thursday 17 September: the month began on the 1st, before the week did.
    const { result, asked } = setUpPartial([], '2026-09-01')

    expect(asked.start).toBe('2026-09-01')
    expect(result.current.heldSince).toBe('2026-09-01')
  })

  it('asks the repository to reach back, and says once it has (STORE-55)', () => {
    const { result, asked, arrive } = setUpPartial([], '2026-09-01')

    act(() => { result.current.reachBack('2026-08-19') })
    arrive([], '2026-08-19')

    expect(asked.reachedBack).toEqual(['2026-08-19'])
    expect(result.current.heldSince).toBe('2026-08-19')
  })

  it('renames a tag on the history too, waiting for it to arrive first (TAG-24, STORE-55)', () => {
    const held = addTag(createTask('email'), 'work')
    const old = completeTask(addTag(createTask('report'), 'work'), new Date(2026, 6, 1))
    const { result, asked, arrive } = setUpPartial([held], '2026-09-01')

    let ran = false
    act(() => {
      result.current.everywhere(() => {
        ran = true
        result.current.renameTagEverywhere('work', 'job')
      })
    })

    expect(ran).toBe(false)
    expect(asked.reachedBack).toEqual([null])

    arrive([held, old], null)

    expect(ran).toBe(true)
    expect(result.current.tasks.map((task) => task.tags)).toEqual([['job'], ['job']])
  })

  it('does at once what needs every task when every task is held already (TAG-22)', () => {
    const { result, asked } = setUpPartial([addTag(createTask('email'), 'work')], null)

    act(() => { result.current.everywhere(() => { result.current.removeTagEverywhere('work') }) })

    expect(asked.reachedBack).toEqual([])
    expect(result.current.tasks.map((task) => task.tags)).toEqual([[]])
  })
})

describe('useTasks, a habit resting ahead of its day (HAB-33)', () => {
  /** A task repository that keeps every change it is asked to save. */
  function savingRepository() {
    const saves: TaskChanges[] = []
    let onTasks: (tasks: Task[]) => void = () => {}
    const repository: TaskRepository = {
      subscribe(_start, callback) {
        onTasks = (tasks) => { callback(tasks, null) }
        return { reachBack() {}, unheld: () => Promise.resolve(0), stop() {} }
      },
      save(changes) {
        saves.push(changes)
        return Promise.resolve()
      },
      importTasks: () => Promise.resolve(),
    }
    const { result } = renderHook(() => useTasks(repository, fakeRewardRepository().repository))
    return { result, saves, arrive: (tasks: Task[]) => { act(() => { onTasks(tasks) }) } }
  }

  const WRITTEN = new Date(2026, 8, 10, 9, 0)

  it('lets go of a rest stored for a day still to come, and writes the habit back', () => {
    // Resting yesterday and today, and ahead on the two days after: what skipping
    // a habit again and again left before it rested today and no further (HAB-32).
    const habit = {
      ...createTask('stretch', { kind: 'daily' }, WRITTEN),
      skippedDays: ['2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19'],
    }
    const { result, saves, arrive } = savingRepository()

    arrive([habit])

    expect(result.current.tasks[0].skippedDays).toEqual(['2026-09-16', '2026-09-17'])
    expect(saves).toEqual([{ saved: [result.current.tasks[0]], removed: [] }])
  })

  it('so a rest left for tomorrow does not arrive with it: tomorrow the habit is due', () => {
    const habit = { ...createTask('stretch', { kind: 'daily' }, WRITTEN), skippedDays: ['2026-09-18'] }
    const { result, arrive } = savingRepository()

    arrive([habit])
    vi.setSystemTime(new Date(2026, 8, 18, 9, 0))

    expect(result.current.tasks[0].skippedDays).toEqual([])
    expect(dueDay(result.current.tasks[0])).toBe('2026-09-18')
  })

  it('writes nothing for tasks with no rest ahead, nor for a rule with gaps skipped ahead (RPT-35)', () => {
    const MONDAYS: Repeat = { kind: 'weekly', weekdays: [1] }
    const rested = { ...createTask('stretch', { kind: 'daily' }, WRITTEN), skippedDays: ['2026-09-17'] }
    const weekly = { ...createTask('review', MONDAYS, WRITTEN), skippedDays: ['2026-09-21'] }
    const { result, saves, arrive } = savingRepository()

    arrive([rested, weekly])

    expect(result.current.tasks).toEqual([rested, weekly])
    expect(saves).toEqual([])
  })
})
