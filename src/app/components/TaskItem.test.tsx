// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { createTask, type Repeat } from '../../core'
import { TaskItem } from './TaskItem'

/*
 * What a task row shows at rest and once clicked into. RPT ids refer to
 * wiki/repeating-tasks.md, UI ids to wiki/interface.md, TASK ids to wiki/tasks.md.
 */

const NOW = new Date('2026-09-15T10:00:00.000Z')
const TASK = 'stretch'

afterEach(cleanup)

function setup(repeat: Repeat | null = { kind: 'daily' }) {
  const user = userEvent.setup()
  const nothing = () => undefined
  render(
    <ul>
      <TaskItem
        task={createTask(TASK, repeat, NOW)}
        now={NOW}
        onComplete={nothing}
        onUncomplete={nothing}
        onRename={nothing}
        onChangeDescription={nothing}
        onChangeDueDate={nothing}
        onChangeRepeat={nothing}
        onRemove={nothing}
        onAddSubtask={nothing}
        onSetSubtaskDone={nothing}
        onRenameSubtask={nothing}
        onRemoveSubtask={nothing}
      />
    </ul>,
  )
  return user
}

/**
 * jsdom lays nothing out, so the title is given a layout of its own: one line,
 * each character 10px wide and 20px high, starting at the left edge.
 */
function layOutTitle() {
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value(this: Range) {
      const left = this.startOffset * 10
      const width = (this.endOffset - this.startOffset) * 10
      return { left, right: left + width, width, top: 0, bottom: 20, height: 20, x: left, y: 0 }
    },
  })
}

afterEach(() => { Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect') })

function titleButton() {
  return screen.getByRole('button', { name: `Edit "${TASK}"` })
}

function titleBox() {
  return screen.getByRole<HTMLInputElement>('textbox', { name: `Title of "${TASK}"` })
}

function repeatButton() {
  return screen.getByRole('button', { name: `Repeat for "${TASK}": Daily` })
}

describe('the repeat rule on a task row', () => {
  it('shows only the icon at rest, still naming the rule (RPT-17)', () => {
    setup()

    expect(repeatButton()).toHaveProperty('textContent', '')
    expect(repeatButton().getAttribute('title')).toBe('Daily')
  })

  it('spells the rule out beside the controls once the row is clicked into, the button staying an icon (RPT-17, UI-17)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))

    expect(within(screen.getByRole('listitem')).getByText('Daily')).toBeDefined()
    expect(repeatButton()).toHaveProperty('textContent', '')
  })

  it('stops spelling it out when a click outside rests the row (RPT-17)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))
    await user.click(document.body)

    expect(within(screen.getByRole('listitem')).queryByText('Daily')).toBeNull()
  })
})

describe('the controls on a task row', () => {
  it('are all on show at rest, even with nothing set (UI-18)', () => {
    setup(null)

    expect(screen.getByRole('button', { name: `Due date for "${TASK}": No date` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Repeat for "${TASK}": Repeat` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Add a checklist to "${TASK}"` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Add a description to "${TASK}"` })).toBeDefined()
  })
})

describe('clicking a woken row', () => {
  it('puts it away again (UI-17)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))
    await user.click(screen.getByRole('listitem'))

    expect(within(screen.getByRole('listitem')).queryByText('Daily')).toBeNull()
    expect(screen.getByRole('button', { name: `Add a checklist to "${TASK}"` }).getAttribute('aria-expanded')).toBe('false')
  })

  it('on a control leaves it awake (UI-21)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))
    await user.click(screen.getByRole('button', { name: `Add a checklist to "${TASK}"` }))

    expect(within(screen.getByRole('listitem')).getByText('Daily')).toBeDefined()
  })

  it('on its title opens the title for editing and leaves the row awake (TASK-8)', async () => {
    layOutTitle()
    const user = setup()

    await user.click(screen.getByRole('listitem'))
    await user.click(titleButton())

    expect(titleBox()).toBeDefined()
    expect(within(screen.getByRole('listitem')).getByText('Daily')).toBeDefined()
  })
})

describe('the caret in a title opened for editing', () => {
  it('goes where the title was clicked (TASK-8)', async () => {
    layOutTitle()
    const user = setup()

    // Between "str" and "etch": nearer the start of the fourth character than its end.
    await user.pointer({ keys: '[MouseLeft]', target: titleButton(), coords: { clientX: 32, clientY: 10 } })

    expect(titleBox().selectionStart).toBe(3)
    expect(titleBox().selectionEnd).toBe(3)
  })

  it('goes to the end when the click is just past the words (TASK-8)', async () => {
    layOutTitle()
    const user = setup()

    await user.pointer({ keys: '[MouseLeft]', target: titleButton(), coords: { clientX: 75, clientY: 10 } })

    expect(titleBox().selectionStart).toBe(TASK.length)
  })

  it('goes to the end when the title is opened from the keyboard (TASK-8)', async () => {
    const user = setup()

    titleButton().focus()
    await user.keyboard('{Enter}')

    expect(titleBox().selectionStart).toBe(TASK.length)
  })
})
