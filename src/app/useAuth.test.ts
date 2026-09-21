// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Account, AuthService } from '../storage/authService'
import { useAuth } from './useAuth'

/* Who is signed in at start-up. AUTH ids refer to wiki/account.md. */

afterEach(cleanup)

const ACCOUNT: Account = { id: 'user-1', name: 'Ada', email: 'ada@example.com', provider: 'google' }

function fakeAuth(first: Account | null | 'never'): AuthService {
  return {
    subscribe(listener) {
      if (first !== 'never') {
        const account = first
        queueMicrotask(() => { listener(account) })
      }
      return () => {}
    },
    signInWithGoogle: () => Promise.resolve(null),
    signOut: () => Promise.resolve(),
  }
}

describe('useAuth', () => {
  it('shows nothing until the saved session has been read back (AUTH-8)', () => {
    const { result } = renderHook(() => useAuth(fakeAuth('never')))

    expect(result.current).toEqual({ status: 'checking' })
  })

  it('opens onto the tasks when a session is already saved (AUTH-7)', async () => {
    const { result } = renderHook(() => useAuth(fakeAuth(ACCOUNT)))

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'signed-in', account: ACCOUNT })
    })
  })

  it('opens onto sign-in when nobody is signed in', async () => {
    const { result } = renderHook(() => useAuth(fakeAuth(null)))

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'signed-out' })
    })
  })
})
