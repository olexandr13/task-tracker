import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import {
  countSubtasks,
  hasDescription,
  hasSubtasks,
  hasTags,
  isComplete,
  isOverdue,
  type LocalDay,
  type Repeat,
  type SubtaskId,
  type Task,
  type TaskId,
} from '../../core'
import { describeDueDate } from '../dueLabels'
import { toDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { describeRepeat } from '../repeatLabels'
import { describeReward } from '../rewardLabels'
import { completionBoxOff, completionBoxOn, controlOff, controlOn, deleteControl } from '../rowControls'
import { isInTextEntry } from '../textEntry'
import { textOffsetAtPoint } from '../textOffsetAtPoint'
import { useSortableTask } from '../useSortableTask'
import { ChecklistIcon } from './ChecklistIcon'
import { ContextMenu } from './ContextMenu'
import { DuePicker } from './DuePicker'
import { GripIcon } from './GripIcon'
import { NoteIcon } from './NoteIcon'
import { RepeatPicker } from './RepeatPicker'
import { RewardPicker } from './RewardPicker'
import { SubtaskList } from './SubtaskList'
import { TagPicker } from './TagPicker'
import { TaskDescription } from './TaskDescription'

interface TaskItemProps {
  task: Task
  now: Date
  /** Every tag in use, to offer when tagging this task. */
  knownTags: readonly string[]
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  onRename: (id: TaskId, title: string) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  onChangeRepeat: (id: TaskId, repeat: Repeat | null) => void
  onChangeReward: (id: TaskId, reward: number | null) => void
  onAddTag: (id: TaskId, name: string) => void
  onRemoveTag: (id: TaskId, name: string) => void
  onRemove: (id: TaskId) => void
  onDuplicate: (id: TaskId) => void
  onAddSubtask: (id: TaskId, index: number, title: string) => void
  onSetSubtaskDone: (id: TaskId, subtaskId: SubtaskId, done: boolean) => void
  onRenameSubtask: (id: TaskId, subtaskId: SubtaskId, title: string) => void
  onRemoveSubtask: (id: TaskId, subtaskId: SubtaskId) => void
}

/** The title and the box that replaces it start in the same place, so nothing shifts. */
const titleBox = 'min-w-0 text-left text-sm'

/**
 * Where the title starts, and so where everything the row holds lines up: the
 * row's own padding, the completion box, and the gap between them.
 */
const indent = 'pl-10'

/**
 * Each control sits in a slot of one icon's width, so an icon is in the same
 * place on every row whatever its neighbours hold.
 */
const slot = 'flex w-8 shrink-0 items-center'

/**
 * The columns of a task's line: the completion box, the title with its tags, the
 * date, repeat, checklist, tag and reward slots, the description and delete. The
 * slots are fixed, so what is spelled out under them can run wider without
 * widening them. A phone has no room for the tag and reward slots beside the
 * title; its tags and reward are set from the woken row instead.
 */
const lineColumns =
  'grid-cols-[auto_minmax(0,1fr)_repeat(3,--spacing(8))_auto_auto] md:grid-cols-[auto_minmax(0,1fr)_repeat(5,--spacing(8))_auto_auto]'

/**
 * A tag the task carries, beside its title. Quieter than the title and smaller,
 * as a label on the task rather than part of what it says.
 */
const chip =
  'max-w-28 min-w-0 truncate rounded-full bg-neutral-100 px-1.5 text-[11px] leading-4 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'

/** What a control holds, on the second line under it. */
const detail = 'row-start-2 pb-1 text-[10px] leading-3 whitespace-nowrap text-neutral-400 tabular-nums dark:text-neutral-500'

/** Shares the shape of the repeat button beside them: small controls, not a row. */
const rowButton = 'flex h-6 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm leading-none transition-colors'
/** Sits in the page's gutter, just left of the row's border. */
const grip =
  'absolute top-1 -left-4 grid h-6 w-4 cursor-grab place-items-center rounded text-neutral-400 transition-opacity hover:text-neutral-900 active:cursor-grabbing dark:text-neutral-500 dark:hover:text-neutral-100'

export function TaskItem({
  task,
  now,
  knownTags,
  onComplete,
  onUncomplete,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onChangeRepeat,
  onChangeReward,
  onAddTag,
  onRemoveTag,
  onRemove,
  onDuplicate,
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
  // A woken row is the one being worked on: it spells its repeat rule out and
  // opens what it holds. Its controls are on show either way.
  const [isActive, setIsActive] = useState(false)
  // What the woken row is showing. Both come up with it — clicking a task is
  // asking to see the whole of it, not to be handed two more buttons to press —
  // and either can be put away again without leaving the row.
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)
  // Where the caret goes when the title opens as a box: where it was clicked, or
  // the end when there is no such place.
  const caret = useRef<number | null>(null)
  // Where the task's menu was opened, while it is open.
  const [menuAt, setMenuAt] = useState<{ x: number; y: number; fromKeyboard: boolean } | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const row = useRef<HTMLLIElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const sortable = useSortableTask(task, now)
  const isEditing = editedTitle !== null
  // What the controls hold, spelled out on a second line under each: the date
  // whenever there is one, the repeat rule, the checklist count and the reward once woken.
  const due = task.repeat === null && task.dueDate !== null ? describeDueDate(task.dueDate, now) : null
  const rule = isActive && task.repeat !== null ? describeRepeat(task.repeat) : null
  const count = isActive && hasSubtasks(task) ? `${String(checklist.done)}/${String(checklist.total)}` : null
  const points = isActive && task.reward !== null ? describeReward(task.reward) : null

  useEffect(() => {
    const element = input.current
    if (element === null) return

    element.focus()
    // A caret rather than the whole title selected: an edit is usually a tweak to
    // what is already there, not a rewrite.
    const at = Math.min(caret.current ?? element.value.length, element.value.length)
    element.setSelectionRange(at, at)
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
   * Opening the row: it shows what it holds. A row already awake is left as it
   * is, so focus moving between its controls does not bring back what was put away.
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
   * A click on a resting row wakes it. On a woken row only a click on the task's
   * own line, clear of everything on it that does something, rests it again:
   * a click inside a control, a picker or a panel is about that, and a button
   * that closes one of those is not undone by the same click reaching the row.
   */
  function handleClick(event: MouseEvent<HTMLLIElement>) {
    if (!isActive) {
      wake()
      return
    }

    const target = event.target as Element
    const onLine = target === event.currentTarget || line.current?.contains(target) === true
    if (onLine && target.closest('button, input, [role="dialog"]') === null) rest()
  }

  /** The title opens as a box, caret where it was clicked; from the keyboard, at the end. */
  function startEdit(event: MouseEvent<HTMLButtonElement>) {
    caret.current =
      event.detail === 0 ? null : textOffsetAtPoint(event.currentTarget, event.clientX, event.clientY)
    setEditedTitle(task.title)
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

  /**
   * A right-click opens the task's menu where it was clicked, and leaves the row
   * as it was: the menu is about the task as a whole, not working on it. Text
   * being typed in keeps the browser's own menu, which is there for the text.
   */
  function handleContextMenu(event: MouseEvent<HTMLLIElement>) {
    if (isInTextEntry(event.target) || sortable.isDragging) return

    event.preventDefault()
    // The context-menu key presses no button, so there is no pointer to open at:
    // it opens under the task's line instead.
    if (event.button !== 2 && event.buttons === 0) {
      const box = line.current?.getBoundingClientRect()
      setMenuAt({ x: box?.left ?? 0, y: box?.bottom ?? 0, fromKeyboard: true })
      return
    }
    setMenuAt({ x: event.clientX, y: event.clientY, fromKeyboard: false })
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
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onContextMenu={handleContextMenu}
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
          : menuAt !== null
            // Marked while its menu is open, so it is plain which task the menu is for.
            ? 'group relative rounded-xl border border-neutral-400 bg-white dark:border-neutral-600 dark:bg-neutral-900'
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

      {/* Two lines sharing columns: the task's own, then what its controls hold, each
          detail under the column it belongs to. */}
      <div ref={line} className={`grid ${lineColumns} items-center gap-x-2.5 px-2.5 py-1`}>
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
          className={done ? completionBoxOn : completionBoxOff}
        >
          ✓
        </button>

        {/* The title is only as wide as its words and a little past them, so the
            rest of the line is the row to click, not the title. The box, once
            open, takes the whole of it to type into. The tags sit at the far end,
            and go under the title when there is no room beside it. */}
        <div className="flex min-w-0 flex-wrap items-center gap-y-0.5">
          {editedTitle === null ? (
            <>
              <button
                type="button"
                onClick={startEdit}
                aria-label={`Edit "${task.title}"`}
                className={
                  done
                    ? `${titleBox} cursor-text pr-[13px] break-words text-neutral-400 line-through dark:text-neutral-600`
                    : `${titleBox} cursor-text pr-[13px] break-words text-neutral-900 dark:text-neutral-100`
                }
              >
                {task.title}
              </button>
              {/* Labels, not controls: a click on one is a click on the row. One line of
                  them, each giving up room to the rest when there is not enough. */}
              {hasTags(task) && (
                <ul aria-label="Tags" className="ml-auto flex min-w-0 justify-end gap-1 overflow-hidden">
                  {task.tags.map((tag) => (
                    <li key={tag} className={done ? `${chip} opacity-60` : chip}>
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </>
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
              className={`${titleBox} flex-1 bg-transparent text-neutral-900 focus:outline-none dark:text-neutral-100`}
            />
          )}
        </div>

        {/* A repeating task is due on its rule's days, so only a one-off has a date to
            set; a repeating one keeps the slot empty, so its icons stay in line. */}
        <div className={slot}>
          {task.repeat === null && (
            <DuePicker
              dueDate={task.dueDate}
              now={now}
              overdue={isOverdue(task, now)}
              onChange={(dueDate) => { onChangeDueDate(task.id, dueDate) }}
              label={`Due date for "${task.title}"`}
              // The date is spelled out under the button.
              showDate={false}
            />
          )}
        </div>

        <div className={slot}>
          <RepeatPicker
            draft={draft}
            onChange={handleRepeatChange}
            label={`Repeat for "${task.title}"`}
            // The icon says the task repeats; how often is spelled out under it.
            showRule={false}
          />
        </div>

        <div className={slot}>
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
            className={hasSubtasks(task) ? `${rowButton} ${controlOn}` : `${rowButton} ${controlOff}`}
          >
            <ChecklistIcon />
          </button>
        </div>

        <div className={`${slot} max-md:hidden`}>
          <TagPicker
            tags={task.tags}
            known={knownTags}
            onAdd={(name) => { onAddTag(task.id, name) }}
            onRemove={(name) => { onRemoveTag(task.id, name) }}
            label={`Tags for "${task.title}"`}
          />
        </div>

        <div className={`${slot} max-md:hidden`}>
          <RewardPicker
            reward={task.reward}
            repeat={task.repeat}
            onChange={(reward) => { onChangeReward(task.id, reward) }}
            label={`Reward for "${task.title}"`}
          />
        </div>

        <button
          type="button"
          onClick={() => { setIsDescriptionOpen(!isDescriptionOpen) }}
          aria-expanded={isDescriptionOpen}
          aria-label={
            hasDescription(task) ? `Description of "${task.title}"` : `Add a description to "${task.title}"`
          }
          title={hasDescription(task) ? 'Description' : 'Add a description'}
          className={hasDescription(task) ? `${rowButton} ${controlOn}` : `${rowButton} ${controlOff}`}
        >
          <NoteIcon />
        </button>

        {/* Always on show, and last, so it keeps its place as the row wakes and rests. */}
        <button
          type="button"
          onClick={(event) => {
            // Deleting is not engaging with the task either: the row is on its way out.
            event.stopPropagation()
            onRemove(task.id)
          }}
          aria-label={`Delete "${task.title}"`}
          className={`flex h-6 shrink-0 items-center rounded-lg px-1.5 text-base leading-none ${deleteControl}`}
        >
          ×
        </button>

        {/* The second line is part of the task's line too, so a click on it rests a woken
            row as the line does. Each detail is centred under its control and free to run
            wider than it. Whether the task is done is the box's to say. */}
        {due !== null && (
          <p
            className={
              isOverdue(task, now)
                ? `${detail} col-start-3 justify-self-center text-red-600 dark:text-red-400`
                : `${detail} col-start-3 justify-self-center`
            }
          >
            {due}
          </p>
        )}

        {/* A long rule would run into the count beside it, so beside a count it ends
            under its button instead, running left over the empty date slot and title. */}
        {rule !== null && (
          <p
            className={
              count === null
                ? `${detail} col-start-4 justify-self-center`
                : `${detail} col-start-2 col-end-5 min-w-8 justify-self-end text-center`
            }
          >
            {rule}
          </p>
        )}

        {count !== null && <p className={`${detail} col-start-5 justify-self-center`}>{count}</p>}

        {/* Under the reward's slot, which a phone does not have: its woken row names the points instead. */}
        {points !== null && <p className={`${detail} col-start-7 justify-self-center max-md:hidden`}>{points}</p>}
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
            tags={task.tags}
            knownTags={knownTags}
            onChange={(description) => { onChangeDescription(task.id, description) }}
            onAddTag={(name) => { onAddTag(task.id, name) }}
          />
        </div>
      )}

      {/* A phone's line has no tag or reward slot, so the woken row carries the controls
          instead, one above the other so each panel opens from the left edge with room. */}
      {isActive && (
        <div
          className={`flex flex-col items-start gap-0.5 border-t border-neutral-200 py-1 pr-2.5 ${indent} md:hidden dark:border-neutral-800`}
        >
          <TagPicker
            tags={task.tags}
            known={knownTags}
            onAdd={(name) => { onAddTag(task.id, name) }}
            onRemove={(name) => { onRemoveTag(task.id, name) }}
            label={`Tags for "${task.title}"`}
            showNames
            align="left"
          />
          <RewardPicker
            reward={task.reward}
            repeat={task.repeat}
            onChange={(reward) => { onChangeReward(task.id, reward) }}
            label={`Reward for "${task.title}"`}
            showAmount
            align="left"
          />
        </div>
      )}

      {menuAt !== null && (
        <ContextMenu
          x={menuAt.x}
          y={menuAt.y}
          label={`Actions for "${task.title}"`}
          fromKeyboard={menuAt.fromKeyboard}
          items={[{ label: 'Duplicate', onSelect: () => { onDuplicate(task.id) } }]}
          onClose={() => { setMenuAt(null) }}
        />
      )}
    </li>
  )
}
