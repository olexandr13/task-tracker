/**
 * The browser's own notification — the one that shows while the app is in the
 * background — and the permission it needs.
 *
 * Everything here is a no-op where notifications are not to be had: an older
 * browser, a refused permission, a page the browser will not let post one. That
 * is deliberate. Whatever the app has to say it also says on screen, so a
 * notification is the second way of hearing it and never the only one.
 *
 * Notifications reach the owner only while the app is open — a tab, or the
 * installed app running. There is no push here: no server wakes the app, so
 * nothing arrives while it is closed.
 */

/** Whether a notification can be posted, and whether it has been asked for. */
export type NotifyPermission = 'unavailable' | 'default' | 'granted' | 'denied'

export function notifyPermission(): NotifyPermission {
  if (typeof Notification === 'undefined') return 'unavailable'
  const permission = Notification.permission
  return permission === 'granted' || permission === 'denied' ? permission : 'default'
}

/**
 * Asks the browser, once: a permission already given or refused is returned as
 * it stands rather than asking again, which browsers ignore in any case.
 */
export async function askToNotify(): Promise<NotifyPermission> {
  if (typeof Notification === 'undefined') return 'unavailable'
  if (Notification.permission !== 'default') return notifyPermission()

  try {
    await Notification.requestPermission()
  } catch {
    // An older browser whose `requestPermission` takes a callback and returns
    // nothing; whatever it settles on is read back below.
  }
  return notifyPermission()
}

/** Posts a notification where one is allowed, and does nothing where it is not. */
export function notifyBrowser(title: string, body: string): void {
  if (notifyPermission() !== 'granted') return

  try {
    new Notification(title, { body })
  } catch {
    // Some browsers reject Notification without a service worker; the on-screen
    // notice covers it.
  }
}
