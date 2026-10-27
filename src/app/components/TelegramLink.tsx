import { ContactIcon } from './ContactIcon'

/** The author's Telegram account, by its handle. */
export const TELEGRAM_HANDLE = 'olexandr13'

const link =
  'grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-sky-500 active:bg-neutral-200/70 dark:text-neutral-500 dark:hover:bg-neutral-700/60 dark:hover:text-sky-400 dark:active:bg-neutral-700/60'

/**
 * The speech bubble that opens the author's Telegram in a new tab (UI-87): beside
 * the logo in the sidebar, and under the links on More's page on a phone.
 */
export function TelegramLink({ className }: { className?: string }) {
  return (
    <a
      href={`https://t.me/${TELEGRAM_HANDLE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Write to the author on Telegram, @${TELEGRAM_HANDLE}`}
      title={`Telegram: @${TELEGRAM_HANDLE}`}
      className={`${link}${className === undefined ? '' : ` ${className}`}`}
    >
      <ContactIcon className="size-4 shrink-0" />
    </a>
  )
}
