import {
  DndContext,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useRef, useState, type KeyboardEvent } from 'react'
import type { Placement, Subtask, SubtaskId, Repeat } from '../../core'
import { NestedMouseSensor, NestedTouchSensor, nestedDragArea } from '../dragSensors'
import { placementFor } from '../taskDrop'
import { SubtaskDraft } from './SubtaskDraft'
import { SubtaskItem, subtaskRow } from './SubtaskItem'

interface SubtaskListProps {
  subtasks: readonly Subtask[]
  /** The rule of the task these belong to: a tick is only read against its occurrence. */
  repeat: Repeat | null
  now: Date
  taskTitle: string
  /** Adds at `index`: the foot of the list from the add box, under an item from a line Enter opened. */
  onAdd: (index: number, title: string) => void
  onSetDone: (subtaskId: SubtaskId, done: boolean) => void
  onRename: (subtaskId: SubtaskId, title: string) => void
  onRemove: (subtaskId: SubtaskId) => void
  /** Puts an item just before or just after another — what a drag and drop asks for. */
  onMove: (subtaskId: SubtaskId, targetId: SubtaskId, placement: Placement) => void
}

/**
 * An item only ever changes places within its own list, so it rides straight up
 * and down: sideways it would look like it could leave the checklist, which it
 * cannot.
 */
const straightUpAndDown: Modifier = ({ transform }) => ({ ...transform, x: 0 })

/**
 * The checklist, and the line that adds to it.
 *
 * The box keeps its focus after each Enter, so a list can be typed straight
 * down rather than clicked back into item by item. It does not take the caret
 * on the way in: the checklist comes up with the row now, on any click into the
 * task, and a list that grabbed the keyboard every time would be reaching for
 * something it had not been asked for.
 *
 * Which item is open for editing, and where a blank line is open, are held here
 * rather than by each item, so the caret can be handed along the list: Enter in
 * an item opens a line under it, and Backspace in an emptied one takes it away
 * and opens its neighbour.
 *
 * The items are also dragged among themselves, which is a drag of its own inside
 * the one the row behind it belongs to: the list brings its own context rather
 * than asking for one, so a checklist reorders wherever it is drawn — a row on a
 * wide screen, a sheet on a phone.
 */
