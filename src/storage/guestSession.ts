/**
 * Whether this browser is in guest mode. Kept in `localStorage` so a refresh
 * opens straight onto the tasks as guest, the same way a Google session does.
 * The guest's records live under their own keys; this is only the door.
 */

const STORAGE_KEY = 'task-tracker/guest-session'

/** Whether guest mode is active on this address. */
export function isGuestSession(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setGuestSession(active: boolean): void {
  try {
    if (active) localStorage.setItem(STORAGE_KEY, '1')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Session lasts for this visit only when the browser refuses storage.
  }
}
