import { MAX_SHARED_WITH, type List, type ListOwner, type ShareRefusal } from '../core'

/** What the people a list is shared with call its owner: their name, or failing that their address. */
export function ownerLabel(owner: ListOwner): string {
  return owner.name ?? owner.email
}

/**
 * The line under a shared list's name on the Lists page (LST-35): whose it is
 * when it is someone else's, whom it is shared with when it is the account's
 * own, and nothing for a list no one else sees.
 */
export function sharedNote(list: List): string | null {
  if (list.sharedBy !== null) return `Shared by ${ownerLabel(list.sharedBy)}`

  const [first] = list.sharedWith
  if (first === undefined) return null
  return list.sharedWith.length === 1 ? `Shared with ${first}` : `Shared with ${String(list.sharedWith.length)} people`
}

/** Why an address was not added to the people a list is shared with, said under the box it was typed in (LST-28). */
export const SHARE_REFUSALS: Readonly<Record<ShareRefusal, string>> = {
  notEmail: 'That is not an email address.',
  self: 'That is your own address. The list is yours already.',
  already: 'The list is shared with them already.',
  full: `A list can be shared with at most ${String(MAX_SHARED_WITH)} people.`,
  notOwner: 'Only the owner of this list can share it.',
}
