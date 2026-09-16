// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SignInFailure } from '../../storage/authService'
import { SignInScreen } from './SignInScreen'

/* Signing in. AUTH ids refer to wiki/account.md. */

afterEach(cleanup)

/** Renders the screen with a sign-in that ends only when the test says so, and how. */
function setup() {
  const user = userEvent.setup()
  let finish: (result: SignInFailure | null) => void = () => {}
  const onSignIn = vi.fn(
    () =>
      new Promise<SignInFailure | null>((resolve) => {
        finish = resolve
      }),
  )
  render(<SignInScreen onSignIn={onSignIn} />)

  return {
    user,
    onSignIn,
    finish: (result: SignInFailure | null) => act(async () => { finish(result) }),
  }
}

const button = () => screen.getByRole('button')
const alert = () => screen.queryByRole('alert')

describe('SignInScreen', () => {
  it('offers one way in, with Google (AUTH-2)', async () => {
    const { user, onSignIn } = setup()

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(button().textContent).toBe('Continue with Google')

    await user.click(button())
    expect(onSignIn).toHaveBeenCalledOnce()
  })

  it('holds the button while the sign-in window is open (AUTH-4)', async () => {
    const { user } = setup()

    await user.click(button())

    expect(button().textContent).toBe('Signing in…')
    expect(button()).toHaveProperty('disabled', true)
  })

  it('says nothing when the window is closed without picking an account (AUTH-5)', async () => {
    const { user, finish } = setup()

    await user.click(button())
    await finish('cancelled')

    expect(alert()).toBeNull()
    expect(button().textContent).toBe('Continue with Google')
    expect(button()).toHaveProperty('disabled', false)
  })

  it('says why a sign-in failed, and clears it on the next try (AUTH-6)', async () => {
    const { user, finish } = setup()

    await user.click(button())
    await finish('popup-blocked')
    expect(alert()?.textContent).toMatch(/blocked the sign-in window/)

    await user.click(button())
    expect(alert()).toBeNull()

    await finish('offline')
    expect(alert()?.textContent).toMatch(/Couldn’t reach Google/)
  })
})
