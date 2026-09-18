import type { SyncState } from '../storage/syncMonitor'

/** What the screen says about the account's changes reaching the server, when it has anything to say. */
export type SyncNotice = 'offline' | 'syncing' | 'synced'

export const SYNC_NOTICE_LABELS: Record<SyncNotice, string> = {
  offline: 'Offline — changes are saved and will sync',
  syncing: 'Syncing changes…',
  synced: 'All changes synced',
}

/** The sync state, and the notice it has come to. */
export interface SyncView {
  readonly state: SyncState
  readonly notice: SyncNotice | null
}

export type SyncEvent =
  /** The monitor reported a new state. */
  | { readonly type: 'state'; readonly state: SyncState }
  /** A change has been on its way long enough to be worth saying so. */
  | { readonly type: 'slow' }
  /** "Synced" has been up long enough. */
  | { readonly type: 'settled' }

export const IN_SYNC: SyncView = { state: { online: true, pending: false }, notice: null }

/**
 * Online and caught up there is nothing to say. Offline is said at once and for
 * as long as it lasts. Online, a change on its way is said only once it is slow
 * (`slow`) — every change is on its way for a moment, and a notice for each would
 * flicker — or when it follows being offline, where the wait is already on screen.
 * "Synced" closes off whatever was said, and goes by itself (`settled`), or as
 * soon as a new change makes it untrue.
 */
export function nextSyncView(view: SyncView, event: SyncEvent): SyncView {
  switch (event.type) {
    case 'state': {
      const { state } = event
      const waiting = view.notice === 'offline' || view.notice === 'syncing'
      const notice = !state.online ? 'offline' : state.pending ? (waiting ? 'syncing' : null) : waiting ? 'synced' : view.notice
      return { state, notice }
    }
    case 'slow':
      return view.notice === null && view.state.online && view.state.pending ? { ...view, notice: 'syncing' } : view
    case 'settled':
      return view.notice === 'synced' ? { ...view, notice: null } : view
  }
}
