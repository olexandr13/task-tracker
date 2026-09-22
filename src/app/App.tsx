import { firebaseApp } from '../storage/firebaseApp'
import { createFirebaseAuthService } from '../storage/firebaseAuthService'
import { createAppAuthService } from '../storage/appAuthService'
import { deviceStorage } from '../storage/deviceStorage'
import { SignInScreen } from './components/SignInScreen'
import { TasksScreen } from './TasksScreen'
import { useAuth } from './useAuth'
import { useTheme } from './useTheme'

/** One for the life of the page: Google underneath, guest layered on top. */
const auth = createAppAuthService(createFirebaseAuthService(firebaseApp))

/**
 * Nothing is shown without an account — signed in with Google, or continuing as
 * guest. Until then the only screen is the way in.
 */
export function App() {
  const state = useAuth(auth)
  // The device's theme, worn on every screen — the way in included — whoever is signed in.
  const [theme, setTheme] = useTheme(deviceStorage.theme)

  // A saved session takes a moment to read back. Showing nothing for it beats
  // flashing the sign-in screen at someone who is already signed in.
  if (state.status === 'checking') {
    return null
  }

  if (state.status === 'signed-out') {
    return (
      <SignInScreen
        onSignIn={() => auth.signInWithGoogle()}
        onContinueAsGuest={() => {
          auth.continueAsGuest()
        }}
      />
    )
  }

  function handleSignOut() {
    auth.signOut().catch((error: unknown) => {
      console.error('Could not sign out.', error)
    })
  }

  // Keyed by the account, so nothing held on screen for one person is still
  // there when another signs in.
  return (
    <TasksScreen
      key={state.account.id}
      account={state.account}
      onSignOut={handleSignOut}
      theme={theme}
      onThemeChange={setTheme}
    />
  )
}
