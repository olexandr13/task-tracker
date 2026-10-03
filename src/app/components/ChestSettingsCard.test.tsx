// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHEST, type ChestSettings } from '../../core'
import { ChestSettingsCard } from './ChestSettingsCard'

/* What the chest asks of a day and plays for. CHST ids refer to wiki/chest.md. */

afterEach(() => {
  cleanup()
})

function setup(settings: ChestSettings = DEFAULT_CHEST, jackpot = 20) {
  const onChange = vi.fn()
  render(<ChestSettingsCard settings={settings} jackpot={jackpot} onChange={onChange} />)
  return { user: userEvent.setup(), onChange }
}

describe('how many tasks a day must ask for', () => {
  it('steps up and down, saving each step as it is made (CHST-3)', async () => {
    const { user, onChange } = setup({ leastTasks: 2 })

    await user.click(screen.getByRole('button', { name: 'One task more' }))
    expect(onChange).toHaveBeenLastCalledWith({ leastTasks: 3 })

    await user.click(screen.getByRole('button', { name: 'One task fewer' }))
    expect(onChange).toHaveBeenLastCalledWith({ leastTasks: 1 })
  })

  it('stops at one, there being no day of no tasks to clear', async () => {
    const { user, onChange } = setup({ leastTasks: 1 })

    await user.click(screen.getByRole('button', { name: 'One task fewer' }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('saves a number as it is typed, and leaves one it cannot use unsaved (RWD-6)', async () => {
    const { user, onChange } = setup({ leastTasks: 1 })
    const box = screen.getByRole('spinbutton', { name: 'Tasks a day must ask for' })

    await user.clear(box)
    await user.type(box, '4')
    expect(onChange).toHaveBeenLastCalledWith({ leastTasks: 4 })

    onChange.mockClear()
    await user.clear(box)
    await user.type(box, '0')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('puts a box left saying nothing it can use back to what is saved (RWD-6)', async () => {
    const { user } = setup({ leastTasks: 3 })
    const box = screen.getByRole('spinbutton', { name: 'Tasks a day must ask for' })

    await user.clear(box)
    await user.tab()

    expect((box as HTMLInputElement).value).toBe('3')
  })
})

describe('what the key plays for', () => {
  it('says it is everything earned today, and what that comes to so far (CHST-7)', () => {
    setup({ leastTasks: 1 }, 25)

    expect(screen.getByText(/everything you earned today/)).toBeTruthy()
    expect(screen.getByText('Today the most is 25 points.')).toBeTruthy()
    // A fact rather than a choice: nothing to pick.
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
  })
})
