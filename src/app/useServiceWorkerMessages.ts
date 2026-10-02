import { useEffect, useRef } from 'react'
import { isHourOfDay, isLocalDay, type HourSlot } from '../core'

/** What the service worker sends a window when a pushed check-in is pressed (`public/check-in-sw.js`). */
export const OPEN_ACTIVITY_MESSAGE = 'pickme/open-activity'

/**
 * Hears a pushed check-in pressed while the app is open: the service worker
 * brings the window forward and says which hour it asked about, and the app
 * opens the activity log on it (CHECKIN-10). An app with no service worker —
 * the development server's — hears nothing, and needs to.
 */
export function useServiceWorkerMessages(onOpenActivity: (slot: HourSlot | null) => void): void {
  const handler = useRef(onOpenActivity)
  useEffect(() => {
    handler.current = onOpenActivity
  })

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const container = navigator.serviceWorker

    function onMessage(event: MessageEvent) {
      const data: unknown = event.data
      if (typeof data !== 'object' || data === null || (data as { type?: unknown }).type !== OPEN_ACTIVITY_MESSAGE) return
      const slot = (data as { slot?: unknown }).slot
      const valid =
        typeof slot === 'object' &&
        slot !== null &&
        typeof (slot as HourSlot).day === 'string' &&
        isLocalDay((slot as HourSlot).day) &&
        isHourOfDay((slot as HourSlot).hour)
      handler.current(valid ? { day: (slot as HourSlot).day, hour: (slot as HourSlot).hour } : null)
    }

    container.addEventListener('message', onMessage)
    return () => { container.removeEventListener('message', onMessage) }
  }, [])
}
