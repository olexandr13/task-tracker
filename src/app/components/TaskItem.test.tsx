// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addTag, createSubtask, createTask, type LocalDay, type Repeat } from '../../core'
import { TaskItem } from './TaskItem'

/*
 * What a task row shows at rest and once clicked into. RPT ids refer to
 * wiki/repeating-tasks.md, UI ids to wiki/interface.md, TASK ids to wiki/tasks.md,
 * DUE ids to wiki/due-dates.md, TAG ids to wiki/tags.md, RWD ids to wiki/rewards.md.
 */

const NOW = new Date('2026-09-15T10:00:00.000Z')
const TASK = 'stretch'
const nothing = () => undefined

afterEach(cleanup)

function setup(
  repeat: Repeat | null = { kind: 'daily' },
  subtasks: readonly string[] = [],
  onDuplicate: (id: string) => void = () => undefined,
  dueDate: LocalDay | null = null,
  reward: number | null = null,
) {
  const user = userEvent.setup()
  const task = {
    ...createTask(TASK, repeat, NOW),
    dueDate,
    reward,
    subtasks: subtasks.map((title) => createSubtask(title, NOW)),
  }
  render(
    <ul>
      <TaskItem
        task={task}
        now={NOW}
        knownTags={[]}
        onComplete={nothing}
        onUncomplete={nothing}
        onRename={nothing}
        onChangeDescription={nothing}
        onChangeDueDate={nothing}
        onChangeRepeat={nothing}
        onChangeReward={nothing}
        onAddTag={nothing}
        onRemoveTag={nothing}
        onRemove={nothing}
        onDuplicate={onDuplicate}
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

  it('spells the rule out under its button once the row is clicked into, the button staying an icon (RPT-17, UI-17)', async () => {
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

describe('the due date on a task row', () => {
  it('is spelled out under its button at rest, the button staying an icon that names it (DUE-5, UI-27)', () => {
    setup(null, [], undefined, '2026-09-16')
    const dueButton = screen.getByRole('button', { name: `Due date for "${TASK}": Tomorrow` })

    expect(dueButton).toHaveProperty('textContent', '')
    expect(within(screen.getByRole('listitem')).getByText('Tomorrow')).toBeDefined()
  })
})

describe('the checklist count on a task row', () => {
  it('is not on the button, at rest or woken, the button still naming it (CHK-5)', async () => {
    const user = setup(null, ['one', 'two'])
    const checklistButton = () => screen.getByRole('button', { name: `Checklist for "${TASK}": 0 of 2 done` })

    expect(checklistButton()).toHaveProperty('textContent', '')
    expect(within(screen.getByRole('listitem')).queryByText('0/2')).toBeNull()

    await user.click(screen.getByRole('listitem'))

    expect(checklistButton()).toHaveProperty('textContent', '')
  })

  it('is spelled out under its button once the row is clicked into (CHK-5, UI-27)', async () => {
    const user = setup(null, ['one', 'two'])

    await user.click(screen.getByRole('listitem'))

    // The row's own item, not one of the checklist's that waking it opened.
    expect(within(screen.getAllByRole('listitem')[0]).getByText('0/2')).toBeDefined()
  })
})

describe('the controls on a task row', () => {
  it('are all on show at rest, even with nothing set (UI-18)', () => {
    setup(null)

    expect(screen.getByRole('button', { name: `Due date for "${TASK}": No date` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Repeat for "${TASK}": Repeat` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Add a checklist to "${TASK}"` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Tags for "${TASK}": No tags` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Reward for "${TASK}": No reward` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Add a description to "${TASK}"` })).toBeDefined()
  })
})

describe('the reward on a task row', () => {
  it('is spelled out under its star once the row is clicked into, and named on the phone\'s line (RWD-7, RWD-8)', async () => {
    const user = setup({ kind: 'daily' }, [], () => undefined, null, 5)
    const row = () => within(screen.getByRole('listitem'))

    expect(row().queryByText('+5')).toBeNull()

    await user.click(screen.getByRole('listitem'))

    expect(row().getByText('+5')).toBeDefined()
    expect(row().getByText('5 points')).toBeDefined()
  })
})

describe('the tags on a task row', () => {
  it('are shown beside the title at rest (TAG-12)', () => {
    render(
      <ul>
        <TaskItem
          task={addTag(addTag(createTask(TASK, null, NOW), 'health'), 'morning')}
          now={NOW}
          knownTags={['health', 'morning']}
          onComplete={nothing}
          onUncomplete={nothing}
          onRename={nothing}
          onChangeDescription={nothing}
          onChangeDueDate={nothing}
          onChangeRepeat={nothing}
          onChangeReward={nothing}
          onAddTag={nothing}
          onRemoveTag={nothing}
          onRemove={nothing}
          onDuplicate={nothing}
          onAddSubtask={nothing}
          onSetSubtaskDone={nothing}
          onRenameSubtask={nothing}
          onRemoveSubtask={nothing}
        />
      </ul>,
    )
    const chips = within(screen.getByRole('list', { name: 'Tags' })).getAllByRole('listitem')

    expect(chips.map((chip) => chip.textContent)).toEqual(['health', 'morning'])
    expect(screen.getByRole('button', { name: `Tags for "${TASK}": health, morning` })).toBeDefined()
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

describe('the menu a right-click opens on a task row', () => {
  function row() {
    return screen.getAllByRole('listitem')[0]
  }

  function menu() {
    return screen.queryByRole('menu', { name: `Actions for "${TASK}"` })
  }

  it('offers to duplicate the task (UI-31, TASK-51)', async () => {
    const user = setup()

    await user.pointer({ keys: '[MouseRight]', target: row() })

    expect(within(menu() as HTMLElement).getByRole('menuitem', { name: 'Duplicate' })).toBeDefined()
  })

  it('duplicates the task when chosen, and closes (TASK-51)', async () => {
    const onDuplicate = vi.fn()
    const user = setup({ kind: 'daily' }, [], onDuplicate)

    await user.pointer({ keys: '[MouseRight]', target: row() })
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }))

    expect(onDuplicate).toHaveBeenCalledTimes(1)
    expect(menu()).toBeNull()
  })

  it('leaves the row as it was, at rest or awake (UI-31)', async () => {
    const user = setup()

    await user.pointer({ keys: '[MouseRight]', target: row() })
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }))

    expect(within(row()).queryByText('Daily')).toBeNull()

    await user.click(row())
    await user.pointer({ keys: '[MouseRight]', target: row() })
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }))

    expect(within(row()).getByText('Daily')).toBeDefined()
  })

  it('closes on Escape without resting the row behind it (UI-10, UI-31)', async () => {
    const user = setup()

    await user.click(row())
    await user.pointer({ keys: '[MouseRight]', target: row() })
    await user.keyboard('{Escape}')

    expect(menu()).toBeNull()
    expect(within(row()).getByText('Daily')).toBeDefined()
  })

  it('closes on a click outside it (UI-9)', async () => {
    const user = setup()

    await user.pointer({ keys: '[MouseRight]', target: row() })
    await user.click(document.body)

    expect(menu()).toBeNull()
  })

  it('opened from the keyboard, starts on its first item and gives focus back when closed (UI-31)', async () => {
    const user = setup()
    const grip = screen.getByRole('button', { name: `Move "${TASK}"` })

    grip.focus()
    // The context-menu key: a contextmenu event with no button pressed.
    fireEvent.contextMenu(grip)

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Duplicate' }))

    await user.keyboard('{Escape}')

    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(grip)
  })

  it('opened by a pointer, picks out no item (UI-31)', async () => {
    const user = setup()

    await user.pointer({ keys: '[MouseRight]', target: row() })

    expect(document.activeElement).toBe(menu())
  })

  it('is not opened from text being typed in, which keeps the browser\'s own menu (UI-31)', async () => {
    const user = setup()

    titleButton().focus()
    await user.keyboard('{Enter}')
    await user.pointer({ keys: '[MouseRight]', target: titleBox() })

    expect(menu()).toBeNull()
  })
})
