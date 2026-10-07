// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTask, deleteTask, type Task } from '../../core'
import { WAYS_OUT } from '../../test/confirmSheet'
import { TrashList } from './TrashList'

/* The trash. TRASH ids refer to wiki/trash.md. */

const AT = new Date(2026, 8, 17, 9, 0)

afterEach(cleanup)

function trashed(title: string): Task {
  return deleteTask(createTask(title, null, AT), AT)
}

const TASKS = [trashed('Call the bank'), trashed('Water the plants')]

function setup(tasks: Task[] = TASKS) {
  const handlers = { onRestore: vi.fn(), onPurge: vi.fn(), onEmpty: vi.fn() }
  const { rerender } = render(<TrashList tasks={tasks} {...handlers} />)
  return {
    user: userEvent.setup(),
    rerender: (next: Task[]) => { rerender(<TrashList tasks={next} {...handlers} />) },
    ...handlers,
  }
}

describe('emptying the trash', () => {
  it('asks first, in a sheet, saying how many go for good (TRASH-10)', async () => {
    const { user, onEmpty } = setup()

    await user.click(screen.getByRole('button', { name: 'Empty trash' }))

    const sheet = screen.getByRole('dialog', { name: 'Empty the trash?' })
    expect([...sheet.querySelectorAll('p')].map((line) => line.textContent)).toEqual([
      'All 2 tasks in it are deleted for good.',
      '"Restore" cannot bring them back after that.',
    ])
    expect(onEmpty).not.toHaveBeenCalled()

    // The sheet's own button, not the one on the page behind it.
    const confirm = [...sheet.querySelectorAll('button')].find((button) => button.textContent === 'Empty trash')
    await user.click(confirm as HTMLElement)

    expect(onEmpty).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('speaks of one task as one (TRASH-10)', async () => {
    const { user } = setup([trashed('Call the bank')])

    await user.click(screen.getByRole('button', { name: 'Empty trash' }))

    expect(screen.getByRole('dialog').textContent).toContain('The task in it is deleted for good.')
  })

  it.each(WAYS_OUT)('deletes nothing when %s closes the sheet (TRASH-10)', async (_, leave) => {
    const { user, onEmpty } = setup()

    await user.click(screen.getByRole('button', { name: 'Empty trash' }))
    await leave(user)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onEmpty).not.toHaveBeenCalled()
    expect(screen.getByText('Call the bank')).toBeTruthy()
  })

  it('stops asking once the trash empties from elsewhere, and does not ask again by itself (TRASH-10)', async () => {
    const { user, rerender, onEmpty } = setup()

    await user.click(screen.getByRole('button', { name: 'Empty trash' }))
    rerender([])
    expect(screen.queryByRole('dialog')).toBeNull()

    rerender([trashed('Buy milk')])
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onEmpty).not.toHaveBeenCalled()
  })
})
