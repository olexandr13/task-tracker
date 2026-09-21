import type { SyncMonitor } from './syncMonitor'

/**
 * Guest data never leaves the device, so there is nothing to sync — online and
 * caught up, which shows no notice (OFF-7).
 */
export function createLocalSyncMonitor(): SyncMonitor {
  return {
    subscribe(onState) {
      onState({ online: true, pending: false })
      return () => {}
    },
  }
}
