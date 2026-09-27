/**
 * The line of controls at the foot of a page on a phone, under the list it
 * belongs to: a way on the bottom bar has no tab for (the lists, the trash),
 * and the View settings button that has no add box to stand beside (UI-46).
 * Each names itself in words rather than an icon alone, and is a thumb's
 * height tall.
 */
export const footLink =
  'flex min-h-11 items-center gap-2 rounded-lg px-3 text-base text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100 dark:active:bg-neutral-800/60'

/** Lit while its panel is open, so it is plain what the panel belongs to. */
export const footLinkOpen = 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800/60 dark:text-neutral-100'
