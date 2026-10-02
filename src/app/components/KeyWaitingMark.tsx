/**
 * A key is waiting, said wherever the Chest is navigated from (CHST-22). A dot,
 * with the words behind it for a screen reader: a mark that is only a colour
 * says nothing to someone who cannot see it, and nothing at all when it is the
 * one thing on the page worth noticing.
 */
export function KeyWaitingMark({ className }: { className?: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full bg-amber-500 dark:bg-amber-400 ${className ?? ''}`}
      />
      <span className="sr-only">a key is waiting</span>
    </>
  )
}
