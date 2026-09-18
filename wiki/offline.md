# Offline

The app opens and works with no connection, on a computer or a phone, and whatever is done offline
reaches the account by itself once there is a connection again.

## Opening with no connection

- **OFF-1** Once the app has been opened with a connection, it **opens without one**: a refresh, a
  closed tab or browser, a phone's home-screen icon. The browser keeps the app itself — its page,
  code and icons — and the tasks come from the copy of the account the browser keeps (STORE-18).
  Signing in for the first time still needs a connection (AUTH-7).
- **OFF-12** A new version of the app is fetched in the background whenever it is open with a
  connection, and is what the **next** open or refresh gets. The page already open keeps the version
  it loaded: it is never reloaded under the owner's hands, so nothing half-typed is lost to an update.
- **OFF-13** Only a build keeps the app offline — the hosted app (STORE-15) and `npm run preview`
  (`http://localhost:4173`, STORE-14). `npm run dev` does not, so what is being worked on is never
  served stale.

## Changes made offline

- **OFF-2** Everything works offline as it does online — adding, completing, editing, deleting,
  lists, tags, habits, redeeming points. Each change is **kept on the device** and survives a
  refresh, a closed app or a restarted phone.
- **OFF-3** Kept changes are **sent by themselves** as soon as there is a connection again, next
  time the app is open. There is nothing to press.
- **OFF-14** A change made offline is written when it arrives, so on the **same** task it wins over
  a change made meanwhile on another device (STORE-16). Changes to different tasks never undo one
  another, however long a device was offline.

## Saying where changes stand

- **OFF-4** With no connection, a notice says so for as long as it lasts: **Offline — changes are
  saved and will sync**.
- **OFF-5** **Syncing changes…** is said when the connection comes back while changes are still on
  their way, and when a change made online takes more than **two seconds** to reach the account.
- **OFF-6** **All changes synced** closes off either of those once every change has arrived. It
  goes by itself after **three seconds**, or at once if a new change makes it untrue.
- **OFF-7** Online and caught up, **nothing is shown**. Every change is on its way for a moment, and
  a notice for each would flicker; one is only said once it is slow (OFF-5).
- **OFF-8** The notice sits at the foot of the screen — above the phone's bar (UI-4), in the bottom
  middle of a wide window — stacked above the undo toast (TRASH-3) rather than over it. It reports
  and asks nothing, and a screen reader hears it as it changes.
- **OFF-9** Whether a change has arrived is read from the account's own records, all of them —
  tasks, lists, points earned and redeemed. A deletion is the one change it cannot see on its way,
  the record being gone from what it reads; it is sent with the rest all the same.

## Installing it

- **OFF-10** The app can be **installed**: added to a phone's home screen (Share → Add to Home
  Screen on an iPhone, the install prompt or menu item on Android), or installed from a desktop
  browser. Installed, it opens in a window of its own without the browser's address bar, under the
  name **Tasks**, with the progress-ring icon (UI-39) — its dark tile filling whatever shape the
  phone gives icons. The bar at the top of the screen matches the page, light or dark (UI-11).
- **OFF-11** On an iPhone, an app added to the home screen keeps its **own** session and offline
  copy, apart from Safari's. It needs signing into once, with a connection, like a new device.

---

**Where it lives:** `vite.config.ts` (the service worker that keeps the app, and the install
manifest), `index.html` (the phone icon and the top bar's colour), `public/` (the icons),
`src/storage/syncMonitor.ts` (the interface), `firestoreSyncMonitor.ts` (reading it from Firestore),
`firestoreAccount.ts` (every collection the account keeps), `src/app/syncNotice.ts` (what is said
when), `src/app/useSyncNotice.ts` (its clocks), `src/app/components/SyncBadge.tsx`,
`src/app/TasksScreen.tsx` (where it sits).
**Tested in:** `src/app/syncNotice.test.ts` (what is said when), `src/app/useSyncNotice.test.ts` (the
two clocks).
