// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../storage/authService'
import { AccountMenu } from './AccountMenu'

/* The signed-in account at the end of the heading. AUTH ids refer to wiki/account.md. */

afterEach(cleanup)

const ADA: Account = {
  id: 'uid-ada',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  photoUrl: 'https://example.com/ada.png',
}

function setup(account: Account = ADA) {
  const user = userEvent.setup()
  const onSignOut = vi.fn()
  const { container } = render(<AccountMenu account={account} onSignOut={onSignOut} />)
  return { user, onSignOut, container }
}

const trigger = () => screen.getByRole('button', { name: /^Account:/ })
const panel = () => screen.queryByRole('dialog', { name: 'Account' })

describe('AccountMenu', () => {
  it('shows the account as its picture, named for a screen reader (AUTH-9)', () => {
    const { container } = setup()

    expect(trigger()).toHaveProperty('ariaLabel', 'Account: Ada Lovelace')
    expect(container.querySelector('img')?.getAttribute('src')).toBe(ADA.photoUrl)
  })

  it('stands in the first letter of the name where there is no picture (AUTH-9)', () => {
    setup({ ...ADA, photoUrl: null })

    expect(trigger().textContent).toBe('A')
  })

  it('stands in the first letter of the name when the picture will not load (AUTH-9)', () => {
    const { container } = setup()

    fireEvent.error(container.querySelector('img')!)

    expect(container.querySelector('img')).toBeNull()
    expect(trigger().textContent).toBe('A')
  })

  it('opens onto the name, the address and signing out (AUTH-10)', async () => {
    const { user } = setup()

    await user.click(trigger())

    expect(trigger()).toHaveProperty('ariaExpanded', 'true')
    expect(panel()?.textContent).toContain('Ada Lovelace')
    expect(panel()?.textContent).toContain('ada@example.com')
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy()
  })

  it('closes on Escape and on a click outside (AUTH-10)', async () => {
    const { user } = setup()

    await user.click(trigger())
    await user.keyboard('{Escape}')
    expect(panel()).toBeNull()

    await user.click(trigger())
    await user.click(document.body)
    expect(panel()).toBeNull()
  })

  it('signs out without asking (AUTH-11)', async () => {
    const { user, onSignOut } = setup()

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalledOnce()
    expect(panel()).toBeNull()
  })
})
