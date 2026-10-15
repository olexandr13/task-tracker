import { describe, expect, it } from 'vitest'
import { createList, type List, type ListOwner } from './list'
import {
  isEmailAddress,
  isOwnList,
  isShared,
  MAX_SHARED_WITH,
  normalizeEmail,
  shareList,
  shareRefusal,
  unshareList,
} from './listSharing'

const AT = new Date('2026-10-15T09:00:00Z')
const OWNER: ListOwner = { id: 'owner-account', email: 'owner@example.com', name: 'Olek' }

function theirs(list: List): List {
  return { ...list, sharedBy: OWNER, sharedWith: ['me@example.com'] }
}

describe('an email address', () => {
  it('reads as one with something, an @, and a domain with a dot', () => {
    expect(isEmailAddress('anna@example.com')).toBe(true)
    expect(isEmailAddress('  anna.k+lists@mail.example.org ')).toBe(true)
  })

  it('does not with the @, the domain or its dot missing, or a space inside', () => {
    expect(isEmailAddress('anna')).toBe(false)
    expect(isEmailAddress('anna@example')).toBe(false)
    expect(isEmailAddress('@example.com')).toBe(false)
    expect(isEmailAddress('an na@example.com')).toBe(false)
    expect(isEmailAddress('')).toBe(false)
  })

  it('is kept trimmed and lowercase: case never makes another mailbox', () => {
    expect(normalizeEmail('  Anna@Example.COM ')).toBe('anna@example.com')
  })
})

describe('sharing a list', () => {
  const groceries = createList('Groceries', AT)

  it('starts every list the account’s own and shared with no one', () => {
    expect(groceries.sharedWith).toEqual([])
    expect(groceries.sharedBy).toBe(null)
    expect(isOwnList(groceries)).toBe(true)
    expect(isShared(groceries)).toBe(false)
  })

  it('adds a person by address, last, as it is kept', () => {
    const shared = shareList(shareList(groceries, 'Anna@Example.com'), 'bob@example.com')

    expect(shared.sharedWith).toEqual(['anna@example.com', 'bob@example.com'])
    expect(isShared(shared)).toBe(true)
    expect(shared.id).toBe(groceries.id)
  })

  it('says why an address will not do, and changes nothing for it', () => {
    const shared = shareList(groceries, 'anna@example.com')

    expect(shareRefusal(shared, 'anna', 'owner@example.com')).toBe('notEmail')
    expect(shareRefusal(shared, 'Owner@example.com', 'owner@example.com')).toBe('self')
    expect(shareRefusal(shared, 'ANNA@example.com', 'owner@example.com')).toBe('already')
    expect(shareRefusal(shared, 'bob@example.com', 'owner@example.com')).toBe(null)
    expect(shareList(shared, 'anna@example.com')).toBe(shared)
    expect(shareList(shared, 'not an address')).toBe(shared)
  })

  it('stops at as many people as a list is shared with', () => {
    const full = { ...groceries, sharedWith: Array.from({ length: MAX_SHARED_WITH }, (_, n) => `p${String(n)}@example.com`) }

    expect(shareRefusal(full, 'one-more@example.com', null)).toBe('full')
    expect(shareList(full, 'one-more@example.com')).toBe(full)
  })

  it('takes a person off again, whatever the case it is typed in', () => {
    const shared = shareList(shareList(groceries, 'anna@example.com'), 'bob@example.com')

    expect(unshareList(shared, 'ANNA@example.com').sharedWith).toEqual(['bob@example.com'])
    expect(unshareList(shared, 'carol@example.com')).toBe(shared)
  })

  it('leaves someone else’s list to them: it is shared and unshared by its owner alone', () => {
    const list = theirs(groceries)

    expect(isOwnList(list)).toBe(false)
    expect(isShared(list)).toBe(true)
    expect(shareRefusal(list, 'bob@example.com', 'me@example.com')).toBe('notOwner')
    expect(shareList(list, 'bob@example.com')).toBe(list)
    expect(unshareList(list, 'me@example.com')).toBe(list)
  })

  it('never modifies the list it was given', () => {
    const before = structuredClone(groceries)
    shareList(groceries, 'anna@example.com')
    expect(groceries).toEqual(before)
  })
})
