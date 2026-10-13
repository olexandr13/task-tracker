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
 * a tab, or the installed app running. Nothing reaches them once it is closed.
 */

/**
 * Whether a notification can be posted, and whether it has been asked for.
 * `home-screen` is Safari on an iPhone or iPad, which has none in a tab but
 * gives them to PickMe added to the Home Screen and opened from there.
 */
export type NotifyPermission = 'unavailable' | 'home-screen' | 'default' | 'granted' | 'denied'

export function notifyPermission(): NotifyPermission {
  if (typeof Notification === 'undefined') return needsHomeScreen() ? 'home-screen' : 'unavailable'
  const permission = Notification.permission
  return permission === 'granted' || permission === 'denied' ? permission : 'default'
}

/**
 * Safari's own word on whether the page is the Home Screen app: `false` in a
 * Safari tab on an iPhone or iPad, and missing in every other browser.
 */
function needsHomeScreen(): boolean {
  return typeof navigator !== 'undefined' && (navigator as { readonly standalone?: boolean }).standalone === false
}

/** The question already put to the browser, while it is still being answered. */
let asking: Promise<NotifyPermission> | null = null

/**
 * Asks the browser, once: a permission already given or refused is returned as
 * it stands rather than asking again, which browsers ignore in any case. Two
 * asks at once — a mode turned on as a timer starts — wait for the one answer.
 */
export async function askToNotify(): Promise<NotifyPermission> {
  if (typeof Notification === 'undefined') return notifyPermission()
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
    announcePermission()
  })
  return asking
}

/** Whoever is showing the permission, to be told when it may have changed. */
const permissionListeners = new Set<() => void>()

/** The browser's own word on the permission, held so its `change` keeps arriving. */
let permissionStatus: PermissionStatus | null = null

function announcePermission(): void {
  for (const listener of permissionListeners) listener()
}

/**
 * Hears whenever the permission may have changed: an answer to `askToNotify`,
 * anywhere in the app, or a change made in the site's settings while the app is
 * open, where the browser reports one. What it changed to is read again with
 * `notifyPermission`, so nothing here keeps a copy that could fall behind.
 */
export function subscribeNotifyPermission(listener: () => void): () => void {
  permissionListeners.add(listener)
  watchSiteSettings()
  return () => { permissionListeners.delete(listener) }
}

let watchingSiteSettings = false

function watchSiteSettings(): void {
  if (watchingSiteSettings) return
  watchingSiteSettings = true
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) return

  try {
    void navigator.permissions.query({ name: 'notifications' }).then(
      (status) => {
        permissionStatus = status
        permissionStatus.addEventListener('change', announcePermission)
      },
      () => {
        // A browser that will not say; the answers to `askToNotify` still arrive.
      },
    )
  } catch {
    // A browser whose `query` refuses the name outright, the same.
  }
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

  const worker = controllingWorker()
  if (worker !== null) {
    notifyThroughWorker(worker, title, body, { tag, onClick })
    return
  }

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
    // A phone's browser refuses `new Notification` outright, and the service
    // worker that would post it instead is not running the page yet — the
    // first seconds after the app is first opened, or `npm run dev`, which has
    // none. The on-screen notice covers it.
  }
}

/**
 * The service worker running this page, where there is one: the built app, on
 * any device, once the worker has taken the page over.
 */
function controllingWorker(): ServiceWorkerContainer | null {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.controller === null ? null : navigator.serviceWorker
}

/** Said by the service worker when a notification is pressed (`public/notification-sw.js`). */
export const NOTIFICATION_PRESSED = 'pickme:notification-pressed'

/** What a notification posted through the worker carries, for the page to know it again when pressed. */
interface PressedNotification {
  /** The page that posted it: another PickMe window pressing it does nothing. */
  readonly page: string
  /** Its tag, or an id of its own: which `onClick` to run. */
  readonly key: string
}

/** What pressing each notification this page posted through the worker does, by its key. */
const onPress = new Map<string, () => void>()

/** This page among the app's open windows; made on first use, as `randomUUID` needs a secure page. */
let page: string | null = null

let hearingPresses = false

/**
 * Posts through the service worker, the only way a phone's browser takes a
 * notification: Chrome on Android throws at `new Notification`, and the Home
 * Screen app on an iPhone has no other. The computer's built app goes the same
 * way, so there is one way for every device that has a worker.
 *
 * A notification posted so is pressed in the worker, not here. The worker
 * brings the app's window forward and says which one was pressed, and this
 * page does what `onClick` said. A notification with a tag replaces the one
 * before it, and so does what pressing it does.
 */
function notifyThroughWorker(
  worker: ServiceWorkerContainer,
  title: string,
  body: string,
  { tag, onClick }: NotifyOptions,
): void {
  page ??= crypto.randomUUID()
  const key = tag ?? crypto.randomUUID()
  onPress.delete(key)
  if (onClick !== undefined) onPress.set(key, onClick)
  hearPresses(worker)

  const data: PressedNotification = { page, key }
  // What a phone shows beside it; without one it shows the browser's.
  const options: NotificationOptions = { body, icon: '/pwa-192.png', data }
  void worker.ready
    .then((registration) => registration.showNotification(title, tag === undefined ? options : { ...options, tag }))
    .catch(() => {
      // Refused by the browser; the on-screen notice covers it.
    })
}

function hearPresses(worker: ServiceWorkerContainer): void {
  if (hearingPresses) return
  hearingPresses = true
  worker.addEventListener('message', (event: MessageEvent) => {
    const pressed = pressedNotification(event.data)
    if (pressed === null || pressed.page !== page) return
    const run = onPress.get(pressed.key)
    onPress.delete(pressed.key)
    run?.()
  })
  // Messages wait until the page says it is listening; it is, from now.
  worker.startMessages()
}

/** The notification a worker's message says was pressed, or null for any other message. */
function pressedNotification(message: unknown): PressedNotification | null {
  if (typeof message !== 'object' || message === null) return null
  const { type, pressed } = message as { type?: unknown; pressed?: unknown }
  if (type !== NOTIFICATION_PRESSED || typeof pressed !== 'object' || pressed === null) return null
  const { page: from, key } = pressed as { page?: unknown; key?: unknown }
  return typeof from === 'string' && typeof key === 'string' ? { page: from, key } : null
}
