// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, type Task } from '../../core'
import { TaskList } from './TaskList'

/* What a list says around its tasks. TASK ids refer to wiki/tasks.md. */

const NOW = new Date(2026, 8, 17, 9, 0)
const EMPTY = 'Add a task above.'
const ALL_DONE = 'Great work!'

afterEach(cleanup)

function setup(tasks: Task[]) {
  render(
    <TaskList
      tasks={tasks}
      now={NOW}
      knownTags={[]}
      emptyMessage={EMPTY}
      allDoneMessage={ALL_DONE}
      onMove={vi.fn()}
      onComplete={vi.fn()}
      onUncomplete={vi.fn()}
      onRename={vi.fn()}
      onChangeDescription={vi.fn()}
      onChangeDueDate={vi.fn()}
      onChangeRepeat={vi.fn()}
      onChangeReward={vi.fn()}
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

    expect(screen.getByText(ALL_DONE)).toBeTruthy()
    expect(screen.queryByText(EMPTY)).toBeNull()
  })

  it('says nothing while a task is still open (TASK-50)', () => {
    setup([completeTask(createTask('read', null, NOW), NOW), createTask('write', null, NOW)])

    expect(screen.queryByText(ALL_DONE)).toBeNull()
    expect(screen.queryByText(EMPTY)).toBeNull()
  })
})
