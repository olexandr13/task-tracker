// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bindTag, createCategory, createTask, deleteTask, logTime, type Category, type Task } from '../../core'
import { BalancePage } from './BalancePage'

/* The Balance page. BAL ids refer to wiki/balance.md. */

afterEach(cleanup)

// Wednesday 16 September 2026, mid-morning.
const NOW = new Date(2026, 8, 16, 10, 0)
const MONDAY = new Date(2026, 8, 14, 9, 0)

const WORK = bindTag(createCategory('Work', new Date(2026, 8, 1)), 'job')
const REST = bindTag(bindTag(createCategory('Rest', new Date(2026, 8, 2)), 'walk'), 'chill')

function task(title: string, tags: readonly string[], minutes: number, at: Date = NOW): Task {
  return logTime({ ...createTask(title, null, NOW), tags }, minutes, at)
}

function setUp(
  { categories = [WORK, REST], tasks = [] as readonly Task[], knownTags = ['chill', 'job', 'walk'] } = {} as {
    categories?: readonly Category[]
    tasks?: readonly Task[]
    knownTags?: readonly string[]
  },
) {
  const handlers = {
    onAdd: vi.fn(() => true),
    onRename: vi.fn(() => true),
    onBind: vi.fn(),
    onUnbind: vi.fn(),
    onDelete: vi.fn(),
  }
  render(<BalancePage categories={categories} tasks={tasks} knownTags={knownTags} now={NOW} {...handlers} />)
  return { user: userEvent.setup(), ...handlers }
}

