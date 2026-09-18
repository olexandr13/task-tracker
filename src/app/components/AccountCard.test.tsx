// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../storage/authService'
import { AccountCard } from './AccountCard'

/* The signed-in account on Settings. AUTH ids refer to wiki/account.md. */

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
  const { container } = render(<AccountCard account={account} onSignOut={onSignOut} />)
  return { user, onSignOut, container }
}

const card = () => screen.getByRole('region', { name: 'Account' })

describe('AccountCard', () => {
  it('names the account, the address and the service on the page (AUTH-9)', () => {
    setup()

    expect(card().textContent).toContain('Ada Lovelace')
    expect(card().textContent).toContain('ada@example.com')
    expect(card().textContent).toContain('Signed in with Google')
  })

  it('shows the mark of the service it signed in with (AUTH-9)', () => {
    const { container } = setup()

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('shows no picture of the account (AUTH-9)', () => {
    const { container } = setup()

    expect(container.querySelector('img')).toBeNull()
  })

  it('signs out without asking (AUTH-11)', async () => {
    const { user, onSignOut } = setup()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('leaves out a line the account has not got (AUTH-9)', () => {
    setup({ ...ADA, name: null })

    expect(card().textContent).not.toContain('Ada Lovelace')
    expect(card().textContent).toContain('ada@example.com')
  })
})
