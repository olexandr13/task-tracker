// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, logTime, setTimeGoal, type Task } from '../../core'
import { NO_TASK_ACTIONS } from '../../test/taskActions'
import { HabitList } from './HabitList'

/* What the habits page shows and does. HAB ids refer to wiki/habits.md. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

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

afterEach(() => {
  Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
})

function setup(habits: Task[], showDetails = false) {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  const onUncomplete = vi.fn()
  const onSetDay = vi.fn()
  const onLogTime = vi.fn()
  const onRename = vi.fn()
  const onRemove = vi.fn()
  const view = render(
    <HabitList
      actions={{ ...NO_TASK_ACTIONS, complete: onComplete, uncomplete: onUncomplete, rename: onRename, logTime: onLogTime, remove: onRemove }}
      habits={habits}
      now={WED_16}
      showDetails={showDetails}
      knownTags={[]}
      lists={[]}
      onSetDay={onSetDay}
    />,
  )
  return { user, onComplete, onUncomplete, onSetDay, onLogTime, onRename, onRemove, rerender: view.rerender }
}

/** Props shared when a test re-renders the list after the default changes. */
function listProps(habits: Task[]) {
  return {
    habits,
    now: WED_16,
    knownTags: [] as const,
    lists: [] as const,
    actions: NO_TASK_ACTIONS,
    onSetDay: vi.fn(),
  }
}

/** A daily habit done on Mon 14 and Tue 15, and still to do today, Wed 16. */
function stretch(): Task {
  return { ...createTask('stretch', { kind: 'daily' }, WED_16), doneDays: ['2026-09-14', '2026-09-15'] }
}

