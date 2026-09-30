# Nudges

The app noticing that nothing is getting done. When the work goes quiet for long enough, it says so
and names the one task to pick up — because the hour lost to procrastination is usually the one
spent deciding what to do, not doing it. Where [Just one](just-one.md) is asked for, a nudge
arrives by itself.

One of the [modes](modes.md), off until it is turned on there, and kept on this device.

## When it says something

- **NUDGE-1** With the nudge on, a stretch with **nothing finished** as long as the chosen span —
  one, two, three or four hours — is worth saying something about. The span is counted to the
  moment it is reached, and the app is measuring all the while it is open, not only when something
  changes.
- **NUDGE-2** The quiet is measured from **the last thing finished** — any task, whenever it was
  due, ticked off here or on another device. It is measured rather than counted down: a refresh, a
  page left open all afternoon, or a phone asleep for an hour all read the same, since the only
  question asked is how long ago work last happened. A completion stamped ahead of the clock, by a
  device whose time ran fast, counts as just now rather than as hours of quiet.
- **NUDGE-3** With **nothing ever finished** there is no moment to measure from, so the quiet runs
  from when this device started watching. A first visit is not hours behind on arrival.
- **NUDGE-5** A nudge needs somewhere to point: with **nothing left to do** in Today — everything
  ticked off, or nothing due — it says nothing at all. Nor does it say anything while the tasks are
  still loading, when a quiet app is one that has not read them yet rather than an idle owner.
- **NUDGE-6** One quiet stretch is nudged **once**, and once more each span it runs on: an
  untouched afternoon at two hours says something at two, four and six, not on every tick. The
  moment of the last nudge is kept on this device, so closing the app and opening it again inside
  the same stretch does not start it over — and a nudge on the laptop is not repeated on the phone,
  which has its own. **Firing is what spends the stretch**, so the notice is kept with it (NUDGE-8)
  rather than held on screen alone: a nudge lost to a refresh would be one paid for and never seen.
- **NUDGE-7** **Turning it on starts the quiet from then**, not from whatever was already behind
  it: a span asked for is a span from here, so switching it on is never answered by a notice in the
  same breath.
- **NUDGE-12** The nudge can be held to **hours of the day** — *Only at certain hours*, with a
  **From** and a **To** picked off the app's own clock face as any hour is (DUE-24) — so it says
  nothing overnight. It arrives holding to **none**, which is any hour at all. Outside the hours
  **nothing is said**: no notice, no notification, and nothing held back to be said later, since
  what a nudge has to say is about the hour it is said in. A window whose **To comes before its
  From runs past midnight** — 22:00 to 07:00 is the night — and one whose **two ends are the same
  hour** shuts nothing out, which the page says outright rather than leaving it to be found out.
  The hours are this device's, along with the rest of the setting (NUDGE-9), and so in this
  device's own clock.
- **NUDGE-13** With hours kept to, the quiet is **counted from the moment they open**: a night with
  nothing finished is not answered at nine in the morning, which would be the sleep nudged rather
  than the day. The first thing said inside them comes **a whole span after they opened** (NUDGE-1),
  as it does after the nudge is turned on (NUDGE-7). The stretch is spent the same way inside them:
  hours from nine to ten at night, at a span of two, say something at eleven, one and three, and
  each opening begins the count again.

## What it points at

- **NUDGE-4** The nudge names **the task Today already leads with** — the overdue first, then
  urgent, then wherever the owner put it in the list. Importance is read from the list rather than
  measured afresh: the top of Today is what the app has been saying matters all along, and a nudge
  that disagreed with the screen behind it would be one more thing to weigh. This is the other end
  of [Just one](just-one.md), which picks the *easiest* open task, because there the point is to
  start at all; here it is to not lose the day to the thing that matters.

## How it arrives

- **NUDGE-8** On screen it is a **notice at the foot of the app**, with the other notices: how long
  has been quiet and the task to pick up. A tap on it **goes to that task** and opens it, as the
  running timer's chip does (TIME-20), so the next step is one move rather than a decision.
- **NUDGE-11** The notice **stands until it is answered**: it survives changing page and refreshing,
  on any view rather than only the one it fired on, since the quiet stretch was already spent on it
  (NUDGE-6). It goes when it is **dismissed**, when **its task is done or leaves the list**, or when
  **anything at all is finished** after it fired — nothing done being the whole of what it said. All
  three are read from the tasks as they are, so finishing the task on another device takes the
  notice away here too, and a task renamed meanwhile is named as it is now. Dismissed, it stays
  dismissed; the next notice comes with the next span (NUDGE-6).
- **NUDGE-10** Where the browser allows notifications there is also a **browser notification**, so
  the nudge lands while the app is in another tab. It reaches the owner **only while the app is
  open** — a tab, or the installed app running — since nothing wakes it once it is closed; that is
  the whole of what the nudge promises, and its page says so among the things it does (MODE-5).
  Everything it has to say is on screen as well, so a browser that has no notifications, or is
  blocking them, loses nothing but the reach: the mode's page says which of those it is rather than
  leaving it a mystery.

## Setting it

- **NUDGE-9** The nudge is **a mode** ([Modes](modes.md)), turned on by the mode's switch — on the
  Modes page or at the head of the **Nudge** page itself (MODE-3) — with what it does written out
  there (MODE-5). Its page carries **Settings** while it is on (MODE-12): the span to wait for —
  **1h**, **2h**, **3h**, **4h**, a couple of hours to begin with — and the hours it may speak in
  (NUDGE-12). Turning it on asks the browser for permission to notify, once. Where the mode stands
  is said beside it — `After 2h with nothing done · 09:00–22:00` — so the list of modes says what
  the nudge is waiting for without being opened. All of it is kept **on this device only**, as the
  theme is (UI-63): the browser is what allows notifications, so being nudged here is not being
  nudged everywhere — which is why this one mode is the device's where the others are the account's
  (MODE-9).

---

**Where it lives:** `src/core/nudge.ts` (the quiet, the span, the hours it may speak in, and which
task is pointed at),
`src/storage/nudgeRepository.ts` and `nudgeSchema.ts` (the setting and its saved shape),
`src/storage/localStorageNudgeRepository.ts` (kept on this device),
`src/app/browserNotification.ts` (the browser's notification and its permission, shared with
[Reminders](reminders.md) and [Time goals](time-goals.md)), `src/app/useNudge.ts` (the measuring, and what is said),
`src/app/nudgeLabels.ts` (the wording — the span, the hours, what the browser allows),
`src/app/components/NudgeToast.tsx` (the notice),
`src/app/components/NudgeSettings.tsx` (the settings on the mode's page),
`src/app/components/TimeOfDayPicker.tsx` (an hour of the day on a page),
`src/app/components/NudgeIcon.tsx` (the mode's glyph), `src/app/modes.ts` and `modeLabels.ts` (the
nudge as a mode).
**Tested in:** `src/core/nudge.test.ts`, `src/storage/nudgeSchema.test.ts`,
`src/app/useNudge.test.ts`, `src/app/modes.test.ts`,
`src/app/components/NudgeSettings.test.tsx`, `src/app/components/ModePage.test.tsx`.
