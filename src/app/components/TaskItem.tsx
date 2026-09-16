import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import {
  countSubtasks,
  hasDescription,
  hasSubtasks,
  isComplete,
  isOverdue,
  type LocalDay,
  type Repeat,
  type SubtaskId,
  type Task,
  type TaskId,
} from '../../core'
import { toDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { describeDoneUntil } from '../repeatLabels'
import { useSortableTask } from '../useSortableTask'
import { ChecklistIcon } from './ChecklistIcon'
import { DuePicker } from './DuePicker'
import { GripIcon } from './GripIcon'
import { NoteIcon } from './NoteIcon'
import { RepeatPicker } from './RepeatPicker'
import { SubtaskList } from './SubtaskList'
import { TaskDescription } from './TaskDescription'

interface TaskItemProps {
  task: Task
  now: Date
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  onRename: (id: TaskId, title: string) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  onChangeRepeat: (id: TaskId, repeat: Repeat | null) => void
  onRemove: (id: TaskId) => void
  onAddSubtask: (id: TaskId, index: number, title: string) => void
  onSetSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  onRenameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  onRemoveSubtask: (id: TaskId, subtaskId: SubtaskId) => void
}

const checkbox =
  'grid size-5 shrink-0 place-items-center rounded-md border-2 text-xs leading-none transition-colors'

/** The title and the box that replaces it sit in the same space, so nothing shifts. */
const titleBox = 'min-w-0 flex-1 text-left text-sm'

/**
 * Where the title starts, and so where everything the row holds lines up: the
 * row's own padding, the completion box, and the gap between them.
 */
const indent = 'pl-10'

/** Shares the shape of the repeat button beside them: small controls, not a row. */
const rowButton = 'flex h-6 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm leading-none transition-colors'
const rowButtonOn = 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 dark:text-blue-400'
/** Sits in the page's gutter, just left of the row's border. */
const grip =
  'absolute top-1 -left-4 grid h-6 w-4 cursor-grab place-items-center rounded text-neutral-400 transition-opacity hover:text-neutral-900 active:cursor-grabbing dark:text-neutral-500 dark:hover:text-neutral-100'

const rowButtonOff =
  'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'

export function TaskItem({
  task,
  now,
  onComplete,
  onUncomplete,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onChangeRepeat,
  onRemove,
  onAddSubtask,
  onSetSubtaskDone,
  onRenameSubtask,
  onRemoveSubtask,
}: TaskItemProps) {
  const done = isComplete(task, now)
  const checklist = countSubtasks(task, now)
  // The picker edits a draft; every change is saved straight away, so there is
  // no separate confirm step and nothing to lose by closing the panel.
  const [draft, setDraft] = useState(() => toDraft(task.repeat, now))
  // Null unless the title is being edited. The text lives here rather than in the
  // task while it is being typed, so an abandoned edit leaves nothing behind.
  const [editedTitle, setEditedTitle] = useState<string | null>(null)
  // A row at rest is a task, not a toolbar: its controls appear once you click
  // into it. What is already set stays on show regardless, being information
  // about the task rather than only a way of changing it.
  const [isActive, setIsActive] = useState(false)
  // What the woken row is showing. Both come up with it — clicking a task is
  // asking to see the whole of it, not to be handed two more buttons to press —
  // and either can be put away again without leaving the row.
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const row = useRef<HTMLLIElement>(null)
  const sortable = useSortableTask(task, now)
  const isEditing = editedTitle !== null

  useEffect(() => {
    const element = input.current
    if (element === null) return

    element.focus()
    // Caret at the end rather than the whole title selected: an edit is usually a
    // tweak to what is already there, not a rewrite.
    element.setSelectionRange(element.value.length, element.value.length)
  }, [isEditing])

  useEffect(() => {
    if (!isActive) return

    function handlePointerDown(event: PointerEvent) {
      if (!row.current?.contains(event.target as Node)) rest()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isActive])

  /**
   * Opening the row: its controls come out and it shows what it holds. Clicks
   * inside an already-woken row change nothing, so a button that closes one of
   * the two is not undone by the same click reaching the row beneath it.
   */
  function wake() {
    if (isActive) return
    setIsActive(true)
    setIsChecklistOpen(true)
    setIsDescriptionOpen(true)
  }

  /** Letting it rest again, and putting away what it was showing. */
  function rest() {
    setIsActive(false)
    setIsChecklistOpen(false)
    setIsDescriptionOpen(false)
  }

  /**
   * Keyboard focus wakes the row, so its controls can be tabbed to at all; a
   * mouse click is left to the row's own pointer handler, which ignores the
   * completion box.
   */
  function handleFocus(event: FocusEvent<HTMLElement>) {
    if (event.target.matches(':focus-visible')) wake()
  }

  /** Tabbing out rests the row; moving between its own controls does not. */
  function handleBlur(event: FocusEvent<HTMLLIElement>) {
    if (event.relatedTarget !== null && !event.currentTarget.contains(event.relatedTarget)) {
      rest()
    }
  }

  function handleRepeatChange(next: RepeatDraft) {
    setDraft(next)
    onChangeRepeat(task.id, toRepeat(next))
  }

  /** Keeping the edit. An empty box is an abandoned edit, not a nameless task. */
  function commitEdit() {
    const trimmed = editedTitle?.trim() ?? ''
    if (trimmed.length > 0) {
      onRename(task.id, trimmed)
    }
    setEditedTitle(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
      return
    }

    if (event.key === 'Escape') {
      // Dropping the edit unmounts the box, so the blur that follows cannot save it.
      event.stopPropagation()
      setEditedTitle(null)
    }
  }

  return (
    <li
      ref={(element) => {
        row.current = element
        sortable.setNodeRef(element)
      }}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      // A mouse or a finger can pick the row up anywhere; the keyboard only from
      // its grip, which is where these listeners check a key press came from.
      {...sortable.listeners}
      // On the click rather than the press: waking the row moves the buttons
      // along, and a press that moves what is under it never becomes a click.
      onClick={wake}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        sortable.listeners?.onKeyDown?.(event)
        // Panels and edit boxes stop Escape before it reaches here, so this only
        // ever rests a row that has nothing of its own open — or cancels a drag,
        // which should leave the row as it was.
        if (event.key === 'Escape' && !sortable.isDragging) rest()
      }}
      className={
        sortable.isDragging
          ? 'group relative z-10 rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900'
          : 'group relative rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
      }
    >
      {/* In the gutter left of the row, so it takes nothing from the row itself.
          Shown on hover and on the woken row, where the keyboard reaches it. */}
      <button
        type="button"
        ref={sortable.setActivatorNodeRef}
        {...sortable.attributes}
        aria-label={`Move "${task.title}"`}
        title="Drag to move"
        className={
          isActive || sortable.isDragging
            ? `${grip} opacity-100`
            : `${grip} opacity-0 group-hover:opacity-100 focus-visible:opacity-100`
        }
      >
        <GripIcon className="size-3.5" />
      </button>

      <div className="flex items-center gap-2.5 px-2.5 py-1">
        <button
          type="button"
          onClick={(event) => {
            // Ticking a task off is not engaging with it: the row stays as it was.
            event.stopPropagation()
            if (done) onUncomplete(task.id)
            else onComplete(task.id)
          }}
          aria-pressed={done}
          aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          className={
            done
              ? `${checkbox} border-green-600 bg-green-600 text-white hover:border-green-700 hover:bg-green-700`
              : `${checkbox} border-neutral-300 text-transparent hover:border-neutral-900 dark:border-neutral-600 dark:hover:border-neutral-300`
          }
        >
          ✓
        </button>

        {editedTitle === null ? (
          <button
            type="button"
            onClick={() => { setEditedTitle(task.title) }}
            aria-label={`Edit "${task.title}"`}
            className={
              done
                ? `${titleBox} cursor-text break-words text-neutral-400 line-through dark:text-neutral-600`
                : `${titleBox} cursor-text break-words text-neutral-900 dark:text-neutral-100`
            }
          >
            {task.title}
          </button>
        ) : (
          <input
            ref={input}
            type="text"
            value={editedTitle}
            onChange={(event) => { setEditedTitle(event.target.value) }}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            aria-label={`Title of "${task.title}"`}
            autoComplete="off"
            enterKeyHint="done"
            className={`${titleBox} bg-transparent text-neutral-900 focus:outline-none dark:text-neutral-100`}
          />
        )}

        {done && task.repeat !== null && !isEditing && (
          <span className="hidden shrink-0 text-xs text-neutral-400 sm:inline dark:text-neutral-500">
            {describeDoneUntil(task.repeat)}
          </span>
        )}

        {/* A repeating task is due on its rule's days, so only a one-off has a date to set. */}
        {task.repeat === null && (task.dueDate !== null || isActive) && (
          <DuePicker
            dueDate={task.dueDate}
            now={now}
            overdue={isOverdue(task, now)}
            onChange={(dueDate) => { onChangeDueDate(task.id, dueDate) }}
            label={`Due date for "${task.title}"`}
          />
        )}

        {(task.repeat !== null || isActive) && (
          <RepeatPicker draft={draft} onChange={handleRepeatChange} label={`Repeat for "${task.title}"`} />
        )}

        {(hasSubtasks(task) || isActive) && (
          <button
            type="button"
            onClick={() => { setIsChecklistOpen(!isChecklistOpen) }}
            aria-expanded={isChecklistOpen}
            aria-label={
              hasSubtasks(task)
                ? `Checklist for "${task.title}": ${String(checklist.done)} of ${String(checklist.total)} done`
                : `Add a checklist to "${task.title}"`
            }
            title={hasSubtasks(task) ? `${String(checklist.done)}/${String(checklist.total)} done` : 'Add a checklist'}
            className={hasSubtasks(task) ? `${rowButton} ${rowButtonOn}` : `${rowButton} ${rowButtonOff}`}
          >
            <ChecklistIcon />
            {/* The count is a hint, and a narrow row would rather have the title:
                the button itself stays, tinted, and its name still reads it out. */}
            {hasSubtasks(task) && (
              <span className="hidden sm:inline">
                {checklist.done}/{checklist.total}
              </span>
            )}
          </button>
        )}

        {(hasDescription(task) || isActive) && (
          <button
            type="button"
            onClick={() => { setIsDescriptionOpen(!isDescriptionOpen) }}
            aria-expanded={isDescriptionOpen}
            aria-label={
              hasDescription(task) ? `Description of "${task.title}"` : `Add a description to "${task.title}"`
            }
            title={hasDescription(task) ? 'Description' : 'Add a description'}
            className={hasDescription(task) ? `${rowButton} ${rowButtonOn}` : `${rowButton} ${rowButtonOff}`}
          >
            <NoteIcon />
          </button>
        )}

        {/* Always on show, and last, so it keeps its place as the row wakes and rests. */}
        <button
          type="button"
          onClick={(event) => {
            // Deleting is not engaging with the task either: the row is on its way out.
            event.stopPropagation()
            onRemove(task.id)
          }}
          aria-label={`Delete "${task.title}"`}
          className="flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          ×
        </button>
      </div>

      {/* Indented to start where the title does, so it reads as part of the same row. */}
      {isChecklistOpen && (
        <div className={`border-t border-neutral-200 py-1 pr-2.5 ${indent} dark:border-neutral-800`}>
          <SubtaskList
            subtasks={task.subtasks}
            repeat={task.repeat}
            now={now}
            taskTitle={task.title}
            onAdd={(index, title) => { onAddSubtask(task.id, index, title) }}
            onSetDone={(subtaskId, done) => { onSetSubtaskDone(task.id, subtaskId, done) }}
            onRename={(subtaskId, title) => { onRenameSubtask(task.id, subtaskId, title) }}
            onRemove={(subtaskId) => { onRemoveSubtask(task.id, subtaskId) }}
          />
        </div>
      )}

      {isDescriptionOpen && (
        <div className={`border-t border-neutral-200 py-1.5 pr-2.5 ${indent} dark:border-neutral-800`}>
          <TaskDescription
            description={task.description}
            title={task.title}
            onChange={(description) => { onChangeDescription(task.id, description) }}
          />
        </div>
      )}
    </li>
  )
}
