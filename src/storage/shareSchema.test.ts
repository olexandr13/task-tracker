import { describe, expect, it } from 'vitest'
import { readShare, SHARE_SCHEMA_VERSION, toStoredShare, type ListShare } from './shareSchema'

const SHARE: ListShare = {
  listId: 'list-1',
  owner: { id: 'owner-account', email: 'owner@example.com', name: 'Olek' },
  members: ['anna@example.com', 'bob@example.com'],
}

describe('reading a saved share', () => {
  it('reads back what it wrote', () => {
    expect(readShare(toStoredShare(SHARE))).toEqual(SHARE)
  })

  it('keeps the owner flat beside the list, as the access rules read it', () => {
    expect(toStoredShare(SHARE)).toEqual({
      version: SHARE_SCHEMA_VERSION,
      share: {
        listId: 'list-1',
        ownerId: 'owner-account',
        ownerEmail: 'owner@example.com',
        ownerName: 'Olek',
        members: ['anna@example.com', 'bob@example.com'],
      },
    })
  })

  it('reads an owner with no name', () => {
    const nameless = { ...SHARE, owner: { ...SHARE.owner, name: null } }
    expect(readShare(toStoredShare(nameless))).toEqual(nameless)
  })

  it('refuses a version it does not know, or anything that is not a share', () => {
    expect(readShare({ ...toStoredShare(SHARE), version: SHARE_SCHEMA_VERSION + 1 })).toBe(null)
    expect(readShare(null)).toBe(null)
    expect(readShare({ version: SHARE_SCHEMA_VERSION })).toBe(null)
  })

  it('refuses a share whose fields are not what they should be', () => {
    const stored = toStoredShare(SHARE).share
    const broken: unknown[] = [
      { ...stored, listId: '' },
      { ...stored, ownerId: 42 },
      { ...stored, ownerEmail: 'nobody' },
      { ...stored, ownerName: 7 },
      { ...stored, members: 'anna@example.com' },
      { ...stored, members: ['anna'] },
      { ...stored, members: ['Anna@Example.com'] },
    ]

    for (const share of broken) {
      expect(readShare({ version: SHARE_SCHEMA_VERSION, share })).toBe(null)
    }
  })
})
