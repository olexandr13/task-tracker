// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appendList, createList, type ListSummary } from '../../core'
import { ListsPage } from './ListsPage'

/* The Lists page. LST ids refer to wiki/lists.md. */

const AT = new Date(2026, 8, 17, 9, 0)

afterEach(cleanup)

const LISTS = appendList(appendList([], createList('Work', AT)), createList('Home', AT))
const [WORK, HOME] = LISTS

const SUMMARY: ListSummary[] = [
  { list: WORK, open: 2 },
  { list: HOME, open: 0 },
]

function setup(lists: readonly ListSummary[] = SUMMARY, inboxOpen = 1) {
  const handlers = {
    onOpenInbox: vi.fn(),
    onOpen: vi.fn(),
    onAdd: vi.fn(() => true),
    onRename: vi.fn(() => true),
    onDelete: vi.fn(),
  }
  render(<ListsPage lists={lists} inboxOpen={inboxOpen} {...handlers} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('what the page lists', () => {
  it('heads the page with the Inbox, then every list, each with what it has still to do (LST-11, LST-17)', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Inbox: 1 to do' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Work: 2 to do' })).toBeTruthy()
  })

  it('still lists a list whose tasks are all done, with no number (LST-17)', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy()
  })

  it('opens the Inbox and a list (LST-8, LST-11)', async () => {
    const { user, onOpenInbox, onOpen } = setup()

    await user.click(screen.getByRole('button', { name: 'Inbox: 1 to do' }))
    expect(onOpenInbox).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Work: 2 to do' }))
    expect(onOpen).toHaveBeenCalledWith(WORK.id)
  })

  it('says how to start when there are no lists, the Inbox still being there (LST-18)', () => {
    setup([], 0)

    expect(screen.getByText(/No lists yet/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Inbox' })).toBeTruthy()
  })
})

describe('making a list', () => {
  it('makes one on Enter in the box, and clears it for the next (LST-4)', async () => {
    const { user, onAdd } = setup()

    await user.type(screen.getByRole('textbox', { name: 'Name of the new list' }), 'Side projects{Enter}')

    expect(onAdd).toHaveBeenCalledWith('Side projects')
    expect(screen.getByRole('textbox', { name: 'Name of the new list' })).toHaveProperty('value', '')
  })

  it('takes a name of more than one word, unlike a tag (LST-3)', async () => {
    const { user, onAdd } = setup()

    await user.click(screen.getByRole('textbox', { name: 'Name of the new list' }))
    await user.paste('Reading list')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledWith('Reading list')
  })

  it('makes nothing of a name that is only space (LST-3)', async () => {
    const { user, onAdd } = setup()

    await user.type(screen.getByRole('textbox', { name: 'Name of the new list' }), '   {Enter}')

    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Add' })).toHaveProperty('disabled', true)
  })

  it('says so rather than making a second list of the same name (LST-5)', async () => {
    const onAdd = vi.fn(() => false)
    render(
      <ListsPage
        lists={SUMMARY}
        inboxOpen={0}
        onOpenInbox={vi.fn()}
        onOpen={vi.fn()}
        onAdd={onAdd}
        onRename={vi.fn(() => true)}
        onDelete={vi.fn()}
      />,
    )
    const user = userEvent.setup()

    await user.type(screen.getByRole('textbox', { name: 'Name of the new list' }), 'work{Enter}')

    expect(screen.getByRole('alert').textContent).toBe('There is a list called that already.')
    // What was typed stays, to fix rather than type again.
    expect(screen.getByRole('textbox', { name: 'Name of the new list' })).toHaveProperty('value', 'work')
  })
})

describe('renaming a list', () => {
  it('turns the name into a box with the caret in it (LST-6)', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Rename the list "Work"' }))

    const box = screen.getByRole('textbox', { name: 'Name of the list "Work"' })
    expect(box).toHaveProperty('value', 'Work')
    expect(document.activeElement).toBe(box)
  })

  it('renames on Enter (LST-6)', async () => {
    const { user, onRename } = setup()

    await user.click(screen.getByRole('button', { name: 'Rename the list "Work"' }))
    await user.keyboard('{Control>}a{/Control}Day job{Enter}')

    expect(onRename).toHaveBeenCalledWith(WORK.id, 'Day job')
    expect(screen.queryByRole('textbox', { name: 'Name of the list "Work"' })).toBeNull()
  })

  it('leaves the list named as it was on Escape (LST-7)', async () => {
    const { user, onRename } = setup()

    await user.click(screen.getByRole('button', { name: 'Rename the list "Work"' }))
    await user.keyboard('{Control>}a{/Control}Day job{Escape}')

    expect(onRename).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Work: 2 to do' })).toBeTruthy()
  })

  it('says so rather than renaming onto another list\'s name, keeping the box open (LST-5)', async () => {
    const onRename = vi.fn(() => false)
    render(
      <ListsPage
        lists={SUMMARY}
        inboxOpen={0}
        onOpenInbox={vi.fn()}
        onOpen={vi.fn()}
        onAdd={vi.fn(() => true)}
        onRename={onRename}
        onDelete={vi.fn()}
      />,
    )
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Rename the list "Work"' }))
    await user.keyboard('{Control>}a{/Control}Home{Enter}')

    expect(screen.getByRole('alert').textContent).toBe('There is a list called that already.')
    expect(screen.getByRole('textbox', { name: 'Name of the list "Work"' })).toHaveProperty('value', 'Home')
  })
})

describe('deleting a list', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('asks first, and says its tasks go back to the Inbox (LST-19)', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the list "Work"' }))

    expect(confirm.mock.calls[0][0]).toContain('back to the Inbox')
    expect(onDelete).toHaveBeenCalledWith(WORK.id)
  })

  it('deletes nothing when the asking is turned down (LST-19)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the list "Work"' }))

    expect(onDelete).not.toHaveBeenCalled()
  })

  it('offers nothing to rename or delete on the Inbox: it is not a record (LST-11)', () => {
    setup()

    expect(screen.queryByRole('button', { name: /the list "Inbox"/ })).toBeNull()
  })
})
