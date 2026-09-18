// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeTask, createTask, logTime, setTimeGoal, type Task } from '../../core'
import { HabitList } from './HabitList'

/* What the habits page shows and does. HAB ids refer to wiki/habits.md. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

function setup(habits: Task[]) {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  const onUncomplete = vi.fn()
  const onSetDay = vi.fn()
  const onLogTime = vi.fn()
  render(
    <HabitList
      habits={habits}
      now={WED_16}
      onComplete={onComplete}
      onUncomplete={onUncomplete}
      onSetDay={onSetDay}
      onChangeTimeGoal={vi.fn()}
      onLogTime={onLogTime}
      onRemoveTimeEntry={vi.fn()}
    />,
  )
  return { user, onComplete, onUncomplete, onSetDay, onLogTime }
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
    expect(onComplete).toHaveBeenCalledWith(habit.id)

    cleanup()
    const second = setup([completeTask(habit, WED_16)])
    await second.user.click(screen.getByRole('button', { name: 'Mark "stretch" as not done today' }))
    expect(second.onUncomplete).toHaveBeenCalledWith(habit.id)
  })

  it('reads the streak and the record out as text (HAB-11)', () => {
    setup([stretch()])

    expect(screen.getByRole('heading', { name: 'stretch' })).toBeTruthy()
    expect(screen.getAllByText('2 days')).toHaveLength(2)
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

  it('on a phone, folds a card to its streak and unfolds its record on a tap (HAB-21, HAB-22)', async () => {
    const { user, onComplete } = setup([stretch()])
    const toggle = screen.getByRole('button', { name: 'Record of "stretch"' })

    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Current streak:').parentElement?.textContent).toBe('Current streak: 2')
    const record = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    expect(record?.contains(screen.getByRole('group', { name: /Last 52 weeks/ }))).toBe(true)

    // Ticking off is not asking for the record.
    await user.click(screen.getByRole('button', { name: 'Mark "stretch" as done today' }))
    expect(onComplete).toHaveBeenCalled()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    // The streak is in the record now, so the line no longer repeats it.
    expect(screen.queryByText('Current streak:')).toBeNull()

    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
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

  it('has no clock on a habit without a time goal', () => {
    setup([stretch()])

    expect(screen.queryByRole('button', { name: /^Time for/ })).toBeNull()
  })

  it('puts the clock of a timed habit on its card, and invites a tick once the goal is reached (TIME-13)', async () => {
    const sport = setTimeGoal(createTask('sport', { kind: 'daily' }, WED_16), 60)
    const { user, onLogTime } = setup([logTime(sport, 60, WED_16), { ...sport, id: 'other', title: 'swim' }])

    expect(screen.getByRole('button', { name: 'Mark "sport" as done today: its time goal is reached' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Mark "swim" as done today' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Time for "swim": 0m of 1h' }).textContent).toBe('0m of 1h')

    await user.click(screen.getByRole('button', { name: 'Time for "swim": 0m of 1h' }))
    await user.click(screen.getByRole('button', { name: 'Log 15m' }))

    expect(onLogTime).toHaveBeenCalledWith('other', 15)
  })
})
