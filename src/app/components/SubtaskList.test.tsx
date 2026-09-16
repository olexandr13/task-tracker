// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { addSubtask, createTask, insertSubtask, removeSubtask, renameSubtask, setSubtaskDone } from '../../core'
import { SubtaskList } from './SubtaskList'

/*
 * The keyboard on a checklist, driven the way a person would: through the
 * rendered list, with the real rules in ../../core behind it. CHK ids refer to
 * wiki/checklists.md.
 */

const NOW = new Date('2026-09-15T10:00:00.000Z')
const TASK = 'ship it'

afterEach(cleanup)

/** A checklist holding its own task, so every change goes through the same rules the app uses. */
function Checklist({ titles }: { titles: readonly string[] }) {
  const [task, setTask] = useState(() =>
    titles.reduce((current, title) => addSubtask(current, title, NOW), createTask(TASK, null, NOW)),
  )

  return (
    <SubtaskList
      subtasks={task.subtasks}
      repeat={task.repeat}
      now={NOW}
      taskTitle={task.title}
      onAdd={(index, title) => { setTask((current) => insertSubtask(current, index, title, NOW)) }}
      onSetDone={(id, done) => { setTask((current) => setSubtaskDone(current, id, done, NOW)) }}
      onRename={(id, title) => { setTask((current) => renameSubtask(current, id, title)) }}
      onRemove={(id) => { setTask((current) => removeSubtask(current, id, NOW)) }}
    />
  )
}

function setup(titles: readonly string[]) {
  const user = userEvent.setup()
  render(<Checklist titles={titles} />)
  return user
}

/**
 * The list as it reads: each item's title, an item open for editing as `[title]`
 * and the blank line as `[+]` or `[+text]`.
 */
function rows(): string[] {
  const list = screen.queryByRole('list', { name: `Checklist for "${TASK}"` })
  if (list === null) return []

  return within(list)
    .getAllByRole('listitem')
    .map((item) => {
      const input = item.querySelector('input')
      if (input === null) return within(item).getByRole('button', { name: /^Edit/ }).textContent ?? ''
      return input.getAttribute('aria-label')?.startsWith('New') === true ? `[+${input.value}]` : `[${input.value}]`
    })
}

function editBox(title: string): HTMLInputElement {
  return screen.getByRole('textbox', { name: `Title of "${title}" on "${TASK}"` })
}

function blankLine(): HTMLInputElement {
  return screen.getByRole('textbox', { name: `New subtask on "${TASK}"` })
}

function addBox(): HTMLInputElement {
  return screen.getByRole('textbox', { name: `Add a subtask to "${TASK}"` })
}

/** Focused, with the caret after the last character. */
function expectCaretAtEnd(input: HTMLInputElement) {
  expect(input).toBe(document.activeElement)
  expect(input.selectionStart).toBe(input.value.length)
  expect(input.selectionEnd).toBe(input.value.length)
}

async function startEditing(user: ReturnType<typeof userEvent.setup>, title: string) {
  await user.click(screen.getByRole('button', { name: `Edit "${title}" on "${TASK}"` }))
  return editBox(title)
}

describe('adding from the foot of the list', () => {
  it('adds to the end on Enter and keeps the box focused for the next one (CHK-6, CHK-7)', async () => {
    const user = setup(['one'])

    await user.click(addBox())
    await user.keyboard('two{Enter}three{Enter}')

    expect(rows()).toEqual(['one', 'two', 'three'])
    expect(addBox()).toBe(document.activeElement)
    expect(addBox().value).toBe('')
  })

  it('does nothing on Enter in an empty box (CHK-6)', async () => {
    const user = setup(['one'])

    await user.click(addBox())
    await user.keyboard('   {Enter}')

    expect(rows()).toEqual(['one'])
  })
})

describe('editing an item', () => {
  it('opens a text box with the caret at the end (CHK-19)', async () => {
    const user = setup(['one', 'two'])

    const box = await startEditing(user, 'two')

    expect(rows()).toEqual(['one', '[two]'])
    expectCaretAtEnd(box)
  })

  it('keeps a rename on clicking away, and drops it on Escape (CHK-19)', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'one')
    await user.keyboard('s')
    await user.click(document.body)
    expect(rows()).toEqual(['ones', 'two'])

    await startEditing(user, 'two')
    await user.keyboard('{Backspace}{Backspace}{Backspace}three{Escape}')
    expect(rows()).toEqual(['ones', 'two'])
  })
})

