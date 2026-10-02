/**
 * PickMe's check-ins, pushed while the app is closed (CHECKIN-10). Imported
 * into the service worker the build makes (`vite.config.ts`, `importScripts`),
 * so it runs whether or not a window of the app is open.
 *
 * Every push is shown: browsers ask that each one put a notification up, and
 * the sender only sends one for an hour still to log. Pressed, it brings an
 * open window forward and tells it which hour to open the activity log on
 * (`useServiceWorkerMessages`), or opens the app there.
 */

const OPEN_ACTIVITY_MESSAGE = 'pickme/open-activity'

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }

  const title = typeof data.title === 'string' ? data.title : 'PickMe'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === 'string' ? data.body : '',
      // One notification per hour asked about: a second push for it replaces the first.
      tag: typeof data.tag === 'string' ? data.tag : 'check-in',
      icon: '/pwa-192.png',
      data: { url: typeof data.url === 'string' ? data.url : '/#/activity', slot: data.slot ?? null },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const { url = '/#/activity', slot = null } = event.notification.data ?? {}

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
      if (open) {
        await open.focus()
        open.postMessage({ type: OPEN_ACTIVITY_MESSAGE, slot })
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
