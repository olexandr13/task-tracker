/** How the account's data on this device stands against the server. */
export interface SyncState {
  /** The device has a connection. Without one, changes are kept here and sent once there is. */
  readonly online: boolean
  /** Changes made on this device that the server does not have yet. */
  readonly pending: boolean
}

/**
 * Whether the account's changes have reached the server. Every call site talks
 * to this interface rather than to the service behind it, as with the repositories.
 */
export interface SyncMonitor {
  /** Calls back with the state at once, and again whenever it changes. Returns the way to stop. */
  subscribe(onState: (state: SyncState) => void): () => void
}