describe('Backspace in an emptied item (CHK-25)', () => {
  it('only deletes characters while there are any left', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'two')
    await user.keyboard('{Backspace}{Backspace}')

    expect(rows()).toEqual(['one', '[t]'])
  })

  it('removes the item and puts the caret at the end of the item above', async () => {
    const user = setup(['one', 'two', 'three'])

    await startEditing(user, 'two')
    await user.keyboard('{Backspace}{Backspace}{Backspace}')
    expect(rows()).toEqual(['one', '[]', 'three'])

    await user.keyboard('{Backspace}')

    expect(rows()).toEqual(['[one]', 'three'])
    expectCaretAtEnd(editBox('one'))
  })

  it('does not carry the key on into the item above', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'two')
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}')

    expect(editBox('one').value).toBe('one')
  })

  it('removes a whole list from the keyboard, bottom to top', async () => {
    const user = setup(['ab', 'cd'])

    await startEditing(user, 'cd')
    await user.keyboard('{Backspace>6/}')

    expect(rows()).toEqual([])
    expect(addBox()).toBe(document.activeElement)
  })

  it('sends the caret from the first item to the one that takes its place', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'one')
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}')

    expect(rows()).toEqual(['[two]'])
    expectCaretAtEnd(editBox('two'))
  })

  it('sends the caret to the add box once nothing is left', async () => {
    const user = setup(['one'])

    await startEditing(user, 'one')
    await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}')

    expect(rows()).toEqual([])
    expect(addBox()).toBe(document.activeElement)
  })
})

describe('Enter in an item (CHK-26)', () => {
  it('keeps the rename and opens a blank line under the item, caret in it', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'one')
    await user.keyboard('s{Enter}')

    expect(rows()).toEqual(['ones', '[+]', 'two'])
    expect(blankLine()).toBe(document.activeElement)
  })

  it('opens the line under the last item too, above the add box', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'two')
    await user.keyboard('{Enter}three{Enter}')

    expect(rows()).toEqual(['one', 'two', 'three', '[+]'])
  })

  it('adds what is typed there, and opens the next line under it', async () => {
    const user = setup(['one', 'four'])

    await startEditing(user, 'one')
    await user.keyboard('{Enter}two{Enter}three{Enter}')

    expect(rows()).toEqual(['one', 'two', 'three', '[+]', 'four'])
    expect(blankLine()).toBe(document.activeElement)
    expect(blankLine().value).toBe('')
  })

  it('does not add a blank item', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'one')
    await user.keyboard('{Enter}   {Enter}')

    expect(rows()).toEqual(['one', 'two'])
  })

  it('keeps what was typed on clicking away, once', async () => {
    const user = setup(['one', 'three'])

    await startEditing(user, 'one')
    await user.keyboard('{Enter}two')
    await user.click(document.body)

    expect(rows()).toEqual(['one', 'two', 'three'])
  })

  it('drops what was typed on Escape', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'one')
    await user.keyboard('{Enter}gone{Escape}')

    expect(rows()).toEqual(['one', 'two'])
  })

  it('closes the empty line on Backspace and goes back to the end of the item above', async () => {
    const user = setup(['one', 'three'])

    await startEditing(user, 'one')
    await user.keyboard('{Enter}two{Enter}{Backspace}')

    expect(rows()).toEqual(['one', '[two]', 'three'])
    expectCaretAtEnd(editBox('two'))
  })

  it('lets a mistyped line be backed out of character by character, then closed', async () => {
    const user = setup(['one', 'two'])

    await startEditing(user, 'one')
    await user.keyboard('{Enter}x{Backspace}')
    expect(rows()).toEqual(['one', '[+]', 'two'])

    await user.keyboard('{Backspace}')
    expect(rows()).toEqual(['[one]', 'two'])
    expect(editBox('one').value).toBe('one')
  })
})
