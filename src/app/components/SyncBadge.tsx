import { SYNC_NOTICE_LABELS, type SyncNotice } from '../syncNotice'

const DOT: Record<SyncNotice, string> = {
  offline: 'bg-amber-500',
  syncing: 'animate-pulse bg-blue-500',
  synced: 'bg-emerald-500',
}

/**
 * Where the account's changes stand: kept on this device while it is offline,
 * on their way, or all on the server. Quieter than a toast — it reports, and
 * asks nothing.
 */
export function SyncBadge({ notice }: { notice: SyncNotice }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-3 py-1.5 text-xs text-neutral-600 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 dark:text-neutral-300"
    >
      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${DOT[notice]}`} />
      <span className="min-w-0 truncate">{SYNC_NOTICE_LABELS[notice]}</span>
    </div>
  )
}
