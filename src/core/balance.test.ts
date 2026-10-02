import { describe, expect, it } from 'vitest'
import {
  balanceByDay,
  balanceShares,
  balanceTotals,
  bindTag,
  createCategory,
  findCategory,
  InvalidCategoryError,
  isCategoryName,
  isCategoryLimitReached,
  isCategoryNameTaken,
  MAX_CATEGORIES,
  MAX_CATEGORY_NAME_LENGTH,
  normalizeCategoryName,
  removeTagFromCategories,
  renameCategory,
  renameTagInCategories,
  sortCategories,
  unbindTag,
  type Category,
} from './balance'
import { InvalidTagError } from './tag'
import { createTask, deleteTask, type Task } from './task'
import { logSeconds, logTime } from './timeLog'

/* BAL ids refer to wiki/balance.md. */

// Wednesday 16 September 2026, mid-morning.
const NOW = new Date(2026, 8, 16, 10, 0)

function category(name: string, tags: readonly string[] = []): Category {
  return tags.reduce((made, tag) => bindTag(made, tag), createCategory(name, NOW))
}

function task(title: string, tags: readonly string[], repeat: Task['repeat'] = null): Task {
  return { ...createTask(title, repeat, NOW), tags }
}

describe('naming a category (BAL-7, BAL-8)', () => {
  it('takes a name and starts bound to no tag', () => {
    const made = createCategory('  Work   time ', NOW)

    expect(made).toMatchObject({ name: 'Work time', tags: [], createdAt: NOW.toISOString() })
    expect(made.id).not.toBe('')
  })

  it('refuses a name that is nothing, too long, or on two lines', () => {
    expect(isCategoryName('   ')).toBe(false)
    expect(isCategoryName('a'.repeat(MAX_CATEGORY_NAME_LENGTH))).toBe(true)
    expect(isCategoryName('a'.repeat(MAX_CATEGORY_NAME_LENGTH + 1))).toBe(false)
    expect(isCategoryName('Work\nRest')).toBe(false)
    expect(() => normalizeCategoryName(' ')).toThrow(InvalidCategoryError)
  })

  it('knows a name taken in any case, but not by the category itself', () => {
    const work = category('Work')

    expect(isCategoryNameTaken([work], ' work ')).toBe(true)
    expect(isCategoryNameTaken([work], 'Rest')).toBe(false)
    expect(isCategoryNameTaken([work], 'WORK', work.id)).toBe(false)
  })

  it('renames, handing the category back as it is when the name does not change', () => {
    const work = category('Work')

    expect(renameCategory(work, 'Deep work').name).toBe('Deep work')
    expect(renameCategory(work, ' Work ')).toBe(work)
    expect(work.name).toBe('Work')
  })

  it('sorts in the order they were made, whatever they are called (BAL-7)', () => {
    const work = createCategory('Work', new Date(2026, 8, 1))
    const rest = createCategory('Rest', new Date(2026, 8, 2))
    const chores = createCategory('Chores', new Date(2026, 8, 3))

    expect(sortCategories([chores, rest, work]).map((made) => made.name)).toEqual(['Work', 'Rest', 'Chores'])
    expect(sortCategories([renameCategory(work, 'Zzz'), rest]).map((made) => made.name)).toEqual(['Zzz', 'Rest'])
    expect(findCategory([work, rest], rest.id)).toBe(rest)
    expect(findCategory([work], 'gone')).toBeNull()
  })
})

describe('the limit (BAL-7)', () => {
  it('is reached at eight categories, one for each colour', () => {
    const seven = Array.from({ length: MAX_CATEGORIES - 1 }, (_, index) => category(`C${String(index)}`))

    expect(MAX_CATEGORIES).toBe(8)
    expect(isCategoryLimitReached(seven)).toBe(false)
    expect(isCategoryLimitReached([...seven, category('Eighth')])).toBe(true)
  })
})

