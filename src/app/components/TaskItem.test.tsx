// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addTag,
  completeTask,
  createList,
  createSubtask,
  createTask,
  uncompleteTask,
  logTime,
  moveToList,
  nextWeekDueDay,
  offsetDay,
  setStartDay,
  setDueDate,
  setTimeGoal,
  toLocalDay,
  type List,
  type ListId,
  type LocalDay,
  type Repeat,
  type Task,
} from '../../core'
import { NO_TASK_ACTIONS } from '../../test/taskActions'
import { describeShortDate } from '../dueLabels'
import type { TaskActions } from '../taskActions'
import { PHONE_QUERY } from '../usePhoneLayout'
import { TaskDragAndDrop } from './TaskDragAndDrop'
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
        actions={{ ...NO_TASK_ACTIONS, complete: nothing, uncomplete: nothing, rename: nothing, changeDescription: nothing, changeDay: nothing, skip: nothing, changeRepeat: nothing, changeReward: nothing, changeUrgent: nothing, changeTimeGoal: nothing, logTime: nothing, removeTimeEntry: nothing, changeList: filing.onChangeList ?? nothing, addTag: nothing, removeTag: nothing, remove: nothing, duplicate: onDuplicate, addSubtask: nothing, setSubtaskDone: nothing, renameSubtask: nothing, removeSubtask: nothing }}
        task={task}
        now={NOW}
        knownTags={[]}
        lists={filing.lists ?? []}
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

/** jsdom scrolls nothing either, so bringing a row into view is only recorded. */
function stubScrollIntoView() {
  const scrollIntoView = vi.fn()
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
  return scrollIntoView
}

afterEach(() => { Reflect.deleteProperty(Element.prototype, 'scrollIntoView') })

function titleButton() {
  return screen.getByRole('button', { name: `Edit "${TASK}"` })
}

function titleBox() {
  return screen.getByRole<HTMLInputElement>('textbox', { name: `Title of "${TASK}"` })
}

/** The one control for the date and the repeat rule (DUE-13). */
function scheduleButton() {
  return screen.getByRole('button', { name: new RegExp(`^Schedule for "${TASK}":`) })
}

/**
 * Inside the panel that control opens. Opening it wakes the row, whose strip
 * carries the same quick day choices (UI-53), so a choice is looked for here.
 */
function schedulePanel() {
  return within(screen.getByRole('dialog', { name: `Schedule for "${TASK}"` }))
}

describe('the repeat rule on a task row', () => {
  it('shows only the icon at rest, one control for the rule and its day, naming both (RPT-17, DUE-13)', () => {
    setup()

    expect(scheduleButton()).toHaveProperty('textContent', '')
    expect(scheduleButton().getAttribute('title')).toBe('Daily · Today')
    expect(screen.getAllByRole('button', { name: /^Schedule for/ })).toHaveLength(1)
  })

  it('spells the rule out under its button once the row is clicked into, the button staying an icon (RPT-17, UI-17)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))

    expect(within(screen.getByRole('listitem')).getByText('Daily')).toBeDefined()
    expect(scheduleButton()).toHaveProperty('textContent', '')
  })

  it('stops spelling it out when a click outside rests the row (RPT-17)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))
    await user.click(document.body)

    expect(within(screen.getByRole('listitem')).queryByText('Daily')).toBeNull()
  })
})

describe('the due date on a task row', () => {
  it('is not spelled out at rest, the button staying an icon that names it (DUE-5, UI-27)', () => {
    setup(null, [], undefined, '2026-09-16')
    const dueButton = screen.getByRole('button', { name: `Schedule for "${TASK}": Tomorrow` })

    expect(dueButton).toHaveProperty('textContent', '')
    expect(within(screen.getByRole('listitem')).queryByText('Tomorrow')).toBeNull()
  })

  it('is spelled out under its button once the row is clicked into (DUE-5, UI-27)', async () => {
    const user = setup(null, [], undefined, '2026-09-16')

    await user.click(screen.getByRole('listitem'))

    expect(within(screen.getAllByRole('listitem')[0]).getByText('Tomorrow')).toBeDefined()
  })
})

describe('the due date on a repeating task row', () => {
  it('is on show, tinted and named with the occurrence in play (DUE-12, UI-18)', () => {
    setup({ kind: 'daily' })

    const dueButton = screen.getByRole('button', { name: `Schedule for "${TASK}": Daily · Today` })
    expect(dueButton.className).toContain('text-blue-600')
  })

  it('reads the rule a day picked for it starts, and the day it first comes round on (DUE-18)', () => {
    const daily = createTask(TASK, { kind: 'daily' }, NOW)
    const row = (task: Task) => (
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={task} now={NOW} knownTags={[]} lists={[]} />
      </ul>
    )
    const { rerender } = render(row(daily))
    expect(scheduleButton().getAttribute('aria-label')).toBe(`Schedule for "${TASK}": Daily · Today`)

    // The rule stays; the day it starts on is the day it is next due.
    rerender(row(setStartDay(daily, offsetDay(toLocalDay(NOW), 1))))

    expect(scheduleButton().getAttribute('aria-label')).toBe(`Schedule for "${TASK}": Daily · Tomorrow`)
  })

  it('reads red on an occurrence that went by undone, and not again once the tick is taken back (DUE-10, RPT-38)', () => {
    // Written the Monday before, so the Monday it missed is one it existed for (DUE-11).
    const mondays: Repeat = { kind: 'weekly', weekdays: [1] }
    const missed = createTask(TASK, mondays, new Date('2026-09-07T10:00:00.000Z'))
    const row = (task: Task) => (
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={task} now={NOW} knownTags={[]} lists={[]} />
      </ul>
    )

    const { rerender } = render(row(missed))
    expect(scheduleButton().className).toContain('text-red-600')
    expect(scheduleButton().getAttribute('aria-label')).toContain('overdue')

    rerender(row(uncompleteTask(completeTask(missed, NOW), NOW)))

    expect(scheduleButton().className).not.toContain('text-red-600')
    expect(scheduleButton().getAttribute('aria-label')).not.toContain('overdue')
  })

  it('starts the rule on the day picked, keeping the rule on the button (DUE-18)', async () => {
    const user = userEvent.setup()
    const onChangeDay = vi.fn()
    render(
      <ul>
        <TaskItem
          actions={{ ...NO_TASK_ACTIONS, changeDay: onChangeDay }}
          task={createTask(TASK, { kind: 'daily' }, NOW)}
          now={NOW}
          knownTags={[]}
          lists={[]}
        />
      </ul>,
    )

    await user.click(scheduleButton())
    await user.click(schedulePanel().getByRole('button', { name: /^Tomorrow/ }))

    expect(onChangeDay).toHaveBeenCalledWith(expect.any(String), '2026-09-16')
    // The rule is untouched, so the button goes on reading it; the day arrives with the saved task.
    expect(scheduleButton().getAttribute('aria-label')).toContain('Daily')
  })

  it('does not claim a daily rule the task was refused (WARM-4, WARM-8)', async () => {
    const user = userEvent.setup()
    // A warm-up holding the habit back leaves the task as it was (TasksScreen),
    // which is what this row is handed back.
    render(
      <ul>
        <TaskItem
          actions={{ ...NO_TASK_ACTIONS, changeRepeat: vi.fn() }}
          task={createTask(TASK, null, NOW)}
          now={NOW}
          knownTags={[]}
          lists={[]}
        />
      </ul>,
    )

    // A task with no schedule brings its control out once the row is woken (UI-18).
    await user.click(screen.getByRole('listitem'))
    await user.click(scheduleButton())
    await user.click(schedulePanel().getByRole('button', { name: /^Repeat:/ }))
    await user.click(schedulePanel().getByRole('button', { name: 'Daily' }))

    expect(scheduleButton().getAttribute('aria-label')).not.toContain('Daily')
  })
})

