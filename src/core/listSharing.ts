/**
 * Sharing a list: its owner names other people by email address, and the list
 * and every task in it are theirs to see as well — to add to, change, tick off
 * and delete, as the owner does (LST-27).
 *
 * Who a list is shared with is carried on the list itself (`sharedWith`), and
 * whose it is when it is someone else's (`sharedBy`), so everything that shows
 * a list can tell a shared one without asking anywhere else. Neither is part of
 * the list's own record: storage keeps them apart and reads them back on.
 *
 * Only the owner shares a list or stops sharing it. Someone it is shared with
 * can only leave it, which is removing it from their own lists (LST-30).
 */

import type { List } from './list'

/** As long as an email address can be. */
export const MAX_EMAIL_LENGTH = 254

/** As many people as one list is shared with. */
export const MAX_SHARED_WITH = 50

/**
 * Whether `text` reads as an email address: something, an @, and a domain with
 * a dot in it, with no spaces. Whether anyone has it is for them to show by
 * signing in with it.
 */
export function isEmailAddress(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length <= MAX_EMAIL_LENGTH && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(trimmed)
}

/** An address as it is kept and compared: trimmed and lowercase, case never making another mailbox. */
export function normalizeEmail(text: string): string {
  return text.trim().toLowerCase()
}

/** Whether the list is the account's own, rather than someone else's shared with it. */
export function isOwnList(list: List): boolean {
  return list.sharedBy === null
}

/** Whether anyone but one account sees the list: shared by its owner, or shared with this account. */
export function isShared(list: List): boolean {
  return list.sharedBy !== null || list.sharedWith.length > 0
}

/** Why an address cannot be added to the people a list is shared with. */
export type ShareRefusal =
  /** It does not read as an email address. */
  | 'notEmail'
  /** It is the owner's own. */
  | 'self'
  /** The list is shared with it already. */
  | 'already'
  /** The list is shared with as many people as it can be. */
  | 'full'
  /** The list is someone else's: only they share it. */
  | 'notOwner'

/**
 * Why the list cannot be shared with `email`, or null when it can. `ownEmail`
 * is the owner's address, which there is no sharing a list with.
 */
export function shareRefusal(list: List, email: string, ownEmail: string | null): ShareRefusal | null {
  if (!isOwnList(list)) return 'notOwner'
  if (!isEmailAddress(email)) return 'notEmail'

  const address = normalizeEmail(email)
  if (ownEmail !== null && normalizeEmail(ownEmail) === address) return 'self'
  if (list.sharedWith.includes(address)) return 'already'
  if (list.sharedWith.length >= MAX_SHARED_WITH) return 'full'
  return null
}

/**
 * Shares the list with one more person, last among them. Whatever
 * `shareRefusal` refuses — the owner's own address aside, which only the
 * caller knows — hands back the very same list.
 */
export function shareList(list: List, email: string): List {
  if (shareRefusal(list, email, null) !== null) return list
  return { ...list, sharedWith: [...list.sharedWith, normalizeEmail(email)] }
}

/**
 * Stops sharing the list with one person: it and its tasks are gone from their
 * lists. Hands back the very same list when it was not shared with them, or is
 * not the account's own to change.
 */
export function unshareList(list: List, email: string): List {
  const address = normalizeEmail(email)
  if (!isOwnList(list) || !list.sharedWith.includes(address)) return list
  return { ...list, sharedWith: list.sharedWith.filter((member) => member !== address) }
}
