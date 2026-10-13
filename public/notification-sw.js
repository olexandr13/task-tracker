/*
 * Pressing one of PickMe's notifications. The build's service worker loads this
 * (`importScripts` in vite.config.ts), as every notification the built app
 * posts goes through the worker (src/app/browserNotification.ts) and is pressed
 * here rather than in the page that posted it.
 *
 * It brings the app's window forward and tells it which notification was
 * pressed, so the page does what that notice's button does. With no window
 * left — the app closed while the notification stayed — it opens the app.
 */

/** Must match NOTIFICATION_PRESSED in src/app/browserNotification.ts. */
const NOTIFICATION_PRESSED = 'pickme:notification-pressed'

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const pressed = event.notification.data ?? null

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // The window focused last comes first.
      const last = windows[0]
      if (last === undefined) return self.clients.openWindow('/')
      // Each window is told; only the one that posted it acts.
      if (pressed !== null) {
        for (const each of windows) each.postMessage({ type: NOTIFICATION_PRESSED, pressed })
      }
      return last.focus()
    }),
  )
})
