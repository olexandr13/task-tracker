import { ContactIcon } from './ContactIcon'

/** The author's Telegram account, by its handle. */
export const TELEGRAM_HANDLE = 'olexandr13'

/**
 * What Settings' **Contact** section holds (UI-87): a sentence on what to write
 * about, and the link that opens the author's Telegram in a new tab, drawn as
 * the page's other buttons are (BackupActions).
 */
export function TelegramLink() {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        A question, an idea, or something that does not work? Write to the author on Telegram.
      </p>
      <a
        href={`https://t.me/${TELEGRAM_HANDLE}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Write to the author on Telegram, @${TELEGRAM_HANDLE}`}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 px-4 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 md:min-h-0 md:px-3 md:py-1.5 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 dark:active:bg-neutral-800"
      >
        <ContactIcon className="size-4 shrink-0 text-sky-500 dark:text-sky-400" />
        Write on Telegram, @{TELEGRAM_HANDLE}
      </a>
    </div>
  )
}
