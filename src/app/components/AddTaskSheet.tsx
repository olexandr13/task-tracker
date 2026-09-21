import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  createSubtask,
  sameTag,
  type List,
  type ListId,
  type LocalDay,
  type Repeat,
  type Subtask,
  type TimeEntry,
} from '../../core'
import { emptyDraft, toDraft, toRepeat, type RepeatDraft } from '../repeatDraft'
import { BottomSheet } from './BottomSheet'
import { ListPicker } from './ListPicker'
import { RewardPicker } from './RewardPicker'
import { SchedulePicker } from './SchedulePicker'
import { SubtaskList } from './SubtaskList'
import { TagPicker } from './TagPicker'
import { TaskDescription } from './TaskDescription'
import { TimePicker } from './TimePicker'
import { UrgentToggle } from './UrgentToggle'

/** Everything the detailed add sheet can set before the task is created. */
export interface NewTaskDetails {
  readonly description: string
  readonly reward: number | null
  readonly urgent: boolean
  readonly timeGoal: number | null
  /** Sessions already logged, oldest first. */
  readonly timeLogMinutes: readonly number[]
  /** Checklist items in order; `done` is whether each starts ticked. */
  readonly subtasks: readonly { title: string; done: boolean }[]
}

interface AddTaskSheetProps {
  now: Date
  /** Placeholder and accessible name — "Add habit" on the Habits page. */
  label?: string
  defaultDueDate: LocalDay | null
  defaultRepeat?: Repeat | null
  defaultTags?: readonly string[]
  defaultListId?: ListId | null
  knownTags: readonly string[]
  lists: readonly List[]
  onClose: () => void
  onAdd: (
    title: string,
    repeat: Repeat | null,
    dueDate: LocalDay | null,
    tags: readonly string[],
    listId: ListId | null,
    details: NewTaskDetails,
  ) => void
}

const action = 'flex min-h-11 w-full min-w-0 items-center'

const titleBox =
  'min-w-0 flex-1 bg-transparent text-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500'

/**
 * A sheet for adding a task with every field the edit sheet has, before it is
 * saved. The one-line box still adds a title in a hurry (TASK-4); this is for
 * when more than a title is known up front (TASK-66, UI-54).
 */
