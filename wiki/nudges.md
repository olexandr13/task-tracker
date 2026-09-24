# Nudges

The app noticing that nothing is getting done. When the work goes quiet for long enough, it says so
and names the one task to pick up — because the hour lost to procrastination is usually the one
spent deciding what to do, not doing it. Where [Just one](just-one.md) is asked for, a nudge
arrives by itself.

Off until it is turned on ([Settings](interface.md)), and kept on this device.

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
  the whole of what the nudge promises. Everything it has to say is on screen as well, so a browser
  that has no notifications, or is blocking them, loses nothing but the reach: Settings says which
  of those it is rather than leaving it a mystery.

## Setting it

- **NUDGE-9** Settings has a **Nudge** card: one switch, **Nudge me when nothing gets done**, and
  under it the span to wait for — **1h**, **2h**, **3h**, **4h** — a couple of hours to begin with.
  The span is there only while the nudge is on. Turning it on asks the browser for permission to
  notify, once. Both are kept on this device only, as the theme is (UI-63): the browser is what
  allows notifications, so being nudged here is not being nudged everywhere.

---

**Where it lives:** `src/core/nudge.ts` (the quiet, the span, and which task is pointed at),
`src/storage/nudgeRepository.ts` and `nudgeSchema.ts` (the setting and its saved shape),
`src/storage/localStorageNudgeRepository.ts` (kept on this device),
`src/app/browserNotification.ts` (the browser's notification and its permission, shared with
[Time goals](time-goals.md)), `src/app/useNudge.ts` (the measuring, and what is said),
`src/app/components/NudgeToast.tsx` (the notice), `src/app/components/NudgeCard.tsx` and
`BellIcon.tsx` (the setting).
**Tested in:** `src/core/nudge.test.ts`, `src/storage/nudgeSchema.test.ts`,
`src/app/useNudge.test.ts`, `src/app/components/NudgeCard.test.tsx`.
