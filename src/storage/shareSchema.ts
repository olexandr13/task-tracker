import { isEmailAddress, MAX_SHARED_WITH, normalizeEmail, type ListId, type ListOwner } from '../core'
import { isRecord } from './plainData'

/**
 * The saved shape of a list's sharing: whose list it is and who else sees it
 * (STORE-66). Its own version, apart from the list's: the list is the owner's
 * record, this one is between accounts, and neither reaches into the other.
 * Bump this whenever the shape below changes, and upgrade on reading.
 */
export const SHARE_SCHEMA_VERSION = 1

/** Who one list is shared with, and whose it is. */
export interface ListShare {
  readonly listId: ListId
  readonly owner: ListOwner
  /** Email addresses, lowercase, in the order they were added; never the owner's. */
  readonly members: readonly string[]
}

/**
 * Kept flat, the owner beside the list, so the access rules (`firestore.rules`)
 * read each field by one name: `share.ownerId`, `share.members`.
 */
export interface StoredShare {
  version: number
  share: {
    listId: ListId
    ownerId: string
    ownerEmail: string
    ownerName: string | null
    members: string[]
  }
}

export function toStoredShare({ listId, owner, members }: ListShare): StoredShare {
  return {
    version: SHARE_SCHEMA_VERSION,
    share: { listId, ownerId: owner.id, ownerEmail: owner.email, ownerName: owner.name, members: [...members] },
  }
}

/**
 * A saved share in today's shape, or null when it can't be trusted — an unknown
 * version, or anything in it that is not what it should be. One that cannot be
 * read shares nothing, and is left as it is.
 */
export function readShare(data: unknown): ListShare | null {
  if (!isRecord(data) || data.version !== SHARE_SCHEMA_VERSION || !isRecord(data.share)) return null

  const { listId, ownerId, ownerEmail, ownerName, members } = data.share
  if (
    typeof listId !== 'string' ||
    listId === '' ||
    typeof ownerId !== 'string' ||
    ownerId === '' ||
    typeof ownerEmail !== 'string' ||
    !isEmailAddress(ownerEmail) ||
    (ownerName !== null && typeof ownerName !== 'string') ||
    !Array.isArray(members) ||
    members.length > MAX_SHARED_WITH ||
    !members.every((member) => typeof member === 'string' && isEmailAddress(member) && member === normalizeEmail(member))
  ) {
    return null
  }

  return {
    listId,
    owner: { id: ownerId, email: ownerEmail, name: ownerName },
    members: members as string[],
  }
}