export function AddTaskSheet({
  now,
  label = 'Add task',
  defaultDueDate,
  defaultRepeat,
  defaultTags = [],
  defaultListId = null,
  knownTags,
  lists,
  onClose,
  onAdd,
}: AddTaskSheetProps) {
  const titleInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [draft, setDraft] = useState<RepeatDraft>(() =>
    defaultRepeat !== undefined ? toDraft(defaultRepeat ?? null, now) : emptyDraft(now),
  )
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [listId, setListId] = useState<ListId | null>(defaultListId)
  const [tags, setTags] = useState<string[]>(() => [...defaultTags])
  const [reward, setReward] = useState<number | null>(null)
  const [urgent, setUrgent] = useState(false)
  const [timeGoal, setTimeGoal] = useState<number | null>(null)
  const [sessions, setSessions] = useState<TimeEntry[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const repeat = toRepeat(draft)
  const trimmed = title.trim()
  const canAdd = trimmed.length > 0
  const namedFor = trimmed.length > 0 ? trimmed : label

  useLayoutEffect(() => {
    titleInput.current?.focus()
  }, [])

  function commit() {
    if (!canAdd) return
    onAdd(trimmed, repeat, repeat === null ? dueDate : null, tags, listId, {
      description,
      reward,
      urgent,
      timeGoal,
      timeLogMinutes: sessions.map((entry) => entry.minutes),
      subtasks: subtasks.map((subtask) => ({
        title: subtask.title,
        done: subtask.completedAt !== null,
      })),
    })
  }

  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter alone does not add: the sheet is for filling more than a title, and
    // the Add button is the one path that saves. Cmd/Ctrl+Enter still adds when
    // the title is ready, for a keyboard that is done.
    if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return
    event.preventDefault()
    commit()
  }

  function handleRepeatChange(next: RepeatDraft) {
    setDraft(next)
    if (toRepeat(next) !== null) setDueDate(null)
  }

  return (
    <BottomSheet label={label} onClose={onClose}>
      <div className="flex shrink-0 items-start gap-3 px-4 pt-1 pb-3">
        <input
          ref={titleInput}
          type="text"
          value={title}
          onChange={(event) => { setTitle(event.target.value) }}
          onKeyDown={handleTitleKeyDown}
          placeholder={label}
          aria-label={label}
          autoComplete="off"
          enterKeyHint="done"
          className={titleBox}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex flex-col items-stretch gap-0.5 border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
          <div className={action}>
            <SchedulePicker
              dueDate={repeat === null ? dueDate : null}
              draft={draft}
              now={now}
              onChangeDueDate={(day) => {
                setDueDate(day)
                if (day !== null) setDraft({ ...draft, kind: 'once' })
              }}
              onChangeRepeat={handleRepeatChange}
              label={`Schedule for "${namedFor}"`}
              showSummary
              align="left"
            />
          </div>
          <div className={action}>
            <ListPicker
              listId={listId}
              lists={lists}
              onChange={setListId}
              label={`List for "${namedFor}"`}
              showName
              align="left"
            />
          </div>
          <div className={action}>
            <TimePicker
              goal={timeGoal}
              sessions={sessions}
              now={now}
              onLog={(minutes) => {
                setSessions((current) => [
                  ...current,
                  {
                    id: crypto.randomUUID(),
                    minutes,
                    loggedAt: now.toISOString(),
                  },
                ])
              }}
              onRemove={(entryId) => {
                setSessions((current) => current.filter((entry) => entry.id !== entryId))
              }}
              onChangeGoal={setTimeGoal}
              label={`Time for "${namedFor}"`}
              showAmount
              align="left"
            />
          </div>
          <div className={action}>
            <TagPicker
              tags={tags}
              known={knownTags}
              onAdd={(name) => {
                if (tags.some((tag) => sameTag(tag, name))) return
                setTags((current) => [...current, name])
              }}
              onRemove={(name) => {
                setTags((current) => current.filter((tag) => !sameTag(tag, name)))
              }}
              label={`Tags for "${namedFor}"`}
              showNames
              align="left"
            />
          </div>
          <div className={action}>
            <UrgentToggle
              urgent={urgent}
              onChange={setUrgent}
              label={`Urgent for "${namedFor}"`}
              showName
            />
          </div>
          <div className={action}>
            <RewardPicker
              reward={reward}
              repeat={repeat}
              onChange={setReward}
              label={`Reward for "${namedFor}"`}
              showAmount
              align="left"
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 px-4 py-1 dark:border-neutral-800">
          <SubtaskList
            subtasks={subtasks}
            repeat={repeat}
            now={now}
            taskTitle={namedFor}
            onAdd={(index, next) => {
              setSubtasks((current) => {
                const item = createSubtask(next, now)
                return [...current.slice(0, index), item, ...current.slice(index)]
              })
            }}
            onSetDone={(subtaskId, done) => {
              const at = now.toISOString()
              setSubtasks((current) =>
                current.map((subtask) =>
                  subtask.id === subtaskId
                    ? { ...subtask, completedAt: done ? at : null }
                    : subtask,
                ),
              )
            }}
            onRename={(subtaskId, next) => {
              setSubtasks((current) =>
                current.map((subtask) =>
                  subtask.id === subtaskId ? { ...subtask, title: next } : subtask,
                ),
              )
            }}
            onRemove={(subtaskId) => {
              setSubtasks((current) => current.filter((subtask) => subtask.id !== subtaskId))
            }}
          />
        </div>

        <div className="border-t border-neutral-200 px-4 py-1.5 dark:border-neutral-800">
          <TaskDescription
            description={description}
            title={namedFor}
            tags={tags}
            knownTags={knownTags}
            onChange={setDescription}
            onAddTag={(name) => {
              if (tags.some((tag) => sameTag(tag, name))) return
              setTags((current) => [...current, name])
            }}
          />
        </div>

        <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={commit}
            disabled={!canAdd}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            {label}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
