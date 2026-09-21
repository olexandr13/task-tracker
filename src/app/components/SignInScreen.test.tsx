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
  const onContinueAsGuest = vi.fn()
  render(<SignInScreen onSignIn={onSignIn} onContinueAsGuest={onContinueAsGuest} />)

  return {
    user,
    onSignIn,
    onContinueAsGuest,
    finish: (result: SignInFailure | null) => act(async () => { finish(result) }),
  }
}

const googleButton = () => screen.getByRole('button', { name: /Continue with Google|Signing in/ })
const guestButton = () => screen.getByRole('button', { name: 'Continue as guest' })
const alert = () => screen.queryByRole('alert')

describe('SignInScreen', () => {
  it('offers Google and guest (AUTH-2, AUTH-15)', async () => {
    const { user, onSignIn } = setup()

    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(googleButton().textContent).toBe('Continue with Google')
    expect(guestButton().textContent).toBe('Continue as guest')

    await user.click(googleButton())
    expect(onSignIn).toHaveBeenCalledOnce()
  })

  it('continues as guest without opening Google (AUTH-15)', async () => {
    const { user, onContinueAsGuest, onSignIn } = setup()

    await user.click(guestButton())

    expect(onContinueAsGuest).toHaveBeenCalledOnce()
    expect(onSignIn).not.toHaveBeenCalled()
  })

  it('holds the Google button while the sign-in window is open (AUTH-4)', async () => {
    const { user } = setup()

    await user.click(googleButton())

    expect(googleButton().textContent).toBe('Signing in…')
    expect(googleButton()).toHaveProperty('disabled', true)
    expect(guestButton()).toHaveProperty('disabled', true)
  })

  it('says nothing when the window is closed without picking an account (AUTH-5)', async () => {
    const { user, finish } = setup()

    await user.click(googleButton())
    await finish('cancelled')

    expect(alert()).toBeNull()
    expect(googleButton().textContent).toBe('Continue with Google')
    expect(googleButton()).toHaveProperty('disabled', false)
  })

  it('says why a sign-in failed, and clears it on the next try (AUTH-6)', async () => {
    const { user, finish } = setup()

    await user.click(googleButton())
    await finish('popup-blocked')
    expect(alert()?.textContent).toMatch(/blocked the sign-in window/)

    await user.click(googleButton())
    expect(alert()).toBeNull()

    await finish('offline')
    expect(alert()?.textContent).toMatch(/Couldn’t reach Google/)
  })
})
