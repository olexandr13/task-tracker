import { useSyncExternalStore } from 'react'
import { notifyPermission, subscribeNotifyPermission, type NotifyPermission } from './browserNotification'

/**
 * Whether this browser will post notifications, as it stands now. One answer
 * for the whole app: allowing them on the Notifications page is read at once by
 * the nudge's and the check-in's pages too, and a change in the site's settings
 * reaches all of them, rather than each holding the copy it started with.
 */
export function useNotifyPermission(): NotifyPermission {
  return useSyncExternalStore(subscribeNotifyPermission, notifyPermission, notifyPermission)
}
