// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendList, createList, type List, type ListId } from '../../core'
import { ListPicker } from './ListPicker'

/* Filing a task from a phone's woken row, which has no right-click to reach the task's menu.
   LST ids refer to wiki/lists.md. */

const AT = new Date(2026, 8, 17, 9, 0)

afterEach(cleanup)

const WORK = createList('Work', AT)
const HOME = createList('Home', AT)
const LISTS = appendList(appendList([], WORK), HOME)

function setup(listId: ListId | null = null, lists: readonly List[] = LISTS) {
  const onChange = vi.fn()
  render(<ListPicker listId={listId} lists={lists} onChange={onChange} />)
  return { user: userEvent.setup(), onChange }
}

const panel = () => screen.queryByRole('dialog', { name: 'List' })

describe('the list button on a phone\'s woken row', () => {
  it('names the Inbox for a task in no list (LST-2)', () => {
    setup(null)

    expect(screen.getByRole('button', { name: 'List: Inbox' })).toBeTruthy()
  })

  it('names the list a task is filed under (LST-23)', () => {
    setup(WORK.id)

    expect(screen.getByRole('button', { name: 'List: Work' })).toBeTruthy()
  })

  it('names the Inbox for a task whose list has gone (LST-12)', () => {
    setup('a-list-deleted-elsewhere')

    expect(screen.getByRole('button', { name: 'List: Inbox' })).toBeTruthy()
  })

  it('opens the panel on the Inbox and every list, in the order they are shown (LST-14)', async () => {
    const { user } = setup(null)

    await user.click(screen.getByRole('button', { name: 'List: Inbox' }))

    const choices = screen.getAllByRole('button', { pressed: false }).map((button) => button.textContent)
    expect(screen.getByRole('button', { pressed: true }).textContent).toContain('Inbox')
    expect(choices).toEqual(['Work', 'Home'])
  })
})

describe('choosing a list', () => {
  it('files the task and closes: a task is in one list at a time (LST-14)', async () => {
    const { user, onChange } = setup(null)

    await user.click(screen.getByRole('button', { name: 'List: Inbox' }))
    await user.click(screen.getByRole('button', { name: 'Home' }))

    expect(onChange).toHaveBeenCalledWith(HOME.id)
    expect(panel()).toBeNull()
  })

  it('takes a task back out of a list with the Inbox (LST-15)', async () => {
    const { user, onChange } = setup(WORK.id)

    await user.click(screen.getByRole('button', { name: 'List: Work' }))
    await user.click(screen.getByRole('button', { name: 'Inbox' }))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('puts the panel away on Escape, leaving the task where it was (UI-10)', async () => {
    const { user, onChange } = setup(WORK.id)

    await user.click(screen.getByRole('button', { name: 'List: Work' }))
    await user.keyboard('{Escape}')

    expect(panel()).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('says where to make one when there are no lists yet, rather than making one here (LST-14)', async () => {
    const { user } = setup(null, [])

    await user.click(screen.getByRole('button', { name: 'List: Inbox' }))

    expect(screen.getByText('No lists yet. Make one on the Lists page.')).toBeTruthy()
  })
})