describe('binding tags (BAL-9)', () => {
  it('binds a tag once, alphabetically, without its #', () => {
    const rest = bindTag(bindTag(category('Rest'), 'walk'), '#chill')

    expect(rest.tags).toEqual(['chill', 'walk'])
    expect(bindTag(rest, 'WALK')).toBe(rest)
  })

  it('spells a known tag the way it is already spelled', () => {
    expect(bindTag(category('Work'), 'deepwork', ['DeepWork']).tags).toEqual(['DeepWork'])
  })

  it('refuses a name a tag cannot have', () => {
    expect(() => bindTag(category('Work'), 'two words')).toThrow(InvalidTagError)
  })

  it('unbinds in any case, handing back a category without the tag as it is', () => {
    const rest = category('Rest', ['chill', 'walk'])

    expect(unbindTag(rest, 'Chill').tags).toEqual(['walk'])
    expect(unbindTag(rest, 'work')).toBe(rest)
  })
})

describe('tags renamed and deleted (BAL-11)', () => {
  it('renames a tag in every category bound to it, leaving the others as they were', () => {
    const rest = category('Rest', ['chill', 'walk'])
    const work = category('Work', ['job'])

    const [renamedRest, sameWork] = renameTagInCategories([rest, work], 'Walk', 'stroll')

    expect(renamedRest.tags).toEqual(['chill', 'stroll'])
    expect(sameWork).toBe(work)
  })

  it('leaves a category bound to both names with the tag once', () => {
    const [rest] = renameTagInCategories([category('Rest', ['chill', 'walk'])], 'walk', 'chill')

    expect(rest.tags).toEqual(['chill'])
  })

  it('unbinds a deleted tag everywhere, leaving the others as they were', () => {
    const rest = category('Rest', ['chill', 'walk'])
    const work = category('Work', ['job'])

    const [unbound, sameWork] = removeTagFromCategories([rest, work], 'walk')

    expect(unbound.tags).toEqual(['chill'])
    expect(sameWork).toBe(work)
  })
})

describe('balanceTotals (BAL-2 to BAL-5)', () => {
  const work = category('Work', ['job'])
  const rest = category('Rest', ['chill', 'walk'])

  it('adds up the time on tasks carrying a bound tag, in any case', () => {
    const tasks = [
      logTime(task('report', ['job']), 90, NOW),
      logTime(task('walk the dog', ['Walk']), 30, NOW),
      logTime(task('nap', ['chill']), 20, NOW),
    ]

    const totals = balanceTotals([work, rest], tasks, 'today', NOW)

    expect(totals.categories.map(({ category: made, seconds }) => [made.name, seconds])).toEqual([
      ['Work', 90 * 60],
      ['Rest', 50 * 60],
    ])
    expect(totals.other).toBe(0)
    expect(totals.total).toBe(140 * 60)
  })

  it('divides a task bound to two categories evenly between them, and counts it in the total once (BAL-4)', () => {
    const tasks = [logTime(task('walk to the office', ['job', 'walk']), 30, NOW)]

    const totals = balanceTotals([work, rest], tasks, 'today', NOW)

    expect(totals.categories.map(({ seconds }) => seconds)).toEqual([15 * 60, 15 * 60])
    expect(totals.total).toBe(30 * 60)
  })

  it('counts a task once in a category it is bound to through two tags (BAL-4)', () => {
    const tasks = [logTime(task('nap in the park', ['chill', 'walk']), 20, NOW)]

    expect(balanceTotals([work, rest], tasks, 'today', NOW).categories[1].seconds).toBe(20 * 60)
  })

  it('puts time on tasks bound to no category, or with no tags, under other (BAL-5)', () => {
    const tasks = [
      logTime(task('post office', ['errand']), 15, NOW),
      logTime(task('dishes', []), 10, NOW),
      logTime(task('report', ['job']), 60, NOW),
    ]

    const totals = balanceTotals([work, rest], tasks, 'today', NOW)

    expect(totals.other).toBe(25 * 60)
    expect(totals.total).toBe(85 * 60)
    expect(balanceTotals([], tasks, 'today', NOW).other).toBe(85 * 60)
  })

  it('counts only what was logged in the period, to the second (BAL-2)', () => {
    const report = [
      new Date(2026, 8, 13, 23, 59), // Sunday: last week
      new Date(2026, 8, 14, 0, 0), // Monday: this week
      new Date(2026, 8, 15, 18, 0), // yesterday
      new Date(2026, 8, 16, 0, 0), // today, from midnight
      new Date(2026, 8, 16, 23, 59), // today, to the last minute
      new Date(2026, 8, 1, 0, 0), // the 1st: this month
      new Date(2026, 7, 31, 23, 59), // August
    ].reduce((logged, at) => logSeconds(logged, 100, at), task('report', ['job']))

    const seconds = (period: 'today' | 'week' | 'month') =>
      balanceTotals([work], [report], period, NOW).categories[0].seconds

    expect(seconds('today')).toBe(200)
    expect(seconds('week')).toBe(400)
    expect(seconds('month')).toBe(600)
  })

  it('counts sessions from a repeating task’s occurrences gone by (BAL-3)', () => {
    const daily = logTime(logTime(task('walk', ['walk'], { kind: 'daily' }), 30, new Date(2026, 8, 14, 8, 0)), 20, NOW)

    expect(balanceTotals([rest], [daily], 'week', NOW).categories[0].seconds).toBe(50 * 60)
    expect(balanceTotals([rest], [daily], 'today', NOW).categories[0].seconds).toBe(20 * 60)
  })

  it('counts a task in the trash (BAL-3)', () => {
    const trashed = deleteTask(logTime(task('report', ['job']), 45, NOW), NOW)

    expect(balanceTotals([work], [trashed], 'today', NOW).total).toBe(45 * 60)
  })

  it('lists every category, in the order given, with nothing logged as nothing', () => {
    const totals = balanceTotals([rest, work], [], 'month', NOW)

    expect(totals.categories.map(({ category: made, seconds }) => [made.name, seconds])).toEqual([
      ['Rest', 0],
      ['Work', 0],
    ])
    expect(totals.total).toBe(0)
  })
})

