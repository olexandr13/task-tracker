import type { BackupStatus } from '../useBackup'

/** The Sign out button's look (AccountCard), so the page's buttons read as one set. */
const action =
  'inline-flex min-h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:min-h-0 md:px-3 md:py-1.5 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800'

interface BackupCardProps {
  status: BackupStatus
  onExport: () => void
  onImport: (file: File) => void
}

/**
 * Exporting the account's data to a file and importing one back, on Settings.
 *
 * Import is the browser's own file picker behind a label drawn as a button:
 * the input inside it is what takes the focus and the keys, so it opens from
 * the keyboard as from a click, and the label wears the focus ring for it.
 */
export function BackupCard({ status, onExport, onImport }: BackupCardProps) {
  const working = status.state === 'working'

  return (
    <section
      aria-label="Backup"
      className="flex flex-col rounded-xl border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 className="text-sm font-medium">Backup</h2>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
        Everything in your account — tasks, the trash, lists, tags and points — in one file. Importing a file adds what
        isn’t here yet and changes nothing that is.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExport}
          disabled={working}
          className={`${action} disabled:pointer-events-none disabled:opacity-60`}
        >
          {working && status.action === 'export' ? 'Exporting…' : 'Export'}
        </button>

        <label
          className={`${action} cursor-pointer outline-offset-2 has-focus-visible:outline-2 has-focus-visible:outline-blue-500 has-disabled:pointer-events-none has-disabled:opacity-60`}
        >
          {working && status.action === 'import' ? 'Importing…' : 'Import'}
          <input
            type="file"
            accept=".json,application/json"
            disabled={working}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              // Emptied at once, so picking the same file again is still a change.
              event.target.value = ''
              if (file !== undefined) onImport(file)
            }}
          />
        </label>
      </div>

      {/* Always there, so what is put in it is read out; empty, it takes no room. */}
      <div role="status">
        {status.state === 'done' && <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{status.message}</p>}
      </div>
      {status.state === 'failed' && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {status.message}
        </p>
      )}
    </section>
  )
}