export function SubtaskList({
  subtasks,
  repeat,
  now,
  taskTitle,
  onAdd,
  onSetDone,
  onRename,
  onRemove,
  onMove,
}: SubtaskListProps) {
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<SubtaskId | null>(null)
  // Where the blank line sits: the index the item typed into it will take.
  const [draftIndex, setDraftIndex] = useState<number | null>(null)
  const addInput = useRef<HTMLInputElement>(null)
  const isEmpty = subtasks.length === 0

  // Only ever closing the item that asked: a blur arriving after the caret has
  // already been handed to a neighbour must not close the neighbour.
  function handleEditEnd(subtaskId: SubtaskId) {
    setEditingId((current) => (current === subtaskId ? null : current))
  }

  /**
   * The caret goes back to the item above. The first item has none, so it goes
   * to the one that takes its place, and to the add box once nothing is left.
   */
  function handleBackspaceWhenEmpty(subtaskId: SubtaskId) {
    const index = subtasks.findIndex((subtask) => subtask.id === subtaskId)
    const neighbour = index > 0 ? subtasks[index - 1] : subtasks[index + 1]

    onRemove(subtaskId)
    openForEditing(neighbour?.id ?? null)
  }

  function handleEnter(subtaskId: SubtaskId) {
    const index = subtasks.findIndex((subtask) => subtask.id === subtaskId)
    setDraftIndex(index + 1)
  }

  function handleDraftAdd(title: string) {
    if (draftIndex === null) return
    onAdd(draftIndex, title)
    setDraftIndex(draftIndex + 1)
  }

  /** An empty blank line taken back with Backspace hands the caret to the item above it. */
  function handleDraftBackspace() {
    const above = draftIndex === null ? undefined : subtasks[draftIndex - 1]
    setDraftIndex(null)
    openForEditing(above?.id ?? null)
  }

  /** With nothing to open, the caret goes to the add box rather than being dropped. */
  function openForEditing(subtaskId: SubtaskId | null) {
    setEditingId(subtaskId)
    if (subtaskId === null) addInput.current?.focus()
  }

  // As in ../components/AddTaskForm, Enter is the only way to submit: there is
  // no button, and handling the key directly keeps that the single path.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      const trimmed = title.trim()
      if (trimmed.length === 0) return
      onAdd(subtasks.length, trimmed)
      setTitle('')
      return
    }

    if (event.key === 'Escape' && title.length > 0) {
      // Clearing what is half-typed before the row's own Escape handling can
      // reach anything behind it.
      event.stopPropagation()
      setTitle('')
    }
  }

  // The row this checklist sits in is picked up the same way, so an item asks for
  // the same press: a few pixels with a mouse, a held moment with a finger.
  const sensors = useSensors(
    useSensor(NestedMouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(NestedTouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function titleOf(id: string): string {
    return subtasks.find((subtask) => subtask.id === id)?.title ?? 'item'
  }

  /** Where an item is, as a person counts: the defaults would read out its UUID. */
  function placeOf(id: string): string {
    return `position ${String(subtasks.findIndex((subtask) => subtask.id === id) + 1)} of ${String(subtasks.length)}`
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up "${titleOf(String(active.id))}", ${placeOf(String(active.id))}.`,
    onDragOver: ({ active, over }) =>
      over === null
        ? `"${titleOf(String(active.id))}" is not over the checklist.`
        : `"${titleOf(String(active.id))}" is over ${placeOf(String(over.id))}.`,
    onDragEnd: ({ active, over }) =>
      over === null
        ? `"${titleOf(String(active.id))}" dropped.`
        : `"${titleOf(String(active.id))}" dropped at ${placeOf(String(over.id))}.`,
    onDragCancel: ({ active }) => `Moving "${titleOf(String(active.id))}" was cancelled.`,
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over === null) return
    const from = subtasks.findIndex((subtask) => subtask.id === active.id)
    const to = subtasks.findIndex((subtask) => subtask.id === over.id)
    if (from === -1 || to === -1 || from === to) return

    onMove(String(active.id), String(over.id), placementFor(from, to))
  }

  const rows = subtasks.map((subtask) => (
    <SubtaskItem
      key={subtask.id}
      subtask={subtask}
      repeat={repeat}
      now={now}
      taskTitle={taskTitle}
      isEditing={subtask.id === editingId}
      onEditStart={setEditingId}
      onEditEnd={handleEditEnd}
      onSetDone={onSetDone}
      onRename={onRename}
      onRemove={onRemove}
      onEnter={handleEnter}
      onBackspaceWhenEmpty={handleBackspaceWhenEmpty}
    />
  ))
  // A sibling under one key rather than a child of the item above, so adding an
  // item in front of it does not remount it and take the caret away.
  if (draftIndex !== null) {
    rows.splice(
      draftIndex,
      0,
      <SubtaskDraft
        key="draft"
        taskTitle={taskTitle}
        onAdd={handleDraftAdd}
        onClose={() => { setDraftIndex(null) }}
        onBackspaceWhenEmpty={handleDraftBackspace}
      />,
    )
  }

  return (
    // Marked as its own drag area, so a press on an item is not the row behind
    // the checklist being picked up (CHK-28).
    <div {...nestedDragArea}>
      {!isEmpty && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[straightUpAndDown]}
          accessibility={{ announcements }}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={subtasks.map((subtask) => subtask.id)} strategy={verticalListSortingStrategy}>
            <ul aria-label={`Checklist for "${taskTitle}"`} className="flex flex-col">
              {rows}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className={subtaskRow}>
        <span aria-hidden="true" className="w-7 shrink-0 text-center text-base leading-none text-neutral-400 md:w-5 md:text-sm dark:text-neutral-500">
          +
        </span>

        <input
          ref={addInput}
          type="text"
          name="subtask-title"
          value={title}
          onChange={(event) => { setTitle(event.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder="Add subtask"
          aria-label={`Add a subtask to "${taskTitle}"`}
          autoComplete="off"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none md:text-sm dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </div>
    </div>
  )
}