const chart = () => screen.getByRole('img')
const legend = () => within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('button')
const legendRow = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}:`) })
const pieces = () => [...chart().querySelectorAll('[data-piece]')]
const days = () => within(screen.getByRole('region', { name: 'By day' })).getAllByRole('button')

describe('the chart (BAL-2 to BAL-6)', () => {
  it('draws one bar divided between the categories, then Other, with the total and a legend', () => {
    setUp({
      tasks: [task('report', ['job'], 90), task('walk the dog', ['walk'], 30), task('post office', ['errand'], 30)],
    })

    expect(screen.getByText('2h 30m')).toBeDefined()
    expect(chart().getAttribute('aria-label')).toBe(
      'Time spent today, 2h 30m: Work 1h 30m, 60%; Rest 30m, 20%; Other 30m, 20%',
    )
    expect(pieces()).toHaveLength(3)
    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual([
      'Work: 1h 30m, 60%',
      'Rest: 30m, 20%',
      'Other: 30m, 20%',
    ])
  })

  it('writes a share inside its piece only when the piece is big enough to hold it', () => {
    setUp({ tasks: [task('report', ['job'], 95), task('walk the dog', ['walk'], 5)] })

    expect(pieces().map((piece) => piece.textContent)).toEqual(['95%', ''])
  })

  it('leaves out a category with no time, and Other when everything is in a category (BAL-5)', () => {
    setUp({ tasks: [task('report', ['job'], 60)] })

    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual(['Work: 1h, 100%'])
  })

  it('divides a task with tags from two categories evenly, and counts it once in the total (BAL-4)', () => {
    setUp({ tasks: [task('walk to the office', ['job', 'walk'], 30)] })

    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual(['Work: 15m, 50%', 'Rest: 15m, 50%'])
    expect(screen.getByText('30m')).toBeDefined()
  })

  it('makes the shares add up to 100', () => {
    setUp({ tasks: [task('report', ['job'], 10), task('walk', ['walk'], 10), task('post office', [], 10)] })

    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual([
      'Work: 10m, 34%',
      'Rest: 10m, 33%',
      'Other: 10m, 33%',
    ])
  })

  it('counts a task in the trash (BAL-3)', () => {
    setUp({ tasks: [deleteTask(task('report', ['job'], 45), NOW)] })

    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual(['Work: 45m, 100%'])
  })

  it('picks a category out when it is pressed in the legend, and lets go when pressed again (BAL-6)', async () => {
    const { user } = setUp({ tasks: [task('report', ['job'], 60), task('walk the dog', ['walk'], 30)] })

    await user.click(legendRow('Rest'))
    await user.unhover(legendRow('Rest'))

    expect(legendRow('Rest').getAttribute('aria-pressed')).toBe('true')
    expect(pieces().map((piece) => piece.className.includes('opacity-25'))).toEqual([true, false])

    await user.click(legendRow('Rest'))
    await user.unhover(legendRow('Rest'))

    expect(legendRow('Rest').getAttribute('aria-pressed')).toBe('false')
    expect(pieces().some((piece) => piece.className.includes('opacity-25'))).toBe(false)
  })

  it('opens on Today and switches to the week and the month (BAL-2)', async () => {
    const { user } = setUp({ tasks: [task('report', ['job'], 60, MONDAY)] })

    expect(screen.getByRole('radio', { name: 'Today' })).toHaveProperty('checked', true)
    expect(screen.getByText('No time logged today.')).toBeDefined()

    await user.click(screen.getByRole('radio', { name: 'Week' }))
    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual(['Work: 1h, 100%'])

    await user.click(screen.getByRole('radio', { name: 'Month' }))
    expect(screen.getByRole('radio', { name: 'Month' })).toHaveProperty('checked', true)
    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual(['Work: 1h, 100%'])
  })

  it('says how to start when there are no categories', () => {
    setUp({ categories: [], tasks: [task('report', ['job'], 60)] })

    expect(legend().map((row) => row.getAttribute('aria-label'))).toEqual(['Other: 1h, 100%'])
    expect(screen.getByText('Add a category below to divide this time.')).toBeDefined()
  })
})

describe('the chart by day (BAL-13)', () => {
  it('is not drawn for today', () => {
    setUp({ tasks: [task('report', ['job'], 60)] })

    expect(screen.queryByRole('region', { name: 'By day' })).toBeNull()
  })

  it('has a column for each day of the week, each naming how its time divided', async () => {
    const { user } = setUp({
      tasks: [task('report', ['job'], 60, MONDAY), task('walk the dog', ['walk'], 30), task('nap', ['chill'], 15)],
    })

    await user.click(screen.getByRole('radio', { name: 'Week' }))

    expect(days().map((day) => day.getAttribute('aria-label'))).toEqual([
      'Mon, Sep 14 · 1h: Work 1h',
      'Tue, Sep 15: nothing logged',
      'Wed, Sep 16 · 45m: Rest 45m',
      'Thu, Sep 17: nothing logged',
      'Fri, Sep 18: nothing logged',
      'Sat, Sep 19: nothing logged',
      'Sun, Sep 20: nothing logged',
    ])
  })

  it('has a column for each day of the month', async () => {
    const { user } = setUp({ tasks: [task('report', ['job'], 60)] })

    await user.click(screen.getByRole('radio', { name: 'Month' }))

    expect(days()).toHaveLength(30)
  })

  it('says how a day divided once it is pressed, until it is pressed again', async () => {
    const { user } = setUp({ tasks: [task('report', ['job'], 60, MONDAY), task('walk the dog', ['walk'], 30, MONDAY)] })
    await user.click(screen.getByRole('radio', { name: 'Week' }))
    const region = screen.getByRole('region', { name: 'By day' })

    expect(region.textContent).toContain('Point at a day, or press it, to see how its time divided.')

    await user.click(days()[0])
    await user.unhover(days()[0])

    expect(days()[0].getAttribute('aria-pressed')).toBe('true')
    expect(region.textContent).toContain('Mon, Sep 14 · 1h 30m')
    expect(region.textContent).toContain('Work 1h')
    expect(region.textContent).toContain('Rest 30m')

    await user.click(days()[0])
    await user.unhover(days()[0])

    expect(region.textContent).toContain('Point at a day, or press it, to see how its time divided.')
  })
})

describe('the categories (BAL-7 to BAL-10)', () => {
  it('adds a category on Enter, emptying the box', async () => {
    const { user, onAdd } = setUp()
    const box = screen.getByRole('textbox', { name: 'Name of the new category' })

    await user.type(box, 'Chores{Enter}')

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('Chores')
    expect(box).toHaveProperty('value', '')
  })

  it('says why a name is refused, and keeps what was typed (BAL-7)', async () => {
    const { user, onAdd } = setUp()
    onAdd.mockReturnValueOnce(false)
    const box = screen.getByRole('textbox', { name: 'Name of the new category' })

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert').textContent).toBe('Type a name for the category first.')
    expect(onAdd).not.toHaveBeenCalled()

    await user.type(box, 'work')
    expect(screen.queryByRole('alert')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert').textContent).toBe('There is a category called that already.')
    expect(box).toHaveProperty('value', 'work')
  })

  it('renames in place on Enter, and leaves the name alone on Escape (BAL-8)', async () => {
    const { user, onRename } = setUp()

    await user.click(screen.getByRole('button', { name: 'Rename the category "Rest"' }))
    const box = screen.getByRole('textbox', { name: 'Name of the category "Rest"' })
    expect(document.activeElement).toBe(box)
    await user.keyboard('{Escape}')
    expect(onRename).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Rename the category "Rest"' }))
    await user.clear(screen.getByRole('textbox', { name: 'Name of the category "Rest"' }))
    await user.keyboard('Chill time{Enter}')

    expect(onRename).toHaveBeenCalledExactlyOnceWith(REST.id, 'Chill time')
    expect(screen.queryByRole('textbox', { name: 'Name of the category "Rest"' })).toBeNull()
  })

  it('keeps a rename open, saying why, when another category has the name (BAL-8)', async () => {
    const { user, onRename } = setUp()
    onRename.mockReturnValueOnce(false)

    await user.click(screen.getByRole('button', { name: 'Rename the category "Rest"' }))
    await user.clear(screen.getByRole('textbox', { name: 'Name of the category "Rest"' }))
    await user.keyboard('Work{Enter}')

    expect(screen.getByRole('alert').textContent).toBe('There is a category called that already.')
    expect(screen.getByRole('textbox', { name: 'Name of the category "Rest"' })).toHaveProperty('value', 'Work')
  })

  it('lists the tags bound to each, and unbinds one from its × (BAL-9)', async () => {
    const { user, onUnbind } = setUp()

    const bound = screen.getByRole('list', { name: 'Tags bound to Rest' })
    expect(within(bound).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['#chill×', '#walk×'])

    await user.click(screen.getByRole('button', { name: 'Unbind "walk" from Rest' }))
    expect(onUnbind).toHaveBeenCalledExactlyOnceWith(REST.id, 'walk')
  })

  it('binds a tag from the tag panel (BAL-9)', async () => {
    const { user, onBind } = setUp({ knownTags: ['chill', 'job', 'nap', 'walk'] })

    await user.click(screen.getByRole('button', { name: 'Tags bound to Work: job' }))
    await user.click(screen.getByRole('button', { name: /nap/ }))

    expect(onBind).toHaveBeenCalledExactlyOnceWith(WORK.id, 'nap')
  })

  it('says when no tag is bound yet', () => {
    setUp({ categories: [createCategory('Chores', NOW)] })

    expect(screen.getByText('No tags bound yet.')).toBeDefined()
  })

  it('refuses a ninth category in place, saying why (BAL-7)', async () => {
    const eight = Array.from({ length: 8 }, (_, index) => createCategory(`C${String(index)}`, NOW))
    const { user, onAdd } = setUp({ categories: eight })

    await user.type(screen.getByRole('textbox', { name: 'Name of the new category' }), 'Ninth{Enter}')

    expect(screen.getByRole('alert').textContent).toBe('You can have up to 8 categories, one for each colour on the chart.')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('deletes a category from its × (BAL-10)', async () => {
    const { user, onDelete } = setUp()

    await user.click(screen.getByRole('button', { name: 'Delete the category "Work"' }))

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(WORK.id)
  })

  it('names every box, so the browser can tell them apart (UI-69)', async () => {
    const { user } = setUp()
    await user.click(screen.getByRole('button', { name: 'Rename the category "Rest"' }))

    for (const box of document.querySelectorAll('input')) {
      expect(['balance-period', 'category-name']).toContain(box.getAttribute('name'))
    }
  })
})
