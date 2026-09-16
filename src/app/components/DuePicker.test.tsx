// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { LocalDay } from '../../core'
import { DuePicker } from './DuePicker'

/* Choosing a day for a task. DUE ids refer to wiki/due-dates.md. */

const WED_16 = new Date(2026, 8, 16, 9, 0)

afterEach(cleanup)

function Picker({ initial = null, overdue = false }: { initial?: LocalDay | null; overdue?: boolean }) {
  const [dueDate, setDueDate] = useState(initial)
  return <DuePicker dueDate={dueDate} now={WED_16} onChange={setDueDate} overdue={overdue} />
}

function setup(props: { initial?: LocalDay | null; overdue?: boolean } = {}) {
  const user = userEvent.setup()
  render(<Picker {...props} />)
  return user
}

const trigger = () => screen.getByRole('button', { name: /^Due date:/ })
const panel = () => screen.queryByRole('dialog', { name: 'Due date' })

describe('DuePicker', () => {
  it('reads "No date" until a day is chosen (DUE-8)', () => {
    setup()

    expect(trigger()).toHaveProperty('ariaLabel', 'Due date: No date')
    expect(trigger().textContent).toBe('')
  })

  it('sets a quick choice and closes, having said everything (DUE-9)', async () => {
    const user = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: /^Tomorrow/ }))

    expect(trigger()).toHaveProperty('ariaLabel', 'Due date: Tomorrow')
    expect(panel()).toBeNull()
  })

  it('offers next week as the same weekday seven days on, and says which day that is', async () => {
    const user = setup()

    await user.click(trigger())
    const nextWeek = screen.getByRole('button', { name: /^Next week/ })
    expect(nextWeek.textContent).toContain('Wed, Sep 23')

    await user.click(nextWeek)
    expect(trigger().textContent).toBe('Sep 23')
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
    fireEvent.change(screen.getByLabelText('On'), { target: { value: '2026-10-01' } })

    expect(trigger()).toHaveProperty('ariaLabel', 'Due date: Oct 1')
    expect(panel()).not.toBeNull()
  })

  it('takes the day away with No date, which is only offered when there is one (DUE-9)', async () => {
    const user = setup({ initial: '2026-09-20' })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'No date' }))
    expect(trigger()).toHaveProperty('ariaLabel', 'Due date: No date')

    await user.click(trigger())
    expect(screen.queryByRole('button', { name: 'No date' })).toBeNull()
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

    expect(trigger()).toHaveProperty('ariaLabel', 'Due date: Sep 14, overdue')
  })
})