describe('a task row with Show task details on', () => {
  function renderRow(task: Task) {
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={task} now={NOW} knownTags={[]} lists={[]} showDetails />
      </ul>,
    )
    return within(screen.getAllByRole('listitem')[0])
  }

  it('spells out the date and the checklist count at rest (UI-42)', () => {
    const row = renderRow({
      ...createTask(TASK, null, NOW),
      dueDate: '2026-09-16',
      subtasks: [createSubtask('one', NOW)],
    })

    expect(row.getByText('Tomorrow')).toBeDefined()
    expect(row.getByText('0/1')).toBeDefined()
  })

  it('spells out the repeat rule at rest, and still opens nothing else (UI-42)', () => {
    const row = renderRow(createTask(TASK, { kind: 'daily' }, NOW))

    expect(row.getByText('Daily')).toBeDefined()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('spells out Urgent at rest when the mark is on (TASK-62)', () => {
    const row = renderRow({ ...createTask(TASK, null, NOW), urgent: true })

    expect(row.getByText('Urgent')).toBeDefined()
  })

  it('spells the hour out with the day it falls on (DUE-19)', () => {
    const row = renderRow({ ...createTask(TASK, null, NOW), dueDate: '2026-09-16', dueTime: '09:00' })

    expect(row.getByText('Tomorrow at 9:00 AM')).toBeDefined()
  })

  it('spells the hour out with a repeating task\'s rule, which gives it its days (DUE-19)', () => {
    const row = renderRow({ ...createTask(TASK, { kind: 'daily' }, NOW), dueTime: '09:00' })

    expect(row.getByText('Daily at 9:00 AM')).toBeDefined()
  })
})

describe('task urgent', () => {
  it('is set from the menu (TASK-63)', async () => {
    const onChangeUrgent = vi.fn()
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={{ ...NO_TASK_ACTIONS, changeUrgent: onChangeUrgent }} task={createTask(TASK, null, NOW)} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('listitem') })
    // A mark that is on or off, heard as a toggle rather than one of a set (UI-31).
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Urgent' }))

    expect(onChangeUrgent).toHaveBeenCalledWith(expect.any(String), true)
  })

  it('is heard and shown as a toggle in the menu, in line with the actions (UI-31)', async () => {
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={{ ...createTask(TASK, null, NOW), urgent: true }} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.pointer({ keys: '[MouseRight]', target: screen.getByRole('listitem') })

    const urgent = screen.getByRole('menuitemcheckbox', { name: 'Urgent' })
    expect(urgent.getAttribute('aria-checked')).toBe('true')
    // No tick, which would be a column indenting it past Duplicate and Tags.
    expect(urgent.textContent).toBe('Urgent')
    expect(screen.getByRole('menuitem', { name: 'Duplicate' }).textContent).toBe('Duplicate')
  })

  it('is set from the woken row (TASK-63)', async () => {
    const onChangeUrgent = vi.fn()
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={{ ...NO_TASK_ACTIONS, changeUrgent: onChangeUrgent }} task={createTask(TASK, null, NOW)} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.click(screen.getByRole('listitem'))
    await user.click(screen.getByRole('button', { name: `Urgent for "${TASK}"` }))

    expect(onChangeUrgent).toHaveBeenCalledWith(expect.any(String), true)
  })

  it('does not show its label on a resting row (TASK-62)', () => {
    render(
      <ul>
        <TaskItem
          actions={NO_TASK_ACTIONS}
          task={{ ...createTask(TASK, null, NOW), urgent: true }}
          now={NOW}
          knownTags={[]}
          lists={[]}
        />
      </ul>,
    )

    expect(screen.queryByText('Urgent')).toBeNull()
    expect(screen.queryByRole('button', { name: /^Urgent for/ })).toBeNull()
  })

  it('marks an urgent open task on the row itself (TASK-64, UI-51)', () => {
    const { rerender } = render(
      <ul>
        <TaskItem
          actions={NO_TASK_ACTIONS}
          task={{ ...createTask(TASK, null, NOW), urgent: true }}
          now={NOW}
          knownTags={[]}
          lists={[]}
        />
      </ul>,
    )

    expect(screen.getByRole('listitem').getAttribute('title')).toBe('Urgent')

    rerender(
      <ul>
        <TaskItem
          actions={NO_TASK_ACTIONS}
          task={completeTask({ ...createTask(TASK, null, NOW), urgent: true }, NOW)}
          now={NOW}
          knownTags={[]}
          lists={[]}
        />
      </ul>,
    )

    expect(screen.getByRole('listitem').getAttribute('title')).toBeNull()
  })
})

