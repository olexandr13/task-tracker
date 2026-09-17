// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TagList } from './TagList'

/* The Tags page. TAG ids refer to wiki/tags.md. */

afterEach(cleanup)

describe('TagList', () => {
  it('lists every tag with how many of its tasks are still to do (TAG-18, TAG-19)', () => {
    render(<TagList tags={[{ name: 'home', open: 0 }, { name: 'work', open: 3 }]} onOpen={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getAllByRole('button', { name: /^(home|work)/ }).map((button) => button.textContent)).toEqual([
      'home',
      'work3',
    ])
    expect(screen.getByRole('button', { name: 'work: 3 to do' })).toBeDefined()
  })

  it('opens a tag\'s list when a tag is clicked (TAG-18)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<TagList tags={[{ name: 'work', open: 1 }]} onOpen={onOpen} onDelete={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^work/ }))

    expect(onOpen).toHaveBeenCalledWith('work')
  })

  it('deletes a tag from its button once confirmed, and not otherwise (TAG-22)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onDelete = vi.fn()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    render(<TagList tags={[{ name: 'work', open: 1 }]} onOpen={onOpen} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Delete the tag "work"' }))
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete the tag "work"' }))
    expect(onDelete).toHaveBeenCalledWith('work')
    expect(onOpen).not.toHaveBeenCalled()
    confirm.mockRestore()
  })

  it('says how to make a tag when there are none (TAG-20)', () => {
    render(<TagList tags={[]} onOpen={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText(/No tags yet/)).toBeDefined()
  })
})
