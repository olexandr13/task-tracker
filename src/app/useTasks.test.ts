// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, setReward, type RewardChanges, type Task } from '../core'
import type { RewardRepository } from '../storage/rewardRepository'
import type { TaskRepository } from '../storage/taskRepository'
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
    removeRedemption: () => Promise.resolve(),
  }
  return { repository, recorded }
}

function setUp(saved: Task[]) {
  const tasks = fakeTaskRepository()
  const rewards = fakeRewardRepository()
  const { result } = renderHook(() => useTasks(tasks.repository, rewards.repository))
  tasks.arrive(saved)
  return { result, arrive: tasks.arrive, recorded: rewards.recorded }
}

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
