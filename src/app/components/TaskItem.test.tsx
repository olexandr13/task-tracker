// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addTag,
  completeTask,
  createList,
  createSubtask,
  createTask,
  logTime,
  moveToList,
  setTimeGoal,
  type List,
  type ListId,
  type LocalDay,
  type Repeat,
  type Task,
} from '../../core'
import { TaskItem } from './TaskItem'

/*
 * What a task row shows at rest and once clicked into. RPT ids refer to
 * wiki/repeating-tasks.md, UI ids to wiki/interface.md, TASK ids to wiki/tasks.md,
 * DUE ids to wiki/due-dates.md, TAG ids to wiki/tags.md, RWD ids to wiki/rewards.md,
 * LST ids to wiki/lists.md, TIME ids to wiki/time-goals.md.
 */

const NOW = new Date('2026-09-15T10:00:00.000Z')
const TASK = 'stretch'
const nothing = () => undefined

/** Every handler a row takes, doing nothing. */
const HANDLERS = {
  onComplete: nothing,
  onUncomplete: nothing,
  onRename: nothing,
  onChangeDescription: nothing,
  onChangeDueDate: nothing,
  onChangeRepeat: nothing,
  onChangeReward: nothing,
  onChangeTimeGoal: nothing,
  onLogTime: nothing,
  onRemoveTimeEntry: nothing,
  onChangeList: nothing,
  onAddTag: nothing,
  onRemoveTag: nothing,
  onRemove: nothing,
  onDuplicate: nothing,
  onAddSubtask: nothing,
  onSetSubtaskDone: nothing,
  onRenameSubtask: nothing,
  onRemoveSubtask: nothing,
}

afterEach(cleanup)

