// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createActivityEntry, DEFAULT_CHECK_IN_WINDOW, type ActivityEntry, type HourSlot } from '../../core'
import type { ModeState } from '../modes'
import { ActivityPage } from './ActivityPage'

/* The activity log. ACT ids refer to wiki/activity-log.md. */

afterEach(cleanup)

// Friday 2 October 2026, twenty past three in the afternoon.
const NOW = new Date(2026, 9, 2, 15, 20)
const AT = new Date(2026, 9, 2, 15, 0)

const CHECK_IN: ModeState = {
  view: 'modes/check-in',
  on: false,
  status: { state: 'Disabled', detail: null },
  blocked: null,
  toggle: vi.fn(),
}

function entry(activity: string, minutes: number, slot: HourSlot): ActivityEntry {
  return createActivityEntry(activity, minutes * 60, slot, AT)
}

function setUp({ entries = [] as readonly ActivityEntry[], initialSlot = null as HourSlot | null } = {}) {
  const handlers = { onAdd: vi.fn(), onChange: vi.fn(), onRemove: vi.fn(), onOpenCheckIn: vi.fn() }
  render(
    <ActivityPage
      entries={entries}
      window={DEFAULT_CHECK_IN_WINDOW}
      now={NOW}
      checkIn={CHECK_IN}
      initialSlot={initialSlot}
      {...handlers}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

const activityBox = () => screen.getByRole('combobox')
const durationBox = () => screen.getByRole('textbox', { name: /^How long/ })
const hours = () => [...screen.getByRole('list', { name: 'Hours' }).children] as HTMLElement[]
const hourRow = (hour: string) => hours().find((row) => row.textContent?.startsWith(hour)) as HTMLElement
const title = () => screen.getByText(/^(Today|Yesterday|This week|Last week|This month|\w{3}, \w{3} \d+)$/)

describe('adding to the log (ACT-2 to ACT-6)', () => {
  it('logs what was done and how long under the hour just gone, minutes unless hours are written', async () => {
    const { user, onAdd } = setUp()

    expect(activityBox().getAttribute('placeholder')).toBe('What did you do 14:00–15:00?')
    await user.type(activityBox(), 'Reading{Enter}')
    expect(document.activeElement).toBe(durationBox())
    await user.type(durationBox(), '1h 20m{Enter}')

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('Reading', 4800, { day: '2026-10-02', hour: 14 })
    expect((activityBox() as HTMLInputElement).value).toBe('')
    await user.type(activityBox(), 'Work')
    await user.type(durationBox(), '15')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenLastCalledWith('Work', 900, { day: '2026-10-02', hour: 14 })
  })

  it('refuses in place, saying why, and keeps what was typed (ACT-3, ACT-6)', async () => {
    const { user, onAdd } = setUp()

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByRole('alert').textContent).toBe('Type what you did first.')

    await user.type(activityBox(), 'Work')
    await user.type(durationBox(), 'soon{Enter}')
    expect(screen.getByRole('alert').textContent).toContain('That isn’t a length of time.')

    await user.clear(durationBox())
    await user.type(durationBox(), '25h{Enter}')
    expect(screen.getByRole('alert').textContent).toBe('One record can be at most 24 hours.')
    expect((activityBox() as HTMLInputElement).value).toBe('Work')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('takes the hour picked in the list, and refuses one that has not started (ACT-5)', async () => {
    // Logged ahead of this device's clock — on another device, say — so the hour is listed.
    const ahead = entry('Call', 20, { day: '2026-10-02', hour: 17 })
    const { user, onAdd } = setUp({ entries: [ahead] })

    await user.click(screen.getByRole('button', { name: 'Log into 12:00–13:00', pressed: false }))
    expect(activityBox().getAttribute('placeholder')).toBe('What did you do 12:00–13:00?')
    await user.type(activityBox(), 'Lunch')
    await user.type(durationBox(), '40{Enter}')
    expect(onAdd).toHaveBeenCalledExactlyOnceWith('Lunch', 2400, { day: '2026-10-02', hour: 12 })

    await user.click(screen.getByRole('button', { name: 'Log into 17:00–18:00', pressed: false }))
    await user.type(activityBox(), 'Call')
    await user.type(durationBox(), '10{Enter}')
    expect(screen.getByRole('alert').textContent).toBe('That hour hasn’t started yet.')
    expect(onAdd).toHaveBeenCalledOnce()
  })

  it('offers the activities used before, picked with the arrows (ACT-4)', async () => {
    const { user, onAdd } = setUp({
      entries: [entry('Work', 60, { day: '2026-10-02', hour: 9 }), entry('Reading', 15, { day: '2026-10-02', hour: 10 })],
    })

    await user.click(activityBox())
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Reading', 'Work'])

    await user.type(activityBox(), 'wo')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Work'])
    await user.keyboard('{ArrowDown}{Enter}')
    expect((activityBox() as HTMLInputElement).value).toBe('Work')
    expect(document.activeElement).toBe(durationBox())

    await user.type(durationBox(), '30{Enter}')
    expect(onAdd).toHaveBeenCalledWith('Work', 1800, { day: '2026-10-02', hour: 14 })
  })

  it('opens on the hour a check-in asked about (CHECKIN-4)', () => {
    setUp({ initialSlot: { day: '2026-10-02', hour: 11 } })

    expect(activityBox().getAttribute('placeholder')).toBe('What did you do 11:00–12:00?')
    expect(within(hourRow('11:00')).getByRole('button', { name: 'Log into 11:00–12:00', pressed: true })).toBeDefined()
  })
})

describe('the day (ACT-7 to ACT-11)', () => {
  const work = entry('Work', 45, { day: '2026-10-02', hour: 9 })
  const reading = entry('Reading', 15, { day: '2026-10-02', hour: 9 })
  const late = entry('Work', 80, { day: '2026-10-02', hour: 10 })

  it('lists the hours meant to be logged up to now, each with what is under it, and its total', () => {
    setUp({ entries: [work, reading, late] })

    expect(hours().map((row) => row.textContent?.slice(0, 5))).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'])
    expect(hourRow('09:00').textContent).toContain('Work 45m')
    expect(hourRow('09:00').textContent).toContain('Reading 15m')
    expect(hourRow('09:00').textContent).toContain('1h')
    // An hour logged past its length says how far past.
    expect(hourRow('10:00').textContent).toContain('+20m')
    expect(hourRow('11:00').textContent).toContain('not logged')
  })

  it('points the form at an hour pressed', async () => {
    const { user } = setUp()

    await user.click(within(hourRow('11:00')).getByRole('button', { name: 'Log into 11:00–12:00', pressed: false }))

    expect(activityBox().getAttribute('placeholder')).toBe('What did you do 11:00–12:00?')
    expect(document.activeElement).toBe(activityBox())
  })

  it('changes a record pressed, in the form (ACT-10)', async () => {
    const { user, onChange } = setUp({ entries: [work] })

    await user.click(screen.getByRole('button', { name: 'Change “Work 45m”' }))
    expect(screen.getByRole('region', { name: 'Change a record' })).toBeDefined()
    expect((activityBox() as HTMLInputElement).value).toBe('Work')
    expect((durationBox() as HTMLInputElement).value).toBe('45m')

    await user.clear(durationBox())
    await user.type(durationBox(), '50{Enter}')
    expect(onChange).toHaveBeenCalledExactlyOnceWith(work.id, { activity: 'Work', seconds: 3000, hour: 9 })
    expect(screen.getByRole('region', { name: 'Add to the log' })).toBeDefined()
  })

  it('moves a record being changed to another hour pressed (ACT-10)', async () => {
    const { user, onChange } = setUp({ entries: [work] })

    await user.click(screen.getByRole('button', { name: 'Change “Work 45m”' }))
    expect(screen.getByText('Change “Work 45m” · 09:00–10:00')).toBeDefined()
    expect(screen.getByText('Press another hour to move it.')).toBeDefined()

    await user.click(within(hourRow('11:00')).getByRole('button', { name: 'Log into 11:00–12:00', pressed: false }))
    expect(screen.getByText('Change “Work 45m” · 11:00–12:00')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(work.id, { activity: 'Work', seconds: 2700, hour: 11 })
  })

  it('deletes a record from its × or from the form (ACT-11)', async () => {
    const { user, onRemove } = setUp({ entries: [work] })

    await user.click(screen.getByRole('button', { name: 'Delete “Work 45m”' }))
    expect(onRemove).toHaveBeenCalledExactlyOnceWith(work)

    await user.click(screen.getByRole('button', { name: 'Change “Work 45m”' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onRemove).toHaveBeenCalledTimes(2)
  })
})

describe('what it adds up to (ACT-12 to ACT-18)', () => {
  const yesterday = entry('Work', 60, { day: '2026-10-01', hour: 9 })
  const today = entry('Reading', 30, { day: '2026-10-02', hour: 9 })

  it('opens on today, with how much of it is logged and the streak', () => {
    setUp({ entries: [today] })

    expect(title().textContent).toBe('Today')
    expect(screen.getByText('1 of 6 hours logged so far · No streak yet')).toBeDefined()
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Time spent today, 30m: Reading 30m, 100%')
  })

  it('steps back a day at a time, and no further on than today', async () => {
    const { user } = setUp({ entries: [yesterday, today] })

    expect(screen.getByRole('button', { name: 'The day after' }).className).toContain('invisible')
    await user.click(screen.getByRole('button', { name: 'The day before' }))
    expect(title().textContent).toBe('Yesterday')
    expect(screen.getByText('1 of 13 hours logged · No streak yet')).toBeDefined()
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Time spent yesterday, 1h: Work 1h, 100%')
  })

  it('reads a week day by day, and opens a day pressed (ACT-14)', async () => {
    const { user } = setUp({ entries: [yesterday, today] })

    await user.click(screen.getByRole('radio', { name: 'Week' }))
    expect(title().textContent).toBe('This week')
    expect(screen.getByText('0 of 5 days logged in full · No streak yet')).toBeDefined()

    const days = within(screen.getByRole('region', { name: 'By day' })).getAllByRole('button')
    expect(days.map((day) => day.getAttribute('aria-label'))).toContain('Thu, Oct 1 · 1h: Work 1h')

    await user.click(days[3])
    expect(title().textContent).toBe('Yesterday')
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveProperty('checked', true)
  })

  it('says when nothing is logged in the period', async () => {
    const { user } = setUp()

    await user.click(screen.getByRole('radio', { name: 'Month' }))
    expect(screen.getByText('Nothing logged this month.')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'The month before' }))
    expect(screen.getByText('Nothing logged in September 2026.')).toBeDefined()
  })
})
