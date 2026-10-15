// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appendList, createList, type List, type ListSummary } from '../../core'
import { WAYS_OUT } from '../../test/confirmSheet'
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

function setup(lists: readonly ListSummary[] = SUMMARY, inboxOpen = 1, ownEmail: string | null = 'me@example.com') {
  const handlers = {
    onOpenInbox: vi.fn(),
    onOpen: vi.fn(),
    onAdd: vi.fn(() => true),
    onRename: vi.fn(() => true),
    onDelete: vi.fn(),
    onShare: vi.fn(),
    onUnshare: vi.fn(),
    onLeave: vi.fn(),
  }
  const view = render(<ListsPage lists={lists} inboxOpen={inboxOpen} ownEmail={ownEmail} {...handlers} />)
  const show = (next: readonly ListSummary[]) => {
    view.rerender(<ListsPage lists={next} inboxOpen={inboxOpen} ownEmail={ownEmail} {...handlers} />)
  }
  return { user: userEvent.setup(), show, ...handlers }
}

/** Someone else's list, shared with this account. */
const THEIRS: List = {
  ...createList('Groceries', AT),
  sharedBy: { id: 'them', email: 'anna@example.com', name: 'Anna' },
  sharedWith: ['me@example.com'],
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
  it('asks first, in a sheet, saying its tasks go back to the Inbox (LST-19)', async () => {
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the list "Work"' }))

    const sheet = screen.getByRole('dialog', { name: 'Delete the list "Work"?' })
    expect([...sheet.querySelectorAll('p')].map((line) => line.textContent)).toEqual([
      'Its tasks go back to the Inbox.',
      'The tasks themselves are not deleted.',
    ])
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(WORK.id)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it.each(WAYS_OUT)('deletes nothing when %s closes the sheet (LST-19)', async (_, leave) => {
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the list "Work"' }))
    await leave(user)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Work: 2 to do' })).toBeTruthy()
  })

  it('offers nothing to rename or delete on the Inbox: it is not a record (LST-11)', () => {
    setup()

    expect(screen.queryByRole('button', { name: /the list "Inbox"/ })).toBeNull()
  })
})

describe('sharing a list', () => {
  it('opens a sheet for it from a button beside each list of the account’s own (LST-28)', async () => {
    const { user } = setup()

    await user.click(screen.getByRole('button', { name: 'Share the list "Work"' }))

    const sheet = screen.getByRole('dialog', { name: 'Share "Work"' })
    expect(sheet.textContent).toContain('Only you can see this list.')
    expect(sheet.textContent).toContain('me@example.com')
  })

  it('shares it with the address typed, on the button or on Enter, and clears the box (LST-28)', async () => {
    const { user, onShare } = setup()
    await user.click(screen.getByRole('button', { name: 'Share the list "Work"' }))

    const box = screen.getByRole('textbox', { name: 'Email address to share the list with' })
    await user.type(box, 'anna@example.com')
    await user.click(screen.getByRole('button', { name: 'Share' }))
    expect(onShare).toHaveBeenLastCalledWith(WORK.id, 'anna@example.com')
    expect((box as HTMLInputElement).value).toBe('')

    await user.type(box, 'bob@example.com{Enter}')
    expect(onShare).toHaveBeenLastCalledWith(WORK.id, 'bob@example.com')
  })

  it.each([
    ['something that is not an address', 'anna', 'That is not an email address.'],
    ['the owner’s own address', 'Me@Example.com', 'That is your own address. The list is yours already.'],
    ['an address it is shared with already', 'anna@example.com', 'The list is shared with them already.'],
  ])('says why rather than sharing it with %s (LST-28)', async (_, typed, said) => {
    const { user, onShare } = setup([{ list: { ...WORK, sharedWith: ['anna@example.com'] }, open: 2 }])
    await user.click(screen.getByRole('button', { name: 'Share the list "Work"' }))

    await user.type(screen.getByRole('textbox', { name: 'Email address to share the list with' }), `${typed}{Enter}`)

    expect(screen.getByRole('alert').textContent).toBe(said)
    expect(onShare).not.toHaveBeenCalled()
  })

  it('lists everyone it is shared with, each with a button that stops sharing it with them (LST-29)', async () => {
    const { user, onUnshare } = setup([{ list: { ...WORK, sharedWith: ['anna@example.com', 'bob@example.com'] }, open: 2 }])
    await user.click(screen.getByRole('button', { name: 'Share the list "Work"' }))

    await user.click(screen.getByRole('button', { name: 'Stop sharing with anna@example.com' }))

    expect(onUnshare).toHaveBeenCalledExactlyOnceWith(WORK.id, 'anna@example.com')
    expect(screen.getByRole('button', { name: 'Stop sharing with bob@example.com' })).toBeTruthy()
  })

  it('says whom a list of the account’s own is shared with, under its name (LST-35)', () => {
    setup([
      { list: { ...WORK, sharedWith: ['anna@example.com'] }, open: 2 },
      { list: { ...HOME, sharedWith: ['anna@example.com', 'bob@example.com'] }, open: 0 },
    ])

    expect(screen.getByRole('button', { name: 'Work, shared with anna@example.com: 2 to do' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Home, shared with 2 people' })).toBeTruthy()
  })

  it('warns that deleting a shared list takes it from the people it is shared with too (LST-34)', async () => {
    const { user } = setup([{ list: { ...WORK, sharedWith: ['anna@example.com'] }, open: 2 }])

    await user.click(screen.getByRole('button', { name: 'Delete the list "Work"' }))

    expect(screen.getByRole('dialog', { name: 'Delete the list "Work"?' }).textContent).toContain(
      'The people it is shared with lose the list and its tasks.',
    )
  })

  it('offers no sharing to a guest, who has no address to share from (LST-36)', () => {
    setup(SUMMARY, 1, null)

    expect(screen.queryByRole('button', { name: /^Share the list/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Rename the list "Work"' })).toBeTruthy()
  })
})

describe('a list someone else shared', () => {
  it('says whose it is, and offers neither renaming, deleting nor sharing it (LST-30)', () => {
    setup([...SUMMARY, { list: THEIRS, open: 3 }])

    expect(screen.getByRole('button', { name: 'Groceries, shared by Anna: 3 to do' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Rename the list "Groceries"' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete the list "Groceries"' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Share the list "Groceries"' })).toBeNull()
  })

  it('leaves it after asking, rather than deleting it (LST-30)', async () => {
    const { user, onLeave, onDelete } = setup([...SUMMARY, { list: THEIRS, open: 3 }])

    await user.click(screen.getByRole('button', { name: 'Leave the list "Groceries"' }))
    const sheet = screen.getByRole('dialog', { name: 'Leave the list "Groceries"?' })
    expect([...sheet.querySelectorAll('p')].map((line) => line.textContent)).toEqual([
      'It and its tasks stop showing in your lists.',
      'Anna can share it with you again.',
    ])

    await user.click(screen.getByRole('button', { name: 'Leave' }))

    expect(onLeave).toHaveBeenCalledExactlyOnceWith(THEIRS.id)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it.each(WAYS_OUT)('leaves nothing when %s closes the sheet (LST-30)', async (_, away) => {
    const { user, onLeave } = setup([...SUMMARY, { list: THEIRS, open: 3 }])

    await user.click(screen.getByRole('button', { name: 'Leave the list "Groceries"' }))
    await away(user)

    expect(onLeave).not.toHaveBeenCalled()
  })

  it('closes the sheet for sharing a list that stops being there (LST-28)', async () => {
    const { user, show } = setup()
    await user.click(screen.getByRole('button', { name: 'Share the list "Work"' }))

    show([{ list: HOME, open: 0 }])

    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
