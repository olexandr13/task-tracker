// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAppAuthService } from './appAuthService'
import { GUEST_ACCOUNT, type Account, type AuthService, type SignInFailure } from './authService'
import { setGuestSession } from './guestSession'

/* Guest and Google together. AUTH ids refer to wiki/account.md. */

afterEach(() => {
  setGuestSession(false)
  localStorage.clear()
})

function fakeGoogle(options: {
  first?: Account | null | 'never'
  onSignOut?: () => void
}): AuthService & { emit: (account: Account | null) => void } {
  let listener: ((account: Account | null) => void) | null = null
  return {
    subscribe(next) {
      listener = next
      if (options.first !== 'never' && options.first !== undefined) {
        queueMicrotask(() => { next(options.first as Account | null) })
      }
      return () => {
        listener = null
      }
    },
    signInWithGoogle: () => Promise.resolve(null as SignInFailure | null),
    continueAsGuest: () => {},
    signOut: async () => {
      options.onSignOut?.()
      listener?.(null)
    },
    emit(account) {
      listener?.(account)
    },
  }
}

describe('createAppAuthService', () => {
  it('opens as guest when a guest session is saved (AUTH-15)', async () => {
    setGuestSession(true)
    const google = fakeGoogle({ first: null })
    const auth = createAppAuthService(google)
    const seen: Array<Account | null> = []

    auth.subscribe((account) => {
      seen.push(account)
    })

    await vi.waitFor(() => {
      expect(seen.at(-1)).toEqual(GUEST_ACCOUNT)
    })
  })

  it('continues as guest from the sign-in screen (AUTH-15)', async () => {
    const google = fakeGoogle({ first: null })
    const auth = createAppAuthService(google)
    const seen: Array<Account | null> = []

    auth.subscribe((account) => {
      seen.push(account)
    })
    await vi.waitFor(() => {
      expect(seen.at(-1)).toBeNull()
    })

    auth.continueAsGuest()

    expect(seen.at(-1)).toEqual(GUEST_ACCOUNT)
    expect(localStorage.getItem('task-tracker/guest-session')).toBe('1')
  })

  it('lets a Google session displace guest (AUTH-15)', async () => {
    setGuestSession(true)
    const googleAccount: Account = { id: 'uid', name: 'Ada', email: 'a@b.c', provider: 'google' }
    const google = fakeGoogle({ first: null })
    const auth = createAppAuthService(google)
    const seen: Array<Account | null> = []

    auth.subscribe((account) => {
      seen.push(account)
    })
    await vi.waitFor(() => {
      expect(seen.at(-1)).toEqual(GUEST_ACCOUNT)
    })

    google.emit(googleAccount)

    expect(seen.at(-1)).toEqual(googleAccount)
    expect(localStorage.getItem('task-tracker/guest-session')).toBeNull()
  })

  it('leaves guest mode without touching Google (AUTH-16)', async () => {
    setGuestSession(true)
    const onSignOut = vi.fn()
    const google = fakeGoogle({ first: null, onSignOut })
    const auth = createAppAuthService(google)
    const seen: Array<Account | null> = []

    auth.subscribe((account) => {
      seen.push(account)
    })
    await vi.waitFor(() => {
      expect(seen.at(-1)).toEqual(GUEST_ACCOUNT)
    })

    await auth.signOut()

    expect(onSignOut).not.toHaveBeenCalled()
    expect(seen.at(-1)).toBeNull()
    expect(localStorage.getItem('task-tracker/guest-session')).toBeNull()
  })
})
