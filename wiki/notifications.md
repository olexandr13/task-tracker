# Notifications

One page for what the app has to say: whether this browser will show its notifications, and every
notice still waiting for an answer. The notices themselves still arrive where they always did — at
the foot or the top of the screen, and as the browser's notification. This page is where they can be
found again after they have scrolled out of mind, and where a browser that is not showing them can
be put right.

## The page

- **NOTIF-1** **Notifications** is a page of its own, at `#/notifications` (UI-36), marked with a
  bell. In the sidebar it is a group of its own, after Reflect and before Trash (UI-30); on a
  phone it is a row on More's page (UI-45). It has two parts, **This browser** and **Waiting**.

## This browser

- **NOTIF-2** The first part says, in plain sentences, where this browser stands:
  - **allowed** — *Notifications are on*: they show while PickMe is open, even in another tab or
    window;
  - **not asked yet** — *Notifications are not allowed yet*: everything still shows on screen, and
    an **Allow notifications** button asks the browser, once, as turning on the nudge or the
    check-in does (NUDGE-9, CHECKIN-9);
  - **blocked** — *This browser is blocking notifications*: the page cannot ask again, so it says
    where they are allowed instead — the site's settings, from the icon at the left of the address
    bar;
  - **on the Home Screen only** — *Notifications need PickMe on the Home Screen*: Safari on an
    iPhone or iPad, which has none in a tab (NOTIF-10);
  - **none** — *This browser has no notifications*: everything shows on screen only.

  Under each it says that **nothing reaches you while PickMe is closed** (PRIN-16), and that a
  phone pauses it soon after you switch to another app, nothing more arriving until you come back.
  The permission
  is one for the whole app: allowed here, the Nudge and Check-in pages stop asking for it at once,
  and a change made in the site's settings while the app is open is read straight away where the
  browser reports it. It is the browser's to give, so it is per device, not per account.

## Waiting

- **NOTIF-3** The second part lists **every notice still standing** — said and not yet answered or
  dismissed — in the order the screen shows them, top to bottom: the **Drop** (CHST-29), the
  **Haul** (CHST-30), a **time goal reached** (TIME-19), each **reminder** (REM-4), the
  **check-in** (CHECKIN-4) and the **nudge** (NUDGE-8). Each is in the words its own notice uses,
  with the glyph of the part of the app it came from. Reminders that struck together are **a row
  each**, with the hour each was due at — `Due at 14:00 · “write”` — rather than the first and a
  count, there being room here. A notice of a part switched off is not there, nor one pointing at a
  task that has gone. With nothing standing the page says so, and what would show here.

  Only what the app says **unasked** is listed. The warm-up holding a habit back (WARM-8), the undo
  (TRASH-3), the sync notice and a refused save (STORE-13) each answer something just done, and
  stay at the foot of the screen alone.
- **NOTIF-4** Each row has the **button its notice has** — **Open task**, **Log it** or **Open
  Cases** — doing what that does there, and an **×** that puts it away as the notice's own × does.
  **Open task** goes to the task and opens it (TIME-20), on its time for a time goal, and puts the
  notice away. **Log it** opens the Activity log on the hour, and the check-in goes once the hour is
  logged (CHECKIN-4). **Open Cases** goes to Cases and puts the notice away (CHST-29). A reminder is
  put away **one at a time** here; the reminder's notice at the foot of the screen still puts them
  all away together. Whatever is done here is done to the notice itself, and whatever is done to the
  notice — on screen, or on another device — leaves this page too.
- **NOTIF-5** While the page is open, the notices it lists are **not shown over it** at the top or
  the foot of the screen: they are in front of you already, as the check-in is not shown over the
  Activity log (CHECKIN-4). The undo, the sync notice, a refused save, the running timer's chip and
  the warm-up's notice still show.
- **NOTIF-6** While anything is waiting, the page's entry in the sidebar and its row on More's page
  **say how many** (UI-82).
- **NOTIF-7** **Nothing is kept** for the page. There is no history: what it lists is what the
  notices hold, and a notice that has gone is gone from here too — a reminder, held on this device
  only, by a refresh (REM-5). Each device lists its own, as each has its own notices.

## On a phone

- **NOTIF-9** A phone **shows the same notifications** as a computer: the reminder, the nudge, the
  check-in, the time goal and the cases. A phone's browser takes them only from the app's service
  worker, so the built app posts every notification through it, on a computer too; only
  `npm run dev`, which has no worker, posts them from the page. Each carries PickMe's icon.
  **Pressing one** brings PickMe forward; the Drop's also opens Cases, and the check-in's the
  Activity log on the hour, as their buttons do (NOTIF-4) — in the window that posted it, and no
  other. Pressed after PickMe was closed, it opens the app.

  It still needs PickMe **open** (PRIN-16), and a phone keeps it so only a little while once you
  switch away: an iPhone pauses it almost at once, Android within minutes. What is due meanwhile is
  said when you come back, on screen.
- **NOTIF-10** Safari on an **iPhone or iPad** gives notifications only to PickMe **added to the
  Home Screen** and opened from there. In a Safari tab, This browser says so and how — press
  **Share**, then **Add to Home Screen**, open PickMe from there and press **Allow notifications** —
  with nothing to press itself. The nudge's and the check-in's pages say they only show on screen
  there, for the same reason. The Home Screen app asks as any browser does (NOTIF-2).

## Switching it off

- **NOTIF-8** **Notifications** has its own switch on Settings (FEAT-1). Off, the page, its entry,
  its row on More and its count go (FEAT-2), and its address lands on More. The notices and the
  browser's notifications **carry on**: they belong to the reminders, the modes and the cases, each
  of which has a switch of its own.

---

**Where it lives:** `src/app/standingNotices.ts` (which notices are standing, and in what order),
`src/app/notificationLabels.ts` (the wording — each notice, the browser's state, the count),
`src/app/components/NotificationsPage.tsx` (the page), `src/app/browserNotification.ts` and
`src/app/useNotifyPermission.ts` (the permission, one for the whole app, and hearing it change;
posting through the service worker, and hearing one pressed), `public/notification-sw.js` (pressing
one, in the worker) and `vite.config.ts` (the worker loading it),
`src/app/TasksScreen.tsx` (what each row does, and the notices not shown over the page),
`src/app/useReminders.ts` (putting one reminder away), `src/app/useTaskTimer.ts` (the task a time
goal was reached on), `src/app/components/SideNav.tsx` and `MorePage.tsx` (the count),
`src/app/view.ts`, `features.ts`, `viewIcons.ts`, `src/core/feature.ts` and `featureLabels.ts` (the
page, its place and its switch).
**Tested in:** `src/app/browserNotification.test.ts`, `src/app/standingNotices.test.ts`, `src/app/components/NotificationsPage.test.tsx`,
`src/app/useReminders.test.ts`, `src/app/useTaskTimer.test.ts`, `src/app/features.test.ts`,
`src/app/components/SideNav.test.tsx`, `src/app/components/MorePage.test.tsx`,
`src/app/components/BottomNav.test.tsx`.
