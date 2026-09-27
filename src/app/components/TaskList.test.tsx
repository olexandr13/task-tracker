// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  completeTask,
  createTask,
  ROLLING_SPANS,
  setDueDate,
  setDueTime,
  toLocalDay,
  type CompletionSpans,
  type Task,
} from '../../core'
import { NO_TASK_ACTIONS } from '../../test/taskActions'
import type { TaskActions } from '../taskActions'
import { PHONE_QUERY } from '../usePhoneLayout'
import { TaskList } from './TaskList'

/* What a list says around its tasks. TASK ids refer to wiki/tasks.md, DUE ids to wiki/due-dates.md. */

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
    const yesterday = completeTask(createTask('read', null, NOW), new Date(2026, 8, 16, 18, 0))
    const today = completeTask(createTask('call', null, NOW), NOW)
    setup([createTask('write', null, NOW), today, yesterday])

    const done = screen.getByRole('region', { name: 'Done' })
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['Done2'])
    expect(within(done).getByText('read')).toBeTruthy()
    expect(within(done).getByText('call')).toBeTruthy()
    expect(within(done).queryByText('write')).toBeNull()
  })

  it('heads the done tasks apart from the ones still to do (TASK-69)', () => {
    setup([completeTask(createTask('read', null, NOW), NOW), createTask('write', null, NOW)])

    const done = screen.getByRole('region', { name: 'Done' })
    expect(screen.getByRole('heading').textContent).toBe('Done1')
    expect(within(done).getByText('read')).toBeTruthy()
    expect(within(done).queryByText('write')).toBeNull()
  })

  it('says nothing about done tasks when none is (TASK-69)', () => {
    setup([createTask('write', null, NOW), createTask('plan', null, NOW)])

    expect(screen.queryAllByRole('heading')).toEqual([])
  })

  it('heads the overdue above the done run (TASK-68, TASK-69)', () => {
    const late = setDueDate(createTask('late', null, NOW), '2026-09-15')
    const done = completeTask(createTask('read', null, NOW), NOW)
    setup([late, done])

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['Overdue1', 'Done1'])
  })

  it('keeps the praise banner above the done run once every task is done (TASK-50, TASK-69)', () => {
    setup([completeTask(createTask('read', null, NOW), NOW)])

    expect(screen.getByRole('status').textContent).toBe(ALL_DONE)
    expect(screen.getByRole('heading').textContent).toBe('Done1')
  })

  it('heads the overdue tasks with a run of their own, in the one list with the rest (TASK-68)', () => {
    const late = setDueDate(createTask('late', null, NOW), '2026-09-15')
    const open = createTask('plan', null, NOW)
    setup([late, open])

    const heading = screen.getByRole('heading')
    const lateRow = screen.getByText('late').closest('li')
    const planRow = screen.getByText('plan').closest('li')
    expect(heading.textContent).toBe('Overdue1')
    // The heading, then the overdue, then the rest — all items of one list.
    expect(heading.compareDocumentPosition(lateRow as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect((lateRow as Node).compareDocumentPosition(planRow as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(heading.closest('ul')).toBe(planRow?.closest('ul'))
    // The heading is not a task: two items are heard, not three or four.
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
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

  it('draws one run while Procrastination mode is on, so the chosen task leads (TASK-68, TASK-69, JUST-5)', () => {
    const late = setDueDate(createTask('late', null, NOW), '2026-09-15')
    const done = completeTask(createTask('read', null, NOW), NOW)
    const focus = createTask('focus', null, NOW)
    setup([focus, late, done], null, focus.id)

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

describe('a task moving between the runs while its row is open', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === PHONE_QUERY,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() { return false },
        onchange: null,
      }),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    })
  })

  /** The list as it is used: the hour picked for a task is the hour its row then shows. */
  function Holder() {
    const [tasks, setTasks] = useState(() => [setDueDate(createTask('plan', null, NOW), toLocalDay(NOW))])
    const actions: TaskActions = {
      ...NO_TASK_ACTIONS,
      changeTime: (id, time) => {
        setTasks((prev) => prev.map((task) => (task.id === id ? setDueTime(task, time) : task)))
      },
    }
    return (
      <TaskList
        actions={actions}
        tasks={tasks}
        now={NOW}
        knownTags={[]}
        lists={[]}
        emptyMessage={EMPTY}
        allDoneMessage={ALL_DONE}
      />
    )
  }

  const sheet = () => screen.getByRole('dialog', { name: 'Details of "plan"' })

  it('keeps a phone’s sheet and the clock face open as an hour before now turns the task overdue (DUE-10, DUE-24)', async () => {
    const user = userEvent.setup()
    render(<Holder />)

    await user.click(screen.getByRole('listitem'))
    await user.click(within(sheet()).getByRole('button', { name: /^Schedule for/ }))
    await user.click(screen.getByRole('button', { name: /^Time:/ }))
    // Eight o'clock, an hour gone by: the task is overdue the moment it is picked (DUE-10).
    await user.click(screen.getByRole('button', { name: '08' }))

    expect(screen.getByRole('heading').textContent).toBe('Overdue1')
    expect(sheet()).toBeDefined()
    expect(screen.getByRole('group', { name: 'Minutes' })).toBeDefined()
  })
})
