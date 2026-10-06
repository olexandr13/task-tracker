// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CASES, type CaseSettings } from '../../core'
import { CasesSettingsCard } from './CasesSettingsCard'

/* What Cases asks of a day and plays for. CHST ids refer to wiki/cases.md. */

afterEach(() => {
  cleanup()
})

function setup(settings: CaseSettings = DEFAULT_CASES, jackpot = 20) {
  const onChange = vi.fn()
  render(<CasesSettingsCard settings={settings} jackpot={jackpot} onChange={onChange} />)
  return { user: userEvent.setup(), onChange }
}

describe('how many tasks a day must ask for', () => {
  it('steps up and down, saving each step as it is made (CHST-3)', async () => {
    const { user, onChange } = setup({ leastTasks: 2, countUnpaid: true })

    await user.click(screen.getByRole('button', { name: 'One task more' }))
    expect(onChange).toHaveBeenLastCalledWith({ leastTasks: 3, countUnpaid: true })

    await user.click(screen.getByRole('button', { name: 'One task fewer' }))
    expect(onChange).toHaveBeenLastCalledWith({ leastTasks: 1, countUnpaid: true })
  })

  it('stops at one, there being no day of no tasks to clear', async () => {
    const { user, onChange } = setup({ leastTasks: 1, countUnpaid: true })

    await user.click(screen.getByRole('button', { name: 'One task fewer' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('saves a number as it is typed, and leaves one it cannot use unsaved (RWD-6)', async () => {
    const { user, onChange } = setup({ leastTasks: 1, countUnpaid: true })
    const box = screen.getByRole('spinbutton', { name: 'Tasks a day must ask for' })

    await user.clear(box)
    await user.type(box, '4')
    expect(onChange).toHaveBeenLastCalledWith({ leastTasks: 4, countUnpaid: true })

    onChange.mockClear()
    await user.clear(box)
    await user.type(box, '0')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('puts a box left saying nothing it can use back to what is saved (RWD-6)', async () => {
    const { user } = setup({ leastTasks: 3, countUnpaid: true })
    const box = screen.getByRole('spinbutton', { name: 'Tasks a day must ask for' })

    await user.clear(box)
    await user.tab()

    expect((box as HTMLInputElement).value).toBe('3')
  })
})

describe('what the key plays for', () => {
  it('says how each case is worked out, and what today has earned so far (CHST-7, CHST-10)', () => {
    setup({ leastTasks: 1, countUnpaid: true }, 25)

    expect(screen.getByText(/cheapest task finished today/)).toBeTruthy()
    expect(screen.getByText(/average points of yesterday’s tasks/)).toBeTruthy()
    expect(screen.getByText(/cheapest task finished last week/)).toBeTruthy()
    expect(screen.getByText('Earned today: 25 points.')).toBeTruthy()
    // A fact rather than a choice: nothing to pick.
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })

  it('names only tasks with points while tasks without them are not counted, set on Settings (CHST-32)', async () => {
    const { user, onChange } = setup({ leastTasks: 2, countUnpaid: false })

    expect(screen.queryByText(/without points/)).toBeNull()
    expect(screen.getByText(/plus 1 for each task finished yesterday with points/)).toBeTruthy()

    // Stepping how big a day must be leaves counting as it was.
    await user.click(screen.getByRole('button', { name: 'One task more' }))
    expect(onChange).toHaveBeenLastCalledWith({ leastTasks: 3, countUnpaid: false })
  })
})
