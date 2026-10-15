import { describe, expect, it } from 'vitest'
import {
  appendGoal,
  clearGoal,
  createGoal,
  findGoal,
  goalOf,
  goalPercent,
  goalProgress,
  InvalidGoalNameError,
  isGoalName,
  isGoalNameTaken,
  isGoalReached,
  linkToGoal,
  MAX_GOAL_NAME_LENGTH,
  normalizeGoalName,
  renameGoal,
  sameGoalName,
  servesGoal,
  sortGoals,
  summarizeGoals,
} from './goal'
import { completeTask, createTask, deleteTask, duplicateTask } from './task'

/* GOAL ids refer to wiki/goals.md. */

const AT = new Date('2026-10-15T09:00:00Z')

function goal(name: string, at = AT) {
  return createGoal(name, at)
}

describe('naming a goal (GOAL-3, GOAL-4)', () => {
  it('takes a phrase, punctuation and all', () => {
    expect(normalizeGoalName('Run a half marathon, by spring!')).toBe('Run a half marathon, by spring!')
  })

  it('trims the ends and squeezes the spaces inside', () => {
    expect(normalizeGoalName('  Ship   the app  ')).toBe('Ship the app')
  })

  it('refuses a name that is only space, one spread over two lines, or one too long to read', () => {
    expect(isGoalName('   ')).toBe(false)
    expect(isGoalName('Ship\nit')).toBe(false)
    expect(isGoalName('x'.repeat(MAX_GOAL_NAME_LENGTH))).toBe(true)
    expect(isGoalName('x'.repeat(MAX_GOAL_NAME_LENGTH + 1))).toBe(false)
    expect(() => normalizeGoalName('')).toThrow(InvalidGoalNameError)
  })

  it('does not make another goal out of a change of case', () => {
    const goals = [goal('Ship the app'), goal('Get fit')]

    expect(sameGoalName('Get fit', 'GET FIT')).toBe(true)
    expect(isGoalNameTaken(goals, ' ship  THE app ')).toBe(true)
    expect(isGoalNameTaken(goals, 'Learn Spanish')).toBe(false)
    // Its own name is not taken: renaming a goal to what it is called already is no clash.
    expect(isGoalNameTaken(goals, 'Get fit', goals[1].id)).toBe(false)
  })
})

describe('renaming a goal (GOAL-5)', () => {
  it('keeps the id its tasks serve it by', () => {
    const fit = goal('Get fit')
    const renamed = renameGoal(fit, ' Get  strong ')

    expect(renamed).toEqual({ ...fit, name: 'Get strong' })
  })

  it('hands back the very same goal when the name has not changed', () => {
    const fit = goal('Get fit')
    expect(renameGoal(fit, 'Get fit')).toBe(fit)
  })
})

describe('the order goals are shown in (GOAL-16)', () => {
  it('puts a new goal at the end, and settles a tie two merged devices could leave', () => {
    const goals = appendGoal(appendGoal([], goal('Get fit')), goal('Ship the app'))
    expect(sortGoals([...goals].reverse()).map((each) => each.name)).toEqual(['Get fit', 'Ship the app'])

    const early = { ...goal('Read more', new Date('2026-09-01T00:00:00Z')), order: 0 }
    const late = { ...goal('Save up', new Date('2026-09-10T00:00:00Z')), order: 0 }
    expect(sortGoals([late, early]).map((each) => each.name)).toEqual(['Read more', 'Save up'])
  })
})

