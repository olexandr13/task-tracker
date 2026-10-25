import { useHoldPageSnapshot } from '../pageSnapshot'

interface LoadingProps {
  /** `page` stands in for a page's content; `line` for one setting among others. */
  size?: 'page' | 'line'
}

const SIZE_CLASSES = {
  page: 'py-10 text-center text-neutral-400 dark:text-neutral-600',
  line: 'px-2 py-2 text-sm text-neutral-400 dark:text-neutral-500',
}

/**
 * What stands where something the account holds is still on its way (TASK-20),
 * rather than an empty list or a switch drawn on a guess. While any is on
 * screen, a reload's picture of the page stays up over it (UI-86).
 */
export function Loading({ size = 'page' }: LoadingProps) {
  useHoldPageSnapshot()
  return <p className={SIZE_CLASSES[size]}>Loading…</p>
}
