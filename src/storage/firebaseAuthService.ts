import { FirebaseError, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import type { Account, AuthService, SignInFailure } from './authService'

/** Ways a sign-in ends that are the person changing their mind, not a fault. */
const CANCELLED = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'])

function failureOf(error: unknown): SignInFailure {
  const code = error instanceof FirebaseError ? error.code : null
  if (code !== null && CANCELLED.has(code)) return 'cancelled'
  if (code === 'auth/popup-blocked') return 'popup-blocked'
  if (code === 'auth/network-request-failed') return 'offline'
  return 'failed'
}

function toAccount(user: User): Account {
  return { id: user.uid, name: user.displayName, email: user.email, photoUrl: user.photoURL }
}

/**
 * Google sign-in through Firebase Authentication. The session is kept in the
 * browser, so a returning visit is already signed in, offline included.
 *
 * A popup rather than a redirect: a redirect back from the project's sign-in
 * domain relies on third-party storage that browsers now block, unless that
 * domain is proxied under the app's own — which this app has no server for.
 */
export function createFirebaseAuthService(app: FirebaseApp): AuthService {
  const auth = getAuth(app)
  const google = new GoogleAuthProvider()
  // Always offer the account picker, so signing out is also the way to switch
  // to another Google account rather than being signed straight back into this one.
  google.setCustomParameters({ prompt: 'select_account' })

  return {
    subscribe(listener) {
      return onAuthStateChanged(auth, (user) => {
        listener(user === null ? null : toAccount(user))
      })
    },

    async signInWithGoogle() {
      try {
        await signInWithPopup(auth, google)
        return null
      } catch (error: unknown) {
        const failure = failureOf(error)
        if (failure === 'failed') {
          console.error('Google sign-in failed.', error)
        }
        return failure
      }
    },

    signOut() {
      return signOut(auth)
    },
  }
}
