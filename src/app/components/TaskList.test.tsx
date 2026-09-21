// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, ROLLING_SPANS, type CompletionSpans, type Task } from '../../core'
import { TaskList } from './TaskList'

/* What a list says around its tasks. TASK ids refer to wiki/tasks.md. */

const NOW = new Date(2026, 8, 17, 9, 0)
const EMPTY = 'Add a task above.'
const ALL_DONE = 'Great work!'

afterEach(cleanup)

function setup(tasks: Task[], doneSpans: CompletionSpans | null = null, focusId: string | null = null, dimAll = false) {
  render(
    <TaskList
      tasks={tasks}
      now={NOW}
      doneSpans={doneSpans}
      focusId={focusId}
      dimAll={dimAll}
      knownTags={[]}
      lists={[]}
      emptyMessage={EMPTY}
      allDoneMessage={ALL_DONE}
      onComplete={vi.fn()}
      onUncomplete={vi.fn()}
      onRename={vi.fn()}
      onChangeDescription={vi.fn()}
      onChangeDueDate={vi.fn()}
      onSkipOccurrence={vi.fn()}
      onChangeRepeat={vi.fn()}
      onChangeReward={vi.fn()}
      onChangeUrgent={vi.fn()}
      onChangeTimeGoal={vi.fn()}
      onLogTime={vi.fn()}
      onRemoveTimeEntry={vi.fn()}
      onChangeList={vi.fn()}
      onAddTag={vi.fn()}
      onRemoveTag={vi.fn()}
      onRemove={vi.fn()}
      onDuplicate={vi.fn()}
      onAddSubtask={vi.fn()}
      onSetSubtaskDone={vi.fn()}
      onRenameSubtask={vi.fn()}
      onRemoveSubtask={vi.fn()}
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
