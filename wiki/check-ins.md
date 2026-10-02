# Check-ins

The top of every hour, asking what was done in the hour that just ended — so the
[Activity log](activity-log.md) is filled in as the day goes, while the hour is still remembered,
rather than reconstructed in the evening from what is left of it.

One of the [modes](modes.md), off until it is turned on. How it is set is the account's, as every
mode is (MODE-9); what it has dismissed, and whether it reaches this device while the app is closed,
are each device's own.

## When it asks

- **CHECKIN-1** With the check-in on, the app asks at the **top of every hour** — 10:00, 11:00,
  12:00 — about the **hour that just ended**, and about nothing else: an hour is asked about once,
  in the hour after it.
- **CHECKIN-2** It keeps to **hours of the day**, **From** and **To**, picked on the hour off the
  app's own clock face (DUE-24) — the face's minutes stay at `:00` — and **09:00–22:00** to begin
  with. An hour is asked about when it **starts inside them**: 09:00–22:00 asks at 10:00 about 9 to
  10, and last at 22:00 about 21 to 22. Hours whose **To comes before their From** run past
  midnight, and hours whose two ends are the **same** are every hour, which the page says outright;
  under the two it writes out the stretch it asks nothing about — `It asks nothing about the hours
  between 22:00 and 09:00.` The same hours are the ones the log counts as **meant to be logged**
  (ACT-17), whether the check-in is on or off. They are read on each device's own clock.
- **CHECKIN-3** An hour **already logged** — anything at all under it, on any device — is **not
  asked about**: the check-in is for the hours that would otherwise go unwritten.

## How it arrives

- **CHECKIN-4** On screen it is a **notice at the foot of the app**, with the other notices: ⏰ and
  `What did you do 14:00–15:00?`, and under it how many more of the day's hours are over and not
  logged — `2 more hours not logged today`. **Log it** opens the Activity log on that hour, the
  caret ready for what was done (ACT-5). It **stands for the hour after**, until the next hour is
  asked about; it goes by itself the moment the hour is logged, anywhere, and the **×** puts it away
  on this device until the next hour asks, a refresh keeping it put away. On the Activity log itself
  there is no notice: the hour is in front of you there already.
- **CHECKIN-5** While the app is open, where the browser allows it, a **browser notification** says
  the same at the top of the hour — pressed, it brings the app forward on the Activity log at that
  hour. An hour that ended while the app was **closed** is on the notice when the app opens, but is
  **not** announced by a notification then: it is already in front of you. A browser that has no
  notifications, or is blocking them, loses only the reach, and the page says which it is.

## Setting it

- **CHECKIN-6** The check-in is a **mode** ([Modes](modes.md)), named **Check-in** and worn as ⏰,
  listed last on the Modes page and under Modes in the sidebar (MODE-2, MODE-7), at
  `#/modes/check-in`. It is turned on and off by its switch — there, on its own page, or on its row
  at the head of the Activity log (ACT-19) — at once and with no confirm. Nothing blocks it once its
  setting has arrived (MODE-6, MODE-8).
- **CHECKIN-7** Where it stands is said beside it: `Every hour · 09:00–22:00`, or nothing while it
  is off.
- **CHECKIN-8** Its page carries **Settings** (MODE-12) whether it is on or off: the hours it keeps
  to (CHECKIN-2), whether this device is reached while the app is closed (CHECKIN-11), and what this
  browser allows.
- **CHECKIN-9** The setting is kept **in the account** (STORE-52): hours set at the laptop are the
  hours at the phone, and a check-in turned off anywhere is off everywhere. Turning it on asks the
  browser for permission to notify, once — the same permission the nudge and the reminders ask for
  (NUDGE-9, REM-7).

## While the app is closed

- **CHECKIN-10** A device can be reached **while PickMe is closed**: at the top of each hour a
  **sender** — the app's one part that runs on a server (PRIN-16) — pushes the same check-in to it,
  and the device shows it as a notification however long the app has been closed. It asks on the
  **device's own clock**, in its own time zone, and only what the app would: the check-in is on,
  the hour that ended is one kept to, nothing is logged under it, and it has not been asked already.
  It comes within the first minutes of the hour — no later than three quarters of the way into it,
  past which the hour is let go — and one waiting for a device that is off is dropped once stale. A
  notification pressed opens the app on the Activity log at that hour, or brings the open app
  forward there. A device pushed to posts no notification of its own while open (CHECKIN-5), so the
  hour is never announced twice.
- **CHECKIN-11** Being reached while closed is **each device's**, a push reaching a device rather
  than an account: **Notify this device when PickMe is closed**, a switch on the Check-in's page,
  turns it on and off here, and turning the check-in on from a device that can be reached turns it on
  there too. Where a device **cannot** be, the page says why and what would do, and pressing the
  switch says it again rather than turning anything on: a guest has to sign in with Google; an
  iPhone or iPad has to add PickMe to the **Home Screen** and open it from there; the development
  server has no service worker to receive a push; and a browser without push cannot be reached at
  all. A browser blocking notifications since is read as off, and says how to allow them again.
- **CHECKIN-12** Once it is on, **Send a test** has the sender push a test to this device now —
  `Check-in is set up` — so it can be seen to arrive, the app closed or not; the page says whether
  it was sent.
- **CHECKIN-13** **Signing out** lets this device's registration go first, waiting a few seconds at
  most, so a browser no longer signed into the account is no longer reached for it. A device the push
  service no longer knows — notifications blocked, the browser's data cleared — is let go of by the
  sender the next time it tries, and of two registrations of one browser, only the latest is kept.

---

**Where it lives:** `src/core/checkIn.ts` (the hours kept to, which hour is asked about, the clock
in another time zone, and what the sender pushes), `src/core/hours.ts` (hours of the day, shared with
[Nudges](nudges.md)), `src/app/useCheckIn.ts` (the watching, the notice and the notification),
`src/app/usePushDevice.ts` and `src/app/browserPush.ts` (reaching this device while closed),
`src/app/useServiceWorkerMessages.ts` and `public/check-in-sw.js` (the pushed notification, shown and
pressed), `src/app/browserNotification.ts` (the browser's notification and its permission, shared
with [Nudges](nudges.md), [Reminders](reminders.md) and [Time goals](time-goals.md)),
`src/app/checkInLabels.ts` (wording), `src/app/components/CheckInToast.tsx` (the notice),
`src/app/components/CheckInSettings.tsx` and `CheckInDevice.tsx` (the settings on the mode's page),
`src/app/components/ClockDial.tsx` and `TimeOfDayPicker.tsx` (an hour on the hour),
`src/app/components/CheckInIcon.tsx`, `src/app/modes.ts` and `modeLabels.ts` (the check-in as a
mode), `src/storage/checkInSender.ts` (what the sender decides) and `functions/src/index.ts` (the
sender itself, a scheduled Firebase function, and the test); saving: [Storage](storage.md).
**Tested in:** `src/core/checkIn.test.ts`, `src/app/useCheckIn.test.ts`,
`src/app/components/CheckInSettings.test.tsx`, `src/app/activityLabels.test.ts`,
`src/storage/checkInSender.test.ts`, `src/storage/checkInSchema.test.ts`, `src/app/modes.test.ts`,
`src/app/components/ModesPage.test.tsx`.
