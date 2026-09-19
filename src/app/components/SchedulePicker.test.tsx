// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LocalDay } from '../../core'
import type { SkipChoice } from '../dateChoices'
import { emptyDraft, type RepeatDraft } from '../repeatDraft'
import { SchedulePicker } from './SchedulePicker'

/* Choosing when a task is due: its day, or the rule that gives it its days. DUE and RPT ids refer to the wiki. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

interface PickerProps {
  initial?: LocalDay | null
  initialDraft?: RepeatDraft
  overdue?: boolean
  showSummary?: boolean
  skip?: SkipChoice
}

/** Holds both as a parent does, a day picked moving the draft back to Once. */
function Picker({ initial = null, initialDraft = emptyDraft(WED_16), overdue = false, showSummary, skip }: PickerProps) {
  const [dueDate, setDueDate] = useState(initial)
  const [draft, setDraft] = useState(initialDraft)
  return (
    <SchedulePicker
      dueDate={dueDate}
      draft={draft}
      now={WED_16}
      overdue={overdue}
      showSummary={showSummary}
      onChangeDueDate={(day) => {
        setDueDate(day)
        if (day !== null) setDraft({ ...draft, kind: 'once' })
      }}
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

  it('takes any other day from the date field, and stays open while it is typed (DUE-9)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Select date' }))
    fireEvent.change(screen.getByLabelText('On'), { target: { value: '2026-10-01' } })

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Oct 1')
    expect(panel()).not.toBeNull()
  })

  it('takes the day away with Remove date, which is only offered when there is one (DUE-9)', async () => {
    const user = setup({ initial: '2026-09-20' })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Remove date' }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: No date')

    await user.click(trigger())
    expect(screen.queryByRole('button', { name: 'Remove date' })).toBeNull()
  })

  it('has the menu\'s quick choices as a row of icons named by their tooltips (DUE-9, DUE-14)', async () => {
    const user = setup({ initial: '2026-09-17' })

    await user.click(trigger())

    const row = screen.getByRole('group', { name: 'Date' })
    expect(Array.from(row.querySelectorAll('button'), (button) => button.getAttribute('aria-label'))).toEqual([
      'Today',
      'Tomorrow',
      'Next week',
      'Select date',
      'Remove date',
    ])
    expect(screen.getByRole('button', { name: 'Tomorrow' }).title).toBe('Tomorrow')
  })

  it('shows the date field only once there is a day, or Select date asks for it (DUE-9)', async () => {
    const user = setup()

    await user.click(trigger())
    expect(screen.queryByLabelText('On')).toBeNull()

    await user.click(screen.getByRole('button', { name: /^Tomorrow/ }))
    await user.click(trigger())
    expect(screen.getByLabelText('On')).toHaveProperty('value', '2026-09-17')
  })

  it('puts the caret in the date field with Select date, and stays open (DUE-9)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Select date' }))

    expect(document.activeElement).toBe(screen.getByLabelText('On'))
    expect(panel()).not.toBeNull()
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

  it('spells the date out beside its icon when asked to', () => {
    render(
      <SchedulePicker
        dueDate="2026-09-16"
        draft={emptyDraft(WED_16)}
        now={WED_16}
        onChangeDueDate={vi.fn()}
        onChangeRepeat={vi.fn()}
        showSummary
      />,
    )

    expect(trigger().textContent).toBe('Today')
  })
})

describe('SchedulePicker, repeating', () => {
  it('shows the repeat icon in place of the calendar once there is a rule (DUE-13)', async () => {
    const user = setup()
    const calendar = icon()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Daily' }))

    expect(icon()).not.toBe(calendar)
    await user.click(trigger())
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

  it('says a day picked ends the repeat, marks no day and offers no Remove date (DUE-12)', async () => {
    const user = setup({ initial: '2026-09-16', initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())

    expect(screen.getByText('Picking a day ends the repeat.')).toBeDefined()
    expect(screen.getByRole('button', { name: /^Today/ })).toHaveProperty('ariaPressed', 'false')
    expect(screen.queryByRole('button', { name: 'Remove date' })).toBeNull()

    await user.click(screen.getByRole('button', { name: /^Tomorrow/ }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Tomorrow')
  })

  it('leaves out the date field, the day being the rule\'s, until Select date brings it up empty (DUE-12)', async () => {
    const user = setup({ initial: '2026-09-16', initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())
    expect(screen.queryByLabelText('On')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Select date' }))
    expect(screen.getByLabelText('On')).toHaveProperty('value', '')

    fireEvent.change(screen.getByLabelText('On'), { target: { value: '2026-10-01' } })
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Oct 1')
    expect(screen.getByLabelText('On')).toHaveProperty('value', '2026-10-01')
  })

  it('closes on Daily, having nothing more to ask, and stays open for Weekly and Monthly (RPT-22)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Weekly' }))
    expect(panel()).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(panel()).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Daily' }))
    expect(panel()).toBeNull()
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: Daily')
  })

  it('turns the rule off when the kind already chosen is chosen again (RPT-18)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'daily' } })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Daily' }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: No date')
  })

  it('clears a weekly rule when its last weekday is taken away, and closes (RPT-19)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'weekly', weekdays: [3] } })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Wednesday' }))

    expect(panel()).toBeNull()
    expect(trigger()).toHaveProperty('ariaLabel', 'Schedule: No date')

    // The day is still there for Weekly chosen again (RPT-21).
    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Weekly' }))
    expect(screen.getByRole('button', { name: 'Wednesday' })).toHaveProperty('ariaPressed', 'true')
  })

  it('offers the 31st as the last day of the month (RPT-20)', async () => {
    const user = setup({ initialDraft: { ...emptyDraft(WED_16), kind: 'monthly', monthDay: 20 } })

    await user.click(trigger())
    await user.selectOptions(screen.getByRole('combobox', { name: 'On day' }), '31/last')

    expect(screen.getByRole('option', { name: '31/last' })).toHaveProperty('selected', true)
    expect(screen.getByText('Shorter months fall back to their last day.')).toBeDefined()
  })
})
