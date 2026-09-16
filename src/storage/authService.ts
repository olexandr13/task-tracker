/**
 * Who is signed in, and signing in and out.
 *
 * An interface for the same reason `TaskRepository` is one: every call site
 * talks to this and never to Firebase directly, so the provider is one file
 * here rather than something the UI knows about.
 */

/** The signed-in person, as much of them as the screen has any use for. */
export interface Account {
  /** Stable for the life of the account; what saved data will be filed under. */
  readonly id: string
  readonly name: string | null
  readonly email: string | null
  readonly photoUrl: string | null
}

/** Why a sign-in ended without anyone signed in. */
export type SignInFailure =
  /** The window was closed or no account was picked. Nothing went wrong. */
  | 'cancelled'
  /** The browser would not let the sign-in window open. */
  | 'popup-blocked'
  /** There was no connection to reach Google over. */
  | 'offline'
  /** Anything else. The details go to the console, not to the screen. */
  | 'failed'

export interface AuthService {
  /**
   * Calls back with the signed-in account, or null, once the saved session has
   * been checked and again whenever it changes. Returns the way to stop.
   */
  subscribe(listener: (account: Account | null) => void): () => void
  /** Resolves with null once signed in; never rejects. */
  signInWithGoogle(): Promise<SignInFailure | null>
  signOut(): Promise<void>
}
