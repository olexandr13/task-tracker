/**
 * The browser's own notification — the one that shows while the app is in the
 * background — and the permission it needs.
 *
 * Everything here is a no-op where notifications are not to be had: an older
 * browser, a refused permission, a page the browser will not let post one. That
 * is deliberate. Whatever the app has to say it also says on screen, so a
 * notification is the second way of hearing it and never the only one.
 *
 * Notifications posted from here reach the owner only while the app is open —
 * a tab, or the installed app running. What arrives while it is closed is a
 * check-in pushed by the sender (./browserPush, CHECKIN-10); nothing else is.
 */

/** Whether a notification can be posted, and whether it has been asked for. */
export type NotifyPermission = 'unavailable' | 'default' | 'granted' | 'denied'

export function notifyPermission(): NotifyPermission {
  if (typeof Notification === 'undefined') return 'unavailable'
  const permission = Notification.permission
  return permission === 'granted' || permission === 'denied' ? permission : 'default'
}

/** The question already put to the browser, while it is still being answered. */
let asking: Promise<NotifyPermission> | null = null

/**
 * Asks the browser, once: a permission already given or refused is returned as
 * it stands rather than asking again, which browsers ignore in any case. Two
 * asks at once — a mode turned on, and the device it is turned on from — wait
 * for the one answer.
 */
export async function askToNotify(): Promise<NotifyPermission> {
  if (typeof Notification === 'undefined') return 'unavailable'
  if (Notification.permission !== 'default') return notifyPermission()

  asking ??= (async () => {
    try {
      await Notification.requestPermission()
    } catch {
      // An older browser whose `requestPermission` takes a callback and returns
      // nothing; whatever it settles on is read back below.
    }
    return notifyPermission()
  })().finally(() => {
    asking = null
  })
  return asking
}

export interface NotifyOptions {
  /** Notifications with the same tag replace one another rather than piling up. */
  readonly tag?: string
  /** What pressing it does, after bringing the app's window forward. */
  readonly onClick?: () => void
}

/** Posts a notification where one is allowed, and does nothing where it is not. */
export function notifyBrowser(title: string, body: string, { tag, onClick }: NotifyOptions = {}): void {
  if (notifyPermission() !== 'granted') return

  try {
    const notification = new Notification(title, tag === undefined ? { body } : { body, tag })
    if (onClick !== undefined) {
      notification.onclick = () => {
        window.focus()
        notification.close()
        onClick()
      }
    }
  } catch {
    // Some browsers reject Notification without a service worker; the on-screen
    // notice covers it.
  }
}
