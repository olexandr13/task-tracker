import { describe, expect, it } from 'vitest'
import { dropOutcome, isListDrop, listDropId, type ListDrop } from './taskDrop'

/* What letting go of a dragged task does. TASK ids refer to wiki/tasks.md, LST ids to wiki/lists.md. */

const ORDER = ['a', 'b', 'c']
const WORK: ListDrop = { kind: 'list', listId: 'work-id', name: 'Work' }
const INBOX: ListDrop = { kind: 'list', listId: null, name: 'Inbox' }

describe('dropOutcome', () => {
  it('files the task in a list it is dropped on (LST-25)', () => {
    expect(dropOutcome('b', { id: listDropId('work-id'), data: WORK }, ORDER)).toEqual({
      kind: 'file',
      id: 'b',
      listId: 'work-id',
    })
  })

  it('takes the task out of its list when dropped on the Inbox (LST-25)', () => {
    expect(dropOutcome('b', { id: listDropId(null), data: INBOX }, ORDER)).toEqual({ kind: 'file', id: 'b', listId: null })
  })

  it('puts a task dragged down below the row it is dropped on, and one dragged up above it (TASK-37)', () => {
    expect(dropOutcome('a', { id: 'c', data: {} }, ORDER)).toEqual({ kind: 'move', id: 'a', targetId: 'c', placement: 'after' })
    expect(dropOutcome('c', { id: 'a', data: {} }, ORDER)).toEqual({ kind: 'move', id: 'c', targetId: 'a', placement: 'before' })
  })

  it('does nothing dropped on itself, on nothing, or on a row not shown', () => {
    expect(dropOutcome('b', { id: 'b', data: {} }, ORDER)).toBeNull()
    expect(dropOutcome('b', null, ORDER)).toBeNull()
    expect(dropOutcome('b', { id: 'gone', data: {} }, ORDER)).toBeNull()
  })
})

describe('listDropId', () => {
  it('never takes the shape of a task id, the Inbox included', () => {
    expect(listDropId(null)).toBe('list-drop:inbox')
    expect(listDropId('work-id')).toBe('list-drop:work-id')
  })
})

describe('isListDrop', () => {
  it('tells a list from a row', () => {
    expect(isListDrop(WORK)).toBe(true)
    expect(isListDrop({ sortable: {} })).toBe(false)
    expect(isListDrop(undefined)).toBe(false)
  })
})