function setup(
  repeat: Repeat | null = { kind: 'daily' },
  subtasks: readonly string[] = [],
  onDuplicate: (id: string) => void = () => undefined,
  dueDate: LocalDay | null = null,
  reward: number | null = null,
  filing: { lists?: readonly List[]; listId?: ListId | null; onChangeList?: (id: string, listId: ListId | null) => void } = {},
) {
  const user = userEvent.setup()
  const task = {
    ...moveToList(createTask(TASK, repeat, NOW), filing.listId ?? null),
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
        lists={filing.lists ?? []}
        onComplete={nothing}
        onUncomplete={nothing}
        onRename={nothing}
        onChangeDescription={nothing}
        onChangeDueDate={nothing}
        onChangeRepeat={nothing}
        onChangeReward={nothing}
        onChangeTimeGoal={nothing}
        onLogTime={nothing}
        onRemoveTimeEntry={nothing}
        onChangeList={filing.onChangeList ?? nothing}
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
          {...HANDLERS}
          task={addTag(addTag(createTask(TASK, null, NOW), 'health'), 'morning')}
          now={NOW}
          knownTags={['health', 'morning']}
          lists={[]}
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

  describe('filing the task in a list', () => {
    const WORK = createList('Work', new Date('2026-09-01T00:00:00.000Z'))
    const HOME = createList('Home', new Date('2026-09-02T00:00:00.000Z'))

    function group() {
      return within(menu() as HTMLElement).queryByRole('group', { name: 'List' })
    }

    it('has no list button on the row (LST-14)', () => {
      setup({ kind: 'daily' }, [], nothing, null, null, { lists: [WORK, HOME] })

      expect(screen.queryByRole('button', { name: /^List for/ })).toBeNull()
    })

    it('offers the Inbox and then every list, the task\'s own checked (LST-14, LST-15)', async () => {
      const user = setup({ kind: 'daily' }, [], nothing, null, null, { lists: [HOME, WORK], listId: HOME.id })

      await user.pointer({ keys: '[MouseRight]', target: row() })

      const choices = within(group() as HTMLElement).getAllByRole('menuitemradio')
      // The mark is drawn for the eye; a screen reader hears the choice checked instead.
      expect(choices.map((choice) => choice.textContent)).toEqual(['Inbox', 'Work', '✓Home'])
      expect(choices.map((choice) => choice.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true'])
    })

    it('checks the Inbox for a task in no list (LST-15)', async () => {
      const user = setup({ kind: 'daily' }, [], nothing, null, null, { lists: [WORK] })

      await user.pointer({ keys: '[MouseRight]', target: row() })

      expect(within(group() as HTMLElement).getByRole('menuitemradio', { name: 'Inbox' }).getAttribute('aria-checked')).toBe('true')
    })

    it('files the task when a list is chosen, and closes (LST-14)', async () => {
      const onChangeList = vi.fn()
      const user = setup({ kind: 'daily' }, [], nothing, null, null, { lists: [WORK, HOME], onChangeList })

      await user.pointer({ keys: '[MouseRight]', target: row() })
      await user.click(screen.getByRole('menuitemradio', { name: 'Home' }))

      expect(onChangeList).toHaveBeenCalledWith(expect.any(String), HOME.id)
      expect(menu()).toBeNull()
    })

    it('takes the task back out of its list with the Inbox (LST-15)', async () => {
      const onChangeList = vi.fn()
      const user = setup({ kind: 'daily' }, [], nothing, null, null, { lists: [WORK], listId: WORK.id, onChangeList })

      await user.pointer({ keys: '[MouseRight]', target: row() })
      await user.click(screen.getByRole('menuitemradio', { name: 'Inbox' }))

      expect(onChangeList).toHaveBeenCalledWith(expect.any(String), null)
    })

    it('is left out while there are no lists (LST-14)', async () => {
      const user = setup()

      await user.pointer({ keys: '[MouseRight]', target: row() })

      expect(group()).toBeNull()
      expect(screen.queryAllByRole('menuitemradio')).toEqual([])
    })

    it('is reached with the arrow keys, after Duplicate (UI-31)', async () => {
      const user = setup({ kind: 'daily' }, [], nothing, null, null, { lists: [WORK] })

      await user.pointer({ keys: '[MouseRight]', target: row() })
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')

      expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Work' }))

      await user.keyboard('{ArrowDown}')

      expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Duplicate' }))
    })
  })
})

describe('the time on a task row', () => {
  /** "1 hour of sport", with `minutes` logged this morning. */
  function sport(minutes: number): Task {
    const task = setTimeGoal(createTask('sport', { kind: 'daily' }, NOW), 60)
    return minutes === 0 ? task : logTime(task, minutes, NOW)
  }

  function renderRow(task: Task, handlers: Partial<typeof HANDLERS> = {}) {
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem {...HANDLERS} {...handlers} task={task} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )
    return user
  }

  const box = () => screen.getByRole('button', { name: /^Mark "sport" as/ })
  const clock = () => screen.getAllByRole('button', { name: /^Time for "sport":/ })[0]

  it('names how the time stands on its clock (TIME-10)', () => {
    renderRow(sport(20))

    expect(clock()).toHaveProperty('ariaLabel', 'Time for "sport": 20m of 1h')
  })

  it('leaves the box plain until the goal is reached, then invites a tick (TIME-5)', () => {
    renderRow(sport(40))
    expect(box()).toHaveProperty('ariaLabel', 'Mark "sport" as done')
    cleanup()

    renderRow(sport(60))
    expect(box()).toHaveProperty('ariaLabel', 'Mark "sport" as done: its time goal is reached')
    expect(box().title).toBe('Time goal reached: ready to tick off')
  })

  it('does not invite a tick once the task is done', () => {
    renderRow(completeTask(sport(60), NOW))

    expect(box()).toHaveProperty('ariaLabel', 'Mark "sport" as not done')
  })

  it('spells the time out under the clock once woken (TIME-12)', async () => {
    const user = renderRow(sport(20))
    expect(screen.queryByText('20m/1h')).toBeNull()

    await user.click(screen.getByRole('listitem'))

    expect(screen.getByText('20m/1h')).toBeDefined()
  })

  it('logs a quick session, and one typed, keeping the panel open (TIME-3, TIME-11)', async () => {
    const onLogTime = vi.fn()
    const user = renderRow(sport(0), { onLogTime })

    await user.click(clock())
    await user.click(screen.getByRole('button', { name: 'Log 30m' }))
    await user.type(screen.getByRole('textbox', { name: 'Time to log' }), '1h 15m{Enter}')

    expect(onLogTime.mock.calls).toEqual([[expect.any(String), 30], [expect.any(String), 75]])
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Time to log' }).value).toBe('')
    expect(screen.getByRole('dialog', { name: 'Time for "sport"' })).toBeDefined()
  })

  it('refuses a session it cannot read, logging nothing', async () => {
    const onLogTime = vi.fn()
    const user = renderRow(sport(0), { onLogTime })

    await user.click(clock())
    await user.type(screen.getByRole('textbox', { name: 'Time to log' }), 'soon{Enter}')

    expect(onLogTime).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Time to log' }).getAttribute('aria-invalid')).toBe('true')
  })

  it('takes a session back (TIME-4)', async () => {
    const onRemoveTimeEntry = vi.fn()
    const task = sport(20)
    const user = renderRow(task, { onRemoveTimeEntry })

    await user.click(clock())
    await user.click(screen.getByRole('button', { name: /^Remove 20m logged at/ }))

    expect(onRemoveTimeEntry).toHaveBeenCalledWith(task.id, task.timeLog[0]?.id)
  })

  it('keeps the goal typed on Enter, and an empty one as none (TIME-1)', async () => {
    const onChangeTimeGoal = vi.fn()
    const user = renderRow(sport(0), { onChangeTimeGoal })

    await user.click(clock())
    const goal = screen.getByRole('textbox', { name: 'Goal' })
    expect((goal as HTMLInputElement).value).toBe('1h')
    await user.clear(goal)
    await user.type(goal, '1h30{Enter}')
    expect(onChangeTimeGoal).toHaveBeenLastCalledWith(expect.any(String), 90)

    await user.click(clock())
    await user.clear(screen.getByRole('textbox', { name: 'Goal' }))
    await user.keyboard('{Enter}')
    expect(onChangeTimeGoal).toHaveBeenLastCalledWith(expect.any(String), null)
    expect(onChangeTimeGoal).toHaveBeenCalledTimes(2)
  })

  it('keeps the goal typed when a click outside closes the panel, and drops it on Escape', async () => {
    const onChangeTimeGoal = vi.fn()
    const user = renderRow(sport(0), { onChangeTimeGoal })

    await user.click(clock())
    await user.clear(screen.getByRole('textbox', { name: 'Goal' }))
    await user.type(screen.getByRole('textbox', { name: 'Goal' }), '45m{Escape}')
    expect(onChangeTimeGoal).not.toHaveBeenCalled()

    await user.click(clock())
    await user.clear(screen.getByRole('textbox', { name: 'Goal' }))
    await user.type(screen.getByRole('textbox', { name: 'Goal' }), '45m')
    await user.click(document.body)

    expect(onChangeTimeGoal).toHaveBeenCalledWith(expect.any(String), 45)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('leaves the goal as it was when what is typed is not one', async () => {
    const onChangeTimeGoal = vi.fn()
    const user = renderRow(sport(0), { onChangeTimeGoal })

    await user.click(clock())
    await user.clear(screen.getByRole('textbox', { name: 'Goal' }))
    await user.type(screen.getByRole('textbox', { name: 'Goal' }), 'lots{Enter}')

    expect(onChangeTimeGoal).not.toHaveBeenCalled()
  })
})
