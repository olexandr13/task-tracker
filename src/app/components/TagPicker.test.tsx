// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { addTag, createTask, removeTag, tagsInUse } from '../../core'
import { TagPicker } from './TagPicker'

/* Putting tags on a task and taking them off. TAG ids refer to wiki/tags.md, UI ids to wiki/interface.md. */

const NOW = new Date('2026-09-15T10:00:00.000Z')

afterEach(cleanup)

/** A task and one other carrying `others`, so the picker has tags to offer that this task has not. */
function Picker({ initial, others }: { initial: readonly string[]; others: readonly string[] }) {
  const [task, setTask] = useState(() => initial.reduce((tagged, tag) => addTag(tagged, tag), createTask('pack', null, NOW)))
  const other = others.reduce((tagged, tag) => addTag(tagged, tag), createTask('other', null, NOW))
  const known = tagsInUse([task, other])

  return (
    <TagPicker
      tags={task.tags}
      known={known}
      onAdd={(name) => { setTask(addTag(task, name, known)) }}
      onRemove={(name) => { setTask(removeTag(task, name)) }}
    />
  )
}

function setup({ initial = [] as string[], others = ['home', 'work'] } = {}) {
  const user = userEvent.setup()
  render(<Picker initial={initial} others={others} />)
  return user
}

const trigger = () => screen.getByRole('button', { name: /^Tags:/ })
const panel = () => screen.queryByRole('dialog', { name: 'Tags' })
const nameBox = () => screen.getByRole('textbox', { name: 'Tag name' })

describe('TagPicker', () => {
  it('names the tags the task carries, and none when it has none (UI-12)', () => {
    setup({ initial: ['work', 'home'] })

    expect(trigger()).toHaveProperty('ariaLabel', 'Tags: work, home')
  })

  it('lists every tag, the task\'s own ticked, with the caret in the box (TAG-7)', async () => {
    const user = setup({ initial: ['work'] })

    await user.click(trigger())

    expect(screen.getByRole('button', { name: 'work' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'home' }).getAttribute('aria-pressed')).toBe('false')
    expect(document.activeElement).toBe(nameBox())
  })

  it('puts a tag on and takes it off as it is clicked, staying open (TAG-7)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'home' }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Tags: home')

    await user.click(screen.getByRole('button', { name: 'home' }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Tags: No tags')
    expect(panel()).not.toBeNull()
  })

  it('puts on the tag typed on Enter, in the spelling it already has, making it if there is none (TAG-4, TAG-7)', async () => {
    const user = setup({ others: ['Work'] })

    await user.click(trigger())
    await user.type(nameBox(), '#work{Enter}')
    await user.type(nameBox(), 'trip{Enter}')

    expect(trigger()).toHaveProperty('ariaLabel', 'Tags: Work, trip')
    expect(nameBox()).toHaveProperty('value', '')
  })

  it('narrows the list to what is typed, and offers to make a tag no task has (TAG-7, TAG-11)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.type(nameBox(), 'wo')

    expect(screen.queryByRole('button', { name: 'home' })).toBeNull()
    expect(screen.getByRole('button', { name: 'work' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Create “wo”' })).toBeDefined()
  })

  it('makes nothing of a name no tag can have, and says why (TAG-3)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.type(nameBox(), 'two words{Enter}')

    expect(trigger()).toHaveProperty('ariaLabel', 'Tags: No tags')
    expect(screen.getByText(/A tag is one word/)).toBeDefined()
  })

  it('closes on Escape (UI-10)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.keyboard('{Escape}')

    expect(panel()).toBeNull()
  })
})
