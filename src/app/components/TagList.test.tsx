// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TagSummary } from '../../core'
import { TagList } from './TagList'

/* The Tags page. TAG ids refer to wiki/tags.md. */

afterEach(cleanup)

function setUp(tags: readonly TagSummary[], { onAdd = vi.fn(() => true), onOpen = vi.fn(), onDelete = vi.fn() } = {}) {
  render(<TagList tags={tags} onOpen={onOpen} onAdd={onAdd} onDelete={onDelete} />)
  return { onAdd, onOpen, onDelete }
}

describe('TagList', () => {
  it('lists every tag with how many of its tasks are still to do (TAG-18, TAG-19)', () => {
    setUp([{ name: 'home', open: 0 }, { name: 'work', open: 3 }])

    expect(screen.getAllByRole('button', { name: /^(home|work)/ }).map((button) => button.textContent)).toEqual([
      'home',
      'work3',
    ])
    expect(screen.getByRole('button', { name: 'work: 3 to do' })).toBeDefined()
  })

  it('opens a tag\'s list when a tag is clicked (TAG-18)', async () => {
    const user = userEvent.setup()
    const { onOpen } = setUp([{ name: 'work', open: 1 }])

    await user.click(screen.getByRole('button', { name: /^work/ }))

    expect(onOpen).toHaveBeenCalledWith('work')
  })

  it('deletes a tag from its button once confirmed, and not otherwise (TAG-22)', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { onOpen, onDelete } = setUp([{ name: 'work', open: 1 }])

    await user.click(screen.getByRole('button', { name: 'Delete the tag "work"' }))
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete the tag "work"' }))
    expect(onDelete).toHaveBeenCalledWith('work')
    expect(onOpen).not.toHaveBeenCalled()
    confirm.mockRestore()
  })

  it('says how to make a tag when there are none (TAG-20)', () => {
    setUp([])

    expect(screen.getByText(/No tags yet/)).toBeDefined()
  })

  it('makes a tag from the box on Enter, without its #, and empties the box (TAG-23)', async () => {
    const user = userEvent.setup()
    const { onAdd } = setUp([])
    const box = screen.getByRole('textbox', { name: 'Name of the new tag' })

    await user.type(box, '#reading{Enter}')

    expect(onAdd).toHaveBeenCalledWith('reading')
    expect((box as HTMLInputElement).value).toBe('')
  })

  it('says so, and keeps what was typed, when there is a tag of that name already (TAG-23)', async () => {
    const user = userEvent.setup()
    const { onAdd } = setUp([{ name: 'work', open: 0 }], { onAdd: vi.fn(() => false) })
    const box = screen.getByRole('textbox', { name: 'Name of the new tag' })

    await user.type(box, 'Work')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledWith('Work')
    expect(screen.getByRole('alert').textContent).toBe('There is a tag called that already.')
    expect((box as HTMLInputElement).value).toBe('Work')
  })

  it('makes nothing from a name a tag cannot have, and says why (TAG-3, TAG-23)', async () => {
    const user = userEvent.setup()
    const { onAdd } = setUp([])

    await user.type(screen.getByRole('textbox', { name: 'Name of the new tag' }), 'two words{Enter}')

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch(/A tag is one word/)
    expect((screen.getByRole('button', { name: 'Add' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
