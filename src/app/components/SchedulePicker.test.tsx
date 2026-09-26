// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { firstDueDay, type LocalDay, type LocalTime } from '../../core'
import type { SkipChoice } from '../dateChoices'
import { emptyDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { SchedulePicker } from './SchedulePicker'

/* Choosing when a task is due: its day, or the rule that gives it its days. DUE and RPT ids refer to the wiki. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

interface PickerProps {
  initial?: LocalDay | null
  initialTime?: LocalTime | null
  initialDraft?: RepeatDraft
  overdue?: boolean
  showSummary?: boolean
  skip?: SkipChoice
}

/** Holds both as a parent does: the day is the task's date, or where its rule starts. */
function Picker({
  initial = null,
  initialTime = null,
  initialDraft = emptyDraft(WED_16),
  overdue = false,
  showSummary,
  skip,
}: PickerProps) {
  const [day, setDay] = useState(initial)
  const [time, setTime] = useState(initialTime)
  const [draft, setDraft] = useState(initialDraft)
  const repeat = toRepeat(draft)
  return (
    <SchedulePicker
      dueDate={repeat === null || day === null ? day : firstDueDay(repeat, day)}
      startDay={repeat === null ? null : day}
      draft={draft}
      now={WED_16}
      overdue={overdue}
      showSummary={showSummary}
      onChangeDay={setDay}
      dueTime={time}
      onChangeTime={setTime}
      onChangeRepeat={setDraft}
      skip={skip}
    />
  )
}

function setup(props: PickerProps = {}) {
  const user = userEvent.setup()
  render(<Picker {...props} />)
  return user
}

const trigger = () => screen.getByRole('button', { name: /^Schedule:/ })
const panel = () => screen.queryByRole('dialog', { name: 'Schedule' })
const icon = () => trigger().querySelector('svg')?.innerHTML ?? ''
/** The lines the hour and the rule sit behind, each reading what it holds (DUE-23). */
const timeRow = () => screen.getByRole('button', { name: /^Time:/ })
const repeatRow = () => screen.getByRole('button', { name: /^Repeat:/ })

describe('SchedulePicker', () => {
  it('reads "No date" until a day is chosen (DUE-8)', () => {
    setup()

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: No date')
    expect(trigger().textContent).toBe('')
  })

  it('sets a quick choice and closes, having said everything (DUE-9)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: /^Tomorrow/ }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Tomorrow')
    expect(panel()).toBeNull()
  })

  it('offers next week as the Sunday that closes it, and says which day that is (DUE-9)', async () => {
    const user = setup()

    await user.click(trigger())
    const nextWeek = screen.getByRole('button', { name: /^Next week/ })
    expect(nextWeek.title).toBe('Next week · Sep 27')

    await user.click(nextWeek)
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Sep 27')
  })

  it('marks the quick choice that is already set', async () => {
    const user = setup({ initial: '2026-09-16' })

    await user.click(trigger())

    expect(screen.getByRole('button', { name: /^Today/ })).toHaveProperty('ariaPressed', 'true')
    expect(screen.getByRole('button', { name: /^Tomorrow/ })).toHaveProperty('ariaPressed', 'false')
  })

  it('picks any other day from the calendar in one click, and closes (DUE-9, DUE-15)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    await user.click(screen.getByRole('button', { name: 'Thursday, October 1, 2026' }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Oct 1')
    expect(panel()).toBeNull()
  })

  it('takes the day away with Remove date, which is only offered when there is one (DUE-9)', async () => {
    const user = setup({ initial: '2026-09-20' })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Remove date' }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: No date')

    await user.click(trigger())
    expect(screen.queryByRole('button', { name: 'Remove date' })).toBeNull()
  })

  it('has the menu\'s quick choices as a row of icons named by their tooltips, less Select date (DUE-9, DUE-14)', async () => {
    const user = setup({ initial: '2026-09-17' })

    await user.click(trigger())

    const row = screen.getByRole('group', { name: 'Date' })
    expect(Array.from(row.querySelectorAll('button'), (button) => button.getAttribute('aria-label'))).toEqual([
      'Today',
      'Tomorrow',
      'Next week',
      'Remove date',
    ])
    expect(screen.getByRole('button', { name: 'Tomorrow' }).title).toBe('Tomorrow')
  })

  it('opens the calendar on today\'s month with no day, nothing marked chosen (DUE-15)', async () => {
    const user = setup()

    await user.click(trigger())

    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeDefined()
    expect(screen.queryAllByRole('gridcell', { selected: true })).toEqual([])
  })

  it('opens the calendar on the month of the task\'s day, marking it chosen (DUE-15)', async () => {
    const user = setup({ initial: '2026-11-05' })

    await user.click(trigger())

    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeDefined()
    expect(screen.getByRole('gridcell', { selected: true }).textContent).toBe('5')
  })

  it('skips a repeating task\'s occurrence where it has one, and closes (RPT-34)', async () => {
    const onSkip = vi.fn()
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'daily' }, skip: { to: '2026-09-17', onSkip } })

    await user.click(trigger())
    const skip = screen.getByRole('button', { name: 'Skip occurrence' })
    expect(skip.title).toBe('Skip to Sep 17')

    await user.click(skip)

    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(panel()).toBeNull()
  })

  it('offers no skip where there is nothing to skip (RPT-34)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())

    expect(screen.queryByRole('button', { name: 'Skip occurrence' })).toBeNull()
  })

  it('closes on Escape and on a click outside', async () => {
    const user = setup()

    await user.click(trigger())
    await user.keyboard('{Escape}')
    expect(panel()).toBeNull()

    await user.click(trigger())
    await user.click(document.body)
    expect(panel()).toBeNull()
  })

  it('says a day gone by is overdue (DUE-10)', () => {
    setup({ initial: '2026-09-14', overdue: true })

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Sep 14, overdue')
  })

  it('spells the date out beside its icon when asked to, staying content-sized (DUE-4)', () => {
    render(
      <SchedulePicker
        dueDate="2026-09-16"
        draft={emptyDraft(WED_16)}
        now={WED_16}
        onChangeDay={vi.fn()}
        onChangeTime={vi.fn()}
        onChangeRepeat={vi.fn()}
        showSummary
      />,
    )

    expect(trigger().textContent).toBe('Today')
    expect(trigger().className).not.toMatch(/\bw-full\b/)
  })
})

