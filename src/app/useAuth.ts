import { useEffect, useState } from 'react'
import type { Account, AuthService } from '../storage/authService'

export type AuthState =
  /** The saved session has not been read back yet, so nobody can say who is here. */
  | { readonly status: 'checking' }
  | { readonly status: 'signed-out' }
  | { readonly status: 'signed-in'; readonly account: Account }

/** Who is signed in, kept in step with the service for as long as the screen is up. */
export function useAuth(service: AuthService): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'checking' })

  useEffect(
    () =>
      service.subscribe((account) => {
        setState(account === null ? { status: 'signed-out' } : { status: 'signed-in', account })
      }),
    [service],
  )

  return state
}
