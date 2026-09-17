// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
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
  provider: 'google',
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
  it('shows the account as the mark of the service it signed in with (AUTH-9)', () => {
    const { container } = setup()

    expect(container.querySelector('svg')).not.toBeNull()
    expect(trigger().textContent).toBe('')
  })

  it('names the account and the service for a screen reader (AUTH-9)', () => {
    setup()

    expect(trigger()).toHaveProperty('ariaLabel', 'Account: Ada Lovelace, signed in with Google')
  })

  it('shows no picture of the account (AUTH-9)', () => {
    const { container } = setup()

    expect(container.querySelector('img')).toBeNull()
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
