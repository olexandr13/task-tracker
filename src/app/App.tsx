import { firebaseApp } from '../storage/firebaseApp'
import { createFirebaseAuthService } from '../storage/firebaseAuthService'
import { SignInScreen } from './components/SignInScreen'
import { TasksScreen } from './TasksScreen'
import { useAuth } from './useAuth'

/** One for the life of the page. */
const auth = createFirebaseAuthService(firebaseApp)

/**
 * Nothing is shown without an account: the tasks are the signed-in person's,
 * so until someone is signed in there are none to show.
 */
export function App() {
  const state = useAuth(auth)

  // A saved session takes a moment to read back. Showing nothing for it beats
  // flashing the sign-in screen at someone who is already signed in.
  if (state.status === 'checking') {
    return null
  }

  if (state.status === 'signed-out') {
    return <SignInScreen onSignIn={() => auth.signInWithGoogle()} />
  }

  function handleSignOut() {
    auth.signOut().catch((error: unknown) => {
      console.error('Could not sign out.', error)
    })
  }

  // Keyed by the account, so nothing held on screen for one person is still
  // there when another signs in.
  return <TasksScreen key={state.account.id} account={state.account} onSignOut={handleSignOut} />
}
