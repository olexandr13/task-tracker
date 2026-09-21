# Account

Who the app belongs to. Tasks are shown for a signed-in Google account, or for a guest using this
device alone.

## Signing in

- **AUTH-1** Until someone is in — signed in with Google, or continuing as guest — the only screen
  is the sign-in screen: no list, no quote, no bars.
- **AUTH-2** There are two ways in: a Google account behind **Continue with Google**, or **Continue
  as guest** with no account at all. No email and password, no other providers, nothing to fill in.
- **AUTH-3** Signing in with Google opens Google's own window over the app. It always asks which
  Google account to use, so signing out and back in is also how to switch to another one.
- **AUTH-4** While that window is open the Google button reads **Signing in…** and neither way in
  can be pressed again.
- **AUTH-5** Closing the window without picking an account is not an error. The button comes back
  and nothing is said.
- **AUTH-6** A Google sign-in that fails says why, in a sentence under the buttons: the browser
  blocked the window, there was no connection, or something else went wrong. The next attempt clears
  it.
- **AUTH-15** **Continue as guest** opens the app at once with no Google window. Everything done as
  guest is kept **only on this device** (STORE-37). A refresh, a closed tab or a restarted browser
  opens straight back onto those tasks. Leaving guest mode and continuing as guest again resumes
  the same local data.

## Staying signed in

- **AUTH-7** The browser remembers the session — Google or guest. A refresh, a closed tab or a
  restarted browser opens straight onto the tasks, with or without a connection. Only signing in
  with Google the first time needs one — including in an app added to an iPhone's home screen, which
  keeps its own session (OFF-11).
- **AUTH-8** While the remembered Google session is being read back at start-up, the screen stays
  blank rather than flashing the sign-in screen at someone who is already signed in. A saved guest
  session is known at once from this device.
- **AUTH-14** Start-up never waits on the network: the Google session is read back from the device
  alone, so the blank moment of AUTH-8 is gone at once with no connection, on a slow one, or on an
  unreliable one, and an installed app never sits on its splash screen. Google is asked in the
  background whether the session is still valid; if there is no answer the saved session is used.
  What Google's sign-in window needs is fetched only when **Continue with Google** is pressed, which
  can make the window take a moment to open. Guest mode asks Google nothing.

## The account on Settings

- **AUTH-9** The signed-in Google account is on the **Settings** page (UI-35), and nowhere else: the
  mark of the service it signed in through — Google's "G" on a white disc, the same mark as the
  sign-in button carries — then the name, the email address and which service it was. Neither the
  Google picture nor the name of it is shown; the app does not keep the picture at all. A line the
  account has not got is left out rather than left blank. Settings has a place in the sidebar and a
  tab in the phone's bar alike, so the account is one tap away on a phone as well.
- **AUTH-10** It is all on the page, not behind a button: a page of settings has the room to say it
  outright, so there is no panel to open and nothing to close. The mark is decorative — the lines
  beside it say who it is, so a screen reader hears it once.
- **AUTH-11** **Sign out** sits beside a Google account and goes straight back to the sign-in screen
  without asking. Nothing is lost by it.
- **AUTH-16** A guest on Settings shows a person mark, the name **Guest**, and that everything is
  **Saved on this device only**. **Leave** goes back to the sign-in screen without asking; the
  guest's data stays in the browser for the next time they continue as guest. Signing in with Google
  afterwards moves that data into the account (STORE-38).

## Whose tasks

- **AUTH-13** Tasks belong to the Google account. Signing in on any device or address shows the same
  tasks (STORE-2), and another account signed in on the same browser sees only its own (STORE-17).
  A guest's tasks belong to this browser address alone (STORE-37).

---

**Where it lives:** `src/storage/authService.ts` (the interface), `firebaseAuthService.ts` and
`firebaseApp.ts` (Google sign-in through Firebase, and the project it signs in to),
`appAuthService.ts` and `guestSession.ts` (guest layered on Google),
`failFastAuthFetch.ts` (so start-up does not wait on Google when there is no connection),
`src/app/App.tsx` (nothing without an account or guest), `src/app/useAuth.ts`,
`src/app/components/SignInScreen.tsx`, `AccountCard.tsx` (the account on Settings), `GuestMark.tsx`.
The project itself: `firebase.json`, `.firebaserc`, `firestore.rules`; its settings: `.env.example`.
**Tested in:** `src/app/useAuth.test.ts`, `src/app/components/SignInScreen.test.tsx`,
`src/app/components/AccountCard.test.tsx`, `src/storage/appAuthService.test.ts`,
`src/storage/failFastAuthFetch.test.ts`.
