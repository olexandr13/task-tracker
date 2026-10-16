// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { UpLink } from './UpLink'

/* The link back atop a goal's or a tag's tasks. UI ids refer to wiki/interface.md. */

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('UpLink (UI-85)', () => {
  it('names the page it goes back to, and says it goes back to a screen reader', () => {
    render(<UpLink to="goals" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Back to Goals' })).toBeDefined()
  })

  it('goes back to that page', async () => {
    const onChange = vi.fn()
    render(<UpLink to="tags" onChange={onChange} />)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Back to Tags' }))

    expect(onChange).toHaveBeenCalledWith('tags')
  })
})
