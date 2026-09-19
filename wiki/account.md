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
  straight onto the tasks, with or without a connection. Only signing in the first time needs one —
  including in an app added to an iPhone's home screen, which keeps its own session (OFF-11).
- **AUTH-8** While the remembered session is being read back at start-up, the screen stays blank
  rather than flashing the sign-in screen at someone who is already signed in.
- **AUTH-14** Start-up never waits on the network: the session is read back from the device alone,
  so the blank moment of AUTH-8 is gone at once on a slow or unreliable connection too, and an
  installed app never sits on its splash screen. What Google's sign-in window needs is fetched only
  when **Continue with Google** is pressed, which can make the window take a moment to open.

## The account on Settings

- **AUTH-9** The signed-in account is on the **Settings** page (UI-35), and nowhere else: the mark
  of the service it signed in through — Google's "G" on a white disc, the same mark as the sign-in
  button carries — then the name, the email address and which service it was. Neither the Google
  picture nor the name of it is shown; the app does not keep the picture at all. A line the account
  has not got is left out rather than left blank. Settings has a place in the sidebar and a tab in
  the phone's bar alike, so the account is one tap away on a phone as well.
- **AUTH-10** It is all on the page, not behind a button: a page of settings has the room to say it
  outright, so there is no panel to open and nothing to close. The mark is decorative — the lines
  beside it say who it is, so a screen reader hears it once.
- **AUTH-11** **Sign out** sits beside them and goes straight back to the sign-in screen without
  asking. Nothing is lost by it.

## Whose tasks

- **AUTH-13** Tasks belong to the account. Signing in on any device or address shows the same
  tasks (STORE-2), and another account signed in on the same browser sees only its own (STORE-17).

---

**Where it lives:** `src/storage/authService.ts` (the interface), `firebaseAuthService.ts` and
`firebaseApp.ts` (Google sign-in through Firebase, and the project it signs in to),
`src/app/App.tsx` (nothing without an account), `src/app/useAuth.ts`,
`src/app/components/SignInScreen.tsx`, `AccountCard.tsx` (the account on Settings). The project itself: `firebase.json`,
`.firebaserc`, `firestore.rules`; its settings: `.env.example`.
**Tested in:** `src/app/components/SignInScreen.test.tsx`, `src/app/components/AccountCard.test.tsx`.