describe('balanceByDay (BAL-13)', () => {
  const work = category('Work', ['job'])
  const rest = category('Rest', ['walk'])

  it('has every day of the week, Monday to Sunday, those with nothing too', () => {
    const days = balanceByDay([work, rest], [], 'week', NOW)

    expect(days.map(({ day }) => day)).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ])
    expect(days.every(({ total }) => total === 0)).toBe(true)
  })

  it('has every day of the month', () => {
    const days = balanceByDay([work], [], 'month', NOW)

    expect(days).toHaveLength(30)
    expect([days[0].day, days[29].day]).toEqual(['2026-09-01', '2026-09-30'])
  })

  it('puts each session on the local day it was logged, split as the period is', () => {
    const report = [new Date(2026, 8, 14, 23, 59), new Date(2026, 8, 15, 0, 0)].reduce(
      (logged, at) => logTime(logged, 30, at),
      task('report', ['job']),
    )
    const walk = deleteTask(logTime(task('walk to the office', ['job', 'walk']), 20, NOW), NOW)

    const [monday, tuesday, wednesday] = balanceByDay([work, rest], [report, walk], 'week', NOW)

    expect(monday.categories.map(({ seconds }) => seconds)).toEqual([30 * 60, 0])
    expect(tuesday.categories.map(({ seconds }) => seconds)).toEqual([30 * 60, 0])
    expect(wednesday.categories.map(({ seconds }) => seconds)).toEqual([10 * 60, 10 * 60])
    expect(wednesday.total).toBe(20 * 60)
  })

  it('has just today for today, and leaves out what was logged outside the period', () => {
    const report = logTime(logTime(task('report', ['job']), 30, new Date(2026, 7, 31, 12, 0)), 10, NOW)

    expect(balanceByDay([work], [report], 'today', NOW)).toEqual([
      { day: '2026-09-16', categories: [{ category: work, seconds: 10 * 60 }], other: 0, total: 10 * 60 },
    ])
  })
})

describe('balanceShares (BAL-6)', () => {
  it('adds up to exactly 100, the largest remainders rounded up', () => {
    expect(balanceShares([1, 1, 1], 3)).toEqual([34, 33, 33])
    expect(balanceShares([45, 90, 240], 375)).toEqual([12, 24, 64])
    expect(balanceShares([1, 199], 200)).toEqual([1, 99])
    expect(balanceShares([10, 0], 10)).toEqual([100, 0])
  })

  it('is nothing of nothing', () => {
    expect(balanceShares([0, 0], 0)).toEqual([0, 0])
  })
})