describe('HabitList', () => {
  it('says how to make a habit when there are none (HAB-3)', () => {
    setup([])

    expect(screen.getByText(/Give a task a daily repeat/)).toBeTruthy()
  })

  it('ticks today off, and takes it back (HAB-4)', async () => {
    const habit = createTask('stretch', { kind: 'daily' }, WED_16)
    const { user, onComplete } = setup([habit])

    const box = screen.getByRole('button', { name: 'Mark "stretch" as done today' })
    expect(box.getAttribute('aria-pressed')).toBe('false')
    await user.click(box)
    // The tick is shown where it was clicked and lands a moment later (UI-65).
    expect(box.getAttribute('aria-pressed')).toBe('true')
    await waitFor(() => { expect(onComplete).toHaveBeenCalledWith(habit.id) })

    cleanup()
    const second = setup([completeTask(habit, WED_16)])
    await second.user.click(screen.getByRole('button', { name: 'Mark "stretch" as not done today' }))
    expect(second.onUncomplete).toHaveBeenCalledWith(habit.id)
  })

  it('reads the streak and the record out as text (HAB-11)', () => {
    setup([stretch()])

    expect(screen.getByRole('heading', { name: 'stretch' })).toBeTruthy()
    // The folded line's streak, the current streak and the best one.
    expect(screen.getAllByText('2 days')).toHaveLength(3)
    // The last 7 days, the last 30 and the last year are all Mon and Tue, today still to do.
    expect(screen.getAllByText('100%')).toHaveLength(3)
    expect(screen.getByText('Last year')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'Last 52 weeks: done on 2 days' })).toBeTruthy()
  })

  it('marks an earlier day done, and takes a done one back (HAB-16)', async () => {
    const habit = stretch()
    const { user, onSetDay } = setup([habit])

    await user.click(screen.getByRole('button', { name: 'Sun, Sep 13 · Not tracked' }))
    expect(onSetDay).toHaveBeenLastCalledWith(habit.id, '2026-09-13', true)

    const monday = screen.getByRole('button', { name: 'Mon, Sep 14 · Done' })
    expect(monday.getAttribute('aria-pressed')).toBe('true')
    await user.click(monday)
    expect(onSetDay).toHaveBeenLastCalledWith(habit.id, '2026-09-14', false)
  })

  it('folds a card to its streak and last week, and unfolds its record on a tap (HAB-21, HAB-22)', async () => {
    const { user, onComplete } = setup([stretch()])
    const toggle = screen.getByRole('button', { name: 'Record of "stretch"' })
    const title = screen.getByRole('heading', { name: 'stretch' })

    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    // The title is never cut off to make room: the streak and the week are on a line under it.
    expect(title.className).not.toContain('truncate')
    expect(screen.getByText('Current streak:').parentElement?.textContent).toBe('Current streak: 2 days')
    const week = screen.getByRole('img', { name: 'Last 7 days: done on 2 days' })
    expect(week.children).toHaveLength(7)
    expect(title.compareDocumentPosition(week) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull()
    const record = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    expect(record?.className).toContain('hidden')
    expect(record?.contains(screen.getByRole('group', { name: /Last 52 weeks/ }))).toBe(true)

    // Ticking off is not asking for the record.
    await user.click(screen.getByRole('button', { name: 'Mark "stretch" as done today' }))
    await waitFor(() => { expect(onComplete).toHaveBeenCalled() })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(record?.className).toContain('flex')
    // The streak and the days are in the record now, so the line no longer repeats them.
    expect(screen.queryByText('Current streak:')).toBeNull()
    expect(screen.queryByRole('img', { name: /Last 7 days/ })).toBeNull()
    // The legend names the grid's shades once a card is open (HAB-10).
    const legend = screen.getByRole('list', { name: 'Legend' })
    expect(legend.textContent).toBe('DoneMissedNot tracked')
    expect(record).toBeTruthy()
    expect(record!.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(record?.className).toContain('hidden')
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull()
  })

  it('starts each card open when Show habit details by default is on (HAB-23)', () => {
    setup([stretch()], true)

    expect(screen.getByRole('button', { name: 'Record of "stretch"' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.queryByText('Current streak:')).toBeNull()
    expect(screen.getByRole('list', { name: 'Legend' })).toBeTruthy()
  })

  it('resets the cards when the default changes (HAB-23)', async () => {
    const habit = stretch()
    const { user, rerender } = setup([habit])
    const props = listProps([habit])

    await user.click(screen.getByRole('button', { name: 'Record of "stretch"' }))
    expect(screen.getByRole('button', { name: 'Record of "stretch"' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('list', { name: 'Legend' })).toBeTruthy()

    rerender(<HabitList {...props} showDetails={true} />)
    expect(screen.getByRole('button', { name: 'Record of "stretch"' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('list', { name: 'Legend' })).toBeTruthy()

    rerender(<HabitList {...props} showDetails={false} />)
    expect(screen.getByRole('button', { name: 'Record of "stretch"' }).getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('list', { name: 'Legend' })).toBeNull()
  })

  it('offers a grip on every card to put the habits in a new order (HAB-27)', async () => {
    const other = { ...createTask('read', { kind: 'daily' }, WED_16), id: 'read-id' }
    const { user } = setup([stretch(), other])

    expect(screen.getAllByRole('button', { name: /^Move "/ }).map((grip) => grip.getAttribute('aria-label')))
      .toEqual(['Move "stretch"', 'Move "read"'])

    // The grip is for carrying the card, not for opening it: it sits outside the line that folds.
    await user.click(screen.getByRole('button', { name: 'Move "stretch"' }))
    expect(screen.getByRole('button', { name: 'Record of "stretch"' }).getAttribute('aria-expanded')).toBe('false')

    // And the card still unfolds on a tap, with the drag listeners on it.
    await user.click(screen.getByRole('button', { name: 'Record of "stretch"' }))
    expect(screen.getByRole('button', { name: 'Record of "stretch"' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('offers no day after today (HAB-18)', () => {
    setup([stretch()])

    expect(screen.queryByRole('button', { name: /Sep 17/ })).toBeNull()
  })

  it('is one stop for Tab, on today, and walks by arrow key (HAB-19)', async () => {
    const habit = stretch()
    const { user, onSetDay } = setup([habit])
    const days = screen.getByRole('group', { name: /Last 52 weeks/ })

    expect(Array.from(days.querySelectorAll('button[tabindex="0"]')).map((button) => button.getAttribute('aria-label')))
      .toEqual(['Wed, Sep 16 · Not done yet'])

    screen.getByRole('button', { name: 'Wed, Sep 16 · Not done yet' }).focus()
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Tue, Sep 15 · Done')

    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Tue, Sep 8 · Not tracked')

    // Down to the Tuesday of this week, then no further: tomorrow is not a day yet.
    await user.keyboard('{ArrowRight}{ArrowDown}{ArrowDown}')
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Wed, Sep 16 · Not done yet')

    await user.keyboard('{Enter}')
    expect(onSetDay).toHaveBeenLastCalledWith(habit.id, '2026-09-16', true)
  })

  it('keeps the clock of a timed habit in its sheet, and invites a tick once the goal is reached (TIME-13)', async () => {
    const sport = setTimeGoal(createTask('sport', { kind: 'daily' }, WED_16), 60)
    const { user, onLogTime } = setup([logTime(sport, 60, WED_16), { ...sport, id: 'other', title: 'swim' }])

    expect(screen.getByRole('button', { name: 'Mark "sport" as done today: its time goal is reached' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Mark "swim" as done today' })).toBeDefined()
    expect(screen.queryByRole('button', { name: /^Time for/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Edit "swim"' }))
    const sheet = screen.getByRole('dialog', { name: 'Details of "swim"' })
    await user.click(within(sheet).getByRole('button', { name: 'Time for "swim": 0m of 1h' }))
    await user.click(screen.getByRole('button', { name: 'Log 15m' }))

    expect(onLogTime).toHaveBeenCalledWith('other', 15)
  })

  it('opens the sheet of a habit gone to from elsewhere (TIME-20)', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    const onRevealed = vi.fn()
    const habit = stretch()
    render(
      <HabitList
        {...listProps([habit, { ...habit, id: 'other', title: 'swim' }])}
        showDetails={false}
        revealId={habit.id}
        onRevealed={onRevealed}
      />,
    )

    expect(screen.getByRole('dialog', { name: 'Details of "stretch"' })).toBeDefined()
    expect(screen.queryByRole('dialog', { name: 'Details of "swim"' })).toBeNull()
    expect(scrollIntoView).toHaveBeenCalledOnce()
    expect(onRevealed).toHaveBeenCalledOnce()
  })

  it('opens the task sheet from the ⋮ without unfolding the card (HAB-25, HAB-22)', async () => {
    layOutTitle()
    const habit = stretch()
    const { user, onRename } = setup([habit])
    const edit = screen.getByRole('button', { name: 'Edit "stretch"' })
    const toggle = screen.getByRole('button', { name: 'Record of "stretch"' })

    expect(edit.getAttribute('aria-haspopup')).toBe('dialog')
    expect(edit.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await user.click(edit)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    const sheet = screen.getByRole('dialog', { name: 'Details of "stretch"' })
    expect(edit.getAttribute('aria-hidden')).toBe('true')
    await user.click(within(sheet).getByRole('button', { name: 'Edit "stretch"' }))
    const box = screen.getByRole<HTMLInputElement>('textbox', { name: 'Title of "stretch"' })
    await user.clear(box)
    await user.type(box, 'breathe{Enter}')
    expect(onRename).toHaveBeenCalledWith(habit.id, 'breathe')
  })

  it('drops the edit and closes the sheet on Escape in the title box (HAB-26)', async () => {
    layOutTitle()
    const { user, onRename } = setup([stretch()])

    await user.click(screen.getByRole('button', { name: 'Edit "stretch"' }))
    const sheet = screen.getByRole('dialog', { name: 'Details of "stretch"' })
    await user.click(within(sheet).getByRole('button', { name: 'Edit "stretch"' }))
    const box = screen.getByRole<HTMLInputElement>('textbox', { name: 'Title of "stretch"' })
    await user.clear(box)
    await user.type(box, 'breathe{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Details of "stretch"' })).toBeNull()
    expect(onRename).not.toHaveBeenCalled()
  })

  it('closes the sheet on Escape outside the title box (HAB-26)', async () => {
    const { user } = setup([stretch()])

    await user.click(screen.getByRole('button', { name: 'Edit "stretch"' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: 'Details of "stretch"' })).toBeNull()
  })
})
