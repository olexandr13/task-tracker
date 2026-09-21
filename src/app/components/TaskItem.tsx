import { CSS } from '@dnd-kit/utilities'
import { useEffect, useEffectEvent, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type TouchEvent } from 'react'
import {
  canSkipOccurrence,
  countSubtasks,
  currentEntries,
  dueDay,
  hasDescription,
  hasSubtasks,
  hasTags,
  isComplete,
  isOverdue,
  isTimeGoalReached,
  listOf,
  skipOccurrence,
  sortLists,
  type List,
  type ListId,
  type LocalDay,
  type Repeat,
  type SubtaskId,
  type Task,
  type TaskId,
  type TimeEntryId,
} from '../../core'
import { dateChoices } from '../dateChoices'
import { describeDueDate } from '../dueLabels'
import { describeTimeProgress } from '../durationLabels'
import { toDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { describeRepeatBriefly } from '../repeatLabels'
import { describeReward } from '../rewardLabels'
import {
  completionBoxOff,
  completionBoxOn,
  completionBoxReady,
  controlMarker,
  controlMarkerOverdue,
  controlOff,
  controlOn,
  deleteControl,
  detailReached,
  rowControlIcon,
  rowControlLabel,
} from '../rowControls'
import { isInTextEntry } from '../textEntry'
import { textOffsetAtPoint } from '../textOffsetAtPoint'
import { isHeldInPlace } from '../useLongPress'
import { usePhoneLayout } from '../usePhoneLayout'
import { useSortableTask } from '../useSortableTask'
import { CalendarIcon } from './CalendarIcon'
import { ChecklistIcon } from './ChecklistIcon'
import { ClockIcon } from './ClockIcon'
import { ContextMenu, type ContextMenuEntry } from './ContextMenu'
import { DueChoices } from './DueChoices'
import { DuplicateIcon } from './DuplicateIcon'
import { FlagIcon } from './FlagIcon'
import { FloatingPanel } from './FloatingPanel'
import { GripIcon } from './GripIcon'
import { ListPicker } from './ListPicker'
import { NoteIcon } from './NoteIcon'
import { RepeatIcon } from './RepeatIcon'
import { RewardPicker } from './RewardPicker'
import { SchedulePicker } from './SchedulePicker'
import { StarIcon } from './StarIcon'
import { SubtaskList } from './SubtaskList'
import { TagIcon } from './TagIcon'
import { TagPanel } from './TagPanel'
import { TagPicker } from './TagPicker'
import { TaskDescription } from './TaskDescription'
import { TaskSheet } from './TaskSheet'
import { TimePicker } from './TimePicker'
import { UrgentToggle } from './UrgentToggle'

interface TaskItemProps {
  task: Task
  now: Date
  /** Every tag there is, to offer in the task's menu when tagging it. */
  knownTags: readonly string[]
  /** Every list there is, to offer in the task's menu when filing it. */
  lists: readonly List[]
  /** Whether the row spells out what its controls hold at rest too, not only once woken. */
  showDetails?: boolean
  /** The rows this one can be dragged among, when the list divides them further than to-do and done. */
  dragGroup?: string
  onComplete: (id: TaskId) => void
  onUncomplete: (id: TaskId) => void
  onRename: (id: TaskId, title: string) => void
  onChangeDescription: (id: TaskId, description: string) => void
  onChangeDueDate: (id: TaskId, dueDate: LocalDay | null) => void
  /** Passes over a repeating task's occurrence, so it is due on the rule's next day. */
  onSkipOccurrence: (id: TaskId) => void
  onChangeRepeat: (id: TaskId, repeat: Repeat | null) => void
  onChangeReward: (id: TaskId, reward: number | null) => void
  onChangeUrgent: (id: TaskId, urgent: boolean) => void
  onChangeTimeGoal: (id: TaskId, minutes: number | null) => void
  onLogTime: (id: TaskId, minutes: number) => void
  onRemoveTimeEntry: (id: TaskId, entryId: TimeEntryId) => void
  onChangeList: (id: TaskId, listId: ListId | null) => void
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
 * row's own padding, the completion box, and the gap between them. A phone's
 * box is larger, so the indent is too.
 */
const indent = 'pl-12 md:pl-10'

/**
 * Each control sits in a slot of one icon button's width, so an icon is in the
 * same place on every row whatever its neighbours hold. The slot is the button
 * and nothing more: the controls belong together, so only the line's gap is
 * between them.
 */
const slot = 'flex w-6 shrink-0 items-center'

/**
 * The columns of a task's line: the completion box, the title, the schedule (the
 * date or the repeat rule), checklist, time and reward slots, the description and
 * delete.
 * The slots are fixed, so what is spelled out under them can run wider without
 * widening them. A phone has no room for the time and reward *controls* beside the
 * title; its time and reward are set from the sheet a tap opens instead, and the
 * rest row shows tinted marks for what is set (UI-50). The list
 * and the tags have no slot anywhere: a task is filed and tagged from its menu,
 * or on a phone from that sheet as well. Urgent is the same: set from the menu
 * or the sheet, never a control on the resting row (TASK-62).
 */
const lineColumns =
  'grid-cols-[auto_minmax(0,1fr)_repeat(2,--spacing(6))_auto_auto] md:grid-cols-[auto_minmax(0,1fr)_repeat(4,--spacing(6))_auto_auto]'

/**
 * A tag the task carries, on the line of details under its title: a label on the
 * task rather than part of what it says, the size of the details beside it.
 */
const chip =
  'max-w-28 min-w-0 truncate rounded-full bg-neutral-100 px-1.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'

/** What a control holds, on the second line under it. */
const detail = 'row-start-2 pb-1 text-[10px] leading-3 whitespace-nowrap text-neutral-400 tabular-nums dark:text-neutral-500'

/** Shares the shape of the pickers beside them: small controls, not a row. */
const rowButton = `${rowControlIcon} shrink-0`
/** Sits in the page's gutter, just left of the row's border. */
const grip =
  'absolute top-1 -left-4 grid h-6 w-4 cursor-grab place-items-center rounded text-neutral-400 transition-opacity hover:text-neutral-900 active:cursor-grabbing dark:text-neutral-500 dark:hover:text-neutral-100'

export function TaskItem({
  task,
  now,
  knownTags,
  lists,
  showDetails = false,
  dragGroup,
  onComplete,
  onUncomplete,
  onRename,
  onChangeDescription,
  onChangeDueDate,
  onSkipOccurrence,
  onChangeRepeat,
  onChangeReward,
  onChangeUrgent,
  onChangeTimeGoal,
  onLogTime,
  onRemoveTimeEntry,
  onChangeList,
  onAddTag,
  onRemoveTag,
  onRemove,
  onDuplicate,
  onAddSubtask,
  onSetSubtaskDone,
  onRenameSubtask,
  onRemoveSubtask,
}: TaskItemProps) {
  const phone = usePhoneLayout()
  const done = isComplete(task, now)
  const urgent = !done && task.urgent
  const checklist = countSubtasks(task, now)
  // The time that counts for the occurrence in play; once it meets the goal the
  // box invites a tick, and ticking it is still the owner's to do.
  const sessions = currentEntries(task.timeLog, task.repeat, now)
  const spent = sessions.reduce((total, entry) => total + entry.minutes, 0)
  const ready = !done && isTimeGoalReached(task, now)
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
  // What last pressed on the row, a mouse or a finger, which a click does not say
  // everywhere; and where a finger went down, to tell holding it from dragging it.
  const pointer = useRef('mouse')
  const touchedAt = useRef<{ x: number; y: number } | null>(null)
  // Where the tag panel opens from the menu: where the menu was, while it is open.
  const [tagsAt, setTagsAt] = useState<{ x: number; y: number } | null>(null)
  // Where the date panel opens from the menu, the same way.
  const [dateAt, setDateAt] = useState<{ x: number; y: number } | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const row = useRef<HTMLLIElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const sortable = useSortableTask(task, now, dragGroup)
  const isEditing = editedTitle !== null
  // What the controls hold, spelled out on a second line under each once woken, or
  // at rest too when the view asks for it: the date or the repeat rule, the checklist
  // count, the time and the reward, and the tags under the title. Otherwise the tinted
  // icons say what is set, so every resting row is one line high. A repeating task's
  // day is its rule's, and the rule is what is spelled out, so the date is a one-off's
  // alone here.
  // On a phone the sheet holds the details and the action buttons; the rest row still
  // shows tinted marks for what is set (UI-50), and spells the words out under the
  // title only when the view asks for details on every row.
  const detailed = phone ? showDetails : isActive || showDetails
  const day = dueDay(task, now)
  const scheduled = task.repeat !== null || day !== null
  const timed = task.timeGoal !== null || spent > 0
  const rewarded = task.reward !== null
  const checklisted = hasSubtasks(task)
  const described = hasDescription(task)
  const tagged = hasTags(task)
  // Labels, not controls: a click on one is a click on the row. One line of them,
  // each giving up room to the rest when there is not enough.
  const tags =
    detailed && tagged ? (
      <ul aria-label="Tags" className="flex min-w-0 gap-1 overflow-hidden">
        {task.tags.map((tag) => (
          <li key={tag} className={chip}>
            {tag}
          </li>
        ))}
      </ul>
    ) : null
  const overdue = isOverdue(task, now)
  const schedule = !detailed
    ? null
    : task.repeat !== null
      ? describeRepeatBriefly(task.repeat)
      : task.dueDate !== null
        ? describeDueDate(task.dueDate, now)
        : null
  const count = detailed && checklisted ? `${String(checklist.done)}/${String(checklist.total)}` : null
  const time = detailed && timed ? describeTimeProgress(spent, task.timeGoal) : null
  const points = detailed && task.reward !== null ? describeReward(task.reward) : null
  const urgentLabel = detailed && task.urgent ? 'Urgent' : null
  // On a phone, marks for what the task carries — set ones only, not buttons.
  // A tap on them is a tap on the row and opens the sheet.
  const marks =
    phone && (scheduled || timed || rewarded || checklisted || described || tagged)
      ? {
          label: [
            scheduled
              ? task.repeat !== null
                ? describeRepeatBriefly(task.repeat)
                : day !== null
                  ? describeDueDate(day, now)
                  : null
              : null,
            checklisted ? `Checklist ${String(checklist.done)} of ${String(checklist.total)}` : null,
            timed ? describeTimeProgress(spent, task.timeGoal) : null,
            rewarded && task.reward !== null ? describeReward(task.reward) : null,
            described ? 'Description' : null,
            tagged ? `Tags ${task.tags.join(', ')}` : null,
          ]
            .filter((part): part is string => part !== null)
            .join(', '),
          overdue: scheduled && task.repeat === null && overdue,
        }
      : null
  const timePicker = {
    goal: task.timeGoal,
    sessions,
    now,
    onLog: (minutes: number) => { onLogTime(task.id, minutes) },
    onRemove: (entryId: TimeEntryId) => { onRemoveTimeEntry(task.id, entryId) },
    onChangeGoal: (minutes: number | null) => { onChangeTimeGoal(task.id, minutes) },
    label: `Time for "${task.title}"`,
  }
  // The list the task is filed under, or null in the Inbox.
  const filed = listOf(task, lists)
  // Where skipping the occurrence in play would move the task on to, while it has one to skip.
  const skipTo = canSkipOccurrence(task, now) ? dueDay(skipOccurrence(task, now), now) : null
  const skip = skipTo === null ? undefined : { to: skipTo, onSkip: () => { onSkipOccurrence(task.id) } }
  const menuItems: ContextMenuEntry[] = [
    // The same quick choices as the date panel; Select date opens that panel, calendar and all, where the menu was.
    {
      group: 'Date',
      icons: dateChoices({
        dueDate: task.dueDate,
        now,
        repeats: task.repeat !== null,
        skip,
        onChange: changeDueDate,
        onSelectDate: () => { setDateAt(menuAt) },
      }),
    },
    {
      label: 'Urgent',
      icon: <FlagIcon />,
      checked: task.urgent,
      onSelect: () => { onChangeUrgent(task.id, !task.urgent) },
    },
    { label: 'Duplicate', icon: <DuplicateIcon />, onSelect: () => { onDuplicate(task.id) } },
    // A panel of its own rather than a group, since it takes typing and more than one choice.
    { label: 'Tags', icon: <TagIcon />, onSelect: () => { setTagsAt(menuAt) } },
    // Only once there is a list to choose: the Inbox alone is no choice at all.
    ...(lists.length === 0
      ? []
      : [
          {
            group: 'List',
            items: [
              { label: 'Inbox', checked: filed === null, onSelect: () => { onChangeList(task.id, null) } },
              ...sortLists(lists).map((list) => ({
                label: list.name,
                checked: list.id === filed?.id,
                onSelect: () => { onChangeList(task.id, list.id) },
              })),
            ],
          },
        ]),
  ]

  useEffect(() => {
    const element = input.current
    if (element === null) return

    element.focus()
    // A caret rather than the whole title selected: an edit is usually a tweak to
    // what is already there, not a rewrite.
    const at = Math.min(caret.current ?? element.value.length, element.value.length)
    element.setSelectionRange(at, at)
  }, [isEditing])

  const putAway = useEffectEvent(rest)

  useEffect(() => {
    // A phone's sheet lives outside the row and closes itself.
    if (!isActive || phone) return

    function handlePointerDown(event: PointerEvent) {
      if (!row.current?.contains(event.target as Node)) putAway()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => { document.removeEventListener('pointerdown', handlePointerDown) }
  }, [isActive, phone])

  /**
   * Opening the row: it shows what it holds. A row already awake is left as it
   * is, so focus moving between its controls does not bring back what was put away.
   */
  function wake() {
    if (isActive) return
    setIsActive(true)
    // On a phone the sheet always shows both; the toggles are a wide screen's.
    if (!phone) {
      setIsChecklistOpen(true)
      setIsDescriptionOpen(true)
    }
  }

  /** Letting it rest again, and putting away what it was showing. */
  function rest() {
    if (phone && editedTitle !== null) {
      const trimmed = editedTitle.trim()
      if (trimmed.length > 0) onRename(task.id, trimmed)
      setEditedTitle(null)
    }
    setIsActive(false)
    setIsChecklistOpen(false)
    setIsDescriptionOpen(false)
  }

  /**
   * A click on a resting row wakes it. On a phone that is the sheet, and a
   * further click on the row does nothing — the dimmed page closes it. On a
   * wide screen only a click on the task's own line, clear of everything on it
   * that does something, does anything more: a mouse's rests it again, and a
   * finger's opens the task's menu where it landed — a finger has no
   * right-click, and a tap anywhere else rests the row. So a double tap opens
   * the menu. A click inside a control, a picker or a panel is about that, and
   * a button that closes one of those is not undone by the same click reaching
   * the row.
   */
  function handleClick(event: MouseEvent<HTMLLIElement>) {
    if (!isActive) {
      wake()
      return
    }

    if (phone) return

    const target = event.target as Element
    const onLine = target === event.currentTarget || line.current?.contains(target) === true
    if (!onLine || target.closest('button, input, [role="dialog"]') !== null) return

    if (pointer.current === 'mouse') rest()
    else setMenuAt({ x: event.clientX, y: event.clientY, fromKeyboard: false })
  }

  /**
   * A finger held on the row until it is picked up (TaskDragAndDrop) and let go
   * where it went down opens the task's menu there, as a right-click would; moved,
   * it was a drag. Letting go is kept from also clicking what the menu opens over.
   */
  function handleTouchEnd(event: TouchEvent<HTMLLIElement>) {
    const start = touchedAt.current
    const end = event.changedTouches[0]
    touchedAt.current = null
    if (!sortable.isDragging || start === null || end === undefined) return

    const at = { x: end.clientX, y: end.clientY }
    if (!isHeldInPlace(start, at)) return

    event.preventDefault()
    setMenuAt({ ...at, fromKeyboard: false })
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
    // On a phone the controls live in the sheet; focusing the box must not open it.
    if (!phone && event.target.matches(':focus-visible')) wake()
  }

  /** Tabbing out rests the row; moving between its own controls does not. */
  function handleBlur(event: FocusEvent<HTMLLIElement>) {
    if (phone) return
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

  /**
   * A day picked for the task, or taken away. A day picked for a repeating task
   * ends its rule, so the draft goes to Once, keeping its choices.
   */
  function changeDueDate(dueDate: LocalDay | null) {
    if (dueDate !== null && task.repeat !== null) setDraft({ ...draft, kind: 'once' })
    onChangeDueDate(task.id, dueDate)
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

  const titleClass = done
    ? `${titleBox} cursor-text pr-[13px] break-words text-neutral-400 line-through dark:text-neutral-600`
    : `${titleBox} cursor-text pr-[13px] break-words text-neutral-900 dark:text-neutral-100`
  const titleEditor =
    editedTitle === null ? (
      <button
        type="button"
        onClick={startEdit}
        aria-label={`Edit "${task.title}"`}
        className={phone ? `${titleClass} text-lg` : titleClass}
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
        className={`${titleBox} ${phone ? 'text-lg' : ''} flex-1 bg-transparent text-neutral-900 focus:outline-none dark:text-neutral-100`}
      />
    )

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
      onPointerDown={(event) => { pointer.current = event.pointerType }}
      onTouchStart={(event) => {
        sortable.listeners?.onTouchStart?.(event)
        const touch = event.touches[0]
        touchedAt.current = touch === undefined ? null : { x: touch.clientX, y: touch.clientY }
      }}
      onTouchEnd={handleTouchEnd}
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
          // Left in the list, faded, where it would land; its title is what the pointer carries (TaskDragAndDrop).
          ? 'group relative touch-manipulation rounded-xl border border-dashed border-neutral-300 bg-white opacity-50 dark:border-neutral-700 dark:bg-neutral-900'
          : menuAt !== null || tagsAt !== null || dateAt !== null || (phone && isActive)
            // Marked while its menu or sheet is open, so it is plain which task that is for.
            ? `group relative touch-manipulation rounded-xl border border-neutral-400 bg-white dark:border-neutral-600 dark:bg-neutral-900${urgent ? ' shadow-[inset_3px_0_0_rgb(217_119_6_/_0.55)] dark:shadow-[inset_3px_0_0_rgb(251_191_36_/_0.45)]' : ''}`
            : `group relative touch-manipulation rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900${urgent ? ' shadow-[inset_3px_0_0_rgb(217_119_6_/_0.55)] dark:shadow-[inset_3px_0_0_rgb(251_191_36_/_0.45)]' : ''}`
      }
      title={urgent ? 'Urgent' : undefined}
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
      {/* The line's gap is the one between the controls; the title adds to it, so it
          stands apart from them. The box adds only what keeps the title at the indent. */}
      <div
        ref={line}
        className={
          phone
            ? 'flex items-center gap-2 px-2 py-1.5'
            : `grid ${lineColumns} items-center gap-x-2 px-2 py-1.5 md:px-2.5 md:py-1`
        }
      >
        <button
          type="button"
          onClick={(event) => {
            // Ticking a task off is not engaging with it: the row stays as it was.
            event.stopPropagation()
            if (done) onUncomplete(task.id)
            else onComplete(task.id)
          }}
          aria-pressed={done}
          aria-label={
            done
              ? `Mark "${task.title}" as not done`
              : ready
                ? `Mark "${task.title}" as done: its time goal is reached`
                : `Mark "${task.title}" as done`
          }
          title={ready ? 'Time goal reached: ready to tick off' : undefined}
          className={`${done ? completionBoxOn : ready ? completionBoxReady : completionBoxOff} md:mr-0.5`}
          aria-hidden={phone && isActive ? true : undefined}
          tabIndex={phone && isActive ? -1 : undefined}
        >
          ✓
        </button>

        {/* On a phone the title is part of the tap that opens the sheet, not an
            edit. The words plus a little past them are the edit on a wide screen. */}
        <div className={phone ? 'flex min-w-0 flex-1 items-center pr-1.5' : 'flex min-w-0 items-center pr-1.5'}>
          {phone ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                wake()
              }}
              aria-haspopup="dialog"
              aria-expanded={isActive}
              aria-hidden={isActive ? true : undefined}
              tabIndex={isActive ? -1 : undefined}
              className={
                done
                  ? `${titleBox} break-words text-neutral-400 line-through dark:text-neutral-600`
                  : `${titleBox} break-words text-neutral-900 dark:text-neutral-100`
              }
            >
              {task.title}
            </button>
          ) : (
            titleEditor
          )}
        </div>

        {/* On a phone: tinted marks for what is set, not controls — a tap still
            opens the sheet. Empty ones stay off, so a bare task stays one title. */}
        {marks !== null && (
          <div
            role="group"
            aria-label={marks.label}
            aria-hidden={phone && isActive ? true : undefined}
            className="flex shrink-0 items-center gap-0.5"
          >
            {scheduled && (
              <span className={marks.overdue ? controlMarkerOverdue : controlMarker}>
                {task.repeat === null ? <CalendarIcon /> : <RepeatIcon />}
              </span>
            )}
            {checklisted && (
              <span className={controlMarker}>
                <ChecklistIcon />
              </span>
            )}
            {timed && (
              <span className={ready ? `${controlMarker} ${detailReached}` : controlMarker}>
                <ClockIcon />
              </span>
            )}
            {rewarded && (
              <span className={controlMarker}>
                <StarIcon />
              </span>
            )}
            {described && (
              <span className={controlMarker}>
                <NoteIcon />
              </span>
            )}
            {tagged && (
              <span className={controlMarker}>
                <TagIcon />
              </span>
            )}
          </div>
        )}

        {!phone && (
          <>
            {/* On every row: the date and the repeat rule are one control, since a rule is
                what gives a repeating task its days. Its name carries the occurrence in play,
                and a day picked there makes the task a one-off. */}
            <div className={slot}>
              <SchedulePicker
                dueDate={dueDay(task, now)}
                draft={draft}
                now={now}
                overdue={overdue}
                onChangeDueDate={changeDueDate}
                onChangeRepeat={handleRepeatChange}
                skip={skip}
                label={`Schedule for "${task.title}"`}
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

            <div className={slot}>
              <TimePicker {...timePicker} />
            </div>

            <div className={slot}>
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
              className={`flex h-6 shrink-0 items-center rounded-lg px-1 text-base leading-none ${deleteControl}`}
            >
              ×
            </button>
          </>
        )}

        {!phone && (
          <>
            {/* The second line is part of the task's line too, so a click on it rests a woken
                row as the line does. Each detail is centred under its control and free to run
                wider than it. Whether the task is done is the box's to say. */}
            {/* The tags are under the title, from where it starts. A long rule centred on its
                button would run into the details beside it, so the schedule's detail ends under
                its button instead and runs left over the title's column, sharing that with the
                tags, which give up room to it. An overdue date is red; a rule is no day, so not. */}
            {(tags !== null || urgentLabel !== null || schedule !== null) && (
              <div className={`${detail} col-start-2 col-end-4 flex min-w-0 gap-2`}>
                {tags}
                {urgentLabel !== null && <p className="shrink-0">{urgentLabel}</p>}
                {schedule !== null && (
                  <p
                    className={
                      task.repeat === null && overdue
                        ? 'ml-auto min-w-6 shrink-0 text-center text-red-600 dark:text-red-400'
                        : 'ml-auto min-w-6 shrink-0 text-center'
                    }
                  >
                    {schedule}
                  </p>
                )}
              </div>
            )}

            {count !== null && <p className={`${detail} col-start-4 justify-self-center`}>{count}</p>}

            {time !== null && (
              <p
                className={
                  ready
                    ? `${detail} col-start-5 justify-self-center ${detailReached}`
                    : `${detail} col-start-5 justify-self-center`
                }
              >
                {time}
              </p>
            )}

            {points !== null && <p className={`${detail} col-start-6 justify-self-center`}>{points}</p>}
          </>
        )}
      </div>

      {phone && detailed && (tags !== null || urgentLabel !== null || schedule !== null || count !== null || time !== null || points !== null) && (
        <div className={`${detail} flex min-w-0 flex-wrap items-center gap-x-2 px-2 pb-1.5 ${indent}`}>
          {tags}
          {urgentLabel !== null && <p>{urgentLabel}</p>}
          {schedule !== null && (
            <p className={task.repeat === null && overdue ? 'text-red-600 dark:text-red-400' : undefined}>
              {schedule}
            </p>
          )}
          {count !== null && <p>{count}</p>}
          {time !== null && <p className={ready ? detailReached : undefined}>{time}</p>}
          {points !== null && <p>{points}</p>}
        </div>
      )}

      {/* The menu's actions, once the row is open — list, tags, urgent, duplicate —
          so a wide screen need not right-click for what a phone's sheet already has. */}
      {!phone && isActive && (
        <div
          className={`flex flex-wrap items-center gap-1 border-t border-neutral-200 py-1 pr-2 md:pr-2.5 ${indent} dark:border-neutral-800`}
        >
          {lists.length > 0 && (
            <ListPicker
              listId={task.listId}
              lists={lists}
              onChange={(listId) => { onChangeList(task.id, listId) }}
              label={`List for "${task.title}"`}
              align="left"
            />
          )}
          <TagPicker
            tags={task.tags}
            known={knownTags}
            onAdd={(name) => { onAddTag(task.id, name) }}
            onRemove={(name) => { onRemoveTag(task.id, name) }}
            label={`Tags for "${task.title}"`}
            align="left"
          />
          <UrgentToggle
            urgent={task.urgent}
            onChange={(next) => { onChangeUrgent(task.id, next) }}
            label={`Urgent for "${task.title}"`}
          />
          <button
            type="button"
            onClick={() => { onDuplicate(task.id) }}
            aria-label={`Duplicate "${task.title}"`}
            title="Duplicate"
            className={`${rowControlLabel} ${controlOff}`}
          >
            <DuplicateIcon />
            Duplicate
          </button>
        </div>
      )}

      {/* Indented to start where the title does, so it reads as part of the same row. */}
      {!phone && isChecklistOpen && (
        <div className={`border-t border-neutral-200 py-1 pr-2 md:pr-2.5 ${indent} dark:border-neutral-800`}>
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

      {!phone && isDescriptionOpen && (
        <div className={`border-t border-neutral-200 py-1.5 pr-2 md:pr-2.5 ${indent} dark:border-neutral-800`}>
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

      {phone && isActive && (
        <TaskSheet
          task={task}
          now={now}
          knownTags={knownTags}
          lists={lists}
          draft={draft}
          title={titleEditor}
          onClose={rest}
          onComplete={onComplete}
          onUncomplete={onUncomplete}
          onChangeDescription={onChangeDescription}
          onChangeDueDate={changeDueDate}
          onSkipOccurrence={onSkipOccurrence}
          onChangeRepeat={handleRepeatChange}
          onChangeReward={onChangeReward}
          onChangeUrgent={onChangeUrgent}
          onChangeTimeGoal={onChangeTimeGoal}
          onLogTime={onLogTime}
          onRemoveTimeEntry={onRemoveTimeEntry}
          onChangeList={onChangeList}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onAddSubtask={onAddSubtask}
          onSetSubtaskDone={onSetSubtaskDone}
          onRenameSubtask={onRenameSubtask}
          onRemoveSubtask={onRemoveSubtask}
        />
      )}

      {menuAt !== null && (
        <ContextMenu
          x={menuAt.x}
          y={menuAt.y}
          label={`Actions for "${task.title}"`}
          fromKeyboard={menuAt.fromKeyboard}
          items={menuItems}
          onClose={() => { setMenuAt(null) }}
        />
      )}

      {dateAt !== null && (
        <FloatingPanel
          x={dateAt.x}
          y={dateAt.y}
          role="dialog"
          label={`Date for "${task.title}"`}
          // Opening it is asking to pick a day, so the calendar has the focus, on the day it opens on.
          focusFirst='[role="grid"] [tabindex="0"]'
          onClose={() => { setDateAt(null) }}
          className="w-64"
        >
          <DueChoices
            dueDate={dueDay(task, now)}
            now={now}
            repeats={task.repeat !== null}
            skip={skip}
            onChange={changeDueDate}
            onDone={() => { setDateAt(null) }}
          />
        </FloatingPanel>
      )}

      {tagsAt !== null && (
        <FloatingPanel
          x={tagsAt.x}
          y={tagsAt.y}
          role="dialog"
          label={`Tags for "${task.title}"`}
          // Opening it is asking to type a tag, so the caret is put there.
          focusFirst="input"
          onClose={() => { setTagsAt(null) }}
          className="w-56"
        >
          <TagPanel
            tags={task.tags}
            known={knownTags}
            onAdd={(name) => { onAddTag(task.id, name) }}
            onRemove={(name) => { onRemoveTag(task.id, name) }}
          />
        </FloatingPanel>
      )}
    </li>
  )
}