describe('linking a task to a goal (GOAL-2, GOAL-6, GOAL-15)', () => {
  it('starts every task serving no goal', () => {
    expect(createTask('Buy milk').goalId).toBeNull()
  })

  it('links one goal at a time, changing nothing else about the task', () => {
    const [fit, app] = [goal('Get fit'), goal('Ship the app')]
    const task = completeTask(createTask('Go for a run'), AT)
    const linked = linkToGoal(linkToGoal(task, fit.id), app.id)

    expect(linked).toEqual({ ...task, goalId: app.id })
    expect(servesGoal(linked, fit.id)).toBe(false)
    expect(goalOf(linked, [fit, app])).toBe(app)
    expect(linkToGoal(linked, null).goalId).toBeNull()
    expect(linkToGoal(linked, app.id)).toBe(linked)
  })

  it('reads a task naming a goal that has gone as serving none', () => {
    const fit = goal('Get fit')
    expect(goalOf(linkToGoal(createTask('Stretch'), fit.id), [])).toBeNull()
    expect(findGoal([fit], 'gone')).toBeNull()
  })

  it('keeps the goal on a copy: another go at the same thing serves the same end', () => {
    const fit = goal('Get fit')
    expect(duplicateTask(linkToGoal(createTask('Go for a run'), fit.id), AT).goalId).toBe(fit.id)
  })

  it('unlinks every task from a deleted goal, trash too, and leaves the rest alone (GOAL-17)', () => {
    const [fit, app] = [goal('Get fit'), goal('Ship the app')]
    const run = linkToGoal(createTask('Go for a run'), fit.id)
    const binned = deleteTask(linkToGoal(createTask('Swim'), fit.id), AT)
    const ship = linkToGoal(createTask('Ship it'), app.id)
    const tasks = [run, binned, ship]

    const cleared = clearGoal(tasks, fit.id)
    expect(cleared.map((task) => task.goalId)).toEqual([null, null, app.id])
    expect(cleared[2]).toBe(ship)
    expect(tasks[0].goalId).toBe(fit.id)
  })
})

describe('how far a goal has got (GOAL-7, GOAL-8, GOAL-9)', () => {
  const fit = goal('Get fit')
  const serving = (title: string) => linkToGoal(createTask(title, null, AT), fit.id)

  it('is the share of the tasks serving it that are done', () => {
    const tasks = [completeTask(serving('Buy shoes'), AT), serving('Go for a run'), serving('Sign up'), createTask('Unrelated')]
    const progress = goalProgress(fit.id, tasks, AT)

    expect(progress).toEqual({ done: 1, total: 3 })
    expect(goalPercent(progress)).toBe(33)
    expect(isGoalReached(progress)).toBe(false)
  })

  it('rounds down, so 100% is said only once every task is done', () => {
    expect(goalPercent({ done: 199, total: 200 })).toBe(99)
    expect(goalPercent({ done: 2, total: 2 })).toBe(100)
    expect(isGoalReached({ done: 2, total: 2 })).toBe(true)
  })

  it('says no share at all for a goal no task serves yet, rather than 0%', () => {
    const progress = goalProgress(fit.id, [createTask('Unrelated')], AT)

    expect(progress).toEqual({ done: 0, total: 0 })
    expect(goalPercent(progress)).toBeNull()
    expect(isGoalReached(progress)).toBe(false)
  })

  it('counts a repeating task for its current occurrence', () => {
    const daily = linkToGoal(createTask('Stretch', { kind: 'daily' }, AT), fit.id)
    const doneToday = completeTask(daily, AT)

    expect(goalProgress(fit.id, [doneToday], AT)).toEqual({ done: 1, total: 1 })
    expect(goalProgress(fit.id, [doneToday], new Date('2026-10-16T09:00:00Z'))).toEqual({ done: 0, total: 1 })
  })

  it('counts the done tasks not held on this device towards both (STORE-55)', () => {
    expect(goalProgress(fit.id, [serving('Go for a run')], AT, 3)).toEqual({ done: 3, total: 4 })
  })

  it('summarizes every goal in order, with what is not held counted for the goal it is named for', () => {
    const app = goal('Ship the app', new Date('2026-10-16T00:00:00Z'))
    const goals = appendGoal(appendGoal([], fit), app)
    const summary = summarizeGoals([...goals].reverse(), [serving('Go for a run')], AT, new Map([[app.id, 2]]))

    expect(summary.map(({ goal: each, done, total }) => [each.name, done, total])).toEqual([
      ['Get fit', 0, 1],
      ['Ship the app', 2, 2],
    ])
  })
})
