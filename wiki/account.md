# Account

Who the app belongs to. Nothing is shown without an account, and the only way to get one is Google.

## Signing in

- **AUTH-1** The app needs an account. Until someone is signed in the only screen is the sign-in
  screen: no list, no quote, no bars.
- **AUTH-2** There is one way in: a Google account, behind a single **Continue with Google** button.
  No email and password, no other providers, nothing to fill in.
- **AUTH-3** Signing in opens Google's own window over the app. It always asks which Google account
  to use, so signing out and back in is also how to switch to another one.
- **AUTH-4** While that window is open the button reads **Signing in…** and cannot be pressed again.
- **AUTH-5** Closing the window without picking an account is not an error. The button comes back
  and nothing is said.
- **AUTH-6** A sign-in that fails says why, in a sentence under the button: the browser blocked the
  window, there was no connection, or something else went wrong. The next attempt clears it.

## Staying signed in

- **AUTH-7** The browser remembers the session. A refresh, a closed tab or a restarted browser opens
  straight onto the tasks, with or without a connection. Only signing in the first time needs one.
- **AUTH-8** While the remembered session is being read back at start-up, the screen stays blank
  rather than flashing the sign-in screen at someone who is already signed in.

## The account menu

- **AUTH-9** The signed-in account sits at the end of the heading as its Google picture — on every
  view, and on a phone as well, where the navigation is collapsed. Without a picture, or when it
  will not load, the first letter of the name stands in. A screen reader hears it as the account
  and the name.
- **AUTH-10** Pressing it opens a panel with the name, the email address and **Sign out**. It closes
  like any other panel: on a click outside or on Escape (UI-9, UI-10).
- **AUTH-11** Signing out goes straight back to the sign-in screen without asking. Nothing is lost
  by it.

## Whose tasks

- **AUTH-13** Tasks belong to the account. Signing in on any device or address shows the same
  tasks (STORE-2), and another account signed in on the same browser sees only its own (STORE-17).

---

**Where it lives:** `src/storage/authService.ts` (the interface), `firebaseAuthService.ts` and
`firebaseApp.ts` (Google sign-in through Firebase, and the project it signs in to),
`src/app/App.tsx` (nothing without an account), `src/app/useAuth.ts`,
`src/app/components/SignInScreen.tsx`, `AccountMenu.tsx`. The project itself: `firebase.json`,
`.firebaserc`, `firestore.rules`; its settings: `.env.example`.
**Tested in:** `src/app/components/SignInScreen.test.tsx`, `src/app/components/AccountMenu.test.tsx`.
