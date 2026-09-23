// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { completeTask, createTask, ROLLING_SPANS, setDueDate, type CompletionSpans, type Task } from '../../core'
import { NO_TASK_ACTIONS } from '../../test/taskActions'
import { TaskList } from './TaskList'

/* What a list says around its tasks. TASK ids refer to wiki/tasks.md. */

const NOW = new Date(2026, 8, 17, 9, 0)
const EMPTY = 'Add a task above.'
const ALL_DONE = 'Great work!'

afterEach(cleanup)

function setup(tasks: Task[], doneSpans: CompletionSpans | null = null, focusId: string | null = null, dimAll = false) {
  render(
    <TaskList
      actions={NO_TASK_ACTIONS}
      tasks={tasks}
      now={NOW}
      doneSpans={doneSpans}
      focusId={focusId}
      dimAll={dimAll}
      knownTags={[]}
      lists={[]}
      emptyMessage={EMPTY}
      allDoneMessage={ALL_DONE}
    />,
  )
}

describe('TaskList', () => {
  it('points at the box above when there are no tasks (TASK-19)', () => {
    setup([])

    expect(screen.getByText(EMPTY)).toBeTruthy()
    expect(screen.queryByText(ALL_DONE)).toBeNull()
  })

  it('praises the work once every task is done (TASK-50)', () => {
    setup([completeTask(createTask('read', null, NOW), NOW), completeTask(createTask('write', null, NOW), NOW)])

    const praise = screen.getByRole('status')
    expect(within(praise).getByText(ALL_DONE)).toBeTruthy()
    expect(screen.queryByText(EMPTY)).toBeNull()
  })

  it('says nothing while a task is still open (TASK-50)', () => {
    setup([completeTask(createTask('read', null, NOW), NOW), createTask('write', null, NOW)])

    expect(screen.queryByText(ALL_DONE)).toBeNull()
    expect(screen.queryByText(EMPTY)).toBeNull()
  })

  it('divides done tasks by when they were finished, most recent first (TASK-56)', () => {
    const open = createTask('plan', null, NOW)
    const today = completeTask(createTask('read', null, NOW), NOW)
    const yesterday = completeTask(createTask('write', null, NOW), new Date(2026, 8, 16, 18, 0))
    const lastMonth = completeTask(createTask('file', null, NOW), new Date(2026, 7, 25, 12, 0))
    setup([open, today, yesterday, lastMonth], ROLLING_SPANS)

    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent)
    expect(headings).toEqual(['Done today1', 'Done yesterday1', 'Done in the last 30 days1'])
    expect(within(screen.getByRole('region', { name: 'Done yesterday' })).getByText('write')).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Done in the last 30 days' })).getByText('file')).toBeTruthy()
  })

  it('fades older done spans further back (TASK-65)', () => {
    const today = completeTask(createTask('read', null, NOW), NOW)
    const yesterday = completeTask(createTask('write', null, NOW), new Date(2026, 8, 16, 18, 0))
    const lastWeek = completeTask(createTask('call', null, NOW), new Date(2026, 8, 12, 12, 0))
    const lastMonth = completeTask(createTask('file', null, NOW), new Date(2026, 7, 25, 12, 0))
    setup([today, yesterday, lastWeek, lastMonth], ROLLING_SPANS)

    expect(screen.getByRole('region', { name: 'Done today' }).className).not.toMatch(/opacity-/)
    expect(screen.getByRole('region', { name: 'Done yesterday' }).className).toMatch(/opacity-80/)
    expect(screen.getByRole('region', { name: 'Done in the last 7 days' }).className).toMatch(/opacity-60/)
    expect(screen.getByRole('region', { name: 'Done in the last 30 days' }).className).toMatch(/opacity-40/)
  })

  it('keeps one run of done tasks where the view does not divide them (TASK-56)', () => {
    setup([completeTask(createTask('read', null, NOW), NOW), createTask('write', null, NOW)])

    expect(screen.queryAllByRole('heading')).toEqual([])
  })

  it('heads the overdue tasks with a run of their own (TASK-68)', () => {
    const late = setDueDate(createTask('late', null, NOW), '2026-09-15')
    const open = createTask('plan', null, NOW)
    setup([late, open])

    const overdue = screen.getByRole('region', { name: 'Overdue' })
    expect(screen.getByRole('heading').textContent).toBe('Overdue1')
    expect(within(overdue).getByText('late')).toBeTruthy()
    expect(within(overdue).queryByText('plan')).toBeNull()
  })

  it('heads the overdue above the done spans too (TASK-68)', () => {
    const late = setDueDate(createTask('late', null, NOW), '2026-09-15')
    const done = completeTask(createTask('read', null, NOW), NOW)
    setup([late, done], ROLLING_SPANS)

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['Overdue1', 'Done today1'])
  })

  it('says nothing about overdue when none is (TASK-68)', () => {
    setup([createTask('plan', null, NOW), setDueDate(createTask('later', null, NOW), '2026-09-20')])

    expect(screen.queryAllByRole('heading')).toEqual([])
  })

  it('draws one run while Procrastination mode is on, so the chosen task leads (TASK-68, JUST-5)', () => {
    const late = setDueDate(createTask('late', null, NOW), '2026-09-15')
    const focus = createTask('focus', null, NOW)
    setup([focus, late], null, focus.id)

    expect(screen.queryAllByRole('heading')).toEqual([])
  })

  it('dims every row but the focused one (JUST-5)', () => {
    const focus = createTask('focus', null, NOW)
    const other = createTask('other', null, NOW)
    setup([focus, other], null, focus.id)

    const focused = screen.getByText('focus').closest('li')
    const dimmed = screen.getByText('other').closest('li')
    expect(focused?.className).not.toMatch(/opacity-25/)
    expect(focused?.className).toMatch(/my-3/)
    expect(dimmed?.className).toMatch(/opacity-25/)
  })

  it('dims every row while Procrastination mode is idle after Rest (JUST-5)', () => {
    const open = createTask('open', null, NOW)
    setup([open], null, null, true)

    expect(screen.getByText('open').closest('li')?.className).toMatch(/opacity-25/)
  })
})