describe('the menu actions on a woken row', () => {
  /** The quick day choices on the strip, in the order they are drawn. */
  function stripDates() {
    const group = screen.getByRole('group', { name: `Date for "${TASK}"` })
    return Array.from(group.querySelectorAll('button'), (icon) => icon.getAttribute('aria-label'))
  }

  it('offers the quick day choices once the row is opened, Select date apart (UI-53, DUE-14)', async () => {
    const user = setup(null)

    expect(screen.queryByRole('group', { name: `Date for "${TASK}"` })).toBeNull()

    await user.click(screen.getByRole('listitem'))

    // No Select date: the schedule control on the row's own line opens the calendar.
    expect(stripDates()).toEqual(['Today', 'Tomorrow', 'Next week'])
    expect(screen.getByRole('button', { name: 'Next week' }).title).toBe(
      `Next week · ${describeShortDate(nextWeekDueDay(NOW), NOW)}`,
    )
  })

  it('sets the day chosen from the strip and leaves the row open (UI-53, DUE-14)', async () => {
    const onChangeDay = vi.fn()
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={{ ...NO_TASK_ACTIONS, changeDay: onChangeDay }} task={createTask(TASK, null, NOW)} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.click(screen.getByRole('listitem'))
    await user.click(screen.getByRole('button', { name: 'Tomorrow' }))

    expect(onChangeDay).toHaveBeenCalledWith(expect.any(String), offsetDay(toLocalDay(NOW), 1))
    expect(stripDates()).toBeDefined()
  })

  it('marks the day already set, and offers to take it away (UI-53, DUE-14)', async () => {
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={setDueDate(createTask(TASK, null, NOW), offsetDay(toLocalDay(NOW), 1))} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.click(screen.getByRole('listitem'))

    expect(stripDates()).toEqual(['Today', 'Tomorrow', 'Next week', 'Remove date'])
    expect(screen.getByRole('button', { name: 'Tomorrow' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Today' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('offers to skip a repeating task\'s occurrence, and marks no day (UI-53, RPT-34)', async () => {
    const onSkipOccurrence = vi.fn()
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={{ ...NO_TASK_ACTIONS, skip: onSkipOccurrence }} task={createTask(TASK, { kind: 'daily' }, NOW)} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.click(screen.getByRole('listitem'))

    expect(stripDates()).toEqual(['Today', 'Tomorrow', 'Next week', 'Skip occurrence'])
    expect(screen.getByRole('button', { name: 'Today' }).getAttribute('aria-pressed')).toBe('false')

    await user.click(screen.getByRole('button', { name: 'Skip occurrence' }))

    expect(onSkipOccurrence).toHaveBeenCalledTimes(1)
  })

  it('says in each day\'s tooltip that picking it starts the repeat (UI-53, DUE-18)', async () => {
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={createTask(TASK, { kind: 'daily' }, NOW)} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.click(screen.getByRole('listitem'))

    expect(screen.getByRole('button', { name: 'Today' }).title).toBe('Today · Starts the repeat')
    expect(screen.getByRole('button', { name: 'Next week' }).title).toBe(
      `Next week · ${describeShortDate(nextWeekDueDay(NOW), NOW)} · Starts the repeat`,
    )
    // Skipping moves the task on inside the rule, so it says nothing of the sort.
    expect(screen.getByRole('button', { name: 'Skip occurrence' }).title).toBe(
      `Skip to ${describeShortDate(offsetDay(toLocalDay(NOW), 1), NOW)}`,
    )
  })

  it('offers tags, urgent and duplicate once the row is opened (UI-53)', async () => {
    const user = setup(null)

    expect(screen.queryByRole('button', { name: /^Tags for/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Urgent for/ })).toBeNull()
    expect(screen.queryByRole('button', { name: `Duplicate "${TASK}"` })).toBeNull()

    await user.click(screen.getByRole('listitem'))

    expect(screen.getByRole('button', { name: `Tags for "${TASK}": No tags` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Urgent for "${TASK}"` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Duplicate "${TASK}"` })).toBeDefined()
  })

  it('offers a list button once there is a list to choose (UI-53, LST-14)', async () => {
    const work = createList('Work', NOW)
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={createTask(TASK, null, NOW)} now={NOW} knownTags={[]} lists={[work]} />
      </ul>,
    )

    expect(screen.queryByRole('button', { name: /^List for/ })).toBeNull()

    await user.click(screen.getByRole('listitem'))

    expect(screen.getByRole('button', { name: `List for "${TASK}": Inbox` })).toBeDefined()
  })

  it('duplicates from the woken strip (TASK-51)', async () => {
    const onDuplicate = vi.fn()
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={{ ...NO_TASK_ACTIONS, duplicate: onDuplicate }} task={createTask(TASK, null, NOW)} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.click(screen.getByRole('listitem'))
    await user.click(screen.getByRole('button', { name: `Duplicate "${TASK}"` }))

    expect(onDuplicate).toHaveBeenCalledTimes(1)
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
  it('are the set ones only at rest, a task with nothing set showing none (UI-18)', () => {
    setup(null)

    expect(screen.queryByRole('button', { name: /^Schedule for/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Add a checklist to/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Time for/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Reward for/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Add a description to/ })).toBeNull()
    // Urgent is no control on a resting row, set or not (TASK-62).
    expect(screen.queryByRole('button', { name: /^Urgent for/ })).toBeNull()
  })

  it('show the set ones at rest, a repeat rule and a checklist among them (UI-18)', () => {
    setup({ kind: 'daily' }, ['one'])

    expect(screen.getByRole('button', { name: `Schedule for "${TASK}": Daily · Today` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Checklist for "${TASK}": 0 of 1 done` })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^Reward for/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Add a description to/ })).toBeNull()
  })

  it('are all on show once the row is woken, empty ones included (UI-18)', async () => {
    const user = setup(null)

    await user.click(screen.getByRole('listitem'))

    expect(screen.getByRole('button', { name: `Schedule for "${TASK}": No date` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Add a checklist to "${TASK}"` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Reward for "${TASK}": No reward` })).toBeDefined()
    expect(screen.getByRole('button', { name: `Add a description to "${TASK}"` })).toBeDefined()
  })
})

describe('the reward on a task row', () => {
  it('is spelled out under its star once the row is clicked into (RWD-7)', async () => {
    const user = setup({ kind: 'daily' }, [], () => undefined, null, 5)
    const row = () => within(screen.getByRole('listitem'))

    expect(row().queryByText('+5')).toBeNull()

    await user.click(screen.getByRole('listitem'))

    expect(row().getByText('+5')).toBeDefined()
  })
})

describe('the tags on a task row', () => {
  /** A task tagged `health` then `morning`. */
  function renderTagged(showDetails = false) {
    render(
      <ul>
        <TaskItem
          actions={NO_TASK_ACTIONS}
          task={addTag(addTag(createTask(TASK, null, NOW), 'health'), 'morning')}
          now={NOW}
          knownTags={['health', 'morning']}
          lists={[]}
          showDetails={showDetails}
        />
      </ul>,
    )
    return userEvent.setup()
  }

  function chips() {
    return within(screen.getByRole('list', { name: 'Tags' }))
      .getAllByRole('listitem')
      .map((chip) => chip.textContent)
  }

  it('are not on a resting row (TAG-12)', () => {
    renderTagged()

    expect(screen.queryByRole('list', { name: 'Tags' })).toBeNull()
  })

  it('are shown on the line of details once the row is clicked into (TAG-12)', async () => {
    const user = renderTagged()

    await user.click(screen.getAllByRole('listitem')[0])

    expect(chips()).toEqual(['health', 'morning'])
  })

  it('are shown at rest with Show task details on (TAG-12, UI-42)', () => {
    renderTagged(true)

    expect(chips()).toEqual(['health', 'morning'])
  })

  it('have no button on the row\'s line, being set from its menu (TAG-7)', () => {
    setup(null)

    expect(screen.queryByRole('button', { name: /^Tags for/ })).toBeNull()
  })
})

describe('clicking a woken row', () => {
  it('puts it away again (UI-17)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))
    await user.click(screen.getByRole('listitem'))

    expect(within(screen.getByRole('listitem')).queryByText('Daily')).toBeNull()
    expect(screen.queryByRole('textbox', { name: `Add a subtask to "${TASK}"` })).toBeNull()
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

describe('a finger on a task row, which has no right-click', () => {
  const menu = () => screen.queryByRole('menu', { name: `Actions for "${TASK}"` })

  it('opens the task\'s menu on a second tap, where a mouse click would put the row away (UI-44, UI-28)', async () => {
    const user = setup()
    const row = screen.getByRole('listitem')

    await user.pointer({ keys: '[TouchA]', target: row })

    expect(menu()).toBeNull()
    expect(within(row).getByText('Daily')).toBeDefined()

    await user.pointer({ keys: '[TouchA]', target: row })

    expect(within(menu() as HTMLElement).getByRole('menuitem', { name: 'Duplicate' })).toBeDefined()
    // The menu is about the task as a whole: the row stays open behind it.
    expect(within(row).getByText('Daily')).toBeDefined()
  })

  it('opens the task\'s menu on a second tap only on the task\'s own line, not on its controls (UI-44)', async () => {
    const user = setup()

    await user.pointer({ keys: '[TouchA]', target: screen.getByRole('listitem') })
    await user.pointer({ keys: '[TouchA]', target: screen.getByRole('button', { name: `Add a checklist to "${TASK}"` }) })

    expect(menu()).toBeNull()
  })

  describe('held', () => {
    // Picking a row up leaves listeners behind for a moment after it is let go; they go before the next test.
    afterEach(() => {
      act(() => { vi.runOnlyPendingTimers() })
      vi.useRealTimers()
    })

    /** A row inside what picks rows up, as on screen, and a finger held on it and let go `drift` pixels on. */
    function holdRow(drift: number) {
      vi.useFakeTimers()
      const task = createTask(TASK, { kind: 'daily' }, NOW)
      render(
        <TaskDragAndDrop tasks={[task]} onMove={nothing} onFile={nothing}>
          <ul>
            <TaskItem actions={NO_TASK_ACTIONS} task={task} now={NOW} knownTags={[]} lists={[]} />
          </ul>
        </TaskDragAndDrop>,
      )
      const row = screen.getByRole('listitem')

      fireEvent.touchStart(row, { touches: [{ clientX: 40, clientY: 10 }] })
      act(() => { vi.advanceTimersByTime(300) })
      const end = { clientX: 40 + drift, clientY: 10 }
      fireEvent.touchMove(row, { touches: [end] })
      return fireEvent.touchEnd(row, { touches: [], changedTouches: [end] })
    }

    it('until it is picked up and let go where it was, opens the task\'s menu (UI-44)', () => {
      const clicked = holdRow(3)

      expect(within(menu() as HTMLElement).getByRole('menuitem', { name: 'Duplicate' })).toBeDefined()
      // Letting go clicks nothing the menu opened over.
      expect(clicked).toBe(false)
    })

    it('and moved before it is let go, is a drag and opens nothing (UI-44, TASK-39)', () => {
      holdRow(40)

      expect(menu()).toBeNull()
    })
  })
})

describe('the move grip', () => {
  function renderRow(task: Task) {
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={task} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )
  }

  function grip() {
    return screen.queryByRole('button', { name: `Move "${TASK}"` })
  }

  it('picks up a task still to do (TASK-38)', () => {
    renderRow(createTask(TASK, null, NOW))

    expect(grip()).not.toBeNull()
  })

  it('is gone from a done task, whose place is when it was finished (TASK-17, TASK-41)', () => {
    renderRow(completeTask(createTask(TASK, null, NOW), NOW))

    expect(grip()).toBeNull()
  })

  it('leaves a done task its menu from the keyboard (UI-31)', () => {
    renderRow(completeTask(createTask(TASK, null, NOW), NOW))

    fireEvent.contextMenu(screen.getByRole('button', { name: `Mark "${TASK}" as not done` }))

    const actions = screen.getByRole('menu', { name: `Actions for "${TASK}"` })
    expect(within(actions).getByRole('menuitem', { name: 'Duplicate' })).toBeDefined()
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

    expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Today' }))

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

  describe('the Date row', () => {
    const TODAY = toLocalDay(NOW)
    const TOMORROW = offsetDay(TODAY, 1)

    function renderDated(task: Task, handlers: Partial<TaskActions> = {}) {
      const user = userEvent.setup()
      render(
        <ul>
          <TaskItem actions={{ ...NO_TASK_ACTIONS, ...handlers }} task={task} now={NOW} knownTags={[]} lists={[]} />
        </ul>,
      )
      return user
    }

    async function openMenu(user: ReturnType<typeof userEvent.setup>) {
      await user.pointer({ keys: '[MouseRight]', target: row() })
    }

    function icons() {
      const group = within(menu() as HTMLElement).getByRole('group', { name: 'Date' })
      return Array.from(group.querySelectorAll('button'), (icon) => icon.getAttribute('aria-label'))
    }

    it('comes first, as icons named by their tooltips (DUE-14)', async () => {
      const user = renderDated(setDueDate(createTask(TASK, null, NOW), TOMORROW))

      await openMenu(user)

      expect(icons()).toEqual(['Today', 'Tomorrow', 'Next week', 'Select date', 'Remove date'])
      expect(screen.getByRole('menuitemradio', { name: 'Next week' }).title).toBe(
        `Next week · ${describeShortDate(nextWeekDueDay(NOW), NOW)}`,
      )
      expect(screen.getByRole('menuitemradio', { name: 'Today' }).title).toBe('Today')
    })

    it('marks the one-off\'s own day as chosen (DUE-14)', async () => {
      const user = renderDated(setDueDate(createTask(TASK, null, NOW), TOMORROW))

      await openMenu(user)

      expect(screen.getByRole('menuitemradio', { name: 'Tomorrow' }).getAttribute('aria-checked')).toBe('true')
      expect(screen.getByRole('menuitemradio', { name: 'Today' }).getAttribute('aria-checked')).toBe('false')
    })

    it('sets the day chosen and closes (DUE-14)', async () => {
      const onChangeDay = vi.fn()
      const user = renderDated(createTask(TASK, null, NOW), { changeDay: onChangeDay })

      await openMenu(user)
      await user.click(screen.getByRole('menuitemradio', { name: 'Next week' }))

      expect(onChangeDay).toHaveBeenCalledWith(expect.any(String), nextWeekDueDay(NOW))
      expect(menu()).toBeNull()
    })

    it('takes a one-off\'s day away, and offers that only once there is one (DUE-14)', async () => {
      const onChangeDay = vi.fn()
      const user = renderDated(createTask(TASK, null, NOW), { changeDay: onChangeDay })

      await openMenu(user)
      expect(icons()).not.toContain('Remove date')
      await user.keyboard('{Escape}')
      cleanup()

      const again = renderDated(setDueDate(createTask(TASK, null, NOW), TODAY), { changeDay: onChangeDay })
      await openMenu(again)
      await again.click(screen.getByRole('menuitem', { name: 'Remove date' }))

      expect(onChangeDay).toHaveBeenCalledWith(expect.any(String), null)
    })

    it('offers to skip a repeating task\'s occurrence, naming the day it moves to (DUE-14, RPT-34)', async () => {
      const onSkipOccurrence = vi.fn()
      const user = renderDated(createTask(TASK, { kind: 'daily' }, NOW), { skip: onSkipOccurrence })

      await openMenu(user)

      expect(icons()).toEqual(['Today', 'Tomorrow', 'Next week', 'Skip occurrence', 'Select date'])
      const skip = screen.getByRole('menuitem', { name: 'Skip occurrence' })
      expect(skip.title).toBe(`Skip to ${describeShortDate(TOMORROW, NOW)}`)

      await user.click(skip)

      expect(onSkipOccurrence).toHaveBeenCalledTimes(1)
    })

    it('marks the day a repeating task\'s rule starts on, and none while it has none (DUE-18)', async () => {
      const user = renderDated(createTask(TASK, { kind: 'daily' }, NOW))

      await openMenu(user)
      expect(screen.getByRole('menuitemradio', { name: 'Today' }).getAttribute('aria-checked')).toBe('false')
      await user.keyboard('{Escape}')
      cleanup()

      const started = renderDated(setStartDay(createTask(TASK, { kind: 'daily' }, NOW), TOMORROW))
      await openMenu(started)

      expect(screen.getByRole('menuitemradio', { name: 'Tomorrow' }).getAttribute('aria-checked')).toBe('true')
      expect(icons()).toContain('Remove start date')
    })

    it('says in each day\'s tooltip that picking it starts the repeat (DUE-18, DUE-14)', async () => {
      const user = renderDated(createTask(TASK, { kind: 'daily' }, NOW))

      await openMenu(user)

      expect(screen.getByRole('menuitemradio', { name: 'Today' }).title).toBe('Today · Starts the repeat')
      expect(screen.getByRole('menuitemradio', { name: 'Next week' }).title).toBe(
        `Next week · ${describeShortDate(nextWeekDueDay(NOW), NOW)} · Starts the repeat`,
      )
      // Neither of these starts it: the skip moves the task on inside the rule, and
      // Select date only opens the panel, whose note says it there.
      expect(screen.getByRole('menuitem', { name: 'Skip occurrence' }).title).toBe(
        `Skip to ${describeShortDate(TOMORROW, NOW)}`,
      )
      expect(screen.getByRole('menuitem', { name: 'Select date' }).title).toBe('Select date')
    })

    it('is in the row\'s schedule panel too, skip and all (DUE-9, RPT-34)', async () => {
      const onSkipOccurrence = vi.fn()
      const user = renderDated(createTask(TASK, { kind: 'daily' }, NOW), { skip: onSkipOccurrence })

      await user.click(screen.getByRole('button', { name: /^Schedule for/ }))
      await user.click(schedulePanel().getByRole('button', { name: 'Skip occurrence' }))

      expect(onSkipOccurrence).toHaveBeenCalledTimes(1)
    })

    it('has no skip for a repeating task already done (RPT-34)', async () => {
      const user = renderDated(completeTask(createTask(TASK, { kind: 'daily' }, NOW), NOW))

      await openMenu(user)

      expect(icons()).not.toContain('Skip occurrence')
    })

    it('opens the date panel where the menu was, its calendar ready for the keys (DUE-14)', async () => {
      const onChangeDay = vi.fn()
      const user = renderDated(createTask(TASK, null, NOW), { changeDay: onChangeDay })

      await openMenu(user)
      await user.click(screen.getByRole('menuitem', { name: 'Select date' }))

      const panel = screen.getByRole('dialog', { name: `Date for "${TASK}"` })
      expect(menu()).toBeNull()
      expect(panel.contains(document.activeElement)).toBe(true)
      expect(document.activeElement?.getAttribute('aria-current')).toBe('date')

      await user.keyboard('{ArrowDown}{Enter}')

      expect(onChangeDay).toHaveBeenCalledWith(expect.any(String), offsetDay(toLocalDay(NOW), 7))
      expect(screen.queryByRole('dialog', { name: `Date for "${TASK}"` })).toBeNull()
    })

    it('is stepped along with the left and right keys too (UI-31)', async () => {
      const user = renderDated(createTask(TASK, null, NOW))

      await openMenu(user)
      await user.keyboard('{ArrowRight}{ArrowRight}')

      expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Tomorrow' }))

      await user.keyboard('{ArrowLeft}')

      expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Today' }))
    })
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
      expect(screen.queryByRole('menuitemradio', { name: 'Inbox' })).toBeNull()
    })

    it('is reached with the arrow keys, after the Date row, Urgent, Duplicate and Tags (UI-31)', async () => {
      // A one-off with no day: Today, Tomorrow, Next week and Select date, then
      // Urgent, Duplicate and Tags, then Inbox and Work.
      const user = setup(null, [], nothing, null, null, { lists: [WORK] })

      await user.pointer({ keys: '[MouseRight]', target: row() })
      await user.keyboard('{ArrowDown>9/}')

      expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Work' }))

      await user.keyboard('{ArrowDown}')

      expect(document.activeElement).toBe(screen.getByRole('menuitemradio', { name: 'Today' }))
    })
  })

  describe('tagging the task', () => {
    /** A one-off task tagged `health`, with `work` in use elsewhere. */
    function renderTagged(handlers: Partial<TaskActions> = {}) {
      const user = userEvent.setup()
      render(
        <ul>
          <TaskItem
            actions={{ ...NO_TASK_ACTIONS, ...handlers }}
            task={addTag(createTask(TASK, null, NOW), 'health')}
            now={NOW}
            knownTags={['health', 'work']}
            lists={[]}
          />
        </ul>,
      )
      return user
    }

    function tagPanel() {
      return screen.queryByRole('dialog', { name: `Tags for "${TASK}"` })
    }

    async function openTags(user: ReturnType<typeof userEvent.setup>) {
      await user.pointer({ keys: '[MouseRight]', target: row() })
      await user.click(screen.getByRole('menuitem', { name: 'Tags' }))
    }

    it('opens the tag panel in the menu\'s place, the caret in its box and the task\'s own tags ticked (TAG-7)', async () => {
      const user = renderTagged()

      await openTags(user)

      const panel = within(tagPanel() as HTMLElement)
      expect(menu()).toBeNull()
      expect(document.activeElement).toBe(panel.getByRole('textbox', { name: 'Tag name' }))
      expect(panel.getByRole('button', { name: 'health' }).getAttribute('aria-pressed')).toBe('true')
      expect(panel.getByRole('button', { name: 'work' }).getAttribute('aria-pressed')).toBe('false')
    })

    it('puts a tag on and takes one off as clicked, staying open and leaving the row at rest (TAG-7, UI-31)', async () => {
      const onAddTag = vi.fn()
      const onRemoveTag = vi.fn()
      const user = renderTagged({ addTag: onAddTag, removeTag: onRemoveTag })

      await openTags(user)
      await user.click(screen.getByRole('button', { name: 'work' }))
      await user.click(screen.getByRole('button', { name: 'health' }))

      expect(onAddTag).toHaveBeenCalledWith(expect.any(String), 'work')
      expect(onRemoveTag).toHaveBeenCalledWith(expect.any(String), 'health')
      expect(tagPanel()).not.toBeNull()
      // The woken row's strip would be there had the row opened (UI-53).
      expect(screen.queryByRole('button', { name: `Duplicate "${TASK}"` })).toBeNull()
    })

    it('makes a tag typed in its box on Enter (TAG-7)', async () => {
      const onAddTag = vi.fn()
      const user = renderTagged({ addTag: onAddTag })

      await openTags(user)
      await user.keyboard('trip{Enter}')

      expect(onAddTag).toHaveBeenCalledWith(expect.any(String), 'trip')
    })

    it('closes on a click outside it (UI-9)', async () => {
      const user = renderTagged()

      await openTags(user)
      await user.click(document.body)

      expect(tagPanel()).toBeNull()
    })

    it('opened from the keyboard, closes on Escape and gives focus back (UI-10, UI-31)', async () => {
      const user = renderTagged()
      const grip = screen.getByRole('button', { name: `Move "${TASK}"` })

      grip.focus()
      fireEvent.contextMenu(grip)
      // From Today, past the rest of the Date row, Urgent, and Duplicate.
      await user.keyboard('{ArrowDown>6/}{Enter}')

      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Tag name' }))

      await user.keyboard('{Escape}')

      expect(tagPanel()).toBeNull()
      expect(document.activeElement).toBe(grip)
    })
  })
})

describe('the time on a task row', () => {
  /** "1 hour of sport", with `minutes` logged this morning. */
  function sport(minutes: number): Task {
    const task = setTimeGoal(createTask('sport', { kind: 'daily' }, NOW), 60)
    return minutes === 0 ? task : logTime(task, minutes, NOW)
  }

  function renderRow(task: Task, handlers: Partial<TaskActions> = {}) {
    const user = userEvent.setup()
    render(
      <ul>
        <TaskItem actions={{ ...NO_TASK_ACTIONS, ...handlers }} task={task} now={NOW} knownTags={[]} lists={[]} />
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
    const user = renderRow(sport(0), { logTime: onLogTime })

    await user.click(clock())
    await user.click(screen.getByRole('button', { name: 'Log 30m' }))
    await user.type(screen.getByRole('textbox', { name: 'Time to log' }), '1h 15m{Enter}')

    expect(onLogTime.mock.calls).toEqual([[expect.any(String), 30], [expect.any(String), 75]])
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Time to log' }).value).toBe('')
    expect(screen.getByRole('dialog', { name: 'Time for "sport"' })).toBeDefined()
  })

  it('refuses a session it cannot read, logging nothing', async () => {
    const onLogTime = vi.fn()
    const user = renderRow(sport(0), { logTime: onLogTime })

    await user.click(clock())
    await user.type(screen.getByRole('textbox', { name: 'Time to log' }), 'soon{Enter}')

    expect(onLogTime).not.toHaveBeenCalled()
    expect(screen.getByRole('textbox', { name: 'Time to log' }).getAttribute('aria-invalid')).toBe('true')
  })

  it('takes a session back (TIME-4)', async () => {
    const onRemoveTimeEntry = vi.fn()
    const task = sport(20)
    const user = renderRow(task, { removeTimeEntry: onRemoveTimeEntry })

    await user.click(clock())
    await user.click(screen.getByRole('button', { name: /^Remove 20m logged at/ }))

    expect(onRemoveTimeEntry).toHaveBeenCalledWith(task.id, task.timeLog[0]?.id)
  })

  it('keeps the goal typed on Enter, and an empty one as none (TIME-1)', async () => {
    const onChangeTimeGoal = vi.fn()
    const user = renderRow(sport(0), { changeTimeGoal: onChangeTimeGoal })

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
    const user = renderRow(sport(0), { changeTimeGoal: onChangeTimeGoal })

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
    const user = renderRow(sport(0), { changeTimeGoal: onChangeTimeGoal })

    await user.click(clock())
    await user.clear(screen.getByRole('textbox', { name: 'Goal' }))
    await user.type(screen.getByRole('textbox', { name: 'Goal' }), 'lots{Enter}')

    expect(onChangeTimeGoal).not.toHaveBeenCalled()
  })
})

describe('a task row gone to from elsewhere', () => {
  it('is brought into view and woken, as a click would (TIME-20)', () => {
    const scrollIntoView = stubScrollIntoView()
    const onRevealed = vi.fn()
    const task = createTask(TASK, { kind: 'daily' }, NOW)
    const row = (revealed: boolean) => (
      <ul>
        <TaskItem
          actions={NO_TASK_ACTIONS}
          task={task}
          now={NOW}
          knownTags={[]}
          lists={[]}
          revealed={revealed}
          onRevealed={onRevealed}
        />
      </ul>
    )
    const { rerender } = render(row(false))
    expect(within(screen.getByRole('listitem')).queryByText('Daily')).toBeNull()
    expect(onRevealed).not.toHaveBeenCalled()

    rerender(row(true))

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
    expect(within(screen.getByRole('listitem')).getByText('Daily')).toBeDefined()
    expect(onRevealed).toHaveBeenCalledOnce()
  })
})

describe('on a phone, tapping a task', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query === PHONE_QUERY,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent() { return false },
        onchange: null,
      }),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    })
  })

  function sheet() {
    return screen.getByRole('dialog', { name: `Details of "${TASK}"` })
  }

  it('opens the sheet when the task is gone to from elsewhere (TIME-20)', () => {
    const scrollIntoView = stubScrollIntoView()
    const task = createTask(TASK, null, NOW)
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={task} now={NOW} knownTags={[]} lists={[]} revealed />
      </ul>,
    )

    expect(sheet()).toBeDefined()
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center' })
  })

  it('opens a sheet from the bottom with the details and the action buttons (UI-48)', async () => {
    const user = setup(null, ['one'])

    expect(screen.queryByRole('dialog', { name: `Details of "${TASK}"` })).toBeNull()
    expect(screen.queryByRole('button', { name: `Edit "${TASK}"` })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Schedule for/ })).toBeNull()

    await user.click(screen.getByRole('listitem'))

    const open = within(sheet())
    expect(sheet().parentElement?.className).toContain('z-40')
    expect(open.getByRole('button', { name: `Edit "${TASK}"` })).toBeDefined()
    expect(open.getByRole('button', { name: /^Schedule for/ })).toBeDefined()
    expect(open.getByRole('button', { name: /^List for/ })).toBeDefined()
    expect(open.getByRole('button', { name: /^Time for/ })).toBeDefined()
    expect(open.getByRole('button', { name: /^Tags for/ })).toBeDefined()
    expect(open.getByRole('button', { name: /^Reward for/ })).toBeDefined()
    expect(open.getByRole('button', { name: /^Urgent for/ })).toBeDefined()
    expect(open.getByRole('button', { name: 'Duplicate' })).toBeDefined()
    expect(open.getByRole('button', { name: `Delete "${TASK}"` })).toBeDefined()
    expect(open.getByRole('list', { name: `Checklist for "${TASK}"` })).toBeDefined()
    expect(open.getByText('one')).toBeDefined()
  })

  it('edits the title only from the sheet (TASK-8, UI-48)', async () => {
    layOutTitle()
    const onRename = vi.fn()
    const user = userEvent.setup()
    const task = createTask(TASK, null, NOW)
    render(
      <ul>
        <TaskItem actions={{ ...NO_TASK_ACTIONS, rename: onRename }} task={task} now={NOW} knownTags={[]} lists={[]} />
      </ul>,
    )

    await user.click(screen.getByRole('listitem'))
    expect(screen.queryByRole('textbox', { name: `Title of "${TASK}"` })).toBeNull()

    await user.click(within(sheet()).getByRole('button', { name: `Edit "${TASK}"` }))
    const box = screen.getByRole<HTMLInputElement>('textbox', { name: `Title of "${TASK}"` })
    await user.clear(box)
    await user.type(box, 'walk{Enter}')

    expect(onRename).toHaveBeenCalledWith(task.id, 'walk')
  })

  it('closes on a tap on the dimmed page and on Escape (UI-9, UI-10, UI-48)', async () => {
    const user = setup()

    await user.click(screen.getByRole('listitem'))
    expect(sheet()).toBeDefined()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: `Details of "${TASK}"` })).toBeNull()

    await user.click(screen.getByRole('listitem'))
    await user.click(sheet().previousElementSibling as HTMLElement)
    expect(screen.queryByRole('dialog', { name: `Details of "${TASK}"` })).toBeNull()
  })

  it('sizes the row and the sheet for a thumb, and says Delete in red (UI-38, UI-47, UI-48)', async () => {
    const user = setup()

    const row = screen.getByRole('button', { name: `Mark "${TASK}" as done` })
    // The box answers a touch past its edge: a thumb's 44 pixels, not its drawn 20.
    expect(row.className).toContain('size-5')
    expect(row.className).toContain('before:-inset-3')
    const title = screen.getByRole('button', { name: TASK })
    expect(title.className).toContain('text-base')
    expect(title.className).not.toContain('text-sm')

    await user.click(screen.getByRole('listitem'))

    const open = within(sheet())
    const heading = open.getByRole('button', { name: `Edit "${TASK}"` })
    expect(heading.className).toContain('text-lg')
    expect(heading.className).not.toContain('text-sm')
    expect(open.getByRole('button', { name: `Delete "${TASK}"` }).className).toContain('text-red-600')
  })

  it('does not open from ticking the box (UI-19)', async () => {
    const user = setup()

    await user.click(screen.getByRole('button', { name: `Mark "${TASK}" as done` }))

    expect(screen.queryByRole('dialog', { name: `Details of "${TASK}"` })).toBeNull()
  })

  it('names the reward on the sheet (RWD-8)', async () => {
    const user = setup({ kind: 'daily' }, [], () => undefined, null, 5)

    expect(screen.queryByText(/\+5/)).toBeNull()
    await user.click(screen.getByRole('listitem'))
    // The icons say what the task has; the line under them spells it out (UI-63).
    expect(within(sheet()).getByText(/\+5/)).toBeDefined()
  })

  it('marks what is set on the rest row, without controls (UI-50)', async () => {
    const user = userEvent.setup()
    let task = setTimeGoal(createTask(TASK, { kind: 'daily' }, NOW), 30)
    task = { ...task, reward: 5, description: 'notes', tags: ['home'] }
    task = { ...task, subtasks: [createSubtask('one', NOW)] }
    render(
      <ul>
        <TaskItem actions={NO_TASK_ACTIONS} task={task} now={NOW} knownTags={['home']} lists={[]} />
      </ul>,
    )

    const marks = screen.getByRole('group', {
      name: 'Daily, Checklist 0 of 1, 0m/30m, +5, Description, Tags home',
    })
    expect(within(marks).queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /^Schedule for/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Reward for/ })).toBeNull()

    await user.click(marks)
    expect(sheet()).toBeDefined()
  })

  it('shows no marks on a bare task (UI-50)', () => {
    setup(null)

    expect(screen.queryByRole('group', { name: /Daily|Checklist|Description|Tags/ })).toBeNull()
  })

  describe('swiping a row (UI-60)', () => {
    function swipe(row: HTMLElement, dx: number) {
      fireEvent.touchStart(row, { touches: [{ clientX: 100, clientY: 40 }] })
      fireEvent.touchMove(row, { touches: [{ clientX: 100 + dx, clientY: 40 }] })
      fireEvent.touchEnd(row, { touches: [], changedTouches: [{ clientX: 100 + dx, clientY: 40 }] })
    }

    it('completes on a swipe right', () => {
      const onComplete = vi.fn()
      const task = createTask(TASK, null, NOW)
      render(
        <ul>
          <TaskItem actions={{ ...NO_TASK_ACTIONS, complete: onComplete }} task={task} now={NOW} knownTags={[]} lists={[]} />
        </ul>,
      )

      swipe(screen.getByRole('listitem'), 80)

      expect(onComplete).toHaveBeenCalledWith(task.id)
      expect(screen.queryByRole('dialog', { name: `Details of "${TASK}"` })).toBeNull()
    })

    it('takes a done task back on a swipe right', () => {
      const onUncomplete = vi.fn()
      const task = completeTask(createTask(TASK, null, NOW), NOW)
      render(
        <ul>
          <TaskItem actions={{ ...NO_TASK_ACTIONS, uncomplete: onUncomplete }} task={task} now={NOW} knownTags={[]} lists={[]} />
        </ul>,
      )

      swipe(screen.getByRole('listitem'), 80)

      expect(onUncomplete).toHaveBeenCalledWith(task.id)
    })

    it('deletes on a swipe left', () => {
      const onRemove = vi.fn()
      const task = createTask(TASK, null, NOW)
      render(
        <ul>
          <TaskItem actions={{ ...NO_TASK_ACTIONS, remove: onRemove }} task={task} now={NOW} knownTags={[]} lists={[]} />
        </ul>,
      )

      swipe(screen.getByRole('listitem'), -80)

      expect(onRemove).toHaveBeenCalledWith(task.id)
      expect(screen.queryByRole('dialog', { name: `Details of "${TASK}"` })).toBeNull()
    })

    it('snaps back without acting on a short swipe', () => {
      const onComplete = vi.fn()
      const onRemove = vi.fn()
      const task = createTask(TASK, null, NOW)
      render(
        <ul>
          <TaskItem
            actions={{ ...NO_TASK_ACTIONS, complete: onComplete, remove: onRemove }}
            task={task}
            now={NOW}
            knownTags={[]}
            lists={[]}
          />
        </ul>,
      )

      swipe(screen.getByRole('listitem'), 40)

      expect(onComplete).not.toHaveBeenCalled()
      expect(onRemove).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog', { name: `Details of "${TASK}"` })).toBeNull()
    })
  })
})
