import { GUEST_ACCOUNT, type Account, type AuthService, type SignInFailure } from './authService'
import { isGuestSession, setGuestSession } from './guestSession'

/**
 * Google sign-in and guest mode together. A Google session always wins: signing
 * in clears the guest flag (the guest's records stay until they are moved into
 * the account). With nobody from Google, a saved guest session opens as guest.
 */
export function createAppAuthService(google: AuthService): AuthService {
  let googleAccount: Account | null | undefined
  let guestActive = isGuestSession()
  const listeners = new Set<(account: Account | null) => void>()

  function current(): Account | null | undefined {
    if (googleAccount === undefined) return undefined
    if (googleAccount !== null) return googleAccount
    return guestActive ? GUEST_ACCOUNT : null
  }

  function emit(): void {
    const account = current()
    if (account === undefined) return
    for (const listener of listeners) listener(account)
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      const stopGoogle = google.subscribe((account) => {
        googleAccount = account
        if (account !== null && guestActive) {
          guestActive = false
          setGuestSession(false)
        }
        emit()
      })
      return () => {
        listeners.delete(listener)
        stopGoogle()
      }
    },

    signInWithGoogle(): Promise<SignInFailure | null> {
      return google.signInWithGoogle()
    },

    continueAsGuest() {
      guestActive = true
      setGuestSession(true)
      emit()
    },

    async signOut() {
      if (googleAccount !== null && googleAccount !== undefined) {
        await google.signOut()
        return
      }
      if (guestActive) {
        guestActive = false
        setGuestSession(false)
        emit()
      }
    },
  }
}
