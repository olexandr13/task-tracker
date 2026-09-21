// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTask } from '../../core'
import { UndoToast } from './UndoToast'

const NOW = new Date('2026-09-21T12:00:00')

afterEach(cleanup)

describe('UndoToast', () => {
  it('names a deleted task and offers Undo and Dismiss (TRASH-3)', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    const onDismiss = vi.fn()
    const task = createTask('Ship it', null, NOW)

    render(
      <UndoToast
        pending={{ kind: 'task', task }}
        onUndo={onUndo}
        onDismiss={onDismiss}
      />,
    )

    expect(screen.getByText(/Deleted “Ship it”/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onUndo).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('shows only an Undo arrow after a completion, with no task title (TASK-67)', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()

    render(
      <UndoToast
        pending={{ kind: 'completion', taskId: 'task-1' }}
        onUndo={onUndo}
        onDismiss={vi.fn()}
      />,
    )

    expect(screen.queryByText(/Deleted/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull()
    const undo = screen.getByRole('button', { name: 'Undo' })
    expect(undo.getAttribute('title')).toBe('Undo')
    await user.click(undo)
    expect(onUndo).toHaveBeenCalledOnce()
  })
})
