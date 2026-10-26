import { FieldPath, type DocumentReference, type QueryDocumentSnapshot, type WriteBatch } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { appendTask, createTask, moveTask, type Task } from '../core'
import { deleteRecord, readRecords, writeRecord, type RecordKind } from './firestoreRecords'
import { readStoredTask, SCHEMA_VERSION, toStoredTask } from './taskSchema'

/*
 * How a change to a record already read is written (STORE-16): against what
 * this device read of it, without Firestore itself — the batch and the
 * documents are stand-ins that keep what they are asked. STORE ids refer to
 * wiki/storage.md.
 */

const TASK: RecordKind<Task> = { noun: 'task', read: readStoredTask, write: toStoredTask }
const AT = new Date('2026-10-25T09:00:00Z')

interface Asked {
  readonly kind: 'set' | 'update' | 'delete'
  readonly path: string
  readonly args: readonly unknown[]
}

function standInBatch(): { batch: WriteBatch; asked: Asked[] } {
  const asked: Asked[] = []
  const keep = (kind: Asked['kind']) => (ref: DocumentReference, ...args: unknown[]) => {
    asked.push({ kind, path: ref.path, args })
  }
  return { batch: { set: keep('set'), update: keep('update'), delete: keep('delete') } as unknown as WriteBatch, asked }
}

/** A document of the account `account`, which no other test reads or writes. */
function at(account: string, task: Task): DocumentReference {
  return { path: `users/${account}/tasks/${task.id}` } as DocumentReference
}

function read(ref: DocumentReference, task: Task): Task[] {
  const saved = { id: ref.path.split('/').pop(), ref, data: () => structuredClone(toStoredTask(task)) }
  return readRecords([saved as unknown as QueryDocumentSnapshot], TASK)
}

function twoTasks(): Task[] {
  return appendTask(appendTask([], createTask('Write', null, AT)), createTask('Call', null, AT))
}

describe('writing a record already read (STORE-16)', () => {
  it('writes a moved task’s place alone', () => {
    const tasks = twoTasks()
    const ref = at('moved', tasks[1]!)
    read(ref, tasks[1]!)
    const moved = moveTask(tasks, tasks[1]!.id, tasks[0]!.id, 'before')
    const { batch, asked } = standInBatch()

    writeRecord(batch, ref, TASK, moved[1]!)

    expect(asked).toHaveLength(1)
    expect(asked[0]!.kind).toBe('update')
    const [field, value, ...more] = asked[0]!.args
    expect((field as FieldPath).isEqual(new FieldPath('task', 'order'))).toBe(true)
    expect(value).toBe(moved[1]!.order)
    expect(more).toEqual([])
  })

  it('writes nothing when it is as it was read', () => {
    const [task] = twoTasks()
    const ref = at('unchanged', task!)
    read(ref, task!)
    const { batch, asked } = standInBatch()

    writeRecord(batch, ref, TASK, task!)

    expect(asked).toEqual([])
  })

  it('writes a task whole when it was never read here', () => {
    const [task] = twoTasks()
    const { batch, asked } = standInBatch()

    writeRecord(batch, at('new', task!), TASK, task!)

    expect(asked).toEqual([{ kind: 'set', path: `users/new/tasks/${task!.id}`, args: [toStoredTask(task!)] }])
  })

  it('writes a task whole when it was read in an older version (STORE-4)', () => {
    const [task] = twoTasks()
    const ref = at('older', task!)
    const saved = { id: task!.id, ref, data: () => ({ ...toStoredTask(task!), version: SCHEMA_VERSION - 1 }) }
    readRecords([saved as unknown as QueryDocumentSnapshot], TASK)
    const { batch, asked } = standInBatch()

    writeRecord(batch, ref, TASK, task!)

    expect(asked.map((write) => write.kind)).toEqual(['set'])
  })

  it('writes a task whole once it has been deleted here', () => {
    const [task] = twoTasks()
    const ref = at('deleted', task!)
    read(ref, task!)
    const { batch, asked } = standInBatch()

    deleteRecord(batch, ref)
    writeRecord(batch, ref, TASK, task!)

    expect(asked.map((write) => write.kind)).toEqual(['delete', 'set'])
  })
})