describe('SchedulePicker, repeating', () => {
  it('shows the repeat icon in place of the calendar once there is a rule (DUE-13)', async () => {
    const user = setup()
    const calendar = icon()

    await user.click(trigger())
    await user.click(repeatRow())
    await user.click(screen.getByRole('button', { name: 'Daily' }))

    expect(icon()).not.toBe(calendar)
    await user.click(repeatRow())
    await user.click(screen.getByRole('button', { name: 'Daily' }))
    expect(icon()).toBe(calendar)
  })

  it('names the rule with the day it gives, and is tinted even with no day in play yet (DUE-12)', () => {
    setup({ initial: '2026-09-16', initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Daily · Today')
    cleanup()

    setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'monthly', monthDay: 20 } })
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Every 20th')
    expect(trigger().className).toContain('text-blue-600')
  })

  it('leaves "every" to the repeat icon beside the words, and says it in full to a screen reader (RPT-24)', () => {
    setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'monthly', monthDay: 20 }, showSummary: true })

    expect(trigger().textContent).toBe('20th')
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Every 20th')
    expect(trigger().getAttribute('title')).toBe('Every 20th')
  })

  it('says a day picked starts the repeat, and keeps the rule when one is picked (DUE-18)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())

    // Each day says it in its own tooltip, which is all the menu and the row's strip have.
    expect(screen.getByRole('button', { name: /^Today/ }).title).toBe('Today · Starts the repeat')
    expect(screen.getByRole('button', { name: /^Next week/ }).title).toBe('Next week · Sep 27 · Starts the repeat')

    await user.click(screen.getByRole('button', { name: /^Tomorrow/ }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Daily · Tomorrow')
  })

  it('marks the day its rule starts on, and takes that day away again (DUE-18)', async () => {
    const user = setup({ initial: '2026-09-16', initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())
    expect(screen.getByRole('button', { name: /^Today/ })).toHaveProperty('ariaPressed', 'true')
    expect(screen.getByRole('gridcell', { selected: true }).textContent).toBe('16')

    // The rule stays, so what goes is the day it was told to start on.
    await user.click(screen.getByRole('button', { name: 'Remove start date' }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Daily')
  })

  it('starts the rule on a day picked in the calendar, the rule saying which day is due (DUE-18)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'weekly', weekdays: [1] } })

    await user.click(trigger())

    // Every day in the grid says what picking it does, the note above being out of
    // the way once the eye is on the calendar.
    expect(screen.getByRole('button', { name: 'Friday, September 25, 2026' }).title).toBe('Starts the repeat')

    // Started on the Friday, a Monday rule is first due on the Monday after it.
    await user.click(screen.getByRole('button', { name: 'Friday, September 25, 2026' }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Every Mon · Sep 28')
  })

  it('leaves a one-off\'s calendar days without a tooltip, there being nothing to warn of (DUE-15)', async () => {
    const user = setup({ initial: '2026-09-16' })

    await user.click(trigger())

    expect(screen.getByRole('button', { name: 'Friday, September 25, 2026' }).title).toBe('')
  })

  it('hands the panel back on Daily, having nothing more to ask, and stays for Weekly and Monthly (RPT-22)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(repeatRow())
    await user.click(screen.getByRole('button', { name: 'Weekly' }))
    expect(screen.getByRole('group', { name: 'Repeat on' })).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(screen.getByRole('combobox', { name: 'On day' })).toBeDefined()

    // Daily leaves nothing more to choose, so the day is what is in front of you again.
    await user.click(screen.getByRole('button', { name: 'Daily' }))
    expect(repeatRow()).toHaveProperty('ariaLabel', 'Repeat: Daily')
    expect(panel()).not.toBeNull()
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Daily')
  })

  it('turns the rule off when the kind already chosen is chosen again (RPT-18)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())
    await user.click(repeatRow())
    await user.click(screen.getByRole('button', { name: 'Daily' }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: No date')
  })

  it('clears a weekly rule when its last weekday is taken away (RPT-19)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'weekly', weekdays: [3] } })

    await user.click(trigger())
    await user.click(repeatRow())
    await user.click(screen.getByRole('button', { name: 'Wednesday' }))

    expect(repeatRow()).toHaveProperty('ariaLabel', 'Repeat: Once')
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: No date')

    // The day is still there for Weekly chosen again (RPT-21).
    await user.click(repeatRow())
    await user.click(screen.getByRole('button', { name: 'Weekly' }))
    expect(screen.getByRole('button', { name: 'Wednesday' })).toHaveProperty('ariaPressed', 'true')
  })

  it('offers the 31st as the last day of the month (RPT-20)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'monthly', monthDay: 20 } })

    await user.click(trigger())
    await user.click(repeatRow())
    await user.selectOptions(screen.getByRole('combobox', { name: 'On day' }), '31/last')

    expect(screen.getByRole('option', { name: '31/last' })).toHaveProperty('selected', true)
    expect(screen.getByText('Shorter months fall back to their last day.')).toBeDefined()
  })
})

describe('the hour a task is due at', () => {
  const timeField = () => screen.getByLabelText('Time of day')

  it('waits for a day to hang on before offering an hour (DUE-19, DUE-21)', async () => {
    const user = setup()
    await user.click(trigger())

    // The line says why rather than opening on hours that would go nowhere.
    expect(timeRow()).toHaveProperty('ariaLabel', 'Time: Pick a day first')
    expect(timeRow()).toHaveProperty('disabled', true)
    expect(timeRow().title).toBe('Pick a day above, and you can set a time on it.')
    expect(screen.queryByRole('button', { name: /^Morning/ })).toBeNull()
  })

  it('offers hours once the task has a day, and sets one at a click (DUE-19)', async () => {
    const user = setup({ initial: '2026-09-16', showSummary: true })
    await user.click(trigger())
    await user.click(timeRow())
    await user.click(screen.getByRole('button', { name: 'Morning, 9:00 AM' }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Today at 9:00 AM')
    expect(trigger().textContent).toBe('Today at 9:00 AM')
  })

  it('hands the panel back with the hour set on its line, the day still there (DUE-20, DUE-23)', async () => {
    const user = setup({ initial: '2026-09-16' })
    await user.click(trigger())
    await user.click(timeRow())
    await user.click(screen.getByRole('button', { name: 'Evening, 6:00 PM' }))

    expect(panel()).not.toBeNull()
    expect(timeRow()).toHaveProperty('ariaLabel', 'Time: 6:00 PM')
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeDefined()
  })

  it('takes the hour back off, leaving the day (DUE-19)', async () => {
    const user = setup({ initial: '2026-09-16', initialTime: '09:00', showSummary: true })
    await user.click(trigger())
    await user.click(timeRow())
    await user.click(screen.getByRole('button', { name: 'Remove time' }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Today')
  })

  it('offers an hour on a repeating task with no day picked, its rule giving it days (DUE-19)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })
    await user.click(trigger())
    await user.click(timeRow())
    await user.click(screen.getByRole('button', { name: 'Midday, 12:00 PM' }))

    expect(timeRow()).toHaveProperty('ariaLabel', 'Time: 12:00 PM')
  })

  it('reads the hour with the day a rule gives the task (DUE-19)', async () => {
    const user = setup({
      initial: '2026-09-16',
      initialDraft: { ...emptyDraft(WED_16), kind: 'daily' },
      showSummary: true,
    })
    await user.click(trigger())
    await user.click(timeRow())
    await user.click(screen.getByRole('button', { name: 'Midday, 12:00 PM' }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Daily · Today at 12:00 PM')
  })

  it('takes an hour typed into the clock field, staying for the rest of it (DUE-19)', async () => {
    const user = setup({ initial: '2026-09-16', showSummary: true })
    await user.click(trigger())
    await user.click(timeRow())
    await user.clear(timeField())
    await user.type(timeField(), '07:45')

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Today at 7:45 AM')
  })
})

describe('the schedule panel, one screenful (DUE-23)', () => {
  it('keeps the hour and the rule to a line each, reading what each holds', async () => {
    const user = setup({ initial: '2026-09-16', initialTime: '09:00', initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())

    // The day is what is on show; the two that hang off it say where they are.
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeDefined()
    expect(timeRow()).toHaveProperty('ariaLabel', 'Time: 9:00 AM')
    expect(repeatRow()).toHaveProperty('ariaLabel', 'Repeat: Daily')
    expect(screen.queryByRole('button', { name: 'Weekly' })).toBeNull()
  })

  it('reads an empty line as what there would be, not as a blank', async () => {
    const user = setup({ initial: '2026-09-16' })

    await user.click(trigger())

    expect(timeRow()).toHaveProperty('ariaLabel', 'Time: Any time')
    expect(repeatRow()).toHaveProperty('ariaLabel', 'Repeat: Once')
  })

  it('takes the hour and the rule away from their lines, without opening either', async () => {
    const user = setup({ initial: '2026-09-16', initialTime: '09:00', initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Remove time' }))
    expect(timeRow()).toHaveProperty('ariaLabel', 'Time: Any time')

    await user.click(screen.getByRole('button', { name: 'Remove repeat' }))
    expect(repeatRow()).toHaveProperty('ariaLabel', 'Repeat: Once')
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Today')

    // Nothing to take away is nothing to offer.
    expect(screen.queryByRole('button', { name: 'Remove time' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remove repeat' })).toBeNull()
  })

  it('steps back out of a group on Escape before closing the panel itself', async () => {
    const user = setup({ initial: '2026-09-16' })

    await user.click(trigger())
    await user.click(repeatRow())
    expect(screen.getByRole('button', { name: 'Weekly' })).toBeDefined()

    await user.keyboard('{Escape}')
    expect(panel()).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Weekly' })).toBeNull()

    await user.keyboard('{Escape}')
    expect(panel()).toBeNull()
  })

  it('puts the focus on the way back in, and on the line it came from on the way out', async () => {
    const user = setup({ initial: '2026-09-16' })

    await user.click(trigger())
    await user.click(repeatRow())
    const back = screen.getByRole('button', { name: 'Back from repeat' })
    expect(document.activeElement).toBe(back)

    await user.click(back)
    expect(document.activeElement).toBe(repeatRow())
  })
})
