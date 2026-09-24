// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModesBackLink } from './ModesBackLink'

/* The way back from a mode's page on a phone. MODE ids refer to wiki/modes.md. */

afterEach(cleanup)

describe('ModesBackLink', () => {
  it('goes back to the list of the modes (MODE-7)', async () => {
    const onBack = vi.fn()
    render(<ModesBackLink onBack={onBack} />)

    const link = screen.getByRole('button', { name: 'Back to Modes' })
    expect(link.textContent).toContain('Modes')

    await userEvent.click(link)
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('is a phone\'s alone, a wide screen listing the modes in the sidebar (MODE-7)', () => {
    render(<ModesBackLink onBack={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Back to Modes' }).className).toContain('md:hidden')
  })
})
