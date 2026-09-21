import { useState } from 'react'
import type { SignInFailure } from '../../storage/authService'
import { GoogleLogo } from './GoogleLogo'

/** A cancelled sign-in is not a fault, so it has nothing to say. */
type ReportedFailure = Exclude<SignInFailure, 'cancelled'>

const MESSAGES: Record<ReportedFailure, string> = {
  'popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.',
  offline: 'Couldn’t reach Google. Check your connection and try again.',
  failed: 'Something went wrong while signing in. Try again.',
}

interface SignInScreenProps {
  /** Resolves with null once signed in, or with why not. */
  onSignIn: () => Promise<SignInFailure | null>
  /** Opens the app with everything kept on this device. */
  onContinueAsGuest: () => void
}

/**
 * The way in: Google for tasks that follow the account, or guest for tasks that
 * stay on this device alone.
 */
export function SignInScreen({ onSignIn, onContinueAsGuest }: SignInScreenProps) {
  const [isPending, setIsPending] = useState(false)
  const [failure, setFailure] = useState<ReportedFailure | null>(null)

  async function signIn() {
    setIsPending(true)
    setFailure(null)

    const result = await onSignIn()
    // Signed in, this screen is already on its way out; there is nothing to reset.
    if (result === null) return

    setIsPending(false)
    if (result !== 'cancelled') setFailure(result)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border border-neutral-200 bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">PickMe</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to sync across devices, or continue as guest on this one.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          {/* Drawn to Google's own button guidelines, the only styling a Google sign-in button may have. */}
          <button
            type="button"
            onClick={() => {
              void signIn()
            }}
            disabled={isPending}
            className="flex h-10 items-center gap-2.5 rounded-full border border-[#747775] bg-white px-4 text-sm font-medium text-[#1f1f1f] transition-colors hover:bg-[#f2f2f2] disabled:cursor-default disabled:opacity-60 dark:border-[#8e918f] dark:bg-[#131314] dark:text-[#e3e3e3] dark:hover:bg-[#1f1f20]"
          >
            <GoogleLogo />
            {isPending ? 'Signing in…' : 'Continue with Google'}
          </button>

          <button
            type="button"
            onClick={onContinueAsGuest}
            disabled={isPending}
            className="text-sm text-neutral-500 transition-colors hover:text-neutral-800 disabled:cursor-default disabled:opacity-60 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Continue as guest
          </button>
        </div>

        {failure !== null && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {MESSAGES[failure]}
          </p>
        )}
      </div>
    </main>
  )
}
