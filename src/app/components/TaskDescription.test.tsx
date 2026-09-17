// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskDescription } from './TaskDescription'

/* Typing `#` in a description to tag the task. TAG ids refer to wiki/tags.md. */

const TASK = 'pack'

/**
 * jsdom edits nothing itself: the two editing commands the box leans on are
 * given the least of what a browser does — moving the selection's far end back
 * one character in its text, and deleting what is selected.
 */
beforeEach(() => {
  Object.defineProperty(Selection.prototype, 'modify', {
    configurable: true,
    value(this: Selection) {
      if (this.anchorNode === null || this.focusNode === null) return
      this.setBaseAndExtent(this.anchorNode, this.anchorOffset, this.focusNode, Math.max(0, this.focusOffset - 1))
    },
  })
  Object.defineProperty(document, 'execCommand', {
    configurable: true,
    value(command: string) {
      if (command !== 'delete') return false
      window.getSelection()?.deleteFromDocument()
      return true
    },
  })
})

afterEach(() => {
  cleanup()
  Reflect.deleteProperty(Selection.prototype, 'modify')
  Reflect.deleteProperty(document, 'execCommand')
})

function setup({ tags = [] as string[], knownTags = ['errands', 'work', 'workout'] } = {}) {
  const user = userEvent.setup()
  const onAddTag = vi.fn()
  const onChange = vi.fn()
  render(
    <TaskDescription
      description=""
      title={TASK}
      tags={tags}
      knownTags={knownTags}
      onChange={onChange}
      onAddTag={onAddTag}
    />,
  )
  return { user, onAddTag, onChange }
}

const box = () => screen.getByRole('textbox', { name: `Description of "${TASK}"` })
const suggestions = () => screen.queryByRole('listbox', { name: 'Tags' })
const options = () => screen.getAllByRole('option').map((option) => option.textContent)

async function startWriting(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: `Edit the description of "${TASK}"` }))
}

describe('typing # in a description', () => {
  it('offers the tags there are, narrowed as a name is typed, best match first (TAG-8, TAG-10)', async () => {
    const { user } = setup()
    await startWriting(user)

    await user.keyboard('#')
    expect(options()).toEqual(['errands', 'work', 'workout'])

    await user.keyboard('work')
    expect(options()).toEqual(['work', 'workout'])
  })

  it('leaves out the tags the task has, and offers a new tag for a name none has (TAG-10, TAG-11)', async () => {
    const { user } = setup({ tags: ['work'] })
    await startWriting(user)

    await user.keyboard('#wor')

    expect(options()).toEqual(['workout', 'Create “wor”'])
  })

  it('puts the chosen tag on the task and takes the #name out of the text (TAG-8)', async () => {
    const { user, onAddTag } = setup()
    await startWriting(user)

    await user.keyboard('call about #wo')
    await user.keyboard('{Enter}')

    expect(onAddTag).toHaveBeenCalledWith('work')
    expect(box().textContent).toBe('call about ')
    expect(suggestions()).toBeNull()
    // Still writing: choosing a tag is not the end of the edit.
    expect(document.activeElement).toBe(box())
  })

  it('moves between suggestions with the arrow keys, and chooses one with a click (TAG-8)', async () => {
    const { user, onAddTag } = setup()
    await startWriting(user)

    await user.keyboard('#work{ArrowDown}')
    expect(screen.getByRole('option', { selected: true }).textContent).toBe('workout')

    await user.click(screen.getByRole('option', { name: 'work' }))
    expect(onAddTag).toHaveBeenCalledWith('work')
  })

  it('makes a new tag when that is what is chosen (TAG-11)', async () => {
    const { user, onAddTag } = setup()
    await startWriting(user)

    await user.keyboard('#trip{Enter}')

    expect(onAddTag).toHaveBeenCalledWith('trip')
  })

  it('puts the suggestions away on Escape, keeping what was typed and the edit (TAG-9)', async () => {
    const { user, onAddTag } = setup()
    await startWriting(user)

    await user.keyboard('#wo{Escape}')

    expect(suggestions()).toBeNull()
    expect(box().textContent).toBe('#wo')

    await user.keyboard('r')
    expect(suggestions()).toBeNull()
    expect(onAddTag).not.toHaveBeenCalled()
  })

  it('offers nothing for a # inside a word, or once the word has ended (TAG-9)', async () => {
    const { user } = setup()
    await startWriting(user)

    await user.keyboard('C#')
    expect(suggestions()).toBeNull()

    await user.keyboard(' #work ')
    expect(suggestions()).toBeNull()
  })
})
