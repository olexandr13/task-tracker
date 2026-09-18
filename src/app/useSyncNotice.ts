import { useEffect, useReducer } from 'react'
import type { SyncMonitor } from '../storage/syncMonitor'
import { IN_SYNC, nextSyncView, type SyncNotice } from './syncNotice'

/** How long a change may be on its way, online, before it is worth saying so. */
const SLOW_SYNC_MS = 2000
/** How long "synced" stays on screen. */
const SYNCED_MS = 3000

/**
 * What to say about the account's changes reaching the server, if anything.
 * The rules are `nextSyncView`; this feeds it the monitor and the two clocks.
 */
export function useSyncNotice(monitor: SyncMonitor): SyncNotice | null {
  const [view, dispatch] = useReducer(nextSyncView, IN_SYNC)

  useEffect(() => monitor.subscribe((state) => { dispatch({ type: 'state', state }) }), [monitor])

  const unsaid = view.notice === null && view.state.online && view.state.pending
  useEffect(() => {
    if (!unsaid) return
    const timer = setTimeout(() => { dispatch({ type: 'slow' }) }, SLOW_SYNC_MS)
    return () => { clearTimeout(timer) }
  }, [unsaid])

  const synced = view.notice === 'synced'
  useEffect(() => {
    if (!synced) return
    const timer = setTimeout(() => { dispatch({ type: 'settled' }) }, SYNCED_MS)
    return () => { clearTimeout(timer) }
  }, [synced])

  return view.notice
}
