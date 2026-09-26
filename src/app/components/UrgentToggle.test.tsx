// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UrgentToggle } from './UrgentToggle'

afterEach(cleanup)

describe('UrgentToggle', () => {
  it('marks a task urgent (TASK-63)', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<UrgentToggle urgent={false} onChange={onChange} label="Urgent" />)

    await user.click(screen.getByRole('button', { name: 'Urgent' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('clears the mark when it is already on', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<UrgentToggle urgent onChange={onChange} label="Urgent" />)

    expect(screen.getByRole('button', { name: 'Urgent' }).getAttribute('aria-pressed')).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Urgent' }))

    expect(onChange).toHaveBeenCalledWith(false)
  })
})
